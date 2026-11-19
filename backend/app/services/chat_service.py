from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException
from firebase_admin import firestore
from google import genai
from google.genai import types

from app.core.config import settings
from app.core.firebase import get_db
from app.services.crisis_service import detect_crisis, crisis_reply, HELPLINES
from app.services.encryption_service import encrypt, decrypt

SYSTEM_PROMPT = """You are SunnoBuddy, a warm, supportive companion for students.
- You are NOT a therapist or doctor. Never diagnose, and never give medication advice.
- Keep replies short (2-5 sentences), gentle and non-judgmental.
- Reflect the user's feelings, then ask at most one open question.
- Reply in the same language and script the user writes in. If they write Hinglish
  (Hindi in English letters), reply in Hinglish. If Hindi in Devanagari, reply in Hindi.
- Encourage reaching out to trusted people when things feel heavy.
- If the user seems to be in danger, encourage contacting a helpline or emergency services."""

LANG_HINT = {
    "en": "Reply in English.",
    "hi": "Reply in Hindi (Devanagari).",
    "hinglish": "Reply in Hinglish (Hindi written in English letters).",
}

FALLBACK = "Sorry, I'm having trouble responding right now. Please try again in a moment."

_client = None


def _gemini():
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


def _sessions(uid: str):
    return get_db().collection("users").document(uid).collection("conversations")


def _iso(ts):
    return ts.isoformat() if ts else None


def _get_session_or_404(uid: str, session_id: str):
    ref = _sessions(uid).document(session_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Session not found")
    return ref


def new_session(uid: str, language: str = "en") -> str:
    ref = _sessions(uid).document()
    ref.set({
        "sessionId": ref.id,
        "title": "New chat",   # title me user ka text nahi rakhte (privacy)
        "language": language,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
        "messageCount": 0,
        "status": "active",
    })
    return ref.id


def list_sessions(uid: str) -> list:
    q = _sessions(uid).order_by("updatedAt", direction=firestore.Query.DESCENDING)
    out = []
    for doc in q.stream():
        d = doc.to_dict()
        out.append({
            "session_id": doc.id,
            "title": d.get("title"),
            "message_count": d.get("messageCount", 0),
            "created_at": _iso(d.get("createdAt")),
            "updated_at": _iso(d.get("updatedAt")),
        })
    return out


def get_history(uid: str, session_id: str, limit: Optional[int] = None) -> list:
    ref = _get_session_or_404(uid, session_id)
    q = ref.collection("messages")
    if limit:
        q = q.order_by("createdAt", direction=firestore.Query.DESCENDING).limit(limit)
        docs = list(q.stream())[::-1]
    else:
        docs = list(q.order_by("createdAt").stream())
    return [{
        "message_id": d.id,
        "role": d.to_dict()["role"],
        "content": decrypt(d.to_dict()["encryptedContent"], d.to_dict()["nonce"], uid),
        "created_at": _iso(d.to_dict().get("createdAt")),
    } for d in docs]


def delete_session(uid: str, session_id: str) -> None:
    ref = _get_session_or_404(uid, session_id)
    # Firestore parent delete subcollection delete nahi karta, isliye messages pehle delete
    for m in ref.collection("messages").stream():
        m.reference.delete()
    ref.delete()


def _generate(history: list, message: str, language: str) -> str:
    contents = [
        types.Content(
            role="user" if m["role"] == "user" else "model",
            parts=[types.Part(text=m["content"])],
        )
        for m in history
    ]
    contents.append(types.Content(role="user", parts=[types.Part(text=message)]))
    system = SYSTEM_PROMPT + "\n" + LANG_HINT.get(language, "")
    resp = _gemini().models.generate_content(
        model=settings.gemini_model,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system, temperature=0.7, max_output_tokens=2048, 
        ),
    )
    text = (resp.text or "").strip()
    if resp.candidates and str(resp.candidates[0].finish_reason).endswith("MAX_TOKENS"):
        print("WARNING: reply truncated")   # debug
    return text or FALLBACK


def _save_pair(uid, session_ref, user_text, reply, user_time):
    db = get_db()
    batch = db.batch()
    msgs = session_ref.collection("messages")
    for role, text, ts in (
        ("user", user_text, user_time),
        ("assistant", reply, user_time + timedelta(milliseconds=1)),
    ):
        enc = encrypt(text, uid)
        batch.set(msgs.document(), {
            "role": role,
            "encryptedContent": enc["ciphertext"],
            "nonce": enc["nonce"],
            "createdAt": ts,
        })
    batch.update(session_ref, {
        "updatedAt": firestore.SERVER_TIMESTAMP,
        "messageCount": firestore.Increment(2),
    })
    batch.commit()


def _log_safety_event(uid: str, session_id: str):
    # Sirf metadata, message ka content bilkul nahi
    get_db().collection("users").document(uid).collection("safetyEvents").add({
        "sessionId": session_id,
        "channel": "chat",
        "createdAt": firestore.SERVER_TIMESTAMP,
    })


def send_message(uid: str, session_id: Optional[str], message: str, language: str) -> dict:
    if session_id is None:
        session_id = new_session(uid, language if language != "auto" else "en")
    session_ref = _get_session_or_404(uid, session_id)
    user_time = datetime.now(timezone.utc)

    flagged, matched_lang = detect_crisis(message)
    if flagged:
        reply_lang = language if language in ("en", "hi", "hinglish") else matched_lang
        reply = crisis_reply(reply_lang)
        _log_safety_event(uid, session_id)
        _save_pair(uid, session_ref, message, reply, user_time)
        return {"session_id": session_id, "reply": reply,
                "crisis_detected": True, "helplines": HELPLINES}

    history = get_history(uid, session_id, limit=20)
    try:
        reply = _generate(history, message, language)
    except Exception as e:
        print("GEMINI ERROR:", type(e).__name__, getattr(e, "code", ""), getattr(e, "message", ""))
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable")

    _save_pair(uid, session_ref, message, reply, user_time)
    return {"session_id": session_id, "reply": reply,
            "crisis_detected": False, "helplines": []}