import re

# Ye starting list hai. Mentor/faculty se review karwao aur test set se improve karte raho.
PATTERNS = {
    "en": [
        "kill myself", "end my life", "want to die", "wanna die", "suicide",
        "suicidal", "don't want to live", "dont want to live", "better off dead",
        "end it all", "hurt myself", "harm myself", "cut myself", "self harm",
        "self-harm", "take my own life", "no reason to live",
    ],
    "hinglish": [
        "marna chahta", "marna chahti", "mar jana chahta", "mar jana chahti",
        "jeena nahi chahta", "jeena nahi chahti", "jeene ka mann nahi",
        "jeene ki ichha nahi", "khudkushi", "atmahatya", "suicide karna",
        "apni jaan", "khud ko khatam", "zindagi khatam", "khatam kar lunga",
        "khatam kar lungi", "khud ko hurt", "khud ko nuksan",
    ],
    "hi": [
        "आत्महत्या", "मरना चाहता", "मरना चाहती", "जीना नहीं चाहता",
        "जीना नहीं चाहती", "जीने का मन नहीं", "खुद को खत्म", "जान दे दूं",
        "ज़िंदगी खत्म", "जिंदगी खत्म",
    ],
}

HELPLINES = [
    {"name": "Tele-MANAS (Govt. of India, 24x7)", "number": "14416"},
    {"name": "KIRAN Mental Health Helpline", "number": "1800-599-0019"},
    {"name": "iCall", "number": "9152987821"},
    {"name": "Emergency", "number": "112"},
]

CRISIS_REPLIES = {
    "en": ("I'm really sorry you're going through this, and I'm glad you told me. "
           "You don't have to face it alone. Please reach out right now to someone "
           "you trust, or call one of the helplines below, where trained people are "
           "available. If you are in immediate danger, call 112."),
    "hinglish": ("Mujhe bahut afsos hai ki tum isse guzar rahe ho, aur accha hai ki tumne mujhe bataya. "
                 "Tumhe ye akele nahi jhelna hai. Abhi kisi bharose ke insaan se baat karo, "
                 "ya neeche di gayi helpline par call karo, wahan trained log hain. "
                 "Agar turant khatra hai to 112 par call karo."),
    "hi": ("मुझे बहुत अफ़सोस है कि आप इससे गुज़र रहे हैं, और अच्छा है कि आपने मुझे बताया। "
           "आपको यह अकेले नहीं झेलना है। अभी किसी भरोसेमंद व्यक्ति से बात करें, "
           "या नीचे दी गई हेल्पलाइन पर कॉल करें। अगर तुरंत ख़तरा है तो 112 पर कॉल करें।"),
}


def _normalize(text: str) -> str:
    text = text.lower().replace("’", "'")
    return re.sub(r"\s+", " ", text)


def detect_crisis(text: str):
    """Returns (is_crisis, matched_language_bucket). Gemini par depend nahi karta."""
    t = _normalize(text)
    for lang, phrases in PATTERNS.items():
        if any(p in t for p in phrases):
            return True, lang
    return False, None


def crisis_reply(lang: str) -> str:
    return CRISIS_REPLIES.get(lang, CRISIS_REPLIES["en"])