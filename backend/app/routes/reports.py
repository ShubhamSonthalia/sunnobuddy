from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel
from app.core.security import get_current_user
from app.services import report_service as svc
from app.utils.response_utils import ok

router = APIRouter(prefix="/api/reports", tags=["reports"])


class ReportRequest(BaseModel):
    period: Optional[str] = "30d"  # 7d, 30d, 90d, all, custom
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    sources: Optional[list[str]] = None


@router.post("")
@router.post("/generate")
@router.post("/mindlog")
def create(body: ReportRequest, user=Depends(get_current_user)):
    return ok(svc.create_wellness_report(user["uid"], body), "Report generated")


@router.get("")
def list_all(user=Depends(get_current_user)):
    return ok(svc.list_reports(user["uid"]))


@router.get("/{report_id}")
def get_one(report_id: str, user=Depends(get_current_user)):
    return ok(svc.get_report(user["uid"], report_id))


@router.get("/{report_id}/download")
def download(report_id: str, user=Depends(get_current_user)):
    pdf = svc.download_pdf(user["uid"], report_id)
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="sunnobuddy_report_{report_id}.pdf"'})


@router.delete("/{report_id}")
def delete(report_id: str, user=Depends(get_current_user)):
    svc.delete_report(user["uid"], report_id)
    return ok(None, "Report deleted")