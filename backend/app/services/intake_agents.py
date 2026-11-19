import json
import time
from google.genai import types
from app.core.config import settings
from app.services.chat_service import _gemini

REVIEWER_PROMPT = """You review answers in a supportive background questionnaire for a student wellbeing app.
You get the QUESTION, an EXAMPLE showing the format and level of detail of a complete answer
(do NOT expect the same content), and the user's ANSWER (English, Hindi or Hinglish).
Decide if the answer adequately addresses the question.
Be lenient: a short answer like "No" is complete for a yes/no question. Mark incomplete only
if an important part of the question is clearly unanswered (for example the user says "yes"
but the question also asked for details).
Do not diagnose. Return ONLY JSON:
{"is_complete": true/false, "reason": "short reason", "followup_required": true/false}"""

FOLLOWUP_PROMPT = """You write ONE short, gentle follow-up question for a supportive intake questionnaire.
You get the original QUESTION, the user's ANSWER so far, and what is missing.
Rules: ask only for the missing information, do not repeat what the user already said,
no diagnosis, no advice, one sentence, reply in the same language and script as the user's answer
(Hinglish if they wrote Hinglish). Return ONLY JSON: {"followup_question": "..."}"""


def _call_json(system: str, prompt: str, retries: int = 2):
    last = None
    for attempt in range(retries):
        try:
            resp = _gemini().models.generate_content(
                model=settings.gemini_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system,
                    temperature=0.2,
                    max_output_tokens=400,
                    response_mime_type="application/json",
                    
                ),
            )
            return json.loads(resp.text)
        except Exception as e:
            last = e
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
    print("INTAKE AGENT ERROR:", type(last).__name__)   # answer kabhi print nahi karte
    return None


def review(question: str, example: str, answer: str):
    """Reviewer agent. None = Gemini unavailable (caller answer accept kar leta hai)."""
    out = _call_json(REVIEWER_PROMPT, f"QUESTION: {question}\nEXAMPLE: {example}\nANSWER: {answer}")
    if not isinstance(out, dict) or "is_complete" not in out:
        return None
    return out


def followup(question: str, answer: str, reason: str):
    """Follow-up agent. Returns question text or None."""
    out = _call_json(FOLLOWUP_PROMPT, f"QUESTION: {question}\nANSWER SO FAR: {answer}\nMISSING: {reason}")
    text = (out or {}).get("followup_question", "") if isinstance(out, dict) else ""
    return text.strip() or None


def progress(total: int, completed: int) -> dict:
    """Progress agent: numbers questionnaire se aate hain, LLM ki zarurat nahi."""
    return {
        "total_questions": total,
        "completed_questions": completed,
        "remaining_questions": total - completed,
        "completion_percentage": round(completed / total * 100) if total else 0,
    }