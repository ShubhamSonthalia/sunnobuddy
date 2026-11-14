"""Very small crisis check.

This is only a placeholder for the real safety layer in our plan
(keyword rules + sentence embeddings + an LLM check). It exists so that a
message about self-harm never goes to the language model and always shows
helpline information. The baseline had no such path at all.
"""
import re

CRISIS_PATTERNS = [
    r"\bkill myself\b",
    r"\bsuicid(e|al)\b",
    r"\bend my life\b",
    r"\bwant to die\b",
    r"\bdon'?t want to live\b",
    r"\bhurt myself\b",
    r"\bself[- ]?harm\b",
    r"\bno reason to live\b",
    r"\bmar jana chahta\b",
    r"\bmar jaana chahta\b",
    r"\bkhud ko khatam\b",
]
_rx = re.compile("|".join(CRISIS_PATTERNS), re.IGNORECASE)

HELPLINE_MESSAGE = (
    "I am really sorry you are feeling this much pain, and I am glad you told me. "
    "I am an AI support tool and I cannot be the right help for this moment. "
    "Please talk to a real person now.\n\n"
    "Tele-MANAS (India, free, 24x7): 14416\n"
    "iCall (India): 9152987821\n"
    "If you are in immediate danger, call 112.\n\n"
    "If someone is near you, please tell them how you feel. "
    "I will be here when you want to talk again."
)


def is_crisis(text: str) -> bool:
    return bool(_rx.search(text or ""))
