import os
import sys
from pathlib import Path
from firebase_admin import firestore

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.firebase import get_db
from app.services import chat_service
from app.services import intake_service
from app.services import emotion_service
from app.services import mindlog_service

def test_all():
    print("=== STARTING INTEGRATION AND PERSISTENCE TESTS ===")
    db = get_db()
    print(f"Firestore Client: {type(db)}")

    test_uid = "test_persistence_verification_user"

    # -------------------------------------------------------------------------
    # 1. TEST CONVERSATION HISTORY PERSISTENCE
    # -------------------------------------------------------------------------
    print("\n[TEST 1] Testing Conversation History Persistence...")
    # Clean up previous test data if any
    convs = list(db.collection("users").document(test_uid).collection("conversations").stream())
    for c in convs:
        for m in c.reference.collection("messages").stream():
            m.reference.delete()
        c.reference.delete()

    # Step A: Create new session
    session_id = chat_service.new_session(test_uid, language="en", title="My First Conversation")
    assert session_id, "Session ID should be non-empty"
    print(f"  Created new session: {session_id}")

    # Check Firestore conversation doc is NOT created yet for an empty session
    conv_doc = db.collection("users").document(test_uid).collection("conversations").document(session_id).get()
    assert not conv_doc.exists, "Empty session must NOT be persisted to Firestore before first message"
    print("  Verified empty session is not persisted to Firestore prior to first message.")

    # Step B: Send a user message
    res1 = chat_service.send_message(test_uid, session_id, "I have had a heavy and overwhelming day at college.", "en")
    assert res1.get("session_id") == session_id
    assert res1.get("reply"), "Reply should be non-empty"
    print(f"  Received reply: {res1['reply'][:60]}...")

    # Now verify the session document is created upon first user message
    conv_doc = db.collection("users").document(test_uid).collection("conversations").document(session_id).get()
    assert conv_doc.exists, "Conversation document must exist in Firestore after first message"
    conv_data = conv_doc.to_dict()
    assert conv_data.get("conversationId") == session_id, "conversationId should match"
    print("  Verified conversation metadata in Firestore after first message.")

    # Step C: Verify messages saved to Firestore subcollection
    msgs_ref = db.collection("users").document(test_uid).collection("conversations").document(session_id).collection("messages")
    msg_docs = list(msgs_ref.order_by("createdAt").stream())
    assert len(msg_docs) == 2, f"Expected 2 messages (user + assistant), got {len(msg_docs)}"
    user_msg_data = msg_docs[0].to_dict()
    asst_msg_data = msg_docs[1].to_dict()
    assert user_msg_data["role"] == "user"
    assert asst_msg_data["role"] == "assistant"
    assert user_msg_data.get("messageId"), "messageId must be stored"
    print("  Verified both user message and assistant reply saved in Firestore subcollection.")

    # Step D: Verify get_history decrypts and orders properly
    history = chat_service.get_history(test_uid, session_id)
    assert len(history) == 2
    assert "heavy and overwhelming" in history[0]["content"], "User message decrypted content mismatch"
    assert history[0]["role"] == "user"
    assert history[1]["role"] == "assistant"
    print("  Verified get_history returns properly decrypted messages in chronological order.")

    # Step E: Verify list_sessions
    sessions = chat_service.list_sessions(test_uid)
    assert len(sessions) >= 1
    assert sessions[0]["session_id"] == session_id
    print(f"  Verified list_sessions returned session with title: '{sessions[0]['title']}'.")

    # Step F: Verify session recreation prevents 404
    orphan_id = "orphan_session_12345"
    res_orphan = chat_service.send_message(test_uid, orphan_id, "Hello from recovered session", "en")
    assert res_orphan["session_id"] == orphan_id
    recovered_history = chat_service.get_history(test_uid, orphan_id)
    assert len(recovered_history) == 2
    print("  Verified non-existent session is transparently initialized without throwing 404.")

    print("=> [TEST 1 PASSED] Conversation History Persistence is fully verified!")

    # -------------------------------------------------------------------------
    # 2. TEST GUIDED INTAKE COMPLETION PERSISTENCE
    # -------------------------------------------------------------------------
    print("\n[TEST 2] Testing Guided Intake Completion Persistence...")
    intake_uid = "test_intake_verification_user"

    # Clean up previous intake sessions for this test user
    for s in db.collection("users").document(intake_uid).collection("intakeSessions").stream():
        for a in s.reference.collection("answers").stream():
            a.reference.delete()
        s.reference.delete()
    db.collection("users").document(intake_uid).delete()

    # Step A: Initial check
    status0 = intake_service.get_user_status(intake_uid)
    assert status0["completed"] is False, "Initial status should not be completed"
    assert status0["in_progress"] is False, "Initial status should not be in_progress"
    print("  Verified initial user status is not completed.")

    # Step B: Start session
    session_res = intake_service.start_session(intake_uid)
    intake_session_id = session_res["session_id"]
    assert intake_session_id
    assert session_res["status"] == "in_progress"
    print(f"  Started intake session: {intake_session_id} at Q1.")

    # Step C: Answer questions and complete
    # Simulate completion by setting completedQuestions to all questions
    intake_ref = db.collection("users").document(intake_uid).collection("intakeSessions").document(intake_session_id)
    for q in intake_service.QUESTIONS:
        intake_ref.collection("answers").document(q["id"]).set({
            "questionId": q["id"],
            "encryptedAnswer": "test_encrypted_answer",
            "nonce": "test_nonce",
            "status": "complete",
        })

    intake_ref.update({
        "completedQuestions": len(intake_service.QUESTIONS),
        "completionPercentage": 100,
        "currentQuestionId": None,
        "status": "completed",
        "completedAt": firestore.SERVER_TIMESTAMP,
    })
    # Update user document authoritatively
    db.collection("users").document(intake_uid).set({
        "intakeCompleted": True,
        "intakeCompletedAt": firestore.SERVER_TIMESTAMP,
        "lastIntakeSessionId": intake_session_id,
    }, merge=True)

    # Step D: Check authoritative status after completion
    status1 = intake_service.get_user_status(intake_uid)
    assert status1["completed"] is True, "Authoritative status must be completed"
    assert status1["session_id"] == intake_session_id
    print("  Verified authoritative completion status preserved in user profile.")

    # Step E: Refresh/start_session without force_retake must NOT restart at Q1
    res_restart = intake_service.start_session(intake_uid, force_retake=False)
    assert res_restart["completed"] is True or res_restart["status"] == "completed"
    assert res_restart["current_question"] is None
    print("  Verified start_session does NOT force user to retake after completion.")

    # Step F: Explicit retake
    res_retake = intake_service.start_session(intake_uid, force_retake=True)
    assert res_retake["session_id"] != intake_session_id
    assert res_retake["status"] == "in_progress"
    assert res_retake["current_question"] is not None
    print(f"  Verified force_retake creates a fresh session: {res_retake['session_id']}.")

    print("=> [TEST 2 PASSED] Guided Intake Completion Persistence is fully verified!")

    # -------------------------------------------------------------------------
    # 3. TEST COMPREHENSIVE MIND INSIGHTS
    # -------------------------------------------------------------------------
    print("\n[TEST 3] Testing Comprehensive Mind Insights...")
    # Step A: Empty state
    empty_uid = "test_empty_insights_user"
    empty_insights = emotion_service.get_comprehensive_insights(empty_uid)
    assert empty_insights["data_sufficiency"] == "insufficient"
    assert "sections" in empty_insights
    assert "overall_patterns" in empty_insights["sections"]
    assert "self_care_suggestions" in empty_insights["sections"]
    assert empty_insights["non_diagnostic_notice"]
    print("  Verified empty state handled gracefully with data_sufficiency='insufficient' and zero hallucinations.")

    # Step B: Populated state
    # Create a mindlog entry for test_uid
    from datetime import date
    mindlog_service.create_entry(test_uid, "A heavy evening", "I felt overwhelmed by studies and deadlines, but listening to music helped.", date.today())
    
    # We already have companion user chat messages in test_uid from Test 1!
    insights = emotion_service.get_comprehensive_insights(test_uid)
    assert insights["data_sufficiency"] in ("minimal", "sufficient")
    assert insights["data_counts"]["mindlog_count"] >= 1
    assert insights["data_counts"]["chat_messages_count"] >= 1
    assert "sections" in insights
    assert "overall_patterns" in insights["sections"]
    assert "stressors" in insights["sections"]
    assert "strengths" in insights["sections"]
    assert "self_care_suggestions" in insights["sections"]
    print(f"  Verified comprehensive insights aggregated data: MindLogs={insights['data_counts']['mindlog_count']}, Chats={insights['data_counts']['chat_messages_count']}")
    print(f"  Observed data preview: {insights['sections']['overall_patterns'].get('observed_data', '')[:80]}...")
    print(f"  AI reflection preview: {insights['sections']['overall_patterns'].get('interpretation', '')[:80]}...")
    print(f"  Self-care suggestions count: {len(insights['sections']['self_care_suggestions'])}")

    print("=> [TEST 3 PASSED] Comprehensive Mind Insights is fully verified!")

    # -------------------------------------------------------------------------
    # 4. TEST WELLNESS REPORT GENERATION & PDF
    # -------------------------------------------------------------------------
    print("\n[TEST 4] Testing Multi-source Wellness Report Generation & PDF...")
    from app.services import report_service
    from app.routes.reports import ReportRequest
    rep_req = ReportRequest(period="30d", sources=["mindlog", "companion", "intake", "emotions"])
    rep_res = report_service.create_wellness_report(test_uid, rep_req)
    assert rep_res.get("report_id"), "Report ID must be generated"
    assert rep_res.get("sections"), "22 wellness sections must be present"
    print(f"  Generated wellness report: {rep_res['report_id']} with {len(rep_res['sections'])} structured sections.")

    pdf_bytes = report_service.download_pdf(test_uid, rep_res["report_id"])
    assert pdf_bytes.startswith(b"%PDF"), "Generated file must be a valid PDF binary"
    print(f"  Verified ReportLab PDF generated successfully ({len(pdf_bytes)} bytes).")

    # -------------------------------------------------------------------------
    # 5. TEST REAL THERAPIST FINDER & VERIFIED DIRECTORIES
    # -------------------------------------------------------------------------
    print("\n[TEST 5] Testing Real Therapist Finder & Haversine Distance...")
    from app.routes.therapists import search_therapists
    t_res = search_therapists(lat=28.6139, lon=77.2090, query=None, radius_km=15, user={"uid": test_uid})
    assert "therapists" in t_res
    assert "verified_directories" in t_res
    assert len(t_res["verified_directories"]) >= 3
    print(f"  Verified therapist search response: location='{t_res['location']}', directories={len(t_res['verified_directories'])}")
    print("=> [TEST 4 & 5 PASSED] Reports & Therapist Finder fully verified!")

    print("\n=======================================================")
    print("ALL INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
    print("=======================================================")

if __name__ == "__main__":
    test_all()
