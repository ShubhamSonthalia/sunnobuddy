"""Anonymous sessions.

No email, no password, no personal details. The server hands out a random
id and a signed token. The token is how later requests prove which
anonymous user they belong to.
"""
import hashlib
import hmac
import secrets

from fastapi import Header, HTTPException

from .config import SECRET
from .db import connect


def _sign(user_id: str) -> str:
    return hmac.new(SECRET.encode(), user_id.encode(), hashlib.sha256).hexdigest()[:32]


def create_anonymous_user() -> dict:
    user_id = "anon_" + secrets.token_hex(6)
    with connect() as con:
        con.execute("INSERT INTO users (id) VALUES (?)", (user_id,))
    return {"user_id": user_id, "token": f"{user_id}.{_sign(user_id)}"}


def current_user(authorization: str = Header(default="")) -> str:
    token = authorization.removeprefix("Bearer ").strip()
    user_id, _, sig = token.partition(".")
    if not user_id or not hmac.compare_digest(sig, _sign(user_id)):
        raise HTTPException(status_code=401, detail="Please start a session first.")
    with connect() as con:
        row = con.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Unknown session.")
    return user_id
