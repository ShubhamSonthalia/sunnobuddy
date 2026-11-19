import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings


def _key() -> bytes:
    key = base64.urlsafe_b64decode(settings.encryption_master_key)
    if len(key) != 32:
        raise RuntimeError("ENCRYPTION_MASTER_KEY must decode to 32 bytes")
    return key


def encrypt(plaintext: str, uid: str) -> dict:
    nonce = os.urandom(12)  # har encryption ke liye naya nonce
    ct = AESGCM(_key()).encrypt(nonce, plaintext.encode("utf-8"), uid.encode())
    return {
        "ciphertext": base64.b64encode(ct).decode(),
        "nonce": base64.b64encode(nonce).decode(),
    }


def decrypt(ciphertext: str, nonce: str, uid: str) -> str:
    pt = AESGCM(_key()).decrypt(
        base64.b64decode(nonce), base64.b64decode(ciphertext), uid.encode()
    )
    return pt.decode("utf-8")