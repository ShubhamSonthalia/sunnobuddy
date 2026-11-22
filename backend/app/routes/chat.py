from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.models.chat import ChatRequest
from app.services import chat_service as svc
from app.utils.response_utils import ok

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("")
def send(body: ChatRequest, user=Depends(get_current_user)):
    return ok(svc.send_message(user["uid"], body.session_id, body.message, body.language))


@router.get("/sessions")        # /{session_id} se pehle
def sessions(user=Depends(get_current_user)):
    return ok(svc.list_sessions(user["uid"]))


@router.get("/stats")           # /{session_id} se pehle
def stats(user=Depends(get_current_user)):
    return ok(svc.get_chat_stats(user["uid"]))


@router.post("/new")            # /{session_id} se pehle
def new(user=Depends(get_current_user)):
    return ok({"session_id": svc.new_session(user["uid"])}, "Session created")


@router.get("/{session_id}")
def history(session_id: str, user=Depends(get_current_user)):
    return ok(svc.get_history(user["uid"], session_id))


@router.delete("/{session_id}")
def delete(session_id: str, user=Depends(get_current_user)):
    svc.delete_session(user["uid"], session_id)
    return ok(None, "Session deleted")