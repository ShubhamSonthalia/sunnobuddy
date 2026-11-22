import re

# Comprehensive multi-lingual patterns for crisis, suicidal intent, and self-harm detection
PATTERNS = {
    "en": [
        r"\b(kill|end|take)\s+(my\s+(own\s+)?life|myself)\b",
        r"\b(kill\s+myself|end\s+my\s+life|want\s+to\s+die|wanna\s+die|suicide|suicidal)\b",
        r"\b(want|wanna|wish)\s+to\s+(die|disappear|not\s+wake\s+up|sleep\s+forever)\b",
        r"\b(suicid(e|al|ing))\b",
        r"\b(don'?t|do\s+not)\s+want\s+to\s+(live|exist|be\s+here)\b",
        r"\b(better\s+off\s+dead|everyone\s+better\s+without\s+me)\b",
        r"\b(end\s+it\s+all|can'?t\s+take\s+this\s+life|no\s+point\s+in\s+living)\b",
        r"\b(hurt|harm|cut|poison|overdose|hang)\s+myself\b",
        r"\b(self[\s-]harm|cutting\s+my\s+wrists|taking\s+all\s+my\s+pills)\b",
        r"\b(no\s+reason\s+to\s+stay\s+alive|i\s+want\s+to\s+jump\s+off)\b",
        r"\b(goodbye\s+everyone|goodbye\s+cruel\s+world|final\s+goodbye)\b",
        r"\b(not\s+safe\s+with\s+myself|cannot\s+keep\s+myself\s+safe)\b",
    ],
    "hinglish": [
        r"\b(mar\s*na|mar\s*jana)\s*(chahta|chahti|chahte)\b",
        r"\b(jeena\s*nahi|jeene\s*ka\s*mann\s*nahi|nahi\s*jeena)\b",
        r"\b(jeene\s*ki\s*(chahat|ichha|himmat)\s*nahi)\b",
        r"\b(khudkushi|atmahatya|suicide)\b",
        r"\b(apni\s*jaan\s*(le|de|khatam))\b",
        r"\b(khud\s*ko\s*(khatam|hurt|nuksan|mar))\b",
        r"\b(zindagi\s*(khatam|nahi\s*chahiye|se\s*tang))\b",
        r"\b(khatam\s*kar\s*(lunga|lungi|dena))\b",
        r"\b(kisi\s*ko\s*meri\s*zaroorat\s*nahi|sab\s*acche\s*rahenge\s*mere\s*bina)\b",
        r"\b(zeher\s*khaa|chhat\s*se\s*kood)\b",
    ],
    "hi": [
        r"(आत्महत्या|खुदकुशी|जान\s*देना)",
        r"(मरना\s*चाहता|मरना\s*चाहती|मर\s*जाना\s*चाहता|मर\s*जाना\s*चाहती)",
        r"(जीना\s*नहीं\s*चाहता|जीना\s*नहीं\s*चाहती|जीने\s*का\s*मन\s*नहीं|जीने\s*की\s*इच्छा\s*नहीं)",
        r"(खुद\s*को\s*(खत्म|नुकसान|चोट|मार))",
        r"(ज़िंदगी\s*खत्म|जिंदगी\s*खत्म|अब\s*नहीं\s*रहा\s*जाता)",
        r"(अपनी\s*जान\s*(लेना|ले\s*लूंगा|ले\s*लूंगी))",
    ],
}

# Educational / third-party context patterns to prevent false alarms
EDUCATIONAL_CONTEXTS = [
    r"\b(what\s+is|definition\s+of|history\s+of|article\s+about|research\s+on|essay\s+on|preventing|prevention\s+day|rates\s+of)\s+suicide\b",
    r"\b(statistics\s+on|book\s+about|movie\s+about|reading\s+about|studying)\s+(suicide|self[\s-]harm)\b",
    r"\bhow\s+to\s+help\s+(a\s+friend|someone|others)\s+who\s+(is|are)\s+suicidal\b",
    r"\b(आत्महत्या\s+रोकथाम|आत्महत्या\s+के\s+कारण|आत्महत्या\s+पर\s+निबंध)\b",
]

# Verified India-specific national helplines and crisis support resources
HELPLINES = [
    {
        "name": "Tele-MANAS (Govt. of India, MoHFW)",
        "number": "14416",
        "phone": "14416",
        "alt_number": "1800-891-4416",
        "hours": "24/7 Toll-Free Support (20+ Indian Languages)",
        "desc": "Official Comprehensive National Mental Health Helpline operated by Ministry of Health & Family Welfare.",
        "url": "https://telemanas.mohfw.gov.in",
    },
    {
        "name": "KIRAN Helpline (Govt. of India, MSJE)",
        "number": "1800-599-0019",
        "phone": "1800-599-0019",
        "hours": "24/7 Free Helpline in 13 Languages",
        "desc": "Toll-free mental health rehabilitation and clinical crisis helpline by Ministry of Social Justice & Empowerment.",
        "url": "https://www.mentalhealthindia.org",
    },
    {
        "name": "Vandrevala Foundation for Mental Health",
        "number": "+91 9999 666 555",
        "phone": "+91 9999 666 555",
        "hours": "24/7 Free Professional Counselling (Call & WhatsApp)",
        "desc": "Round-the-clock clinical psychologists and counsellors available via voice call and WhatsApp.",
        "url": "https://www.vandrevalafoundation.com",
    },
    {
        "name": "National Emergency Services (All India)",
        "number": "112",
        "phone": "112",
        "hours": "Immediate 24/7 Police, Ambulance & Emergency Care",
        "desc": "Unified national emergency number for immediate life-safety or medical intervention.",
        "url": "https://112.gov.in",
    },
    {
        "name": "NIMHANS Helpline",
        "number": "080-46110007",
        "phone": "080-46110007",
        "hours": "8:00 AM - 8:00 PM IST (Mon-Sat)",
        "desc": "National Institute of Mental Health and Neurosciences clinical guidance and psychosocial care.",
        "url": "https://nimhans.ac.in",
    },
]

CRISIS_REPLIES = {
    "en": (
        "I hear how deeply painful and heavy this feels right now, and I am so grateful you shared this with me. "
        "Please know that you do not have to carry this alone. While SunnoBuddy is an AI companion and cannot provide "
        "emergency medical intervention, there are caring, trained people available right now who want to listen and support you. "
        "If you are in immediate physical danger, please reach out to someone you trust or call 112 or Tele-MANAS (14416) right away."
    ),
    "hinglish": (
        "Mujhe sunkar bahut afsos aur chinta ho rahi hai ki aap itne mushkil waqt se guzar rahe hain. "
        "Yeh sach mein bahut bhaari hai, aur aapko ye akele nahi jhelna hai. SunnoBuddy ek AI companion hai aur emergency doctor ya police ki jagah nahi le sakta, "
        "lekin abhi iss waqt trained counselors bilkul free aur bina kisi judgment ke aapki baat sunne ke liye taiyaar hain. "
        "Agar aap turant khatre mein hain, toh kripya turant 112 ya Tele-MANAS (14416) par call karein."
    ),
    "hi": (
        "मुझे यह जानकर गहरा दुख और चिंता है कि आप इस समय इतने भारी और कठिन दौर से गुजर रहे हैं। "
        "कृपया याद रखें कि आपको यह अकेला नहीं सहना है। सुनोबड्डी एक एआई साथी है और आपातकालीन सेवाओं या चिकित्सक का विकल्प नहीं है, "
        "लेकिन इस समय कई संवेदनशील, प्रशिक्षित काउंसलर उपलब्ध हैं जो आपकी बात सुनने और संबल देने के लिए तैयार हैं। "
        "यदि आप तत्काल किसी खतरे में हैं, तो कृपया तुरंत 112 या राष्ट्रीय हेल्पलाइन टेली-मानस (14416) पर संपर्क करें।"
    ),
}


def _normalize(text: str) -> str:
    text = text.lower().replace("’", "'").replace("`", "'")
    return re.sub(r"\s+", " ", text).strip()


def detect_crisis(text: str) -> tuple[bool, str | None]:
    """Context-aware crisis and suicidal intent detector.
    Distinguishes acute personal distress from third-party/educational discussions.
    Returns (is_crisis, matched_language_bucket).
    """
    if not text or len(text.strip()) < 3:
        return False, None

    t = _normalize(text)

    # 1. Check if the message is purely an educational or informational inquiry
    is_educational = any(re.search(pat, t) for pat in EDUCATIONAL_CONTEXTS)
    has_first_person = bool(re.search(r"\b(i|i'm|im|my|myself|me|mine|main|mera|meri|mujhe|mujhko|mai|ham|hamara)\b", t))

    # If it is clearly an educational search without personal intent, do not trigger false alarm
    if is_educational and not has_first_person:
        return False, None

    # 2. Check each language bucket's regex patterns
    for lang, regexes in PATTERNS.items():
        for pat in regexes:
            if re.search(pat, t, re.IGNORECASE):
                return True, lang

    return False, None


def crisis_reply(lang: str) -> str:
    norm_lang = (lang or "en").lower()
    if "hind" in norm_lang or norm_lang == "hi":
        return CRISIS_REPLIES["hi"]
    if "hing" in norm_lang:
        return CRISIS_REPLIES["hinglish"]
    return CRISIS_REPLIES.get(norm_lang, CRISIS_REPLIES["en"])
