"""Encryption helpers.

Refactored from backend/persona_server/encryption.py. Same idea (AES-GCM),
but the key now comes from a server-side secret and a per-user derivation
step, not from the user's email address.
"""
import base64
import secrets

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

PREFIX = "v1:"


def user_key(master_secret: str, user_id: str) -> bytes:
    """Derive a 32 byte key for one user from the master secret."""
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=f"sunnobuddy-user-key:{user_id}".encode(),
    )
    return hkdf.derive(master_secret.encode())


def encrypt(text: str, master_secret: str, user_id: str) -> str:
    if text is None:
        raise ValueError("nothing to encrypt")
    key = user_key(master_secret, user_id)
    nonce = secrets.token_bytes(12)
    # The user id is bound to the ciphertext, so one user's data cannot be
    # copied into another user's row and still decrypt.
    box = AESGCM(key).encrypt(nonce, text.encode("utf-8"), user_id.encode())
    return PREFIX + base64.b64encode(nonce + box).decode()


def decrypt(token: str, master_secret: str, user_id: str) -> str:
    if not token.startswith(PREFIX):
        raise ValueError("unknown format")
    raw = base64.b64decode(token[len(PREFIX):])
    nonce, box = raw[:12], raw[12:]
    key = user_key(master_secret, user_id)
    return AESGCM(key).decrypt(nonce, box, user_id.encode()).decode("utf-8")
