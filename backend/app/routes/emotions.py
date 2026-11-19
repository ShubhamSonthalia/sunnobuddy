from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.services import emotion_service as svc
from app.utils.response_utils import ok

router = APIRouter(prefix="/api/emotions", tags=["emotions"])


@router.post("/analyze/{entry_id}")
def analyze(entry_id: str, user=Depends(get_current_user)):
    return ok(svc.analyze_entry(user["uid"], entry_id), "Analysis completed")


@router.get("/summary")
def summary(start_date: Optional[date] = None, end_date: Optional[date] = None,
            user=Depends(get_current_user)):
    return ok(svc.get_summary(user["uid"], start_date, end_date))


@router.get("/trends")
def trends(start_date: Optional[date] = None, end_date: Optional[date] = None,
           user=Depends(get_current_user)):
    return ok(svc.get_trend(user["uid"], start_date, end_date))