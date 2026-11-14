import os
import secrets
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(ENV_PATH)

DB_PATH = Path(os.getenv("SUNNOBUDDY_DB", BASE_DIR / "sunnobuddy.db"))
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash").strip()


def load_secret() -> str:
    """Return the master secret. Create and save one on first run.

    The old code derived the encryption key from the user's email, which is
    not secret. Here the key comes from a server-side secret instead.
    """
    secret = os.getenv("SUNNOBUDDY_SECRET", "").strip()
    if secret:
        return secret
    secret = secrets.token_hex(32)
    with open(ENV_PATH, "a", encoding="utf-8") as f:
        f.write(f"\nSUNNOBUDDY_SECRET={secret}\n")
    os.environ["SUNNOBUDDY_SECRET"] = secret
    return secret


SECRET = load_secret()
