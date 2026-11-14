from datetime import date
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import intake, llm, mindlog, persona
from .config import SECRET
from .crypto import decrypt, encrypt
from .db import connect, init_db
from .safety import HELPLINE_MESSAGE, is_crisis
from .sessions import create_anonymous_user, current_user

import json

STATIC = Path(__file__).resolve().parent.parent / "static"

app = FastAPI(title="SunnoBuddy prototype")
init_db()


# ---------- status and session ----------

@app.get("/api/status")
def status():
    return {
        "mode": "gemini" if llm.available() else "demo",
        "model": llm.MODEL if llm.available() else None,
        "last_error": llm.last_error,
    }


@app.post("/api/session/anonymous")
def start_anonymous():
    return create_anonymous_user()


# ---------- text chat ----------

class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


def _load_chat(user_id: str) -> list[dict]:
    with connect() as con:
        rows = con.execute(
            "SELECT role, content_enc FROM chat_messages WHERE user_id = ? ORDER BY id", (user_id,)
        ).fetchall()
    return [{"role": r["role"], "content": decrypt(r["content_enc"], SECRET, user_id)} for r in rows]


def _save_chat(user_id: str, role: str, text: str):
    with connect() as con:
        con.execute(
            "INSERT INTO chat_messages (user_id, role, content_enc) VALUES (?, ?, ?)",
            (user_id, role, encrypt(text, SECRET, user_id)),
        )


@app.get("/api/chat/history")
def chat_history(user_id: str = Depends(current_user)):
    return {"messages": _load_chat(user_id)}


@app.post("/api/chat")
def chat(body: ChatIn, user_id: str = Depends(current_user)):
    history = _load_chat(user_id)
    result = persona.reply(history, body.message)
    _save_chat(user_id, "user", body.message)
    _save_chat(user_id, "assistant", result["reply"])
    return result


# ---------- guided intake ----------

class AnswerIn(BaseModel):
    answer: str = Field(min_length=1, max_length=2000)


def _intake_state(user_id: str) -> dict:
    with connect() as con:
        row = con.execute("SELECT idx, followups FROM intake_state WHERE user_id = ?", (user_id,)).fetchone()
        if not row:
            con.execute("INSERT INTO intake_state (user_id, idx, followups) VALUES (?, 0, 0)", (user_id,))
            return {"idx": 0, "followups": 0}
    return {"idx": row["idx"], "followups": row["followups"]}


def _intake_view(idx: int, extra: dict | None = None) -> dict:
    total = len(intake.QUESTIONS)
    view = {"answered": min(idx, total), "total": total, "done": idx >= total}
    if idx < total:
        view["section"] = intake.QUESTIONS[idx]["section"]
        view["question"] = intake.QUESTIONS[idx]["question"]
    view.update(extra or {})
    return view


@app.get("/api/intake")
def intake_current(user_id: str = Depends(current_user)):
    return _intake_view(_intake_state(user_id)["idx"])


@app.post("/api/intake/answer")
def intake_answer(body: AnswerIn, user_id: str = Depends(current_user)):
    state = _intake_state(user_id)
    idx, followups = state["idx"], state["followups"]
    if idx >= len(intake.QUESTIONS):
        return _intake_view(idx)

    if is_crisis(body.answer):
        return _intake_view(idx, {"crisis": True, "message": HELPLINE_MESSAGE})

    question = intake.QUESTIONS[idx]["question"]
    verdict = {"complete": True, "follow_up": ""}
    if followups < intake.MAX_FOLLOWUPS:
        verdict = intake.review(question, body.answer)

    with connect() as con:
        con.execute(
            "INSERT INTO intake_answers (user_id, q_index, answer_enc) VALUES (?, ?, ?)",
            (user_id, idx, encrypt(body.answer, SECRET, user_id)),
        )
        if not verdict["complete"] and verdict["follow_up"]:
            con.execute("UPDATE intake_state SET followups = followups + 1 WHERE user_id = ?", (user_id,))
            return _intake_view(idx, {"follow_up": verdict["follow_up"]})
        con.execute("UPDATE intake_state SET idx = idx + 1, followups = 0 WHERE user_id = ?", (user_id,))
    return _intake_view(idx + 1)


@app.post("/api/intake/reset")
def intake_reset(user_id: str = Depends(current_user)):
    with connect() as con:
        con.execute("DELETE FROM intake_answers WHERE user_id = ?", (user_id,))
        con.execute("DELETE FROM intake_state WHERE user_id = ?", (user_id,))
    return _intake_view(_intake_state(user_id)["idx"])


# ---------- MindLog (encrypted journal) ----------

class JournalIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    content: str = Field(min_length=1, max_length=5000)
    entry_date: str | None = None


@app.post("/api/mindlog")
def mindlog_create(body: JournalIn, user_id: str = Depends(current_user)):
    emotion = mindlog.analyze(body.content)
    payload = json.dumps(
        {"title": body.title, "content": body.content, "emotion": emotion["emotion"], "method": emotion["method"]}
    )
    when = body.entry_date or date.today().isoformat()
    with connect() as con:
        con.execute(
            "INSERT INTO journal_entries (user_id, entry_date, payload_enc) VALUES (?, ?, ?)",
            (user_id, when, encrypt(payload, SECRET, user_id)),
        )
    result = {"saved": True, "emotion": emotion["emotion"], "method": emotion["method"]}
    if is_crisis(body.content):
        result["crisis"] = True
        result["message"] = HELPLINE_MESSAGE
    return result


@app.get("/api/mindlog")
def mindlog_list(user_id: str = Depends(current_user)):
    with connect() as con:
        rows = con.execute(
            "SELECT id, entry_date, payload_enc FROM journal_entries WHERE user_id = ? ORDER BY entry_date DESC, id DESC",
            (user_id,),
        ).fetchall()
    entries, counts = [], {e: 0 for e in mindlog.EMOTIONS}
    for r in rows:
        data = json.loads(decrypt(r["payload_enc"], SECRET, user_id))
        counts[data["emotion"]] += 1
        entries.append({"id": r["id"], "date": r["entry_date"], **data})
    return {"entries": entries, "emotion_counts": counts}


@app.get("/api/mindlog/raw")
def mindlog_raw(user_id: str = Depends(current_user)):
    """Demo helper: shows what is actually stored in the database."""
    with connect() as con:
        rows = con.execute(
            "SELECT id, entry_date, payload_enc FROM journal_entries WHERE user_id = ? ORDER BY id DESC LIMIT 5",
            (user_id,),
        ).fetchall()
    return {"stored": [{"id": r["id"], "date": r["entry_date"], "payload_enc": r["payload_enc"]} for r in rows]}


# ---------- frontend ----------

app.mount("/static", StaticFiles(directory=STATIC), name="static")


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")
