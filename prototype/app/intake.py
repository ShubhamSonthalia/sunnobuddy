"""Guided intake.

The baseline (backend/cassidy_adk) uses Google ADK agents: a reviewer agent
checks whether an answer is complete, and either calls a follow-up agent or
fetches the next question. Here the same flow is a small plain function so we
can run and test it without Firebase or ADK. The question list is the same
therapy_questionnaire.json file from the baseline.
"""
import json
from pathlib import Path

from . import llm

DATA = Path(__file__).parent / "data" / "therapy_questionnaire.json"
MAX_FOLLOWUPS = 1
SKIP_WORDS = ("skip", "don't want", "dont want", "prefer not", "pass")

REVIEWER_SYSTEM = (
    "You help a listening companion run an intake. You get a question and the "
    "person's answer. Decide if the answer covers the question. "
    'Reply only with JSON: {"complete": true or false, "follow_up": "one short, gentle follow-up question or empty"}'
)


def load_questions() -> list[dict]:
    raw = json.loads(DATA.read_text(encoding="utf-8"))
    items = []
    for section, qs in raw.items():
        for q in qs:
            text = q["question"]
            # People use anonymous mode, so we do not ask for contact details.
            if "contact information" in text.lower():
                text = "What should I call you, and how old are you? (A nickname is fine.)"
            items.append({"section": section, "question": text})
    return items


QUESTIONS = load_questions()


def review(question: str, answer: str) -> dict:
    """Return {"complete": bool, "follow_up": str}."""
    low = answer.lower()
    if any(w in low for w in SKIP_WORDS):
        return {"complete": True, "follow_up": ""}

    if llm.available():
        out = llm.generate_json(
            REVIEWER_SYSTEM, f"Question: {question}\nAnswer: {answer}"
        )
        if isinstance(out, dict) and "complete" in out:
            return {"complete": bool(out["complete"]), "follow_up": (out.get("follow_up") or "").strip()}

    # Demo rule: very short answers get one nudge.
    if len(answer.split()) < 4:
        return {"complete": False, "follow_up": "Could you tell me a little more about that?"}
    return {"complete": True, "follow_up": ""}
