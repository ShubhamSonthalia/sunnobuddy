import os
import sqlite3
import tempfile

# Use a throwaway database and key, and no Gemini key, so tests run offline.
_tmp = tempfile.mkdtemp()
os.environ["SUNNOBUDDY_DB"] = os.path.join(_tmp, "test.db")
os.environ["SUNNOBUDDY_SECRET"] = "test-secret"
os.environ["GEMINI_API_KEY"] = ""

import pytest
from fastapi.testclient import TestClient

from app import crypto, mindlog
from app.main import app
from app.safety import is_crisis

client = TestClient(app)


def new_user():
    s = client.post("/api/session/anonymous").json()
    return s["user_id"], {"Authorization": "Bearer " + s["token"]}


def test_crypto_round_trip_and_user_binding():
    token = crypto.encrypt("hello", "secret", "anon_a")
    assert "hello" not in token
    assert crypto.decrypt(token, "secret", "anon_a") == "hello"
    with pytest.raises(Exception):
        crypto.decrypt(token, "secret", "anon_b")
    with pytest.raises(Exception):
        crypto.decrypt(token, "other-secret", "anon_a")


def test_anonymous_session_and_auth():
    uid, headers = new_user()
    assert uid.startswith("anon_")
    assert client.get("/api/chat/history", headers=headers).status_code == 200
    assert client.get("/api/chat/history").status_code == 401
    bad = {"Authorization": "Bearer " + uid + ".wrongsignature"}
    assert client.get("/api/chat/history", headers=bad).status_code == 401


def test_chat_demo_mode_and_history():
    _, h = new_user()
    r = client.post("/api/chat", json={"message": "I feel stressed about exams"}, headers=h).json()
    assert r["mode"] == "demo" and r["reply"]
    msgs = client.get("/api/chat/history", headers=h).json()["messages"]
    assert [m["role"] for m in msgs] == ["user", "assistant"]


def test_chat_crisis_skips_model():
    _, h = new_user()
    r = client.post("/api/chat", json={"message": "I want to die"}, headers=h).json()
    assert r["crisis"] is True and "14416" in r["reply"]


def test_chat_data_is_encrypted_in_db():
    uid, h = new_user()
    client.post("/api/chat", json={"message": "secretphrase123"}, headers=h)
    con = sqlite3.connect(os.environ["SUNNOBUDDY_DB"])
    rows = con.execute("SELECT content_enc FROM chat_messages WHERE user_id=?", (uid,)).fetchall()
    assert rows and all("secretphrase123" not in r[0] for r in rows)


def test_intake_flow_followup_then_advance():
    _, h = new_user()
    first = client.get("/api/intake", headers=h).json()
    assert first["answered"] == 0 and first["total"] == 26
    # very short answer gets one follow-up and does not advance
    r = client.post("/api/intake/answer", json={"answer": "Ok"}, headers=h).json()
    assert r["follow_up"] and r["answered"] == 0
    # answering the follow-up advances
    r = client.post("/api/intake/answer", json={"answer": "Aman, 21, third year student"}, headers=h).json()
    assert r["answered"] == 1 and "follow_up" not in r
    # skip works
    r = client.post("/api/intake/answer", json={"answer": "I would rather skip this"}, headers=h).json()
    assert r["answered"] == 2


def test_intake_crisis_does_not_advance():
    _, h = new_user()
    r = client.post("/api/intake/answer", json={"answer": "I want to kill myself"}, headers=h).json()
    assert r["crisis"] is True and r["answered"] == 0


def test_mindlog_encrypted_and_emotion():
    uid, h = new_user()
    text = "I am so worried and anxious about my results, I feel scared"
    r = client.post("/api/mindlog", json={"title": "Result day", "content": text}, headers=h).json()
    assert r["saved"] and r["emotion"] == "fear"
    listed = client.get("/api/mindlog", headers=h).json()
    assert listed["entries"][0]["content"] == text
    assert listed["emotion_counts"]["fear"] == 1
    con = sqlite3.connect(os.environ["SUNNOBUDDY_DB"])
    stored = con.execute("SELECT payload_enc FROM journal_entries WHERE user_id=?", (uid,)).fetchone()[0]
    assert "worried" not in stored and "Result day" not in stored


def test_mindlog_isolated_between_users():
    _, h1 = new_user()
    _, h2 = new_user()
    client.post("/api/mindlog", json={"title": "mine", "content": "happy day"}, headers=h1)
    assert client.get("/api/mindlog", headers=h2).json()["entries"] == []


def test_wordlist_neutral_and_crisis_detector():
    assert mindlog.analyze("Went to college, had lunch.")["emotion"] == "neutral"
    assert is_crisis("Sometimes I feel suicidal") and not is_crisis("I am dying to see the match")


def test_gemini_rest_call_and_error_fallback(monkeypatch):
    from app import llm, persona

    class Resp:
        def __init__(self, code, data):
            self.status_code, self._d, self.text = code, data, str(data)

        def json(self):
            return self._d

    monkeypatch.setattr(llm, "GEMINI_API_KEY", "fake")
    sent = {}

    def ok(url, headers, json, timeout):
        sent["url"], sent["key"] = url, headers["x-goog-api-key"]
        return Resp(200, {"candidates": [{"content": {"parts": [{"text": "Hello from Gemini"}]}}]})

    monkeypatch.setattr(llm.httpx, "post", ok)
    r = persona.reply([], "hi there")
    assert r["mode"] == "gemini" and r["reply"] == "Hello from Gemini"
    assert sent["key"] == "fake" and sent["url"].endswith(":generateContent")

    def bad(url, headers, json, timeout):
        return Resp(404, {"error": {"message": "model not found"}})

    monkeypatch.setattr(llm.httpx, "post", bad)
    r = persona.reply([], "hi there")
    assert r["mode"] == "demo" and "404" in llm.last_error
