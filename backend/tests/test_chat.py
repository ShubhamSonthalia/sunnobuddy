from app.services.crisis_service import detect_crisis

def test_flags_crisis():
    for msg in ["I want to die", "mujhe marna chahta hu", "main jeena nahi chahti",
                "मुझे आत्महत्या के ख्याल आ रहे हैं"]:
        assert detect_crisis(msg)[0], msg

def test_normal_messages_not_flagged():
    for msg in ["I am stressed about exams", "Exam ne mera din kharab kar diya",
                "I killed it in my presentation"]:
        assert not detect_crisis(msg)[0], msg