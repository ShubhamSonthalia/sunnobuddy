import json
from pathlib import Path

from fastapi import HTTPException
from firebase_admin import firestore

from app.core.firebase import get_db
from app.services import intake_agents
from app.services.crisis_service import detect_crisis, crisis_reply, HELPLINES
from app.services.encryption_service import encrypt, decrypt

QUESTIONS_PATH = Path(__file__).resolve().parent.parent / "data" / "therapy_questionnaire.json"
MAX_FOLLOWUPS = 1
NO_FOLLOWUP_SECTIONS = {"Risk to Self / Others"}
PLAIN_NO = {"no", "nope", "nahi", "nahin", "never", "none", "not at all"}


def _load() -> list:
    raw = json.loads(QUESTIONS_PATH.read_text(encoding="utf-8"))
    qs = []
    for section, items in raw.items():
        for item in items:
            qs.append({
                "id": f"Q{len(qs) + 1}",
                "index": len(qs),
                "section": section,
                "question": item["question"],
                "example": item.get("expected_answer", ""),
            })
    return qs


QUESTIONS = _load()
BY_ID = {q["id"]: q for q in QUESTIONS}


def _col(uid: str):
    return get_db().collection("users").document(uid).collection("intakeSessions")


def _get_ref_or_404(uid: str, session_id: str):
    ref = _col(uid).document(session_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Intake session not found")
    return ref


def _enc(text: str, uid: str) -> dict:
    e = encrypt(text, uid)
    return {"ciphertext": e["ciphertext"], "nonce": e["nonce"]}


def _dec(blob: dict, uid: str) -> str:
    return decrypt(blob["ciphertext"], blob["nonce"], uid)


def _state(uid: str, doc) -> dict:
    d = doc.to_dict()
    q = BY_ID.get(d.get("currentQuestionId")) if d["status"] == "in_progress" else None
    current = None
    if q:
        fu = _dec(d["pendingFollowUp"], uid) if d.get("pendingFollowUp") else None
        current = {"question_id": q["id"], "section": q["section"],
                   "question": q["question"], "followup_question": fu}
    return {
        "session_id": doc.id,
        "status": d["status"],
        "current_question": current,
        "progress": intake_agents.progress(d["totalQuestions"], d["completedQuestions"]),
    }


def start_session(uid: str) -> dict:
    existing = list(_col(uid).where("status", "==", "in_progress").limit(1).stream())
    if existing:   # naya nahi banate, purana resume hota hai
        return _state(uid, existing[0])
    ref = _col(uid).document()
    ref.set({
        "sessionId": ref.id,
        "status": "in_progress",
        "currentQuestionId": QUESTIONS[0]["id"],
        "totalQuestions": len(QUESTIONS),
        "completedQuestions": 0,
        "completionPercentage": 0,
        "followUpCount": 0,
        "pendingFollowUp": None,
        "startedAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
        "completedAt": None,
    })
    return _state(uid, ref.get())


def get_state(uid: str, session_id: str) -> dict:
    return _state(uid, _get_ref_or_404(uid, session_id).get())


def get_progress(uid: str, session_id: str) -> dict:
    return get_state(uid, session_id)["progress"]


def _crisis_lang(q: dict, text: str):
    # Risk section me sirf seedha "No" wale answer ko skip karte hain, baaki sab check hota hai
    if q["section"] == "Risk to Self / Others" and text.strip(" .!").lower() in PLAIN_NO:
        return None
    flagged, lang = detect_crisis(text)
    return lang if flagged else None


def submit_answer(uid: str, session_id: str, text: str) -> dict:
    ref = _get_ref_or_404(uid, session_id)
    d = ref.get().to_dict()
    if d["status"] != "in_progress":
        raise HTTPException(status_code=409, detail="Intake already completed")

    q = BY_ID[d["currentQuestionId"]]
    ans_ref = ref.collection("answers").document(q["id"])
    prev = ans_ref.get()
    crisis_lang = _crisis_lang(q, text)

    if prev.exists:   # follow-up ka jawab: pehle wale answer ke saath jodte hain
        pd = prev.to_dict()
        prev_text = decrypt(pd["encryptedAnswer"], pd["nonce"], uid)
        fq = _dec(d["pendingFollowUp"], uid) if d.get("pendingFollowUp") else ""
        combined = f"{prev_text}\nFollow-up question: {fq}\nFollow-up answer: {text}"
    else:
        combined = text

    followup = None
    if (not crisis_lang and q["section"] not in NO_FOLLOWUP_SECTIONS
            and d.get("followUpCount", 0) < MAX_FOLLOWUPS):
        rv = intake_agents.review(q["question"], q["example"], combined)
        if rv and not rv.get("is_complete", True) and rv.get("followup_required", True):
            followup = intake_agents.followup(q["question"], combined, rv.get("reason", ""))

    enc = encrypt(combined, uid)
    answer_doc = {
        "questionId": q["id"],
        "encryptedAnswer": enc["ciphertext"],
        "nonce": enc["nonce"],
        "status": "needs_followup" if followup else "complete",
        "followUpRequired": bool(followup),
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }
    if not prev.exists:
        answer_doc["createdAt"] = firestore.SERVER_TIMESTAMP
    ans_ref.set(answer_doc, merge=True)

    if followup:
        ref.update({
            "pendingFollowUp": _enc(followup, uid),
            "followUpCount": firestore.Increment(1),
            "updatedAt": firestore.SERVER_TIMESTAMP,
        })
    else:
        completed = q["index"] + 1
        finished = completed == len(QUESTIONS)
        prog = intake_agents.progress(len(QUESTIONS), completed)
        ref.update({
            "completedQuestions": completed,
            "completionPercentage": prog["completion_percentage"],
            "currentQuestionId": None if finished else QUESTIONS[q["index"] + 1]["id"],
            "status": "completed" if finished else "in_progress",
            "completedAt": firestore.SERVER_TIMESTAMP if finished else None,
            "followUpCount": 0,
            "pendingFollowUp": None,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        })

    result = _state(uid, ref.get())
    result["followup_required"] = bool(followup)
    result["crisis_detected"] = bool(crisis_lang)
    result["safety_message"] = crisis_reply(crisis_lang) if crisis_lang else None
    result["helplines"] = HELPLINES if crisis_lang else []
    if crisis_lang:   # sirf metadata, answer ka content nahi
        get_db().collection("users").document(uid).collection("safetyEvents").add({
            "sessionId": session_id, "channel": "intake",
            "createdAt": firestore.SERVER_TIMESTAMP})
    return result