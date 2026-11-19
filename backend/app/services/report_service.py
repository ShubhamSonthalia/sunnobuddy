import io
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import HTTPException
from firebase_admin import firestore
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.core.firebase import get_db
from app.services import emotion_service, mindlog_service

EMOTIONS = emotion_service.EMOTIONS
POSITIVE = ["joy", "love"]
NEGATIVE = ["sadness", "anger", "fear"]


def _col(uid: str):
    return get_db().collection("users").document(uid).collection("reports")


def _iso(ts):
    return ts.isoformat() if ts else None


def _count_entries(uid: str, start: date, end: date) -> int:
    q = (mindlog_service._col(uid)
         .where("entryDate", ">=", start.isoformat())
         .where("entryDate", "<=", end.isoformat()))
    return sum(1 for _ in q.select(["entryDate"]).stream())


def _collect(uid: str, start: date, end: date) -> dict:
    if end < start:
        raise HTTPException(status_code=400, detail="end_date must be after start_date")
    if (end - start).days > 366:
        raise HTTPException(status_code=400, detail="Date range cannot exceed 1 year")
    trend = emotion_service.get_trend(uid, start, end)
    if not trend:
        raise HTTPException(status_code=400,
                            detail="No analyzed journal entries in this period")
    summary = emotion_service.get_summary(uid, start, end)
    total = max(_count_entries(uid, start, end), len(trend))
    return {"trend": trend, "summary": summary, "total_entries": total}


def _pattern_text(trend: list, summary: dict) -> list:
    lines = []
    n = len(trend)
    top = summary["most_frequent_emotion"]
    count = sum(1 for t in trend if t["emotion"] == top)
    lines.append(f"The most frequent dominant emotion was <b>{top}</b> "
                 f"({count} of {n} analyzed entries).")
    if n >= 4:
        half = n // 2

        def score(items):
            pos = sum(sum(t["emotions"][e] for e in POSITIVE) for t in items) / len(items)
            neg = sum(sum(t["emotions"][e] for e in NEGATIVE) for t in items) / len(items)
            return pos - neg

        diff = score(trend[half:]) - score(trend[:half])
        if diff > 0.1:
            lines.append("Entries in the later part of this period were more positive "
                         "than earlier entries.")
        elif diff < -0.1:
            lines.append("Entries in the later part of this period were more negative "
                         "than earlier entries.")
        else:
            lines.append("The overall tone stayed fairly similar through this period.")
    else:
        lines.append("Too few entries to describe a trend. Add more entries for better insight.")
    return lines


def build_pdf(data: dict, start: date, end: date) -> bytes:
    trend, summary = data["trend"], data["summary"]
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=styles["Title"], textColor=colors.HexColor("#2F4858"))
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], textColor=colors.HexColor("#2F4858"))
    body = styles["BodyText"]
    small = ParagraphStyle("small", parent=body, fontSize=8, textColor=colors.grey)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm,
                            topMargin=2 * cm, bottomMargin=2 * cm, title="SunnoBuddy MindLog Report")
    story = [Paragraph("SunnoBuddy", h1),
             Paragraph("MindLog Emotion Report", styles["Heading2"]), Spacer(1, 10)]

    info = [
        ["Reporting period", f"{start.isoformat()} to {end.isoformat()}"],
        ["Generated on", datetime.now(timezone.utc).strftime("%Y-%m-%d")],
        ["Journal entries in period", str(data["total_entries"])],
        ["Entries analyzed", str(len(trend))],
    ]
    t = Table(info, colWidths=[6 * cm, 10 * cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.lightgrey),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F1F5F9")),
    ]))
    story += [t, Spacer(1, 14), Paragraph("Emotion distribution", h2)]

    avg = summary["average_distribution"]
    d = Drawing(450, 180)
    chart = VerticalBarChart()
    chart.x, chart.y, chart.width, chart.height = 40, 30, 380, 130
    chart.data = [[round(avg[e] * 100, 1) for e in EMOTIONS]]
    chart.categoryAxis.categoryNames = [e.capitalize() for e in EMOTIONS]
    chart.valueAxis.valueMin = 0
    chart.valueAxis.valueMax = 100
    chart.valueAxis.valueStep = 20
    chart.bars[0].fillColor = colors.HexColor("#4F9DA6")
    d.add(chart)
    story += [d, Paragraph("Average share of each emotion (%) across analyzed entries.", small),
              Spacer(1, 10)]

    rows = [["Emotion", "Average (%)"]] + [[e.capitalize(), f"{avg[e] * 100:.1f}"] for e in EMOTIONS]
    t2 = Table(rows, colWidths=[6 * cm, 4 * cm])
    t2.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2F4858")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.lightgrey),
    ]))
    story += [t2, Spacer(1, 14), Paragraph("Mood trend", h2)]

    trows = [["Date", "Dominant emotion", "Confidence"]]
    for x in trend[-30:]:   # last 30 entries tak
        trows.append([x["date"], x["emotion"].capitalize(), f"{x['confidence'] * 100:.0f}%"])
    t3 = Table(trows, colWidths=[4 * cm, 6 * cm, 4 * cm], repeatRows=1)
    t3.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2F4858")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.lightgrey),
    ]))
    story += [t3, Spacer(1, 14), Paragraph("Observed patterns", h2)]
    for line in _pattern_text(trend, summary):
        story.append(Paragraph("&bull; " + line, body))

    story += [Spacer(1, 20), Paragraph(
        "<b>Disclaimer:</b> This report is generated by an automated emotion-classification "
        "system from your journal entries. It is not a clinical diagnosis or medical advice. "
        "Confidence scores are estimates and can be wrong. If you are struggling, please "
        "talk to a trusted person or a qualified mental health professional.", small)]
    doc.build(story)
    return buf.getvalue()


def create_report(uid: str, start: date, end: date) -> dict:
    data = _collect(uid, start, end)   # validate + data hai ya nahi
    ref = _col(uid).document()
    ref.set({
        "reportId": ref.id,
        "reportType": "mindlog",
        "startDate": start.isoformat(),
        "endDate": end.isoformat(),
        "entriesAnalyzed": len(data["trend"]),
        "status": "completed",
        "createdAt": firestore.SERVER_TIMESTAMP,
    })
    return {"report_id": ref.id, "status": "completed",
            "download_url": f"/api/reports/{ref.id}/download"}


def _meta(doc) -> dict:
    d = doc.to_dict()
    return {
        "report_id": doc.id,
        "report_type": d["reportType"],
        "start_date": d["startDate"],
        "end_date": d["endDate"],
        "entries_analyzed": d.get("entriesAnalyzed"),
        "status": d["status"],
        "created_at": _iso(d.get("createdAt")),
        "download_url": f"/api/reports/{doc.id}/download",
    }


def list_reports(uid: str) -> list:
    q = _col(uid).order_by("createdAt", direction=firestore.Query.DESCENDING)
    return [_meta(d) for d in q.stream()]


def _get_or_404(uid: str, report_id: str):
    doc = _col(uid).document(report_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Report not found")
    return doc


def get_report(uid: str, report_id: str) -> dict:
    return _meta(_get_or_404(uid, report_id))


def download_pdf(uid: str, report_id: str) -> bytes:
    d = _get_or_404(uid, report_id).to_dict()
    start = date.fromisoformat(d["startDate"])
    end = date.fromisoformat(d["endDate"])
    return build_pdf(_collect(uid, start, end), start, end)


def delete_report(uid: str, report_id: str) -> None:
    _get_or_404(uid, report_id)
    _col(uid).document(report_id).delete()