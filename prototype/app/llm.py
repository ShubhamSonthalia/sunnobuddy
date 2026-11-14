"""Thin wrapper around the Gemini REST API.

The old code used Vertex AI with a hard-coded credential file and project
id. This calls the public Gemini API with a plain key from the environment.
It uses httpx directly (no Google SDK), so there are no SDK version problems.
If there is no key, or a call fails, the callers fall back to a simple demo
behaviour so the app never crashes in front of someone. The last error is
kept in last_error so it can be shown on the page.
"""
import json
import logging

import httpx

from .config import GEMINI_API_KEY, GEMINI_MODEL

log = logging.getLogger("sunnobuddy.llm")

MODEL = GEMINI_MODEL.removeprefix("models/")
URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
last_error: str | None = None


def available() -> bool:
    return bool(GEMINI_API_KEY)


def generate(system: str, contents: list[dict], temperature: float = 0.7, json_out: bool = False) -> str:
    """contents is a list of {"role": "user"|"model", "text": "..."}"""
    global last_error
    body = {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": [{"role": c["role"], "parts": [{"text": c["text"]}]} for c in contents],
        "generationConfig": {"temperature": temperature, "maxOutputTokens": 2048},
    }
    if json_out:
        body["generationConfig"]["responseMimeType"] = "application/json"

    try:
        resp = httpx.post(
            URL.format(model=MODEL),
            headers={"x-goog-api-key": GEMINI_API_KEY},
            json=body,
            timeout=30,
        )
        if resp.status_code != 200:
            try:
                msg = resp.json()["error"]["message"]
            except Exception:
                msg = resp.text[:200]
            raise RuntimeError(f"HTTP {resp.status_code}: {msg}")
        parts = resp.json()["candidates"][0]["content"]["parts"]
        text = "".join(p.get("text", "") for p in parts).strip()
        if not text:
            raise RuntimeError("Gemini returned an empty reply")
        last_error = None
        return text
    except Exception as exc:
        last_error = str(exc)[:300]
        raise


def generate_json(system: str, prompt: str) -> dict | None:
    try:
        text = generate(system, [{"role": "user", "text": prompt}], temperature=0.0, json_out=True)
        return json.loads(text)
    except Exception as exc:
        log.warning("Gemini JSON call failed: %s", exc)
        return None
