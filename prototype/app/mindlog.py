"""MindLog emotion analysis.

The baseline classifies journal text into 7 emotion classes with Gemini. Same
7 classes here (the label set of the Hartmann DistilRoBERTa model in our
plan). With a Gemini key we ask the model. Without one we use a small word
list, which is crude but good enough to show the pipeline end to end.
"""
from . import llm

EMOTIONS = ["anger", "disgust", "fear", "joy", "neutral", "sadness", "surprise"]

WORDS = {
    "anger": ["angry", "furious", "annoyed", "irritated", "hate", "frustrated", "gussa"],
    "disgust": ["disgusting", "gross", "sick of", "revolting", "yuck"],
    "fear": ["scared", "afraid", "anxious", "worried", "nervous", "panic", "dar lag", "tension"],
    "joy": ["happy", "glad", "excited", "great", "proud", "grateful", "relieved", "khush"],
    "sadness": ["sad", "lonely", "cry", "crying", "hopeless", "tired of", "empty", "down", "udaas"],
    "surprise": ["surprised", "shocked", "suddenly", "unexpected", "could not believe"],
}

SYSTEM = (
    "Classify the main emotion of a diary entry. Choose exactly one of: "
    + ", ".join(EMOTIONS)
    + '. Reply only with JSON: {"emotion": "<label>"}'
)


def analyze(text: str) -> dict:
    if llm.available():
        out = llm.generate_json(SYSTEM, text[:3000])
        if isinstance(out, dict) and out.get("emotion") in EMOTIONS:
            return {"emotion": out["emotion"], "method": "gemini"}

    low = text.lower()
    scores = {e: sum(low.count(w) for w in ws) for e, ws in WORDS.items()}
    best = max(scores, key=scores.get)
    if scores[best] == 0:
        return {"emotion": "neutral", "method": "wordlist"}
    return {"emotion": best, "method": "wordlist"}
