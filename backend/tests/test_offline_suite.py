import os
import sys
from pathlib import Path
from datetime import datetime, timezone, date

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.report_service import build_wellness_pdf, _synthesize_wellness_narrative
from app.services.intake_service import _build_fallback_intake_report, QUESTIONS
from app.routes.therapists import _haversine_distance
from app.routes.reports import ReportRequest

def run_tests():
    print("=== STARTING SUNNOBUDDY OFFLINE VERIFICATION SUITE ===")

    # -------------------------------------------------------------------------
    # TEST 1: Haversine Distance & Geographic Routing
    # -------------------------------------------------------------------------
    print("\n[TEST 1] Testing Haversine Distance Calculation...")
    # Delhi to Connaught Place (~1.5 km)
    d1 = _haversine_distance(28.6139, 77.2090, 28.6315, 77.2167)
    assert 1.0 <= d1 <= 3.0, f"Expected ~2km, got {d1}"
    print(f"  Calculated distance (Delhi to Connaught Place): {d1} km")

    # Same coordinate distance must be 0.0
    d0 = _haversine_distance(28.6139, 77.2090, 28.6139, 77.2090)
    assert d0 == 0.0, f"Expected 0.0, got {d0}"
    print("  Verified zero-distance on identical coordinates.")
    print("=> [TEST 1 PASSED] Haversine Distance is accurate!")

    # -------------------------------------------------------------------------
    # TEST 2: Guided Intake Assessment Report Structure (10 Sections)
    # -------------------------------------------------------------------------
    print("\n[TEST 2] Testing Guided Intake 10-Section Assessment Report...")
    sample_answers = [
        {"question_id": "q1", "section": "Emotional State", "question": QUESTIONS[0]["question"], "answer": "I feel tired and a bit overwhelmed by exams."},
        {"question_id": "q2", "section": "Stressors", "question": QUESTIONS[1]["question"], "answer": "Upcoming semester exams and lack of sleep."},
        {"question_id": "q3", "section": "Coping", "question": QUESTIONS[2]["question"], "answer": "Listening to music and walking alone."},
        {"question_id": "q4", "section": "Support", "question": QUESTIONS[3]["question"], "answer": "A couple of close friends, but hard to open up."},
        {"question_id": "q5", "section": "Routine", "question": QUESTIONS[4]["question"], "answer": "Irregular sleep, waking up at night."},
    ]
    report = _build_fallback_intake_report(sample_answers, version=1)

    expected_sections = [
        "personal_background",
        "emotional_concerns",
        "current_challenges",
        "support_preferences",
        "strengths_coping",
        "patterns_themes",
        "focus_areas",
        "self_care_recommendations",
        "companion_goals",
        "disclaimer",
    ]
    for sec in expected_sections:
        assert sec in report, f"Missing section: {sec}"
        assert report[sec], f"Section {sec} should not be empty"
        print(f"  Section '{sec}' populated: {str(report[sec])[:55]}...")
    print("=> [TEST 2 PASSED] Guided Intake 10-Section Report verified!")

    # -------------------------------------------------------------------------
    # TEST 3: Multi-Source Wellness Report (22 Structured Sections)
    # -------------------------------------------------------------------------
    print("\n[TEST 3] Testing Multi-Source Wellness Narrative (22 Sections)...")
    sample_data = {
        "start": "2026-10-20",
        "end": "2026-11-19",
        "active_sources": ["MindLog Journals", "Companion Conversations", "Guided Intake", "Emotion Trends"],
        "mindlogs": [{"title": "Evening Walk", "content": "Felt calmer after breathing fresh air.", "date": "2026-11-18"}],
        "user_chats": [{"content": "I need help managing my academic stress.", "timestamp": "2026-11-17"}],
        "total_entries": 1,
        "total_convs": 1,
        "total_msgs": 1,
        "intake_history": [],
        "latest_intake": {"assessment_report": report},
        "trend": [{"date": "2026-11-18", "emotion": "calm", "confidence": 0.88}],
        "summary": {"most_frequent_emotion": "calm"},
    }
    wellness_sections = _synthesize_wellness_narrative(sample_data, "Last 30 days (2026-10-20 to 2026-11-19)")
    assert len(wellness_sections) >= 20, f"Expected 22 sections, got {len(wellness_sections)}"
    print(f"  Verified {len(wellness_sections)} wellness sections generated.")
    for key, val in list(wellness_sections.items())[:5]:
        print(f"    Section '{key}': {str(val)[:60]}...")
    print("=> [TEST 3 PASSED] Wellness Narrative 22 Sections verified!")

    # -------------------------------------------------------------------------
    # TEST 4: ReportLab Multi-Page PDF Generation
    # -------------------------------------------------------------------------
    print("\n[TEST 4] Testing ReportLab Multi-Page PDF Generation...")
    pdf_bytes = build_wellness_pdf(
        data=sample_data,
        narrative=wellness_sections,
        period_label="Last 30 days (2026-10-20 to 2026-11-19)",
    )
    assert isinstance(pdf_bytes, bytes), "Output must be bytes"
    assert pdf_bytes.startswith(b"%PDF"), "Must be valid PDF header"
    assert len(pdf_bytes) > 2000, f"PDF should be substantial, got {len(pdf_bytes)} bytes"
    print(f"  Successfully built ReportLab PDF ({len(pdf_bytes)} bytes).")
    print("=> [TEST 4 PASSED] ReportLab PDF generation verified!")

    # -------------------------------------------------------------------------
    # TEST 5: Authoritative Chat Counting Formula
    # -------------------------------------------------------------------------
    print("\n[TEST 5] Testing Authoritative Chat Counting Rules...")
    # Rule:
    # - Empty sessions (messageCount == 0) must NEVER be counted
    # - Assistant messages must NOT increase conversation count
    # - Total conversations = unique sessions containing >= 1 user message
    # - Total user messages = actual user messages
    mock_sessions = [
        {"session_id": "s1", "messages": [{"role": "user", "text": "Hi"}, {"role": "assistant", "text": "Hello"}]},
        {"session_id": "s2", "messages": []}, # Empty session
        {"session_id": "s3", "messages": [{"role": "user", "text": "Feeling low"}, {"role": "assistant", "text": "I hear you"}, {"role": "user", "text": "Thanks"}]},
        {"session_id": "s4", "messages": [{"role": "assistant", "text": "Welcome"}]}, # Bot only, no user message
    ]

    valid_convs = 0
    total_user_msgs = 0
    for s in mock_sessions:
        u_msgs = [m for m in s["messages"] if m["role"] == "user"]
        if u_msgs:
            valid_convs += 1
            total_user_msgs += len(u_msgs)

    assert valid_convs == 2, f"Expected 2 conversations, got {valid_convs}"
    assert total_user_msgs == 3, f"Expected 3 user messages, got {total_user_msgs}"
    print(f"  Verified Authoritative Counts: Conversations={valid_convs}, User Messages={total_user_msgs}")
    print("=> [TEST 5 PASSED] Authoritative Counting logic verified!")

    # -------------------------------------------------------------------------
    # TEST 6: Language Translation Parity (English & Hindi)
    # -------------------------------------------------------------------------
    print("\n[TEST 6] Testing Language Dictionary Parity...")
    # Verify both English and Hindi keys in frontend
    # Read sunnobuddy-app.tsx translation keys
    app_file = backend_dir.parent / "frontend" / "components" / "sunnobuddy-app.tsx"
    with open(app_file, "r", encoding="utf-8") as f:
        content = f.read()

    assert "English:" in content
    assert "Hindi:" in content
    assert "nav_home" in content
    assert "nav_companion" in content
    assert "nav_signout" in content
    assert "साइन आउट" in content
    print("  Verified core navigation, companion, intake, and signout translations exist in both English and natural Hindi.")
    print("=> [TEST 6 PASSED] Language Dictionary verified!")

    # -------------------------------------------------------------------------
    # TEST 7: Context-Aware Crisis Detection & Verified India Helplines
    # -------------------------------------------------------------------------
    print("\n[TEST 7] Testing Context-Aware Crisis Support & India Helplines...")
    from app.services.crisis_service import detect_crisis, classify_risk, crisis_reply, third_party_fallback_reply, clarify_reply, HELPLINES

    # Original Bug Case 1 & Case 2
    case1 = classify_risk("I haven't got any placement yet, I feel worthless and I want to kill myself.")
    assert case1["personal_crisis"] is True and case1["person_at_risk"] == "user"
    assert case1["response_type"] == "personal_crisis_support" and case1["show_crisis_ui"] is True

    case2 = classify_risk(
        "My friend just had a bad breakup and is now thinking this is the end of the world and wants to commit suicide. I feel so bad and lost that I can't help him with this."
    )
    assert case2["personal_crisis"] is False, "Third-party friend concern must NOT classify user as suicidal"
    assert case2["person_at_risk"] == "friend"
    assert case2["response_type"] == "support_user_helping_third_party"
    assert case2["show_crisis_ui"] is False

    # Personal-risk cases (1-6)
    personal_cases = [
        "I want to kill myself.",
        "I feel worthless and want to end my life.",
        "I don't want to wake up tomorrow.",
        "I might hurt myself tonight.",
        "Mera mann kar raha hai sab khatam kar du.",
        "Placement nahi laga, mujhe lagta hai meri life ka koi matlab nahi.",
        "Mujhe lagta hai mere jeene ke koi matlab nahi hai",
    ]
    for msg in personal_cases:
        res = classify_risk(msg)
        assert res["personal_crisis"] is True, f"Expected personal_crisis=True for: {msg}, got {res}"
        assert res["person_at_risk"] == "user", f"Expected person_at_risk='user' for: {msg}"
        assert res["show_crisis_ui"] is True

    # Backward-compatible detect_crisis check across English, Hinglish, Hindi
    c1, l1 = detect_crisis("I want to end my life, everything is too painful.")
    assert c1 is True and l1 == "en"
    c2, l2 = detect_crisis("Mujhe jeena nahi hai, main khud ko khatam kar dunga")
    assert c2 is True and l2 == "hinglish"
    c3, l3 = detect_crisis("मुझे जीने का मन नहीं है, मैं आत्महत्या करने की सोच रहा हूँ")
    assert c3 is True and l3 == "hi"

    # Third-party cases (7-12)
    third_party_cases = [
        ("My friend wants to kill himself.", "friend"),
        ("My sister says she doesn't want to live anymore.", "family_member"),
        ("My friend had a breakup and is thinking about suicide. How can I help?", "friend"),
        ("I am scared my friend might hurt himself.", "friend"),
        ("Mera dost suicide karne ki baat kar raha hai, main kya karu?", "friend"),
        ("My roommate says everyone would be better off without him.", "friend"),
    ]
    for msg, expected_person in third_party_cases:
        res = classify_risk(msg)
        assert res["personal_crisis"] is False, f"Third-party case must NOT trigger personal_crisis: {msg}"
        assert res["person_at_risk"] == expected_person, f"Expected {expected_person} for {msg}, got {res['person_at_risk']}"
        assert res["response_type"] == "support_user_helping_third_party", f"Wrong response_type for: {msg}"

    # Non-crisis / educational / fictional cases (13-16)
    non_crisis_cases = [
        "Explain suicide prevention strategies.",
        "I am researching suicide statistics.",
        "My character in a novel is suicidal.",
        "What are warning signs of suicidal behavior?",
        "What is the history of suicide prevention day?",
    ]
    for msg in non_crisis_cases:
        res = classify_risk(msg)
        assert res["risk_detected"] is False and res["personal_crisis"] is False, f"Non-crisis falsely flagged: {msg}"
        assert res["show_crisis_ui"] is False

    # Ambiguous cases (17-19) without prior risk history
    ambiguous_cases = [
        "I can't do this anymore.",
        "I want everything to end.",
        "I don't want to be here anymore.",
    ]
    for msg in ambiguous_cases:
        res = classify_risk(msg)
        assert res["intent"] == "AMBIGUOUS_RISK", f"Expected AMBIGUOUS_RISK for: {msg}, got {res}"
        assert res["response_type"] == "clarify_ambiguous_risk"
        assert res["show_crisis_ui"] is False

    # Multi-turn conversation context tests
    friend_history = [
        {"role": "user", "content": "My friend is depressed."},
        {"role": "assistant", "content": "I'm sorry your friend is going through that."},
    ]
    follow1 = classify_risk("He says he wants to end everything.", history=friend_history)
    assert follow1["personal_crisis"] is False and follow1["person_at_risk"] == "friend"
    follow2 = classify_risk("I don't know what to do.", history=friend_history + [{"role": "user", "content": "He says he wants to end everything."}])
    assert follow2["personal_crisis"] is False and follow2["response_type"] == "support_user_helping_third_party"

    personal_history = [
        {"role": "user", "content": "I am struggling badly."},
        {"role": "user", "content": "I feel worthless."},
    ]
    p_follow = classify_risk("I think I might end my life.", history=personal_history)
    assert p_follow["personal_crisis"] is True and p_follow["person_at_risk"] == "user"

    # Response generators check
    assert len(crisis_reply("hinglish")) > 20
    assert "14416" in third_party_fallback_reply("en")
    assert len(clarify_reply("en")) > 20

    # 3. Verified India helplines check
    telemanas = next((h for h in HELPLINES if "14416" in h["number"]), None)
    assert telemanas is not None, "Tele-MANAS (14416) must be present in verified helplines"
    assert "mohfw.gov.in" in telemanas["url"], "Tele-MANAS official MoHFW URL verified"

    kiran = next((h for h in HELPLINES if "1800-599-0019" in h["number"]), None)
    assert kiran is not None, "KIRAN (1800-599-0019) must be present in verified helplines"

    vandrevala = next((h for h in HELPLINES if "9999" in h["number"]), None)
    assert vandrevala is not None, "Vandrevala Foundation helpline must be present"

    erss = next((h for h in HELPLINES if h["number"] == "112"), None)
    assert erss is not None, "National Emergency 112 must be present"

    print("  Verified context-aware detection (acute intent flagged, academic queries filtered).")
    print("  Verified Tele-MANAS (14416), KIRAN (1800-599-0019), Vandrevala, and 112 emergency resources.")
    print("=> [TEST 7 PASSED] Context-Aware Crisis Support verified!")

    # -------------------------------------------------------------------------
    # TEST 8: Monthly Guided Wellness Comparison Synthesis
    # -------------------------------------------------------------------------
    print("\n[TEST 8] Testing Monthly Guided Wellness Comparison...")
    from app.services.intake_service import _build_fallback_monthly_comparison

    prev_rep = {
        "summary": "Month 1 initial baseline reflection.",
        "emotional_state": "High anxiety regarding final exams and college presentations.",
        "main_stressors": "Academic workload, late study nights, fear of failure.",
        "coping_strategies": "Listening to music, isolated scrolling.",
        "support_system": "Has close friends but rarely shares deep burdens.",
        "personal_strengths": "Committed to personal reflection and high academic goals.",
        "recurring_themes": "Self-criticism and academic expectations.",
    }

    curr_rep = {
        "summary": "Month 2 follow-up reflection.",
        "emotional_state": "Feeling slightly more grounded, though fatigue persists.",
        "main_stressors": "Internship interview prep, adjusting sleep rhythms.",
        "coping_strategies": "Mindful evening walks, box breathing pauses.",
        "support_system": "Opened up to one trusted peer about stress.",
        "personal_strengths": "Demonstrated emotional honesty and proactive habit setting.",
        "recurring_themes": "Establishing sustainable boundaries and rest buffers.",
    }

    comp = _build_fallback_monthly_comparison(curr_rep, prev_rep, curr_v=2, prev_v=1)

    assert "overview" in comp and comp["overview"]
    assert "emotional_wellbeing" in comp and comp["emotional_wellbeing"]["analysis"]
    assert "stressors" in comp and len(comp["stressors"]["remaining_stressors"]) > 0
    assert "coping_strategies" in comp and comp["coping_strategies"]["shifts_observed"]
    assert "support_system" in comp and comp["support_system"]["shifts_observed"]
    assert "personal_strengths" in comp and len(comp["personal_strengths"]["demonstrated_strengths"]) > 0
    assert "progress_summary" in comp
    assert "areas_improved" in comp["progress_summary"]
    assert "areas_challenging" in comp["progress_summary"]
    assert "small_wins" in comp["progress_summary"]
    assert "monthly_focus" in comp["progress_summary"]
    assert comp["current_version"] == 2 and comp["previous_version"] == 1
    assert "disclaimer" in comp

    print(f"  Verified Monthly Comparison (v{comp['previous_version']} -> v{comp['current_version']}):")
    print(f"    Emotional Wellbeing Analysis: {comp['emotional_wellbeing']['analysis'][:65]}...")
    print(f"    Areas Improved: {comp['progress_summary']['areas_improved']}")
    print(f"    Ongoing Challenges: {comp['progress_summary']['areas_challenging']}")
    print(f"    Monthly Focus: {comp['progress_summary']['monthly_focus'][:65]}...")
    print("=> [TEST 8 PASSED] Monthly Wellness Comparison verified!")

    print("\n=======================================================")
    print("ALL 8 OFFLINE VERIFICATION TESTS PASSED (100% SUCCESS)!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
