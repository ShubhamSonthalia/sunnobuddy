"""Chat persona and reply logic.

The prompt is refactored from reflection_chatbot() in
backend/persona_server/chat.py. Changes: it is now a proper system
instruction (the old one pasted everything into the user turn), the
conversation history is passed in, the replies are kept short, and it
states clearly what the companion is not.
"""
from . import llm
from .safety import HELPLINE_MESSAGE, is_crisis

PERSONA = """You are SunnoBuddy, a warm and calm listening companion for young adults in India.
You are not a therapist and you do not diagnose. You never name a condition or give a diagnosis.
Listen first. Reflect back what the person said in simple words. Ask one gentle question at a time.
Keep replies short (2 to 4 sentences). Match the person's language: English, Hindi or Hinglish.
Do not give medical advice or medication advice. If the person seems to be in danger, encourage them
to contact a helpline or someone they trust."""

DEMO_REPLIES = [
    "That sounds like a lot to carry. What part of it has been weighing on you the most today?",
    "Thank you for telling me. I am listening. When did you first start feeling this way?",
    "It makes sense that this feels hard. What usually helps you even a little when you feel like this?",
]


def reply(history: list[dict], user_message: str) -> dict:
    """history: [{"role": "user"|"assistant", "content": "..."}] oldest first."""
    if is_crisis(user_message):
        return {"reply": HELPLINE_MESSAGE, "crisis": True, "mode": "safety"}

    if llm.available():
        contents = [
            {"role": "model" if m["role"] == "assistant" else "user", "text": m["content"]}
            for m in history[-10:]
        ]
        contents.append({"role": "user", "text": user_message})
        try:
            text = llm.generate(PERSONA, contents)
            if text:
                return {"reply": text, "crisis": False, "mode": "gemini"}
        except Exception as exc:
            llm.log.warning("Gemini chat failed, using demo reply: %s", exc)

    turn = sum(1 for m in history if m["role"] == "user") % len(DEMO_REPLIES)
    return {"reply": DEMO_REPLIES[turn], "crisis": False, "mode": "demo"}
