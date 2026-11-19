import json
import time
from collections import Counter
from datetime import date
from typing import Optional

from fastapi import HTTPException
from firebase_admin import firestore
from google.genai import types

from app.core.config import settings
from app.core.firebase import get_db
from app.services import mindlog_service
from app.services.chat_service import _gemini

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