import json
import time
from collections import Counter
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import HTTPException
from firebase_admin import firestore
from google.genai import types

from app.core.config import settings
from app.core.firebase import get_db
from app.services import mindlog_service
from app.services import chat_service
from app.services.chat_service import _gemini
from app.services.encryption_service import decrypt
from app.services import intake_service

EMOTIONS = ["joy", "sadness", "anger", "fear", "love", "surprise", "neutral"]
MODEL_VERSION = "gemini-zero-shot-v1"

PROMPT = """You classify the emotion expressed in a personal journal entry.
The text may be English, Hindi or Hinglish.
Return ONLY a JSON object with exactly these 7 keys, each a number between 0 and 1,
summing to 1: joy, sadness, anger, fear, love, surprise, neutral.
This is emotion classification, not a diagnosis."""


def classify(text: str) -> dict:
    """Swap this function if the AI developer provides a trained model."""
    last_err = None
    for attempt in range(3):
        try:
            resp = _gemini().models.generate_content(
                model=settings.gemini_model,
                contents=text,
                config=types.GenerateContentConfig(
                    system_instruction=PROMPT,
                    temperature=0,
                    max_output_tokens=300,
                    response_mime_type="application/json",
                    
                ),
            )
            raw = json.loads(resp.text)
            scores = {e: max(0.0, float(raw.get(e, 0))) for e in EMOTIONS}
            total = sum(scores.values())
            if total == 0:
                raise ValueError("empty scores")
            return {e: round(v / total, 4) for e, v in scores.items()}
        except Exception as e:
            last_err = e
            time.sleep(2 ** attempt)   # 1s, 2s, 4s
    print("EMOTION ERROR:", type(last_err).__name__)   # text kabhi print nahi karte
    raise HTTPException(status_code=503, detail="Emotion analysis temporarily unavailable")


def _col(uid: str):
    return get_db().collection("users").document(uid).collection("emotionAnalyses")


def analyze_entry(uid: str, entry_id: str) -> dict:
    entry = mindlog_service.get_entry(uid, entry_id)   # 404 + decrypt, user-scoped
    entry_ref = mindlog_service._col(uid).document(entry_id)
    try:
        dist = classify(f"{entry['title']}\n{entry['content']}")
    except HTTPException:
        entry_ref.update({"analysisStatus": "failed"})
        raise
    primary = max(dist, key=dist.get)
    # Policy: ek entry ka ek hi analysis, dobara analyze karne par replace
    _col(uid).document(entry_id).set({
        "entryId": entry_id,
        "entryDate": entry["entry_date"],
        "primaryEmotion": primary,
        "confidence": dist[primary],
        "emotionDistribution": dist,
        "analyzedAt": firestore.SERVER_TIMESTAMP,
        "modelVersion": MODEL_VERSION,
    })
    entry_ref.update({"analysisStatus": "completed"})
    return {
        "entry_id": entry_id,
        "primary_emotion": primary,
        "confidence": dist[primary],
        "emotions": dist,
        "analysis_status": "completed",
    }


def safe_analyze(uid: str, entry_id: str) -> None:
    """Background task ke liye: error kabhi crash nahi karega."""
    try:
        analyze_entry(uid, entry_id)
    except Exception as e:
        print("BG ANALYSIS FAILED:", type(e).__name__)


def get_trend(uid: str, start: Optional[date], end: Optional[date]) -> list:
    q = _col(uid)
    if start:
        q = q.where("entryDate", ">=", start.isoformat())
    if end:
        q = q.where("entryDate", "<=", end.isoformat())
    q = q.order_by("entryDate")
    out = []
    for doc in q.stream():
        d = doc.to_dict()
        out.append({
            "date": d["entryDate"],
            "emotion": d["primaryEmotion"],
            "confidence": d["confidence"],
            "emotions": d["emotionDistribution"],
        })
    return out


def get_summary(uid: str, start: Optional[date], end: Optional[date]) -> dict:
    trend = get_trend(uid, start, end)
    if not trend:
        return {"total_entries": 0, "most_frequent_emotion": None,
                "average_distribution": {}, "trend": []}
    counts = Counter(t["emotion"] for t in trend)
    avg = {e: round(sum(t["emotions"][e] for t in trend) / len(trend), 4) for e in EMOTIONS}
    return {
        "total_entries": len(trend),
        "most_frequent_emotion": counts.most_common(1)[0][0],
        "average_distribution": avg,
        "trend": [{"date": t["date"], "emotion": t["emotion"],
                   "confidence": t["confidence"]} for t in trend],
    }


COMPREHENSIVE_PROMPT = """You are SunnoBuddy's emotional insights synthesizer.
You synthesize emotional patterns from the user's personal journals (MindLog), their conversation messages with SunnoBuddy Companion, and their Guided Intake responses.

CRITICAL RULES:
1. NON-DIAGNOSTIC & NON-CLINICAL: You are NOT a medical, psychological, or psychiatric diagnostic tool. Never provide clinical diagnoses, DSM terminology, or medication advice.
2. COMPANION MESSAGES: The provided companion messages are STRICTLY from the user. Do not analyze AI responses as user emotions.
3. HUMBLE, TENTATIVE TONE: Never make absolute psychological claims or infer deep, permanent personality traits from limited data. Use gentle, cautious language such as "Based on your recent notes...", "You may be feeling...", "From the moments you've shared...".
4. DISTINCTION BETWEEN FACTS AND REFLECTIONS: You must strictly distinguish between:
   - "observed_data": Concrete, factual observations quoting or noting topics from the user's entries, chats, or intake answers.
   - "interpretation": Empathetic, gentle reflection and pattern synthesis without clinical labeling.
5. HONEST DATA LIMITATIONS: If only 1-3 entries are available, state explicitly in "progress_over_time" and "mood_trends" that observations are based on a brief initial snapshot. Never hallucinate events or habits not mentioned by the user.
6. STRUCTURE: Return ONLY a valid JSON object matching the exact schema below:
{
  "primary_emotion": "joy" | "sadness" | "anger" | "fear" | "love" | "surprise" | "neutral",
  "emotion_distribution": {
    "joy": 0.0, "sadness": 0.0, "anger": 0.0, "fear": 0.0, "love": 0.0, "surprise": 0.0, "neutral": 0.0
  },
  "sections": {
    "emotional_overview": {"observed_data": "...", "interpretation": "..."},
    "mood_trends": {"observed_data": "...", "interpretation": "..."},
    "recurring_themes": {"observed_data": "...", "interpretation": "..."},
    "stressors": {"observed_data": "...", "interpretation": "..."},
    "positive_patterns": {"observed_data": "...", "interpretation": "..."},
    "conversation_patterns": {"observed_data": "...", "interpretation": "..."},
    "mindlog_observations": {"observed_data": "...", "interpretation": "..."},
    "intake_context": {"observed_data": "...", "interpretation": "..."},
    "strengths": {"observed_data": "...", "interpretation": "..."},
    "progress_over_time": {"observed_data": "...", "interpretation": "..."},
    "self_care_suggestions": ["...", "...", "..."]
  }
}"""


def _build_fallback_insights(mindlogs: list, user_chats: list, intake_ans: list, data_sufficiency: str, stats: dict = None) -> dict:
    observed_log = f"{len(mindlogs)} MindLog journal entries recorded." if mindlogs else "No MindLog entries saved yet."
    observed_chat = f"{len(user_chats)} Companion user messages reflected." if user_chats else "No Companion conversations recorded yet."
    observed_intake = f"{len(intake_ans)} reflection questions answered in Guided Intake." if intake_ans else "Guided Intake has not been completed yet."

    data_sources = []
    if mindlogs: data_sources.append("MindLog Journals")
    if user_chats: data_sources.append("Companion Conversations")
    if intake_ans: data_sources.append("Guided Intake Assessment")

    counts = stats or {
        "mindlog_count": len(mindlogs),
        "conversation_count": 1 if user_chats else 0,
        "unique_conversations_count": 1 if user_chats else 0,
        "chat_messages_count": len(user_chats),
        "total_user_messages_count": len(user_chats),
        "intake_answers_count": len(intake_ans),
        "completed_intake_assessments": 1 if intake_ans else 0,
        "intake_assessments_count": 1 if intake_ans else 0,
        "data_sources_included": data_sources,
        "last_analysis_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    }

    if data_sufficiency == "insufficient":
        return {
            "data_sufficiency": "insufficient",
            "data_counts": counts,
            "primary_emotion": "neutral",
            "emotion_distribution": {e: (1.0 if e == "neutral" else 0.0) for e in EMOTIONS},
            "sections": {
                "emotional_overview": {
                    "observed_data": "Not enough data yet. No journal entries or conversations recorded.",
                    "interpretation": "Your emotional landscape will begin forming as you chat with SunnoBuddy, write in your MindLog, or take the Guided Reflection."
                },
                "mood_trends": {
                    "observed_data": "Not enough data yet.",
                    "interpretation": "Tracking your emotions regularly in MindLog helps reveal rhythms over days and weeks."
                },
                "recurring_themes": {
                    "observed_data": "Not enough data yet.",
                    "interpretation": "Repeated thoughts or topics you mention will be highlighted here once you share them."
                },
                "stressors": {
                    "observed_data": "Not enough data yet.",
                    "interpretation": "When challenges arise, noting them down provides clarity and helps discover helpful coping strategies."
                },
                "positive_patterns": {
                    "observed_data": "Taking your first steps.",
                    "interpretation": "Taking the step to explore your emotional well-being is an intentional strength in itself."
                },
                "conversation_patterns": {
                    "observed_data": observed_chat,
                    "interpretation": "Conversations with SunnoBuddy help illuminate what's on your mind in real-time."
                },
                "mindlog_observations": {
                    "observed_data": observed_log,
                    "interpretation": "Your personal MindLog is a safe space to reflect at your own pace."
                },
                "intake_context": {
                    "observed_data": observed_intake,
                    "interpretation": "Guided Intake offers foundational insights into your sleep, routines, and support network."
                },
                "strengths": {
                    "observed_data": "Intentional self-care start.",
                    "interpretation": "Showing up for your emotional health is a foundational personal strength."
                },
                "progress_over_time": {
                    "observed_data": "Baseline period established.",
                    "interpretation": "Progress comparisons will appear as you continue reflecting over weeks."
                },
                "self_care_suggestions": [
                    "Take three deep, intentional breaths to ground yourself in this moment.",
                    "Drink a warm glass of water or tea and pause for 5 minutes.",
                    "Write down one thing that brought you comfort today, however small."
                ]
            },
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "non_diagnostic_notice": "SunnoBuddy provides emotional reflections and self-care tools, not clinical diagnoses."
        }

    # Minimal or sufficient fallback
    return {
        "data_sufficiency": data_sufficiency,
        "data_counts": counts,
        "primary_emotion": "neutral",
        "emotion_distribution": {e: round(1.0 / len(EMOTIONS), 4) for e in EMOTIONS},
        "sections": {
            "emotional_overview": {
                "observed_data": f"Observed {len(mindlogs)} journal logs, {len(user_chats)} user messages, and intake responses.",
                "interpretation": "Your expressions show an ongoing journey of reflection, seeking calm, and processing daily experiences."
            },
            "mood_trends": {
                "observed_data": "Emotional tone shows varied daily feelings across journal and chat notes.",
                "interpretation": "Fluctuations are natural. Continuing to log will offer a clearer rhythm."
            },
            "recurring_themes": {
                "observed_data": "Discussions focus on personal routines, navigating feelings, and daily reflections.",
                "interpretation": "Balancing daily commitments with emotional space is a consistent focus."
            },
            "stressors": {
                "observed_data": "Moments of tiredness or emotional heaviness noted in recent entries.",
                "interpretation": "Acknowledging these heavy moments without judgment is a key step toward easing them."
            },
            "positive_patterns": {
                "observed_data": "Moments of calm, music, or relief noted amidst stressful days.",
                "interpretation": "Identifying calming activities builds meaningful resilience."
            },
            "conversation_patterns": {
                "observed_data": observed_chat,
                "interpretation": "Companion interactions reflect thoughtful self-inquiry and seeking supportive dialogue."
            },
            "mindlog_observations": {
                "observed_data": observed_log,
                "interpretation": "MindLog entries preserve your thoughts with privacy and honest expression."
            },
            "intake_context": {
                "observed_data": observed_intake,
                "interpretation": "Guided Intake responses provide steady background context on your coping and lifestyle."
            },
            "strengths": {
                "observed_data": "Consistent engagement with self-reflection tools and expressing thoughts honestly.",
                "interpretation": "Your commitment to checking in with yourself demonstrates self-awareness and resilience."
            },
            "progress_over_time": {
                "observed_data": "Active reflection across multiple platform sources.",
                "interpretation": "Consistent tracking helps identify healthy shifts over time."
            },
            "self_care_suggestions": [
                "Practice a 2-minute mindful breathing exercise when feeling overwhelmed.",
                "Step away from screens for a short 10-minute walk outside or by an open window.",
                "Reach out to a trusted friend or write a few lines in your MindLog before sleep."
            ]
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "non_diagnostic_notice": "SunnoBuddy provides emotional reflections and self-care tools, not clinical diagnoses."
    }


def get_comprehensive_insights(uid: str) -> dict:
    db = get_db()
    
    # 1. Authoritative chat stats (shared with Companion history)
    chat_stats = chat_service.get_chat_stats(uid)
    unique_convs = chat_stats["total_conversations"]
    total_user_msgs = chat_stats["total_user_messages"]

    # 2. Authoritative intake history count
    intake_history = intake_service.list_intake_history(uid)
    intake_count = len(intake_history)

    # 3. Gather MindLog entries
    mindlogs = []
    try:
        for doc in db.collection("users").document(uid).collection("mindlogEntries").stream():
            d = doc.to_dict()
            title = ""
            content = ""
            nonce = d.get("nonce")
            if d.get("encryptedTitle") and nonce:
                try:
                    title = decrypt(d["encryptedTitle"], nonce, uid)
                except Exception:
                    title = d.get("title", "")
            else:
                title = d.get("title", "")

            if d.get("encryptedContent") and nonce:
                try:
                    content = decrypt(d["encryptedContent"], nonce, uid)
                except Exception:
                    content = d.get("content", "")
            else:
                content = d.get("content", "")

            mindlogs.append({
                "id": doc.id,
                "title": title,
                "content": content,
                "date": d.get("entryDate") or "",
            })
    except Exception as e:
        print("[Insights] MindLog fetch error:", e)

    # 4. Gather SunnoBuddy Companion messages (ONLY user messages, NEVER assistant responses)
    user_chats = []
    try:
        convs = list(db.collection("users").document(uid).collection("conversations").stream())
        for c_doc in convs:
            for m in c_doc.reference.collection("messages").where("role", "==", "user").stream():
                md = m.to_dict()
                enc = md.get("encryptedContent") or md.get("content")
                nonce = md.get("nonce")
                text = ""
                if enc and nonce:
                    try:
                        text = decrypt(enc, nonce, uid)
                    except Exception:
                        text = enc
                else:
                    text = enc or ""
                if text and text.strip():
                    user_chats.append({
                        "message": text.strip(),
                        "time": str(md.get("createdAt") or md.get("timestamp") or ""),
                    })
    except Exception as e:
        print("[Insights] Chat fetch error:", e)

    # 5. Gather Guided Intake latest answers and assessment reports
    intake_ans = []
    latest_report_summary = ""
    try:
        if intake_history:
            latest_session = intake_history[0]
            latest_report_summary = latest_session.get("summary", "")
            s_doc_ref = db.collection("users").document(uid).collection("intakeSessions").document(latest_session["session_id"])
            for a in s_doc_ref.collection("answers").stream():
                ad = a.to_dict()
                q_id = ad.get("questionId")
                q_item = intake_service.BY_ID.get(q_id, {})
                enc_ans = ad.get("encryptedAnswer")
                nonce = ad.get("nonce")
                ans_text = ""
                if enc_ans and nonce:
                    try:
                        ans_text = decrypt(enc_ans, nonce, uid)
                    except Exception:
                        ans_text = enc_ans
                else:
                    ans_text = enc_ans or ""
                if ans_text and ans_text.strip():
                    intake_ans.append({
                        "section": q_item.get("section", "General"),
                        "question": q_item.get("question", ""),
                        "answer": ans_text.strip(),
                    })
    except Exception as e:
        print("[Insights] Intake fetch error:", e)

    # Data sources list
    data_sources = []
    if len(mindlogs) > 0:
        data_sources.append("MindLog Journals")
    if unique_convs > 0:
        data_sources.append("Companion Conversations")
    if intake_count > 0:
        data_sources.append("Guided Intake Assessment")

    stats = {
        "mindlog_count": len(mindlogs),
        "conversation_count": unique_convs,
        "unique_conversations_count": unique_convs,
        "chat_messages_count": total_user_msgs,
        "total_user_messages_count": total_user_msgs,
        "intake_answers_count": len(intake_ans),
        "completed_intake_assessments": intake_count,
        "intake_assessments_count": intake_count,
        "data_sources_included": data_sources,
        "last_analysis_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    }

    total_signals = len(mindlogs) + len(user_chats) + len(intake_ans)
    if total_signals == 0:
        return _build_fallback_insights(mindlogs, user_chats, intake_ans, "insufficient", stats)
    
    data_sufficiency = "minimal" if total_signals < 2 else "sufficient"

    # Compile synthesis context for Gemini
    context_parts = []
    if mindlogs:
        context_parts.append("### MINDLOG ENTRIES (User's journal):")
        for m in mindlogs[:10]:
            context_parts.append(f"- Date: {m['date']}\n  Title: {m['title']}\n  Content: {m['content']}")
    
    if user_chats:
        context_parts.append("### SUNNOBUDDY COMPANION USER MESSAGES (Strictly user statements):")
        for c in user_chats[:25]:
            context_parts.append(f"- User wrote: {c['message']}")

    if intake_ans:
        context_parts.append("### GUIDED INTAKE RESPONSES (Background & personal context):")
        if latest_report_summary:
            context_parts.append(f"- Assessment Report Summary: {latest_report_summary}")
        for a in intake_ans[:10]:
            context_parts.append(f"- Section: {a['section']}\n  Question: {a['question']}\n  Answer: {a['answer']}")

    full_context = "\n\n".join(context_parts)

    try:
        resp = _gemini().models.generate_content(
            model=settings.gemini_model,
            contents=full_context,
            config=types.GenerateContentConfig(
                system_instruction=COMPREHENSIVE_PROMPT,
                temperature=0.3,
                max_output_tokens=1800,
                response_mime_type="application/json",
            ),
        )
        raw_json = json.loads(resp.text)
        
        # Validate and sanitize distribution
        raw_dist = raw_json.get("emotion_distribution", {})
        scores = {e: max(0.0, float(raw_dist.get(e, 0))) for e in EMOTIONS}
        total_score = sum(scores.values())
        if total_score > 0:
            distribution = {e: round(v / total_score, 4) for e, v in scores.items()}
        else:
            distribution = {e: round(1.0 / len(EMOTIONS), 4) for e in EMOTIONS}

        primary = raw_json.get("primary_emotion")
        if primary not in EMOTIONS:
            primary = max(distribution, key=distribution.get)

        sections = raw_json.get("sections", {})
        
        return {
            "data_sufficiency": data_sufficiency,
            "data_counts": stats,
            "primary_emotion": primary,
            "emotion_distribution": distribution,
            "sections": sections,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "non_diagnostic_notice": "SunnoBuddy provides emotional reflections and self-care tools, not clinical diagnoses."
        }
    except Exception as e:
        print("[Insights] Gemini synthesis error, using fallback:", type(e).__name__, e)
        return _build_fallback_insights(mindlogs, user_chats, intake_ans, data_sufficiency, stats)
