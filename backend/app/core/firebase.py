import os
from pathlib import Path
import firebase_admin
from firebase_admin import credentials, firestore
from app.core.config import settings

def _resolve_service_account():
    # 1. Configured path
    raw = (settings.google_application_credentials or "").strip()
    if raw:
        p1 = Path(raw)
        if p1.is_file():
            return str(p1.resolve())
        # Try relative to backend dir
        backend_dir = Path(__file__).resolve().parent.parent.parent
        p2 = backend_dir / raw
        if p2.is_file():
            return str(p2.resolve())
    
    # 2. Check standard backend/firebase-service-account.json
    backend_dir = Path(__file__).resolve().parent.parent.parent
    std_path = backend_dir / "firebase-service-account.json"
    if std_path.is_file():
        return str(std_path.resolve())
    
    return None

if not firebase_admin._apps:
    resolved_cred = _resolve_service_account()
    if resolved_cred:
        cred = credentials.Certificate(resolved_cred)
        firebase_admin.initialize_app(cred, {"projectId": settings.firebase_project_id})
        print(f"[Firebase] Initialized with service account: {resolved_cred}")
    else:
        try:
            firebase_admin.initialize_app(options={"projectId": settings.firebase_project_id})
            print("[Firebase] Initialized with Application Default Credentials")
        except Exception as e:
            print("[Firebase] Initialization fallback note:", e)

from app.core.local_db import get_local_db

def get_db():
    try:
        return firestore.client()
    except Exception as e:
        print("[Firebase] firestore.client() failed, falling back to local_db:", e)
        return get_local_db()


