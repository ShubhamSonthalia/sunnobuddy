import re
from typing import Any, Optional

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

# ---------------------------------------------------------------------------
# Language & normalization helpers
# ---------------------------------------------------------------------------

HINGLISH_MARKERS = re.compile(
    r"\b(mera|meri|mere|mujhe|mujhko|main|mai|mein|dost|yaar|bhai|behen|khatam|nahi|"
    r"jeena|jeene|marna|marne|karu|karun|karna|karne|lagta|lagti|zindagi|mann|man|"
    r"sab|kuch|abhi|koi|matlab|baat|raha|rahi|rahe|kaise|kya|bina|apni|apna|khud|khudkushi|"
    r"atmahatya|woh|wo|usne|uska|uski|chhat|zeher)\b",
    re.IGNORECASE,
)


def _normalize(text: str) -> str:
    text = (text or "").lower().replace("’", "'").replace("`", "'")
    return re.sub(r"\s+", " ", text).strip()


def detect_language(text: str, hint: str = "auto") -> str:
    if hint in ("en", "hi", "hinglish"):
        return hint
    if re.search(r"[\u0900-\u097F]", text or ""):
        return "hi"
    if HINGLISH_MARKERS.search(text or ""):
        return "hinglish"
    return "en"


# ---------------------------------------------------------------------------
# Semantic & syntactic pattern sets
# ---------------------------------------------------------------------------

EDUCATIONAL_PATTERNS = [
    r"\b(explain|what\s+are|what\s+is|definition\s+of|history\s+of|statistics\s+on|rates\s+of)\b.*\b(suicid\w*|self[\s-]harm)\b",
    r"\b(research|researching|studying|study|essay|paper|article|book|presentation|report|assignment)\b.*\b(suicid\w*|self[\s-]harm)\b",
    r"\b(suicid\w*|self[\s-]harm)\b.*\b(prevention\s+strateg\w*|warning\s+signs|statistics|research|article|awareness|prevention\s+day)\b",
    r"\b(prevent|preventing)\s+suicide\b",
    r"\b(आत्महत्या\s+रोकथाम|आत्महत्या\s+के\s+कारण|आत्महत्या\s+पर\s+निबंध)\b",
]

FICTIONAL_PATTERNS = [
    r"\b(character|protagonist|antagonist|villain|hero)\b.*\b(novel|story|book|movie|film|script|play|comic|game|fiction)\b",
    r"\b(writing\s+a\s+(story|novel|book|script|scene)|in\s+a\s+(novel|story|movie|book|show)|my\s+character)\b.*\b(suicid\w*|kill\s+(him|her|them)self|end\s+(his|her|their)\s+life)\b",
    r"\b(suicid\w*|kill\s+(him|her|them)self)\b.*\b(in\s+a\s+(novel|story|movie|book|show)|fictional)\b",
]

HISTORICAL_PATTERNS = [
    r"\b(previously|years\s+ago|months\s+ago|long\s+ago|back\s+in|in\s+high\s+school|in\s+the\s+past|used\s+to)\b.*\b(attempted\s+suicide|suicide\s+attempt|tried\s+to\s+kill|was\s+suicidal)\b",
    r"\b(attempted\s+suicide|suicide\s+attempt)\b.*\b(years\s+ago|months\s+ago|long\s+ago|previously|past)\b",
]

# Third-party subject markers
THIRD_PARTY_SUBJECT_MAP = [
    ("friend", r"\b(my\s+(best\s+)?friend|a\s+friend|friend\s+of\s+mine|mera\s+dost|meri\s+dost|dost|roommate|my\s+roommate|classmate|colleague)\b"),
    ("family_member", r"\b(my\s+(sister|brother|mom|mother|dad|father|cousin|sibling|son|daughter|uncle|aunt)|meri\s+behen|mera\s+bhai|behen|bhai)\b"),
    ("partner", r"\b(my\s+(partner|boyfriend|girlfriend|husband|wife|spouse|fiance|bf|gf)|meri\s+gf|mera\s+bf)\b"),
    ("other_person", r"\b(someone\s+i\s+know|someone\s+who|a\s+person\s+who|another\s+person|my\s+student|my\s+client|unhone|kisi\s+ko)\b"),
]

THIRD_PERSON_PRONOUNS = re.compile(
    r"\b(he|him|his|himself|she|her|hers|herself|they|them|their|themself|themselves|woh|wo|usne|uska|uski|unhone)\b",
    re.IGNORECASE,
)

# Explicit third-party reflexive self-harm/suicide phrases (never first-person)
THIRD_PARTY_SUICIDE_PREDICATES = [
    r"\b(kill|hurt|harm|cut|hang)\s+(himself|herself|themselves|themself)\b",
    r"\b(end|take)\s+(his|her|their)\s+(own\s+)?life\b",
    r"\bwithout\s+(him|her|them)\b",
    r"\b(he|she|they|friend|sister|brother|roommate|partner|dost|behen|bhai)\b.*\b(doesn'?t|don'?t|do\s+not)\s+want\s+to\s+(live|be\s+alive|wake\s+up)\b",
    r"\b(he|she|they|friend|sister|brother|roommate|partner|dost|behen|bhai)\b.*\b(suicid\w*|commit\s+suicide|end\s+everything|end\s+it\s+all|die|hurt\s+(him|her)self|marna|khudkushi|atmahatya)\b",
    r"\b(don'?t|do\s+not)\s+want\s+(my\s+)?(friend|sister|brother|him|her|them|dost)\s+to\s+die\b",
    r"\b(help|save)\s+(him|her|them|my\s+friend|someone\s+who\s+feels\s+suicidal|dost)\b",
    r"\b(dost|behen|bhai|friend|sister|brother|roommate)\b.*\b(suicide|marna|khudkushi|khatam)\b",
]

# Explicit first-person suicidal / self-harm phrases
EXPLICIT_PERSONAL_PATTERNS = [
    r"\b(kill|end|take)\s+(my\s+(own\s+)?life|myself)\b",
    r"\b(i|i'm|im)\s+(am\s+)?(want|wanna|going|planning|about|trying|ready)\s+to\s+(kill\s+myself|die|end\s+my\s+life|commit\s+suicide)\b",
    r"\b(want|wanna|wish)\s+to\s+(kill\s+myself|end\s+my\s+life|die|commit\s+suicide)\b",
    r"\b(hurt|harm|cut|poison|overdose|hang)\s+myself\b",
    r"\b(i\s+might|might|going\s+to|gonna)\s+(hurt|harm|kill)\s+myself\b",
    r"\b(self[\s-]harm|cutting\s+my\s+wrists|taking\s+all\s+my\s+pills)\b",
    r"\b(not\s+safe\s+with\s+myself|cannot\s+keep\s+myself\s+safe)\b",
    r"\b(i\s+am|i'm|im)\s+suicidal\b",
    r"\b(apni\s*jaan\s*(le|de|khatam)|khud\s*ko\s*(khatam|hurt|nuksan|mar)|khudkushi|atmahatya)\b",
    r"\b(mar\s*na|mar\s*jana)\s*(chahta|chahti|chahte)\b",
    r"\b(zeher\s*khaa|chhat\s*se\s*kood)\b",
    r"(आत्महत्या|खुदकुशी|अपनी\s*जान\s*(लेना|ले\s*लूंगा|ले\s*लूंगी)|मरना\s*चाहता|मरना\s*चाहती)",
]

# Indirect / implicit personal suicidal ideation (requires first-person or no third-party override)
INDIRECT_PERSONAL_PATTERNS = [
    r"\b(don'?t|do\s+not)\s+want\s+to\s+wake\s+up(\s+tomorrow)?\b",
    r"\b(no\s+reason|don'?t\s+see\s+a\s+reason)\s+to\s+(wake\s+up|live|stay\s+alive|go\s+on)\b",
    r"\b(wish\s+i\s+could|want\s+to)\s+disappear\s+forever\b",
    r"\beveryone\s+(would\s+be|is)\s+better\s+off\s+without\s+me\b",
    r"\bbetter\s+off\s+dead\b",
    r"\b(don'?t|do\s+not)\s+think\s+i\s+can\s+keep\s+doing\s+this\b",
    r"\bcan'?t\s+take\s+it\s+anymore\s+and\s+i\s+(might|will|gonna)\s+do\s+something\b",
    r"\b(don'?t|do\s+not)\s+want\s+to\s+live(\s+anymore)?\b",
    r"\bno\s+point\s+in\s+living\b",
    r"\b(mann\s+kar\s+raha\s+hai|man\s+kar\s+raha\s+hai|dil\s+kar\s+raha\s+hai)\s+(sab\s+)?khatam\s+kar\s*(du|doon|lu|loon)\b",
    r"\b(sab\s+khatam\s+kar\s*(du|doon|lunga|lungi)|zindagi\s+khatam)\b",
    r"\b(meri|mere|mera)\s+(life|zindagi|jeene)\s+k[aei]\s+(koi\s+)?matlab\s+nahi\b",
    r"\b(jeene\s+k[aei]\s+(koi\s+)?matlab\s+nahi|jeena\s*nahi)\b",
    r"(जीना\s*नहीं\s*चाहता|जीना\s*नहीं\s*चाहती|जीने\s*का\s*मन\s*नहीं|ज़िंदगी\s*खत्म)",
]

# Immediate danger / intent-or-plan cues
IMMEDIATE_DANGER_CUES = re.compile(
    r"\b(tonight|right\s+now|today|this\s+moment|abhi|aaj\s+raat|have\s+a\s+plan|"
    r"got\s+the\s+pills|taking\s+pills|on\s+the\s+roof|going\s+to\s+jump|final\s+goodbye)\b",
    re.IGNORECASE,
)

# Ambiguous expressions that need clarification unless history disambiguates
AMBIGUOUS_PATTERNS = [
    r"^\s*i\s+can'?t\s+do\s+this\s+anymore[\.\!\?]*\s*$",
    r"^\s*i\s+want\s+everything\s+to\s+end[\.\!\?]*\s*$",
    r"^\s*i\s+(don'?t|do\s+not)\s+want\s+to\s+be\s+here\s+anymore[\.\!\?]*\s*$",
    r"\b(i\s+can'?t\s+do\s+this\s+anymore|i\s+want\s+everything\s+to\s+end|i\s+don'?t\s+want\s+to\s+be\s+here\s+anymore)\b",
]


def _extract_history_context(history: Optional[list[dict]]) -> dict[str, Any]:
    """Inspect recent conversation turns for subject & risk continuity."""
    ctx = {
        "recent_third_party": None,
        "recent_personal_distress": False,
        "recent_personal_risk": False,
        "recent_educational": False,
    }
    if not history:
        return ctx

    # Focus on recent user messages (last 6)
    user_msgs = [m.get("content", "") for m in history if m.get("role") == "user"][-6:]
    for prev in user_msgs:
        pt = _normalize(prev)
        if not pt:
            continue
        if any(re.search(pat, pt, re.IGNORECASE) for pat in EDUCATIONAL_PATTERNS):
            ctx["recent_educational"] = True
        for label, pat in THIRD_PARTY_SUBJECT_MAP:
            if re.search(pat, pt, re.IGNORECASE):
                ctx["recent_third_party"] = label
                ctx["recent_educational"] = False
        if re.search(r"\b(i\s+feel\s+worthless|struggling\s+badly|want\s+to\s+die|end\s+my\s+life|kill\s+myself|suicidal)\b", pt):
            if not ctx["recent_third_party"]:
                ctx["recent_personal_distress"] = True
                ctx["recent_personal_risk"] = True
        elif re.search(r"\b(i\s+am\s+struggling|feel\s+worthless|hopeless|can'?t\s+go\s+on)\b", pt):
            ctx["recent_personal_distress"] = True
    return ctx


def _find_third_party_subject(t: str) -> Optional[str]:
    for label, pat in THIRD_PARTY_SUBJECT_MAP:
        if re.search(pat, t, re.IGNORECASE):
            return label
    return None


def classify_risk(
    message: str,
    history: Optional[list[dict]] = None,
    language: str = "auto",
) -> dict[str, Any]:
    """Structured contextual suicide & self-harm risk classifier.

    Distinguishes:
    - Personal suicidal ideation / self-harm risk
    - Third-party concern / helping a friend or family member
    - Educational / prevention / research queries
    - Fictional / hypothetical discussions
    - Historical / past resolved discussions
    - Ambiguous distress requiring gentle clarification
    """
    lang = detect_language(message, language)
    t = _normalize(message)

    base = {
        "risk_detected": False,
        "personal_crisis": False,
        "person_at_risk": "none",
        "intent": "NO_CRISIS_RISK",
        "severity": "no_risk",
        "immediacy": "none",
        "confidence": 0.9,
        "response_type": "normal_supportive",
        "language": lang,
        "show_crisis_ui": False,
        "crisis_ui_mode": "none",
    }

    if not t or len(t) < 2:
        return base

    hist_ctx = _extract_history_context(history)

    # 1. Educational / Research / Prevention check
    if any(re.search(pat, t, re.IGNORECASE) for pat in EDUCATIONAL_PATTERNS):
        # Ensure user didn't also add an explicit personal crisis statement
        if not any(re.search(pat, t, re.IGNORECASE) for pat in EXPLICIT_PERSONAL_PATTERNS):
            return {
                **base,
                "intent": "PREVENTION_OR_EDUCATIONAL_DISCUSSION",
                "confidence": 0.95,
            }

    # 2. Fictional / Story character check
    if any(re.search(pat, t, re.IGNORECASE) for pat in FICTIONAL_PATTERNS):
        return {
            **base,
            "person_at_risk": "fictional",
            "intent": "FICTIONAL_OR_HYPOTHETICAL",
            "confidence": 0.94,
        }

    # 3. Historical / Past resolved check
    if any(re.search(pat, t, re.IGNORECASE) for pat in HISTORICAL_PATTERNS):
        if not IMMEDIATE_DANGER_CUES.search(t):
            return {
                **base,
                "person_at_risk": _find_third_party_subject(t) or "user",
                "intent": "HISTORICAL_DISCUSSION",
                "severity": "emotional_distress",
                "confidence": 0.88,
            }

    # 4. Identify third-party vs personal subject
    explicit_third_party = _find_third_party_subject(t)
    has_third_person_pronoun = bool(THIRD_PERSON_PRONOUNS.search(t))
    has_third_party_predicate = any(re.search(pat, t, re.IGNORECASE) for pat in THIRD_PARTY_SUICIDE_PREDICATES)
    has_explicit_personal = any(re.search(pat, t, re.IGNORECASE) for pat in EXPLICIT_PERSONAL_PATTERNS)
    has_indirect_personal = any(re.search(pat, t, re.IGNORECASE) for pat in INDIRECT_PERSONAL_PATTERNS)
    has_suicide_keyword = bool(re.search(r"\b(suicid\w*|kill\s+(him|her|them|my)self|end\s+everything|end\s+it\s+all|hurt\s+(him|her|my)self|marna|khudkushi|atmahatya|khatam)\b", t, re.IGNORECASE))

    # Resolve third-party context from current message or multi-turn history
    bound_third_party = explicit_third_party
    if not bound_third_party and has_third_person_pronoun and hist_ctx["recent_third_party"]:
        bound_third_party = hist_ctx["recent_third_party"]

    # Case A: Third-party suicide/self-harm concern
    # Note: Even if user says "I feel so bad and lost that I can't help him", the suicidal risk is the friend's!
    if (bound_third_party or has_third_party_predicate) and not has_explicit_personal:
        person = bound_third_party or "other_person"
        is_immediate = bool(IMMEDIATE_DANGER_CUES.search(t))
        if has_third_party_predicate or has_suicide_keyword or has_indirect_personal:
            return {
                "risk_detected": True,
                "personal_crisis": False,
                "person_at_risk": person,
                "intent": "THIRD_PARTY_IMMEDIATE_DANGER" if is_immediate else "THIRD_PARTY_SUICIDE_CONCERN",
                "severity": "third_party_immediate_danger" if is_immediate else "potentially_high",
                "immediacy": "immediate" if is_immediate else "unknown",
                "confidence": 0.94,
                "response_type": "support_user_helping_third_party",
                "language": lang,
                "show_crisis_ui": is_immediate,
                "crisis_ui_mode": "third_party" if is_immediate else "none",
            }
        # Follow-up caregiver emotional support after discussing third-party risk (e.g. "I don't know what to do")
        if hist_ctx["recent_third_party"]:
            return {
                "risk_detected": False,
                "personal_crisis": False,
                "person_at_risk": hist_ctx["recent_third_party"],
                "intent": "EMOTIONAL_SUPPORT_FOR_CAREGIVER",
                "severity": "emotional_distress",
                "immediacy": "none",
                "confidence": 0.88,
                "response_type": "support_user_helping_third_party",
                "language": lang,
                "show_crisis_ui": False,
                "crisis_ui_mode": "none",
            }

    # Case A-2: Follow-up caregiver emotional support after discussing third-party risk (e.g. "I don't know what to do")
    if not has_explicit_personal and not has_indirect_personal and hist_ctx["recent_third_party"]:
        if re.search(r"\b(what\s+to\s+do|how\s+(can|do)\s+i\s+help|scared|worried|lost|helpless|overwhelmed|kya\s+karu)\b", t):
            return {
                "risk_detected": False,
                "personal_crisis": False,
                "person_at_risk": hist_ctx["recent_third_party"],
                "intent": "EMOTIONAL_SUPPORT_FOR_CAREGIVER",
                "severity": "emotional_distress",
                "immediacy": "none",
                "confidence": 0.88,
                "response_type": "support_user_helping_third_party",
                "language": lang,
                "show_crisis_ui": False,
                "crisis_ui_mode": "none",
            }

    # Case B: Explicit or indirect PERSONAL suicidal ideation / self-harm risk
    if has_explicit_personal or has_indirect_personal:
        is_immediate = bool(IMMEDIATE_DANGER_CUES.search(t))
        if is_immediate:
            severity = "immediate_danger"
            immediacy = "immediate"
        elif has_explicit_personal:
            severity = "active_ideation"
            immediacy = "high"
        else:
            severity = "passive_ideation"
            immediacy = "moderate"

        return {
            "risk_detected": True,
            "personal_crisis": True,
            "person_at_risk": "user",
            "intent": "PERSONAL_SELF_HARM_RISK" if re.search(r"\b(hurt|harm|cut)\s+myself\b", t) else "PERSONAL_SUICIDAL_IDEATION",
            "severity": severity,
            "immediacy": immediacy,
            "confidence": 0.95 if has_explicit_personal else 0.88,
            "response_type": "personal_crisis_support",
            "language": lang,
            "show_crisis_ui": True,
            "crisis_ui_mode": "personal",
        }

    # Case C: Ambiguous phrases ("I can't do this anymore", "I want everything to end", "I don't want to be here anymore")
    if any(re.search(pat, t, re.IGNORECASE) for pat in AMBIGUOUS_PATTERNS):
        # If prior turns already showed personal suicidal/worthlessness progression, treat as personal risk
        if hist_ctx["recent_personal_risk"] or hist_ctx["recent_personal_distress"]:
            return {
                "risk_detected": True,
                "personal_crisis": True,
                "person_at_risk": "user",
                "intent": "PERSONAL_SUICIDAL_IDEATION",
                "severity": "passive_ideation",
                "immediacy": "moderate",
                "confidence": 0.86,
                "response_type": "personal_crisis_support",
                "language": lang,
                "show_crisis_ui": True,
                "crisis_ui_mode": "personal",
            }
        # If prior turns were about a friend, treat as caregiver support
        if hist_ctx["recent_third_party"]:
            return {
                "risk_detected": False,
                "personal_crisis": False,
                "person_at_risk": hist_ctx["recent_third_party"],
                "intent": "EMOTIONAL_SUPPORT_FOR_CAREGIVER",
                "severity": "emotional_distress",
                "immediacy": "none",
                "confidence": 0.85,
                "response_type": "support_user_helping_third_party",
                "language": lang,
                "show_crisis_ui": False,
                "crisis_ui_mode": "none",
            }
        # Otherwise ask a gentle clarifying question rather than guessing
        return {
            "risk_detected": False,
            "personal_crisis": False,
            "person_at_risk": "unknown",
            "intent": "AMBIGUOUS_RISK",
            "severity": "emotional_distress",
            "immediacy": "unknown",
            "confidence": 0.78,
            "response_type": "clarify_ambiguous_risk",
            "language": lang,
            "show_crisis_ui": False,
            "crisis_ui_mode": "none",
        }

    return base


def detect_crisis(text: str, history: Optional[list[dict]] = None) -> tuple[bool, str | None]:
    """Backward-compatible wrapper returning (personal_crisis, matched_language).
    Triggers True ONLY when the user themselves is at personal risk.
    """
    res = classify_risk(text, history=history)
    if res["personal_crisis"]:
        return True, res["language"]
    return False, None


# ---------------------------------------------------------------------------
# Response generators (Personal Crisis, Third-Party Support, Ambiguous Clarify)
# ---------------------------------------------------------------------------

CRISIS_REPLIES = {
    "en": (
        "I hear how deeply painful and heavy this feels right now, and I am glad you told me. "
        "You don't have to carry this alone. Are you in a safe place right now, or thinking about acting on these thoughts tonight? "
        "Please consider reaching out to someone you trust to be with you right now, or calling Tele-MANAS (14416) or 112 if you're in immediate danger—real people are there 24/7 to listen without judgment."
    ),
    "hinglish": (
        "Mujhe sunkar bahut chinta ho rahi hai ki aap abhi itne mushkil aur dardnaak waqt se guzar rahe hain. "
        "Aapko yeh akele nahi sehna hai. Kya aap abhi kisi safe jagah par hain, ya kya aap aaj khud ko nuksan pahunchane ke baare mein soch rahe hain? "
        "Kripya abhi kisi bharosemand dost ya family member ke paas rahein, aur agar aap turant khatre mein hain toh 112 ya Tele-MANAS (14416) par call karein."
    ),
    "hi": (
        "मुझे यह सुनकर गहरी चिंता हो रही है कि आप इस समय इतने कठिन और दर्दनाक दौर से गुजर रहे हैं। "
        "आपको यह अकेले नहीं सहना है। क्या आप अभी सुरक्षित स्थान पर हैं? "
        "कृपया अभी किसी भरोसेमंद व्यक्ति के साथ रहें, और यदि आप तत्काल खतरे में हैं तो तुरंत 112 या टेली-मानस (14416) पर कॉल करें—वहां 24/7 प्रशिक्षित लोग बिना किसी जजमेंट के आपकी मदद के लिए उपलब्ध हैं।"
    ),
}

THIRD_PARTY_FALLBACK_REPLIES = {
    "en": (
        "It sounds really frightening and heavy to see someone you care about hurting like this, and it makes complete sense that you feel overwhelmed. "
        "You don't have to carry this alone or have all the answers.\n\n"
        "If you can reach out to them calmly, ask directly whether they are thinking about hurting themselves or have a plan—asking directly does not put the idea in their head and often brings relief. "
        "If they are in immediate danger, please try not to leave them alone, involve a trusted family member or adult who can be physically present, and contact emergency services (112) or a helpline for them.\n\n"
        "You can say something simple like: \"I care about you and I'm right here. You don't have to go through this alone—let's reach out for support together.\" "
        "If they are open to talking to someone, Tele-MANAS (14416) and KIRAN (1800-599-0019) are free 24/7 helplines you can share with them or call together."
    ),
    "hinglish": (
        "Kisi apne ko itni takleef mein dekhna sach mein bahut darawna aur bhaari hota hai, aur aapka pareshan hona bilkul samajh aata hai. "
        "Aapko yeh sab akele nahi sambhalna hai.\n\n"
        "Aap unse pyaar aur shaanti se seedha pooch sakte hain ki kya woh khud ko nuksan pahunchane ya suicide ke baare mein soch rahe hain—seedha poochne se khatra badhta nahi hai, balki unhe sahara milta hai. "
        "Agar turant khatra lage, toh unhe akela na chhodein, kisi bharosemand family member ya adult ko batayein, aur zaroorat padne par 112 par call karein.\n\n"
        "Aap keh sakte hain: \"Main tumhari parwah karta/karti hoon, tum akele nahi ho, chalo saath mein help lete hain.\" "
        "Unki madad ke liye aap Tele-MANAS (14416) ya KIRAN (1800-599-0019) par bhi call kar sakte hain."
    ),
    "hi": (
        "किसी अपने को इतने दर्द में देखना सच में बहुत डरावना और भारी होता है, और आपका चिंतित होना बिल्कुल स्वाभाविक है। "
        "आपको यह सब अकेले नहीं संभालना है।\n\n"
        "यदि संभव हो तो उनसे शांत और संवेदनशील तरीके से सीधे पूछें कि क्या वे खुद को नुकसान पहुंचाने के बारे में सोच रहे हैं—सीधे पूछने से विचार मन में नहीं आते, बल्कि उन्हें बात करने का सहारा मिलता है। "
        "यदि तत्काल खतरा दिखे, तो उन्हें अकेला न छोड़ें, किसी भरोसेमंद परिजन को शामिल करें, और जरूरत हो तो 112 या टेली-मानस (14416) पर संपर्क करें।"
    ),
}

CLARIFY_REPLIES = {
    "en": (
        "It sounds like you're carrying a really heavy weight right now. "
        "When you say that, are you feeling unsafe or having thoughts of hurting yourself, or are you feeling exhausted by everything you're dealing with? "
        "Either way, I'm right here to listen."
    ),
    "hinglish": (
        "Aisa lag raha hai ki aap abhi bahut bhaari bojh mehsoos kar rahe hain. "
        "Jab aap yeh keh rahe hain, toh kya aap khud ko nuksan pahunchane ke baare mein soch rahe hain, ya aap bas is waqt ki mushkilon se bahut thak gaye hain? "
        "Main yahin hoon, aap bina jhijhak bata sakte hain."
    ),
    "hi": (
        "ऐसा लग रहा है कि आप अभी बहुत भारी बोझ महसूस कर रहे हैं। "
        "क्या आप खुद को नुकसान पहुंचाने के बारे में सोच रहे हैं, या आप इस समय की परिस्थितियों से बहुत थक गए हैं? "
        "मैं यहीं सुनने के लिए हूं।"
    ),
}


def crisis_reply(lang: str) -> str:
    norm_lang = (lang or "en").lower()
    if "hind" in norm_lang or norm_lang == "hi":
        return CRISIS_REPLIES["hi"]
    if "hing" in norm_lang:
        return CRISIS_REPLIES["hinglish"]
    return CRISIS_REPLIES.get(norm_lang, CRISIS_REPLIES["en"])


def third_party_fallback_reply(lang: str) -> str:
    norm_lang = (lang or "en").lower()
    if "hind" in norm_lang or norm_lang == "hi":
        return THIRD_PARTY_FALLBACK_REPLIES["hi"]
    if "hing" in norm_lang:
        return THIRD_PARTY_FALLBACK_REPLIES["hinglish"]
    return THIRD_PARTY_FALLBACK_REPLIES.get(norm_lang, THIRD_PARTY_FALLBACK_REPLIES["en"])


def clarify_reply(lang: str) -> str:
    norm_lang = (lang or "en").lower()
    if "hind" in norm_lang or norm_lang == "hi":
        return CLARIFY_REPLIES["hi"]
    if "hing" in norm_lang:
        return CLARIFY_REPLIES["hinglish"]
    return CLARIFY_REPLIES.get(norm_lang, CLARIFY_REPLIES["en"])
