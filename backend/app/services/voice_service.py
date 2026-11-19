from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from firebase_admin import firestore
from google import genai

from app.core.config import settings
from app.core.firebase import get_db
from app.services import chat_service
from app.services.crisis_service import detect_crisis, crisis_reply, HELPLINES
from app.services.encryption_service import encrypt

SESSION_MINUTES = 15

VOICE_PROMPT = chat_service.SYSTEM_PROMPT + """
This is a spoken conversation: keep replies short and natural, no lists or markdown.
If the user mentions harming themselves, stay calm and encourage them to contact a
helpline or someone they trust."""


_live = None


def _live_client():
    global _live
    if _live is None:
        # ephemeral tokens abhi v1alpha API par hain
        _live = genai.Client(api_key=settings.gemini_api_key,
                             http_options={"api_version": "v1alpha"})
    return _live

# def _live_client():
#     # ephemeral tokens abhi v1alpha API par hain
#     return genai.Client(api_key=settings.gemini_api_key,
#                         http_options={"api_version": "v1alpha"})


def create_session(uid: str, language: str) -> dict:
    ref = chat_service._sessions(uid).document()
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=SESSION_MINUTES)
    ref.set({
        "sessionId": ref.id,
        "title": "Voice chat",
        "channel": "voice",
        "language": language,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
        "expiresAt": expires,
        "messageCount": 0,
        "status": "active",
    })
    hint = chat_service.LANG_HINT.get(language, "")
    try:
        token = _live_client().auth_tokens.create(config={
            "uses": 1,
            "expire_time": expires,
            "new_session_expire_time": now + timedelta(minutes=1),
            "live_connect_constraints": {
                "model": settings.gemini_live_model,
                "config": {
                    "response_modalities": ["AUDIO"],
                    "system_instruction": VOICE_PROMPT + "\n" + hint,
                    "speech_config": {"voice_config": {
                        "prebuilt_voice_config": {"voice_name": settings.gemini_voice}}},
                    "input_audio_transcription": {},
                    "output_audio_transcription": {},
                },
            },
            "http_options": {"api_version": "v1alpha"},
        })
    # except Exception as e:
    #     print("VOICE TOKEN ERROR:", type(e).__name__, getattr(e, "message", ""))
    #     ref.delete()
    #     raise HTTPException(status_code=503, detail="Voice service temporarily unavailable")
    except Exception as e:
        import traceback
        traceback.print_exc()   # temporary debug
        print("VOICE TOKEN ERROR:", type(e).__name__, repr(e))
        ref.delete()
        raise HTTPException(status_code=503, detail="Voice service temporarily unavailable")
    return {
        "session_id": ref.id,
        "token": token.name,
        "model": settings.gemini_live_model,
        "expires_at": expires.isoformat(),
    }


def _active_session(uid: str, session_id: str):
    ref = chat_service._get_session_or_404(uid, session_id)
    d = ref.get().to_dict()
    if d.get("channel") != "voice":
        raise HTTPException(status_code=404, detail="Session not found")
    if d.get("status") != "active":
        raise HTTPException(status_code=409, detail="Session already ended")
    if d["expiresAt"] < datetime.now(timezone.utc):
        ref.update({"status": "expired"})
        raise HTTPException(status_code=410, detail="Session expired")
    return ref


def save_transcript(uid: str, session_id: str, turns: list) -> dict:
    ref = _active_session(uid, session_id)
    base = datetime.now(timezone.utc)
    batch = get_db().batch()
    msgs = ref.collection("messages")
    crisis_lang = None
    for i, t in enumerate(turns):
        if t.role == "user":
            flagged, lang = detect_crisis(t.text)
            if flagged and crisis_lang is None:
                crisis_lang = lang
        enc = encrypt(t.text, uid)
        batch.set(msgs.document(), {
            "role": t.role,
            "encryptedContent": enc["ciphertext"],
            "nonce": enc["nonce"],
            "createdAt": base + timedelta(milliseconds=i),
        })
    batch.update(ref, {"updatedAt": firestore.SERVER_TIMESTAMP,
                       "messageCount": firestore.Increment(len(turns))})
    batch.commit()

    if crisis_lang:
        get_db().collection("users").document(uid).collection("safetyEvents").add({
            "sessionId": session_id, "channel": "voice",
            "createdAt": firestore.SERVER_TIMESTAMP})
        return {"saved": len(turns), "crisis_detected": True,
                "safety_message": crisis_reply(crisis_lang), "helplines": HELPLINES}
    return {"saved": len(turns), "crisis_detected": False,
            "safety_message": None, "helplines": []}


def end_session(uid: str, session_id: str) -> None:
    ref = chat_service._get_session_or_404(uid, session_id)
    if ref.get().to_dict().get("status") == "active":
        ref.update({"status": "ended", "updatedAt": firestore.SERVER_TIMESTAMP})