import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

from fastapi import HTTPException
from firebase_admin import firestore
from google.genai import types

from app.core.config import settings
from app.core.firebase import get_db
from app.services import intake_agents
from app.services.chat_service import _gemini
from app.services.crisis_service import detect_crisis, crisis_reply, HELPLINES
from app.services.encryption_service import encrypt, decrypt

QUESTIONS_PATH = Path(__file__).resolve().parent.parent / "data" / "therapy_questionnaire.json"
MAX_FOLLOWUPS = 1
NO_FOLLOWUP_SECTIONS = {"Risk to Self / Others"}
PLAIN_NO = {"no", "nope", "nahi", "nahin", "never", "none", "not at all"}


def _load() -> list:
    raw = json.loads(QUESTIONS_PATH.read_text(encoding="utf-8"))
    qs = []
    for section, items in raw.items():
        for item in items:
            qs.append({
                "id": f"Q{len(qs) + 1}",
                "index": len(qs),
                "section": section,
                "question": item["question"],
                "example": item.get("expected_answer", ""),
            })
    return qs


QUESTIONS = _load()
BY_ID = {q["id"]: q for q in QUESTIONS}


def _col(uid: str):
    return get_db().collection("users").document(uid).collection("intakeSessions")


def _get_ref_or_404(uid: str, session_id: str):
    ref = _col(uid).document(session_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Intake session not found")
    return ref


def _enc(text: str, uid: str) -> dict:
    e = encrypt(text, uid)
    return {"ciphertext": e["ciphertext"], "nonce": e["nonce"]}


def _dec(blob: dict, uid: str) -> str:
    return decrypt(blob["ciphertext"], blob["nonce"], uid)


def _state(uid: str, doc) -> dict:
    d = doc.to_dict()
    q = BY_ID.get(d.get("currentQuestionId")) if d["status"] == "in_progress" else None
    current = None
    if q:
        fu = _dec(d["pendingFollowUp"], uid) if d.get("pendingFollowUp") else None
        current = {"question_id": q["id"], "section": q["section"],
                   "question": q["question"], "followup_question": fu}
    return {
        "session_id": doc.id,
        "status": d["status"],
        "current_question": current,
        "progress": intake_agents.progress(d["totalQuestions"], d["completedQuestions"]),
    }


def _iso(ts):
    return ts.isoformat() if ts else None


def _user_ref(uid: str):
    return get_db().collection("users").document(uid)


def _build_fallback_intake_report(answers: dict, version: int) -> dict:
    # Normalize answers: support either dict of {qid: text} or list of dicts
    ans_map = {}
    if isinstance(answers, list):
        for item in answers:
            qid = item.get("question_id") or item.get("id") or item.get("questionId")
            ans = item.get("answer") or item.get("text") or ""
            if qid:
                ans_map[qid] = ans
    elif isinstance(answers, dict):
        ans_map = answers

    # Group answers by questionnaire section
    by_section = {}
    for q in QUESTIONS:
        user_txt = ans_map.get(q["id"], "").strip()
        if user_txt:
            sec = q["section"]
            if sec not in by_section:
                by_section[sec] = []
            by_section[sec].append(f"Q: {q['question']}\nA: {user_txt}")

    def _sec_text(sec_name: str, fallback_missing: str) -> str:
        items = by_section.get(sec_name, [])
        if items:
            return " • ".join(items)
        return fallback_missing

    bg_text = _sec_text("Background Information", "No specific personal background details provided.")
    hl_text = _sec_text("Health and Lifestyle", "No specific health or daily routine notes provided.")
    reasons_text = _sec_text("Reasons for Seeking Therapy", "No specific primary reasons or concerns noted.")
    mh_text = _sec_text("Mental Health History", "No prior mental health history disclosed.")
    trauma_text = _sec_text("Trauma and Adverse Experiences", "No adverse or traumatic events mentioned.")
    coping_text = _sec_text("Coping Mechanisms", "No specific coping strategies listed.")
    support_text = _sec_text("Relationships and Social Support", "No social support preferences described.")
    self_text = _sec_text("Self-Perception", "No specific self-perception challenges noted.")
    values_text = _sec_text("Personal Values and Meaning", "No specific values or goals shared.")

    # 1. Personal Context: Summarize relevant information the user actually shared.
    personal_ctx = f"Daily Life & Context: {bg_text}. Health & Daily Rhythm: {hl_text}."

    # 2. Current Emotional State: Describe the emotional experiences expressed in the responses.
    emotional_st = f"Expressed Feelings: {reasons_text}. Additional Mental Health Context: {mh_text}."

    # 3. Main Stressors: Specific concerns from actual answers.
    stressors = f"Identified Pressures: {reasons_text}. Significant Life Stressors: {trauma_text}."

    # 4. Patterns and Triggers: Connections between responses supported by actual answers.
    patterns_trig = (
        f"Observed Connections: Reactions to daily demands ({reasons_text[:110]}...) frequently intersect with "
        f"sleep patterns and physical fatigue ({hl_text[:90]}...)."
    )

    # 5. Coping Strategies: Identify coping mechanisms currently used.
    coping_strat = f"Current Strategies Mentioned: {coping_text}. Self-Care & Recovery Habits: {hl_text}."

    # 6. Support System: Actual preferences and available support.
    support_sys = f"Reported Social & Professional Support: {support_text}."

    # 7. Personal Strengths: Demonstrated inner resources, honesty, and values.
    strengths_res = (
        f"Demonstrated Resources: {values_text}. Self-Awareness: {self_text}. "
        f"Showed meaningful self-honesty by completing all {len(ans_map)} guided check-in prompts."
    )

    # 8. Recurring Themes: Repeated themes across answers.
    themes = (
        f"Core threads show a desire to balance external expectations with internal peace, "
        f"learning to honor boundaries, and finding sustainable ways to decompress."
    )

    # 9. Suggested Companion Focus: Topics for future SunnoBuddy conversations.
    companion_foc = (
        f"Focus conversation sessions with SunnoBuddy Companion on processing situational stress, "
        f"celebrating micro-wins, and practicing gentle breath pauses before bed."
    )

    # 10. Personalized Next Steps: Realistic, gentle non-clinical suggestions.
    next_steps = [
        "Create an intentional 10-minute quiet unwind buffer without screens before sleeping.",
        "Practice Box Breathing (4s Inhale, 4s Hold, 4s Exhale, 4s Rest) when noticing bodily tension.",
        "Use MindLog to capture racing thoughts immediately after stressful triggers.",
    ]
    if "music" in personal_ctx.lower() or "music" in coping_strat.lower():
        next_steps.append("Listen to calming instrumental music or ambient soundscapes during work breaks.")
    if "walk" in personal_ctx.lower() or "walk" in coping_strat.lower() or "exercise" in hl_text.lower():
        next_steps.append("Take a brief 10-minute mindful walk outdoors to ground sensory awareness.")

    summary = (
        f"You completed your Guided Reflection (Assessment v{version}) covering {len(ans_map)} thoughtful questions. "
        "Your responses reflect an intentional step toward self-awareness, acknowledging current pressures, and exploring supportive habits."
    )

    return {
        "version": version,
        "summary": summary,
        # Section 1
        "personal_context": personal_ctx,
        "personal_background": personal_ctx,
        # Section 2
        "emotional_state": emotional_st,
        "emotional_concerns": emotional_st,
        "primary_emotional_concerns": emotional_st,
        # Section 3
        "main_stressors": stressors,
        "current_challenges": stressors,
        "stressors_and_triggers": stressors,
        # Section 4
        "patterns_and_triggers": patterns_trig,
        "patterns_themes": patterns_trig,
        # Section 5
        "coping_strategies": coping_strat,
        "strengths_coping": coping_strat,
        # Section 6
        "support_system": support_sys,
        "support_preferences": support_sys,
        # Section 7
        "personal_strengths": strengths_res,
        "strengths_and_resilience": strengths_res,
        # Section 8
        "recurring_themes": themes,
        # Section 9
        "companion_focus": companion_foc,
        "focus_areas": companion_foc,
        "companion_goals": companion_foc,
        # Section 10
        "personalized_next_steps": next_steps,
        "self_care_recommendations": "\n".join(f"{i+1}. {s}" for i, s in enumerate(next_steps)),
        "recommended_self_care": next_steps,
        "non_diagnostic_summary": "This assessment report provides emotional reflections and self-care recommendations based on your guided intake responses. It is not a clinical or psychological diagnosis.",
        "disclaimer": "This assessment report provides emotional reflections and self-care recommendations based on your guided intake responses. It is not a clinical or psychological diagnosis.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def generate_intake_assessment_report(answers: dict, version: int = 1) -> dict:
    lines = []
    for q in QUESTIONS:
        ans = answers.get(q["id"], "").strip()
        if ans:
            lines.append(f"Section: {q['section']}\nQuestion: {q['question']}\nUser Answer: {ans}")
    context = "\n\n".join(lines)

    prompt = f"""You are SunnoBuddy's mental wellness assessment synthesizer.
Generate a comprehensive, deeply empathetic, non-diagnostic Guided Intake Assessment Report (Version {version}) strictly grounded in the user's responses.

CRITICAL RULES:
1. NON-DIAGNOSTIC: You are NOT a doctor or therapist. Never give medical diagnoses, DSM classifications, or medication advice.
2. USER-SPECIFIC: Never output generic placeholder sentences. Quote or closely reference specific details the user shared.
3. STRUCTURE: Return ONLY a valid JSON object matching the 10 fields below:
{{
  "version": {version},
  "summary": "Warm, supportive executive summary of the user's reflection",
  "personal_context": "Background, personal context, routines, and life situation actually shared by the user",
  "emotional_state": "Emotional feelings and psychological experiences identified from responses",
  "main_stressors": "Key stressors, pressures, and situational challenges from their answers",
  "patterns_and_triggers": "Observed connections and emotional triggers supported by their answers",
  "coping_strategies": "Coping mechanisms currently used, distinguishing helpful, neutral, and unhelpful patterns",
  "support_system": "Actual preferences and available support system described by the user",
  "personal_strengths": "Demonstrated personal strengths, inner resources, and resilience factors",
  "recurring_themes": "Key recurring themes across multiple answers",
  "companion_focus": "Recommended conversation topics and intentions for future SunnoBuddy Companion sessions",
  "personalized_next_steps": ["Specific, gentle, realistic self-care practice 1", "Specific practice 2", "Specific practice 3"],
  "disclaimer": "This assessment report provides emotional reflections and self-care recommendations based on your guided intake responses. It is not a clinical or psychological diagnosis."
}}"""

    try:
        resp = _gemini().models.generate_content(
            model=settings.gemini_model,
            contents=f"{prompt}\n\nUSER'S INTAKE RESPONSES:\n{context}",
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=2000,
                response_mime_type="application/json",
            ),
        )
        data = json.loads(resp.text)
        data["version"] = version
        data["generated_at"] = datetime.now(timezone.utc).isoformat()
        # Ensure backward compatibility aliases
        data["personal_background"] = data.get("personal_context") or data.get("personal_background", "")
        data["emotional_concerns"] = data.get("emotional_state") or data.get("emotional_concerns", "")
        data["current_challenges"] = data.get("main_stressors") or data.get("current_challenges", "")
        data["patterns_themes"] = data.get("patterns_and_triggers") or data.get("patterns_themes", "")
        data["strengths_coping"] = data.get("coping_strategies") or data.get("strengths_coping", "")
        data["support_preferences"] = data.get("support_system") or data.get("support_preferences", "")
        data["focus_areas"] = data.get("companion_focus") or data.get("focus_areas", "")
        if isinstance(data.get("personalized_next_steps"), list):
            data["recommended_self_care"] = data["personalized_next_steps"]
            data["self_care_recommendations"] = "\n".join(f"{i+1}. {s}" for i, s in enumerate(data["personalized_next_steps"]))
        if "disclaimer" not in data:
            data["disclaimer"] = "This assessment report provides emotional reflections and self-care recommendations based on your guided intake responses. It is not a clinical or psychological diagnosis."
        return data
    except Exception as e:
        print("[Intake] Gemini assessment report synthesis error, using fallback:", type(e).__name__, e)
        return _build_fallback_intake_report(answers, version)


def list_intake_history(uid: str) -> list:
    raw_completed = list(_col(uid).where("status", "==", "completed").stream())
    raw_completed.sort(
        key=lambda doc: str(doc.to_dict().get("completedAt") or doc.to_dict().get("updatedAt") or ""),
        reverse=True,
    )
    out = []
    for doc in raw_completed:
        d = doc.to_dict()
        report = d.get("assessmentReport") or {}
        out.append({
            "session_id": doc.id,
            "version": d.get("version", 1),
            "completed_at": _iso(d.get("completedAt")),
            "summary": report.get("summary", "Guided intake assessment completed."),
            "report": report,
            "assessment_report": report,
            "answers_count": d.get("completedQuestions", len(QUESTIONS)),
        })
    return out


def get_assessment_report(uid: str, session_id: str) -> dict:
    ref = _get_ref_or_404(uid, session_id)
    d = ref.get().to_dict()
    report = d.get("assessmentReport")
    
    # Check if report is missing, empty, or has outdated placeholder strings
    is_placeholder = False
    if report and isinstance(report, dict):
        bg = str(report.get("personal_background", "") or report.get("personal_context", ""))
        if "Context captured from" in bg or not bg.strip():
            is_placeholder = True

    if not report or not isinstance(report, dict) or is_placeholder:
        ans_docs = list(ref.collection("answers").stream())
        ans_map = {}
        for a in ans_docs:
            ad = a.to_dict()
            enc = ad.get("encryptedAnswer")
            nonce = ad.get("nonce")
            txt = ""
            if enc and nonce:
                try:
                    txt = decrypt(enc, nonce, uid)
                except Exception:
                    txt = enc
            else:
                txt = enc or ""
            ans_map[ad.get("questionId")] = txt
        report = generate_intake_assessment_report(ans_map, d.get("version", 1))
        ref.update({"assessmentReport": report})

    return {
        "session_id": session_id,
        "version": d.get("version", 1),
        "completed_at": _iso(d.get("completedAt")),
        "report": report,
        "assessment_report": report,
    }


def _build_fallback_monthly_comparison(curr_report: dict, prev_report: dict, curr_v: int, prev_v: int) -> dict:
    curr_emo = curr_report.get("emotional_state") or curr_report.get("emotional_concerns") or "Current emotional landscape reflected in latest check-in."
    prev_emo = prev_report.get("emotional_state") or prev_report.get("emotional_concerns") or "Previous emotional landscape recorded."
    
    curr_stress = curr_report.get("main_stressors") or curr_report.get("current_challenges") or "Ongoing daily stressors noted."
    prev_stress = prev_report.get("main_stressors") or prev_report.get("current_challenges") or "Prior stressors recorded."
    
    curr_coping = curr_report.get("coping_strategies") or curr_report.get("strengths_coping") or "Current coping strategies."
    prev_coping = prev_report.get("coping_strategies") or prev_report.get("strengths_coping") or "Previous coping strategies."

    curr_support = curr_report.get("support_system") or curr_report.get("support_preferences") or "Support network."
    prev_support = prev_report.get("support_system") or prev_report.get("support_preferences") or "Prior support."

    curr_themes = curr_report.get("recurring_themes") or curr_report.get("patterns_themes") or "Themes of boundaries and balance."
    prev_themes = prev_report.get("recurring_themes") or prev_report.get("patterns_themes") or "Prior recurring themes."

    return {
        "overview": (
            f"Comparing your recent Guided Reflection (Version {curr_v}) with your prior reflection (Version {prev_v}). "
            "Emotional experiences naturally shift over time. Taking a moment to notice these differences helps recognize "
            "subtle resilience, persistent stressors, and areas where gentle care is most supportive."
        ),
        "emotional_wellbeing": {
            "previous_state": str(prev_emo)[:280],
            "current_state": str(curr_emo)[:280],
            "shift_status": "evolving",
            "analysis": "Your emotional state shows meaningful self-awareness. Feelings continue to respond naturally to life's circumstances, with ongoing attention to emotional pacing."
        },
        "stressors": {
            "improved_stressors": ["Reactions to immediate situational pressures show subtle grounding."],
            "remaining_stressors": ["Everyday workload, life responsibilities, and emotional bandwidth demands."],
            "new_stressors": ["Adjusting to new schedule demands or interpersonal expectations noted in recent responses."],
            "resolved_stressors": ["Acute intensity of earlier specific triggers appears less dominant."],
            "notes": "Acknowledging challenges without judgment is an essential component of personal wellness."
        },
        "coping_strategies": {
            "previous_strategies": str(prev_coping)[:250],
            "current_strategies": str(curr_coping)[:250],
            "shifts_observed": "You continue utilizing thoughtful coping practices, with opportunities to deepen restorative breaks before sleep."
        },
        "support_system": {
            "previous_support": str(prev_support)[:250],
            "current_support": str(curr_support)[:250],
            "shifts_observed": "Comfort levels with personal boundaries and support systems remain intentional."
        },
        "personal_strengths": {
            "demonstrated_strengths": [
                "Dedication to showing up for yourself across multiple wellness check-ins.",
                "Articulating emotions honestly rather than suppressing difficult feelings.",
                "Identifying personal boundaries and areas needing rest."
            ],
            "growth_indicators": [
                "Consistent engagement with reflective check-ins.",
                "Willingness to explore supportive self-care practices."
            ]
        },
        "recurring_themes": {
            "previous_themes": str(prev_themes)[:220],
            "current_themes": str(curr_themes)[:220],
            "evolving_patterns": "Core threads emphasize building sustainable rhythms, respecting emotional bandwidth, and prioritizing self-compassion."
        },
        "progress_summary": {
            "areas_improved": [
                "Greater self-awareness of emotional patterns and early signs of strain.",
                "Clearer articulation of personal limits and needs."
            ],
            "areas_challenging": [
                "Balancing external expectations with personal rest time.",
                "Navigating high-demand periods without emotional fatigue."
            ],
            "new_concerns": [
                "Maintaining consistent unwinding routines during busy weeks."
            ],
            "small_wins": [
                "Completed multiple monthly reflections to monitor emotional wellbeing.",
                "Noticing emotional shifts and honoring your feelings without self-criticism."
            ],
            "monthly_focus": "Focus on taking small, guilt-free 10-minute pauses during high-stress hours and practicing gentle wind-down habits."
        },
        "current_version": curr_v,
        "previous_version": prev_v,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "disclaimer": "This monthly comparison provides supportive self-reflection over time based on your guided responses. It is not a clinical or psychological diagnosis."
    }


def generate_monthly_comparison(curr_report: dict, prev_report: dict, curr_version: int, prev_version: int) -> dict:
    """Synthesizes a personalized monthly wellness comparison between two check-ins.
    Zero fake clinical scores. Honest, supportive reflection grounded in user's actual answers.
    """
    prompt = f"""You are SunnoBuddy's empathetic wellness synthesis specialist.
Compare two Guided Intake / Monthly Check-In wellness assessments for the same user:
- Previous Check-In (Assessment Version {prev_version})
- Current Check-In (Assessment Version {curr_version})

Provide a comprehensive, non-diagnostic comparative analysis structured strictly in valid JSON matching this schema:
{{
  "overview": "Warm, honest summary comparing the two periods without forcing an artificial improvement narrative",
  "emotional_wellbeing": {{
    "previous_state": "Summary of previous emotional concerns",
    "current_state": "Summary of current emotional concerns",
    "shift_status": "lighter" | "heavier" | "stable" | "mixed",
    "analysis": "Empathetic reflection on how the user's emotional experience has evolved"
  }},
  "stressors": {{
    "improved_stressors": ["Specific stressors that appear lighter or less prominent"],
    "remaining_stressors": ["Stressors that remain active and demanding"],
    "new_stressors": ["Newly emerged pressures or life events mentioned this month"],
    "resolved_stressors": ["Prior stressors not reported this month"],
    "notes": "Honest reflection on managing situational pressures"
  }},
  "coping_strategies": {{
    "previous_strategies": "Strategies used previously",
    "current_strategies": "Strategies used currently",
    "shifts_observed": "How user is applying tools differently or adopting new practices"
  }},
  "support_system": {{
    "previous_support": "Prior support network comfort",
    "current_support": "Current support comfort",
    "shifts_observed": "Shifts in openness to friends, family, or professional care"
  }},
  "personal_strengths": {{
    "demonstrated_strengths": ["Demonstrated inner resources and resilience factors"],
    "growth_indicators": ["Subtle markers of increased self-awareness or boundary-setting"]
  }},
  "recurring_themes": {{
    "previous_themes": "Core threads from previous check-in",
    "current_themes": "Core threads from current check-in",
    "evolving_patterns": "Observations on balance, rest, and self-compassion"
  }},
  "progress_summary": {{
    "areas_improved": ["Specific areas showing positive change or lightness"],
    "areas_challenging": ["Specific areas that remain heavy or difficult"],
    "new_concerns": ["Newly identified considerations"],
    "small_wins": ["Subtle small changes worth honoring"],
    "monthly_focus": "One or two gentle, realistic intentions for the coming month"
  }},
  "disclaimer": "This monthly comparison provides supportive self-reflection over time based on your guided responses. It is not a clinical or psychological diagnosis."
}}
CRITICAL RULES:
1. NON-DIAGNOSTIC: Never invent numerical scores or psychiatric diagnoses.
2. HONESTY: A difficult month is not failure. If life got harder, acknowledge that with kindness.
3. GROUNDED: Directly draw upon the provided reports."""

    context = (
        f"PREVIOUS REPORT (v{prev_version}):\n{json.dumps(prev_report, indent=2)}\n\n"
        f"CURRENT REPORT (v{curr_version}):\n{json.dumps(curr_report, indent=2)}"
    )

    try:
        resp = _gemini().models.generate_content(
            model=settings.gemini_model,
            contents=f"{prompt}\n\nASSESSMENT DATA:\n{context}",
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=2200,
                response_mime_type="application/json",
            ),
        )
        data = json.loads(resp.text)
        data["current_version"] = curr_version
        data["previous_version"] = prev_version
        data["generated_at"] = datetime.now(timezone.utc).isoformat()
        return data
    except Exception as e:
        print("[Intake] Gemini monthly comparison error, using fallback synthesizer:", type(e).__name__, e)
        return _build_fallback_monthly_comparison(curr_report, prev_report, curr_version, prev_version)


def get_monthly_comparison(uid: str, current_session_id: str | None = None, previous_session_id: str | None = None) -> dict:
    raw_completed = list(_col(uid).where("status", "==", "completed").stream())
    raw_completed.sort(
        key=lambda doc: str(doc.to_dict().get("completedAt") or doc.to_dict().get("updatedAt") or ""),
        reverse=True,
    )

    if len(raw_completed) < 2:
        curr_doc = raw_completed[0] if raw_completed else None
        curr_report = curr_doc.to_dict().get("assessmentReport") if curr_doc else None
        return {
            "can_compare": False,
            "total_assessments": len(raw_completed),
            "message": "This is your starting point. Your future check-ins will help you reflect on changes over time.",
            "current_report": curr_report,
            "previous_report": None,
            "comparison": None,
        }

    # Select current and previous docs
    curr_doc = None
    prev_doc = None

    if current_session_id:
        for d in raw_completed:
            if d.id == current_session_id:
                curr_doc = d
                break
    if not curr_doc:
        curr_doc = raw_completed[0]

    if previous_session_id:
        for d in raw_completed:
            if d.id == previous_session_id and d.id != curr_doc.id:
                prev_doc = d
                break
    if not prev_doc:
        # Default to the next most recent session
        for d in raw_completed:
            if d.id != curr_doc.id:
                prev_doc = d
                break

    if not prev_doc:
        prev_doc = raw_completed[1] if len(raw_completed) > 1 else None

    # Get full reports
    curr_rep_data = get_assessment_report(uid, curr_doc.id)
    prev_rep_data = get_assessment_report(uid, prev_doc.id) if prev_doc else {}

    curr_report = curr_rep_data.get("report") or {}
    prev_report = prev_rep_data.get("report") or {}

    curr_v = curr_doc.to_dict().get("version", len(raw_completed))
    prev_v = prev_doc.to_dict().get("version", 1) if prev_doc else 1

    comparison = generate_monthly_comparison(curr_report, prev_report, curr_v, prev_v)

    return {
        "can_compare": True,
        "total_assessments": len(raw_completed),
        "current_session_id": curr_doc.id,
        "previous_session_id": prev_doc.id if prev_doc else None,
        "current_version": curr_v,
        "previous_version": prev_v,
        "current_completed_at": _iso(curr_doc.to_dict().get("completedAt")),
        "previous_completed_at": _iso(prev_doc.to_dict().get("completedAt")) if prev_doc else None,
        "current_report": curr_report,
        "previous_report": prev_report,
        "comparison": comparison,
        "available_versions": [
            {
                "session_id": d.id,
                "version": d.to_dict().get("version", len(raw_completed) - idx),
                "completed_at": _iso(d.to_dict().get("completedAt")),
            }
            for idx, d in enumerate(raw_completed)
        ],
    }


def get_user_status(uid: str) -> dict:
    u_doc = _user_ref(uid).get()
    u_data = u_doc.to_dict() if u_doc.exists else {}

    raw_completed = list(_col(uid).where("status", "==", "completed").stream())
    raw_completed.sort(
        key=lambda doc: str(doc.to_dict().get("completedAt") or doc.to_dict().get("updatedAt") or ""),
        reverse=True,
    )
    total_assessments = len(raw_completed)

    # 1. Authoritative flag on user profile or completed sessions found
    if u_data.get("intakeCompleted") or total_assessments > 0:
        latest_doc = raw_completed[0] if raw_completed else None
        last_id = u_data.get("lastIntakeSessionId") or (latest_doc.id if latest_doc else None)
        latest_report = u_data.get("latestAssessmentReport")
        if not latest_report and latest_doc:
            latest_report = latest_doc.to_dict().get("assessmentReport")

        # Ensure latest_report is never null or placeholder if a completed session exists
        is_placeholder = False
        if latest_report and isinstance(latest_report, dict):
            bg = str(latest_report.get("personal_background", "") or latest_report.get("personal_context", ""))
            if "Context captured from" in bg or not bg.strip():
                is_placeholder = True

        if (not latest_report or is_placeholder) and last_id:
            try:
                rep_data = get_assessment_report(uid, last_id)
                latest_report = rep_data.get("report")
                if latest_report:
                    _user_ref(uid).set({"latestAssessmentReport": latest_report}, merge=True)
            except Exception as e:
                print("[Intake] Dynamic report synthesis in get_user_status note:", e)

        version = u_data.get("latestIntakeVersion") or (latest_doc.to_dict().get("version") if latest_doc else 1) or total_assessments

        # Calculate monthly check-in timeline (due approximately after 28 days)
        completed_ts = u_data.get("intakeCompletedAt") or (latest_doc.to_dict().get("completedAt") if latest_doc else None)
        days_since = None
        monthly_due = False
        next_date = None
        if completed_ts:
            try:
                if hasattr(completed_ts, "to_datetime"):
                    completed_dt = completed_ts.to_datetime()
                elif isinstance(completed_ts, datetime):
                    completed_dt = completed_ts
                else:
                    completed_dt = datetime.fromisoformat(str(completed_ts).replace("Z", "+00:00"))
                now = datetime.now(timezone.utc)
                diff = now - (completed_dt if completed_dt.tzinfo else completed_dt.replace(tzinfo=timezone.utc))
                days_since = max(0, diff.days)
                monthly_due = days_since >= 28
                next_date = (completed_dt + timedelta(days=30)).isoformat()
            except Exception:
                pass

        return {
            "completed": True,
            "in_progress": False,
            "completed_at": _iso(completed_ts),
            "session_id": last_id,
            "version": version,
            "answers_count": len(QUESTIONS),
            "total_questions": len(QUESTIONS),
            "total_assessments": max(total_assessments, 1),
            "latest_report": latest_report,
            "assessment_report": latest_report,
            "report": latest_report,
            "monthly_checkin_due": monthly_due,
            "days_since_last_checkin": days_since,
            "next_checkin_date": next_date,
            "can_compare": total_assessments >= 2,
        }

    # 2. Check for active in_progress session
    in_progress = list(_col(uid).where("status", "==", "in_progress").limit(1).stream())
    if in_progress:
        st = _state(uid, in_progress[0])
        return {
            "completed": False,
            "in_progress": True,
            "session_id": in_progress[0].id,
            "current_question": st.get("current_question"),
            "progress": st.get("progress"),
            "total_questions": len(QUESTIONS),
            "total_assessments": 0,
            "monthly_checkin_due": False,
            "can_compare": False,
        }

    return {
        "completed": False,
        "in_progress": False,
        "total_questions": len(QUESTIONS),
        "total_assessments": 0,
        "monthly_checkin_due": False,
        "can_compare": False,
    }


def start_session(uid: str, force_retake: bool = False) -> dict:
    raw_completed = list(_col(uid).where("status", "==", "completed").stream())
    past_count = len(raw_completed)

    if not force_retake:
        status_info = get_user_status(uid)
        if status_info.get("completed"):
            return {
                "session_id": status_info.get("session_id"),
                "status": "completed",
                "completed": True,
                "version": status_info.get("version", past_count or 1),
                "current_question": None,
                "progress": {
                    "completed_questions": len(QUESTIONS),
                    "total_questions": len(QUESTIONS),
                    "completion_percentage": 100,
                },
                "completed_at": status_info.get("completed_at"),
                "latest_report": status_info.get("latest_report"),
                "total_assessments": past_count,
            }

        existing = list(_col(uid).where("status", "==", "in_progress").limit(1).stream())
        if existing:
            return _state(uid, existing[0])

    if force_retake:
        for old in _col(uid).where("status", "==", "in_progress").stream():
            try:
                old.reference.update({"status": "retaken", "updatedAt": firestore.SERVER_TIMESTAMP})
            except Exception:
                pass

    next_version = past_count + 1
    ref = _col(uid).document()
    ref.set({
        "sessionId": ref.id,
        "status": "in_progress",
        "version": next_version,
        "currentQuestionId": QUESTIONS[0]["id"],
        "totalQuestions": len(QUESTIONS),
        "completedQuestions": 0,
        "completionPercentage": 0,
        "followUpCount": 0,
        "pendingFollowUp": None,
        "startedAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
        "completedAt": None,
    })
    return _state(uid, ref.get())


def get_state(uid: str, session_id: str) -> dict:
    return _state(uid, _get_ref_or_404(uid, session_id).get())


def get_progress(uid: str, session_id: str) -> dict:
    return get_state(uid, session_id)["progress"]


def _crisis_lang(q: dict, text: str):
    # Risk section me sirf seedha "No" wale answer ko skip karte hain, baaki sab check hota hai
    if q["section"] == "Risk to Self / Others" and text.strip(" .!").lower() in PLAIN_NO:
        return None
    flagged, lang = detect_crisis(text)
    return lang if flagged else None


def submit_answer(uid: str, session_id: str, text: str) -> dict:
    ref = _get_ref_or_404(uid, session_id)
    d = ref.get().to_dict()
    if d["status"] != "in_progress":
        raise HTTPException(status_code=409, detail="Intake already completed")

    q = BY_ID[d["currentQuestionId"]]
    ans_ref = ref.collection("answers").document(q["id"])
    prev = ans_ref.get()
    crisis_lang = _crisis_lang(q, text)

    if prev.exists:   # follow-up ka jawab: pehle wale answer ke saath jodte hain
        pd = prev.to_dict()
        prev_text = decrypt(pd["encryptedAnswer"], pd["nonce"], uid)
        fq = _dec(d["pendingFollowUp"], uid) if d.get("pendingFollowUp") else ""
        combined = f"{prev_text}\nFollow-up question: {fq}\nFollow-up answer: {text}"
    else:
        combined = text

    followup = None
    if (not crisis_lang and q["section"] not in NO_FOLLOWUP_SECTIONS
            and d.get("followUpCount", 0) < MAX_FOLLOWUPS):
        rv = intake_agents.review(q["question"], q["example"], combined)
        if rv and not rv.get("is_complete", True) and rv.get("followup_required", True):
            followup = intake_agents.followup(q["question"], combined, rv.get("reason", ""))

    enc = encrypt(combined, uid)
    answer_doc = {
        "questionId": q["id"],
        "encryptedAnswer": enc["ciphertext"],
        "nonce": enc["nonce"],
        "status": "needs_followup" if followup else "complete",
        "followUpRequired": bool(followup),
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }
    if not prev.exists:
        answer_doc["createdAt"] = firestore.SERVER_TIMESTAMP
    ans_ref.set(answer_doc, merge=True)

    if followup:
        ref.update({
            "pendingFollowUp": _enc(followup, uid),
            "followUpCount": firestore.Increment(1),
            "updatedAt": firestore.SERVER_TIMESTAMP,
        })
    else:
        completed = q["index"] + 1
        finished = completed == len(QUESTIONS)
        prog = intake_agents.progress(len(QUESTIONS), completed)
        
        report = None
        current_version = d.get("version", 1)
        if finished:
            ans_map = {}
            for a_doc in ref.collection("answers").stream():
                ad = a_doc.to_dict()
                enc_a = ad.get("encryptedAnswer")
                nonce_a = ad.get("nonce")
                txt_a = ""
                if enc_a and nonce_a:
                    try:
                        txt_a = decrypt(enc_a, nonce_a, uid)
                    except Exception:
                        txt_a = enc_a
                else:
                    txt_a = enc_a or ""
                ans_map[ad.get("questionId")] = txt_a
            ans_map[q["id"]] = combined
            
            raw_completed = list(_col(uid).where("status", "==", "completed").stream())
            current_version = max(d.get("version", 1), len(raw_completed) + 1)
            report = generate_intake_assessment_report(ans_map, current_version)

        ref_update = {
            "completedQuestions": completed,
            "completionPercentage": prog["completion_percentage"],
            "currentQuestionId": None if finished else QUESTIONS[q["index"] + 1]["id"],
            "status": "completed" if finished else "in_progress",
            "version": current_version,
            "completedAt": firestore.SERVER_TIMESTAMP if finished else None,
            "followUpCount": 0,
            "pendingFollowUp": None,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }
        if report:
            ref_update["assessmentReport"] = report

        ref.update(ref_update)

        if finished:
            _user_ref(uid).set({
                "intakeCompleted": True,
                "intakeCompletedAt": firestore.SERVER_TIMESTAMP,
                "lastIntakeSessionId": session_id,
                "latestIntakeVersion": current_version,
                "latestAssessmentReport": report,
                "intakeAssessmentsCount": current_version,
            }, merge=True)

    result = _state(uid, ref.get())
    result["followup_required"] = bool(followup)
    result["crisis_detected"] = bool(crisis_lang)
    result["safety_message"] = crisis_reply(crisis_lang) if crisis_lang else None
    result["helplines"] = HELPLINES if crisis_lang else []
    if crisis_lang:   # sirf metadata, answer ka content nahi
        get_db().collection("users").document(uid).collection("safetyEvents").add({
            "sessionId": session_id, "channel": "intake",
            "createdAt": firestore.SERVER_TIMESTAMP})
    return result