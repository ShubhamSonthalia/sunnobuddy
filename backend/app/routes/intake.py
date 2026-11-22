from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user
from app.models.intake import AnswerRequest
from app.services import intake_service as svc
from app.utils.response_utils import ok

router = APIRouter(prefix="/api/intake", tags=["intake"])


@router.post("/start")
def start(user=Depends(get_current_user)):
    return ok(svc.start_session(user["uid"]), "Intake session ready")


@router.get("/user-status")
def user_status(user=Depends(get_current_user)):
    return ok(svc.get_user_status(user["uid"]))


@router.post("/retake")
def retake(user=Depends(get_current_user)):
    return ok(svc.start_session(user["uid"], force_retake=True), "New intake session ready")


@router.get("/history")
def history(user=Depends(get_current_user)):
    return ok(svc.list_intake_history(user["uid"]))


@router.get("/compare")
def compare_assessments(
    current_id: Optional[str] = Query(None),
    previous_id: Optional[str] = Query(None),
    user=Depends(get_current_user),
):
    return ok(svc.get_monthly_comparison(user["uid"], current_id, previous_id))


@router.get("/assessments/{session_id}")
def assessment(session_id: str, user=Depends(get_current_user)):
    return ok(svc.get_assessment_report(user["uid"], session_id))


@router.get("/{session_id}")
def status(session_id: str, user=Depends(get_current_user)):
    return ok(svc.get_state(user["uid"], session_id))


@router.get("/{session_id}/current")
def current(session_id: str, user=Depends(get_current_user)):
    return ok(svc.get_state(user["uid"], session_id)["current_question"])


@router.get("/{session_id}/progress")
def progress(session_id: str, user=Depends(get_current_user)):
    return ok(svc.get_progress(user["uid"], session_id))


@router.post("/{session_id}/answer")
def answer(session_id: str, body: AnswerRequest, user=Depends(get_current_user)):
    return ok(svc.submit_answer(user["uid"], session_id, body.answer))


@router.post("/{session_id}/resume")
def resume(session_id: str, user=Depends(get_current_user)):
    return ok(svc.get_state(user["uid"], session_id), "Session resumed")