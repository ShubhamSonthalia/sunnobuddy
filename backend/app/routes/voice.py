from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.security import get_current_user
from app.models.voice import VoiceSessionRequest, TranscriptRequest
from app.services import voice_service as svc
from app.utils.response_utils import ok

router = APIRouter(prefix="/api/voice", tags=["voice"])


class EndRequest(BaseModel):
    session_id: str


@router.post("/session")
def create(body: VoiceSessionRequest, user=Depends(get_current_user)):
    return ok(svc.create_session(user["uid"], body.language))


@router.post("/session/end")   # {session_id} wale route se pehle
def end(body: EndRequest, user=Depends(get_current_user)):
    svc.end_session(user["uid"], body.session_id)
    return ok(None, "Session ended")


@router.post("/session/{session_id}/transcript")
def transcript(session_id: str, body: TranscriptRequest, user=Depends(get_current_user)):
    return ok(svc.save_transcript(user["uid"], session_id, body.turns))