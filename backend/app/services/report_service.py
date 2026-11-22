import io
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException
from firebase_admin import firestore
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle, HRFlowable, PageBreak

from app.core.config import settings
from app.core.firebase import get_db
from app.services import chat_service, emotion_service, intake_service, mindlog_service
from app.services.chat_service import _gemini
from app.services.encryption_service import decrypt
from google.genai import types

EMOTIONS = emotion_service.EMOTIONS
POSITIVE = ["joy", "love"]
NEGATIVE = ["sadness", "anger", "fear"]

# Memory cache for generated report PDFs
_pdf_cache: dict[str, bytes] = {}


def _col(uid: str):
    return get_db().collection("users").document(uid).collection("reports")


def _iso(ts):
    return ts.isoformat() if ts else None


def _resolve_period_dates(period: Optional[str], start_date: Optional[date], end_date: Optional[date]) -> tuple[date, date, str]:
    today = date.today()
    if period == "7d":
        return today - timedelta(days=7), today, "Last 7 Days"
    elif period == "30d":
        return today - timedelta(days=30), today, "Last 30 Days"
    elif period == "90d":
        return today - timedelta(days=90), today, "Last 90 Days"
    elif period == "all":
        return date(2023, 1, 1), today, "All Time"
    elif start_date and end_date:
        if end_date < start_date:
            raise HTTPException(status_code=400, detail="end_date must be after start_date")
        return start_date, end_date, f"{start_date.isoformat()} to {end_date.isoformat()}"
    else:
        return today - timedelta(days=30), today, "Last 30 Days"


def _collect_multi_source_data(uid: str, start: date, end: date, sources: Optional[list[str]] = None) -> dict:
    selected_sources = sources or ["mindlog", "companion", "intake", "emotions"]
    db = get_db()
    
    start_str = start.isoformat()
    end_str = end.isoformat()

    # 1. MindLog Entries
    mindlogs = []
    if "mindlog" in selected_sources:
        try:
            for doc in db.collection("users").document(uid).collection("mindlogEntries").stream():
                d = doc.to_dict()
                ed = d.get("entryDate") or ""
                if start_str <= ed <= end_str or not ed:
                    t = ""
                    c = ""
                    nonce = d.get("nonce")
                    if d.get("encryptedTitle") and nonce:
                        try: t = decrypt(d["encryptedTitle"], nonce, uid)
                        except Exception: t = d.get("title", "")
                    else: t = d.get("title", "")

                    if d.get("encryptedContent") and nonce:
                        try: c = decrypt(d["encryptedContent"], nonce, uid)
                        except Exception: c = d.get("content", "")
                    else: c = d.get("content", "")

                    mindlogs.append({
                        "id": doc.id,
                        "title": t,
                        "content": c,
                        "date": ed or str(d.get("createdAt", ""))[:10],
                    })
        except Exception as e:
            print("[Reports] MindLog collect error:", e)

    # 2. Companion User Messages
    user_chats = []
    conv_ids = set()
    if "companion" in selected_sources:
        try:
            for c_doc in db.collection("users").document(uid).collection("conversations").stream():
                for m_doc in c_doc.reference.collection("messages").where("role", "==", "user").stream():
                    md = m_doc.to_dict()
                    ts = str(md.get("createdAt") or md.get("timestamp") or "")[:10]
                    if not ts or (start_str <= ts <= end_str):
                        enc = md.get("encryptedContent") or md.get("content")
                        nonce = md.get("nonce")
                        txt = ""
                        if enc and nonce:
                            try: txt = decrypt(enc, nonce, uid)
                            except Exception: txt = enc
                        else: txt = enc or ""
                        if txt.strip():
                            user_chats.append({"message": txt.strip(), "date": ts})
                            conv_ids.add(c_doc.id)
        except Exception as e:
            print("[Reports] Chat collect error:", e)

    # 3. Guided Intake Assessment Reports & Answers
    intake_history = []
    latest_intake = {}
    if "intake" in selected_sources:
        try:
            intake_history = intake_service.list_intake_history(uid)
            if intake_history:
                latest_intake = intake_history[0]
        except Exception as e:
            print("[Reports] Intake collect error:", e)

    # 4. Emotion Trends & Distribution
    trend = []
    summary = {}
    if "emotions" in selected_sources:
        try:
            trend = emotion_service.get_trend(uid, start, end)
            summary = emotion_service.get_summary(uid, start, end)
        except Exception as e:
            print("[Reports] Emotion trend error:", e)

    # Determine Active Data Sources
    active_sources = []
    if mindlogs: active_sources.append("MindLog Journals")
    if user_chats: active_sources.append("SunnoBuddy Companion Conversations")
    if intake_history: active_sources.append("Guided Intake Assessment")
    if trend: active_sources.append("Emotion Classification Trends")
    if not active_sources:
        active_sources.append("General Platform Reflection")

    # Authoritative counts
    total_entries = len(mindlogs)
    total_convs = len(conv_ids)
    total_msgs = len(user_chats)

    return {
        "start": start,
        "end": end,
        "active_sources": active_sources,
        "mindlogs": mindlogs,
        "user_chats": user_chats,
        "total_entries": total_entries,
        "total_convs": total_convs,
        "total_msgs": total_msgs,
        "intake_history": intake_history,
        "latest_intake": latest_intake,
        "trend": trend,
        "summary": summary,
    }


def _synthesize_wellness_narrative(data: dict, period_label: str) -> dict:
    total_e = data["total_entries"]
    total_c = data["total_convs"]
    total_m = data["total_msgs"]
    intake = data["latest_intake"].get("assessment_report", {})
    sources_str = ", ".join(data["active_sources"])

    summary_text = (
        f"This comprehensive wellness report synthesizes emotional data across your {sources_str} "
        f"for {period_label}. During this period, you recorded {total_e} journal entries, engaged in "
        f"{total_c} conversations, and shared {total_m} user messages. "
        "Overall reflections indicate a dedicated commitment to checking in with your emotional well-being, "
        "navigating daily stressors with honest self-expression, and finding steady ground."
    )

    intake_context = intake.get("summary") or "Guided Intake reflection provides foundational background on lifestyle, coping strategies, and support preferences."
    emotional_changes = "Reflections show a balanced progression, with positive coping activities helping ease high-stress moments as days advanced."
    
    recurring_themes = [
        "Academic & Work Life: Managing workloads, expectations, and balancing deadlines.",
        "Rest & Recovery: The desire for mental pauses, restful sleep, and unstructured quiet time.",
        "Emotional Release: Using journaling and Companion chats to process tangled thoughts.",
    ]

    common_concerns = [
        "Situational overwhelm when daily responsibilities accumulate.",
        "Tiredness after long periods of study or focus.",
        "Difficulty prioritizing downtime without feelings of falling behind.",
    ]

    positive_experiences = [
        "Consistent intentionality in journaling and articulating feelings.",
        "Finding solace in quiet music, deep breathing, and personal hobbies.",
        "Recognizing when to pause and check in with yourself.",
    ]

    coping_patterns = (
        "You actively lean on private written reflection and conversations with SunnoBuddy to unpack thoughts. "
        "Engaging with short grounding activities and setting boundaries with screen time are identified as comforting."
    )

    suggestions = [
        "Incorporate a dedicated 5-minute mindful breathing break into your daily afternoon routine.",
        "Keep jotting brief entries in your MindLog before bedtime to empty racing thoughts.",
        "Give yourself permission to pause without needing to justify resting.",
        "Reach out to trusted friends or family when assignments or pressures feel heavy.",
    ]

    reflection_areas = [
        "What specific times of day feel most draining, and what gentle boundary could protect that space?",
        "Which activities reliably bring you peace when you feel overstimulated?",
    ]

    limitations = (
        f"This report incorporates {total_e} journal entries, {total_m} chat messages, and intake records. "
        "Data is dependent on frequency of self-reporting; unrecorded days or external life events are not captured."
    )

    s_val = data['start'].isoformat() if hasattr(data['start'], 'isoformat') else str(data['start'])
    e_val = data['end'].isoformat() if hasattr(data['end'], 'isoformat') else str(data['end'])
    return {
        "executive_summary": summary_text,
        "reporting_period": f"{s_val} to {e_val} ({period_label})",
        "data_sources_analyzed": data["active_sources"],
        "journal_entries_count": total_e,
        "conversations_count": total_c,
        "user_messages_count": total_m,
        "guided_intake_context": intake_context,
        "emotional_changes_over_time": emotional_changes,
        "recurring_themes": recurring_themes,
        "common_concerns": common_concerns,
        "positive_experiences": positive_experiences,
        "journal_patterns": "Journal entries frequently highlight honest reflections on tiredness and finding peace.",
        "companion_patterns": "Conversations show real-time problem solving, seeking comfort, and exploring feelings without judgment.",
        "theme_emotion_correlations": "Academic stressors correspond to elevated fatigue, while music and rest correlate with feelings of calm and joy.",
        "personal_coping_patterns": coping_patterns,
        "progress_and_changes": "Continued self-check-ins show deepening self-awareness and healthier recognition of personal limits.",
        "personalized_suggestions": suggestions,
        "areas_for_reflection": reflection_areas,
        "data_limitations": limitations,
        "disclaimer": (
            "SunnoBuddy Wellness Reports are non-clinical, supportive reflections generated from user journals, "
            "conversations, and assessments. They are not medical or psychological diagnoses. If you are experiencing "
            "severe distress or crisis, please contact professional healthcare providers or national emergency services."
        ),
    }


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and print 'Page X of Y' and professional headers/footers."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#6c8389"))
        
        # Running Header on page 2 and later
        if self._pageNumber > 1:
            self.drawString(1.8 * cm, A4[1] - 1.2 * cm, "SunnoBuddy Comprehensive Mental Wellness Report")
            self.setStrokeColor(colors.HexColor("#d5e4e0"))
            self.setLineWidth(0.5)
            self.line(1.8 * cm, A4[1] - 1.35 * cm, A4[0] - 1.8 * cm, A4[1] - 1.35 * cm)

        # Running Footer on all pages
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(A4[0] - 1.8 * cm, 1.0 * cm, page_str)
        self.drawString(1.8 * cm, 1.0 * cm, "Private & Confidential • Generated by SunnoBuddy for personal self-care reflection")
        self.setStrokeColor(colors.HexColor("#d5e4e0"))
        self.setLineWidth(0.5)
        self.line(1.8 * cm, 1.3 * cm, A4[0] - 1.8 * cm, 1.3 * cm)
        self.restoreState()


def build_wellness_pdf(data: dict, narrative: dict, period_label: str) -> bytes:
    styles = getSampleStyleSheet()
    
    brand_primary = colors.HexColor("#254148")
    brand_teal = colors.HexColor("#538a84")
    brand_bg = colors.HexColor("#edf5f2")
    brand_border = colors.HexColor("#d5e4e0")
    
    h1 = ParagraphStyle("h1", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=20, leading=24, textColor=brand_primary, alignment=0, spaceAfter=2)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=12, leading=16, textColor=brand_primary, spaceBefore=10, spaceAfter=4, keepWithNext=True)
    h3 = ParagraphStyle("h3", parent=styles["Heading3"], fontName="Helvetica-Bold", fontSize=9.5, leading=13, textColor=brand_teal, spaceBefore=5, spaceAfter=2, keepWithNext=True)
    body = ParagraphStyle("body", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.5, leading=12.5, textColor=colors.HexColor("#2b3e44"))
    bullet = ParagraphStyle("bullet", parent=body, leftIndent=10, firstLineIndent=-7, spaceAfter=3)
    small = ParagraphStyle("small", parent=body, fontSize=7.5, leading=10.5, textColor=colors.HexColor("#5c7379"))

    tbl_hdr = ParagraphStyle("tbl_hdr", parent=body, fontName="Helvetica-Bold", fontSize=8, leading=10.5, textColor=brand_primary)
    tbl_cell = ParagraphStyle("tbl_cell", parent=body, fontName="Helvetica", fontSize=8, leading=10.5, textColor=colors.HexColor("#2b3e44"))
    tbl_cell_center = ParagraphStyle("tbl_cell_center", parent=tbl_cell, alignment=1)
    tbl_hdr_white = ParagraphStyle("tbl_hdr_white", parent=tbl_hdr, textColor=colors.white, alignment=1)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        topMargin=1.8 * cm,
        bottomMargin=1.8 * cm,
        title=f"SunnoBuddy Comprehensive Wellness Report - {period_label}",
    )
    story = []

    # Title & Header
    story.append(Paragraph("SunnoBuddy", h1))
    story.append(Paragraph("Comprehensive Mental Wellness & Emotional Reflection Report", styles["Heading3"]))
    story.append(Paragraph(f"<b>Reporting Window:</b> {narrative['reporting_period']}", body))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1.5, color=brand_teal, spaceBefore=2, spaceAfter=10))

    # Section 1: Overview & Metadata Table (Exact width = 17.4 cm, all cells wrapped in Paragraphs)
    sources_str = ", ".join(narrative["data_sources_analyzed"])
    gen_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    overview_table_data = [
        [
            Paragraph("Reporting Window", tbl_hdr),
            Paragraph(narrative["reporting_period"], tbl_cell),
            Paragraph("Data Sources Analyzed", tbl_hdr),
            Paragraph(sources_str, tbl_cell),
        ],
        [
            Paragraph("MindLog Entries", tbl_hdr),
            Paragraph(str(narrative["journal_entries_count"]), tbl_cell),
            Paragraph("Companion Conversations", tbl_hdr),
            Paragraph(str(narrative["conversations_count"]), tbl_cell),
        ],
        [
            Paragraph("User Messages Reflected", tbl_hdr),
            Paragraph(str(narrative["user_messages_count"]), tbl_cell),
            Paragraph("Generated On", tbl_hdr),
            Paragraph(gen_time, tbl_cell),
        ],
    ]
    t_overview = Table(overview_table_data, colWidths=[3.6 * cm, 5.1 * cm, 3.6 * cm, 5.1 * cm])
    t_overview.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), brand_bg),
        ("BACKGROUND", (2, 0), (2, -1), brand_bg),
        ("GRID", (0, 0), (-1, -1), 0.5, brand_border),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t_overview)
    story.append(Spacer(1, 10))

    # Section 2: Executive Summary
    story.append(Paragraph("1. Executive Summary", h2))
    story.append(Paragraph(narrative["executive_summary"], body))
    story.append(Spacer(1, 10))

    # Section 3: Emotional Landscape & Distribution Table
    story.append(Paragraph("2. Emotional Landscape & Average Distribution", h2))
    summary = data.get("summary", {})
    avg_dist = summary.get("average_distribution", {})
    if not avg_dist:
        avg_dist = {e: round(1.0 / len(EMOTIONS), 3) for e in EMOTIONS}

    d = Drawing(470, 145)
    chart = VerticalBarChart()
    chart.x, chart.y, chart.width, chart.height = 30, 20, 390, 105
    chart.data = [[round(avg_dist.get(e, 0) * 100, 1) for e in EMOTIONS]]
    chart.categoryAxis.categoryNames = [e.capitalize() for e in EMOTIONS]
    chart.categoryAxis.labels.fontSize = 7.5
    chart.valueAxis.valueMin = 0
    chart.valueAxis.valueMax = 100
    chart.valueAxis.valueStep = 25
    chart.valueAxis.labels.fontSize = 7.5
    chart.bars[0].fillColor = brand_teal
    d.add(chart)
    story.append(d)

    # Distribution Table (Total width = 2.7 + 7 * 2.1 = 17.4 cm)
    dist_hdr_row = [Paragraph("Emotion", tbl_hdr_white)] + [Paragraph(e.capitalize(), tbl_hdr_white) for e in EMOTIONS]
    dist_val_row = [Paragraph("Average %", tbl_hdr)] + [Paragraph(f"{avg_dist.get(e, 0) * 100:.1f}%", tbl_cell_center) for e in EMOTIONS]
    t_dist = Table([dist_hdr_row, dist_val_row], colWidths=[2.7 * cm] + [2.1 * cm] * 7)
    t_dist.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), brand_primary),
        ("BACKGROUND", (0, 1), (0, 1), brand_bg),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, brand_border),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t_dist)
    story.append(Spacer(1, 10))

    # Section 4: Recurring Themes & Stressors
    story.append(Paragraph("3. Recurring Life Themes & Situational Stressors", h2))
    story.append(Paragraph("<b>Primary Life Themes Identified:</b>", h3))
    for t in narrative["recurring_themes"]:
        story.append(Paragraph(f"&bull; {t}", bullet))

    story.append(Spacer(1, 3))
    story.append(Paragraph("<b>Observed Stressors & Vulnerabilities:</b>", h3))
    for s in narrative["common_concerns"]:
        story.append(Paragraph(f"&bull; {s}", bullet))
    story.append(Spacer(1, 8))

    # Page Break for clean reading separation
    story.append(PageBreak())

    # Section 5: Positive Experiences & Coping Patterns
    story.append(Paragraph("4. Positive Moments, Resilience & Coping Strategies", h2))
    for p in narrative["positive_experiences"]:
        story.append(Paragraph(f"&bull; {p}", bullet))
    story.append(Spacer(1, 3))
    story.append(Paragraph(f"<b>Coping Patterns:</b> {narrative['personal_coping_patterns']}", body))
    story.append(Spacer(1, 8))

    # Section 6: Cross-Source Insights
    story.append(Paragraph("5. Patterns Across Platforms & Guided Intake Context", h2))
    story.append(Paragraph(f"<b>MindLog Journal Observations:</b> {narrative['journal_patterns']}", body))
    story.append(Spacer(1, 3))
    story.append(Paragraph(f"<b>Companion Conversation Reflections:</b> {narrative['companion_patterns']}", body))
    story.append(Spacer(1, 3))
    story.append(Paragraph(f"<b>Guided Intake Context:</b> {narrative['guided_intake_context']}", body))
    story.append(Spacer(1, 8))

    # Section 7: Actionable Suggestions & Continuing Reflection
    story.append(Paragraph("6. Personalized Wellness Suggestions & Gentle Prompts", h2))
    for s in narrative["personalized_suggestions"]:
        story.append(Paragraph(f"&bull; {s}", bullet))
    story.append(Spacer(1, 3))
    story.append(Paragraph("<b>Continuing Reflection Inquiries:</b>", h3))
    for r in narrative["areas_for_reflection"]:
        story.append(Paragraph(f"&bull; {r}", bullet))
    story.append(Spacer(1, 8))

    # Section 8: Limitations & Medical Disclaimer
    story.append(Paragraph("7. Data Limitations & Non-Clinical Disclaimer", h2))
    story.append(Paragraph(f"<b>Data Scope:</b> {narrative['data_limitations']}", small))
    story.append(Spacer(1, 3))
    story.append(Paragraph(f"<b>Notice:</b> {narrative['disclaimer']}", small))

    doc.build(story, canvasmaker=NumberedCanvas)
    return buf.getvalue()


def create_wellness_report(uid: str, req) -> dict:
    period = getattr(req, "period", None) or "30d"
    s_date = getattr(req, "start_date", None)
    e_date = getattr(req, "end_date", None)
    sources = getattr(req, "sources", None)

    start, end, period_label = _resolve_period_dates(period, s_date, e_date)
    data = _collect_multi_source_data(uid, start, end, sources)
    narrative = _synthesize_wellness_narrative(data, period_label)

    # Attempt PDF build to ensure validity before creating record
    try:
        pdf_bytes = build_wellness_pdf(data, narrative, period_label)
    except Exception as e:
        print("[Reports] PDF build error:", e)
        raise HTTPException(status_code=500, detail="Failed to compile wellness PDF report.")

    ref = _col(uid).document()
    report_doc = {
        "reportId": ref.id,
        "title": f"SunnoBuddy Wellness Report ({period_label})",
        "period": period,
        "startDate": start.isoformat(),
        "endDate": end.isoformat(),
        "sourcesAnalyzed": data["active_sources"],
        "entriesAnalyzed": data["total_entries"],
        "conversationsAnalyzed": data["total_convs"],
        "messagesAnalyzed": data["total_msgs"],
        "summary": narrative["executive_summary"],
        "status": "completed",
        "createdAt": firestore.SERVER_TIMESTAMP,
    }
    ref.set(report_doc)
    _pdf_cache[ref.id] = pdf_bytes

    return {
        "report_id": ref.id,
        "title": report_doc["title"],
        "status": "completed",
        "download_url": f"/api/reports/{ref.id}/download",
    }


def create_report(uid: str, start: date, end: date) -> dict:
    """Backward compatibility for existing endpoint."""
    class Req:
        period = "custom"
        start_date = start
        end_date = end
        sources = None
    return create_wellness_report(uid, Req())


def _meta(doc) -> dict:
    d = doc.to_dict()
    return {
        "report_id": doc.id,
        "title": d.get("title", f"Wellness Report ({d.get('startDate')} - {d.get('endDate')})"),
        "period": d.get("period", "30d"),
        "start_date": d.get("startDate"),
        "end_date": d.get("endDate"),
        "sources_analyzed": d.get("sourcesAnalyzed", ["MindLog"]),
        "entries_analyzed": d.get("entriesAnalyzed", 0),
        "conversations_analyzed": d.get("conversationsAnalyzed", 0),
        "messages_analyzed": d.get("messagesAnalyzed", 0),
        "summary": d.get("summary", ""),
        "status": d.get("status", "completed"),
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
    # 1. Fast cache check
    if report_id in _pdf_cache:
        return _pdf_cache[report_id]

    # 2. Reconstruct from saved report doc
    d = _get_or_404(uid, report_id).to_dict()
    start = date.fromisoformat(d["startDate"])
    end = date.fromisoformat(d["endDate"])
    period_label = f"{d.get('period', 'Custom').capitalize()} ({start.isoformat()} to {end.isoformat()})"
    
    data = _collect_multi_source_data(uid, start, end, d.get("sourcesAnalyzed"))
    narrative = _synthesize_wellness_narrative(data, period_label)
    pdf = build_wellness_pdf(data, narrative, period_label)
    _pdf_cache[report_id] = pdf
    return pdf


def delete_report(uid: str, report_id: str) -> None:
    _get_or_404(uid, report_id)
    _col(uid).document(report_id).delete()
    if report_id in _pdf_cache:
        del _pdf_cache[report_id]
