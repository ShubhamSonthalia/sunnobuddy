from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks
from app.core.security import require_authenticated_user as get_current_user
from app.models.mindlog import MindLogCreate, MindLogUpdate
from app.services import mindlog_service as svc
from app.services import emotion_service
from app.utils.response_utils import ok

router = APIRouter(prefix="/api/mindlog", tags=["mindlog"])


# @router.post("")
# def create(body: MindLogCreate, user=Depends(get_current_user)):
#     data = svc.create_entry(user["uid"], body.title, body.content, body.entry_date)
#     return ok(data, "Entry created")

@router.post("")
def create(body: MindLogCreate, background: BackgroundTasks, user=Depends(get_current_user)):
    data = svc.create_entry(user["uid"], body.title, body.content, body.entry_date)
    background.add_task(emotion_service.safe_analyze, user["uid"], data["entry_id"])
    return ok(data, "Entry created")





@router.get("")
def list_all(start_date: Optional[date] = None, end_date: Optional[date] = None,
             user=Depends(get_current_user)):
    return ok(svc.list_entries(user["uid"], start_date, end_date))


@router.get("/calendar")  # /{entry_id} se pehle hona zaroori hai
def calendar(user=Depends(get_current_user)):
    return ok(svc.calendar_dates(user["uid"]))


@router.get("/{entry_id}")
def get_one(entry_id: str, user=Depends(get_current_user)):
    return ok(svc.get_entry(user["uid"], entry_id))


# @router.put("/{entry_id}")
# def update(entry_id: str, body: MindLogUpdate, user=Depends(get_current_user)):
#     data = svc.update_entry(user["uid"], entry_id, body.title, body.content, body.entry_date)
#     return ok(data, "Entry updated")

@router.put("/{entry_id}")
def update(entry_id: str, body: MindLogUpdate, background: BackgroundTasks,
           user=Depends(get_current_user)):
    data = svc.update_entry(user["uid"], entry_id, body.title, body.content, body.entry_date)
    if body.content is not None:
        background.add_task(emotion_service.safe_analyze, user["uid"], entry_id)
    return ok(data, "Entry updated")


@router.delete("/{entry_id}")
def delete(entry_id: str, user=Depends(get_current_user)):
    svc.delete_entry(user["uid"], entry_id)
    return ok(None, "Entry deleted")