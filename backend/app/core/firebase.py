import os
import firebase_admin
from firebase_admin import credentials, firestore
from app.core.config import settings

if not firebase_admin._apps:
    cred_path = (settings.google_application_credentials or "").strip()
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, {"projectId": settings.firebase_project_id})
    else:
        try:
            firebase_admin.initialize_app(options={"projectId": settings.firebase_project_id})  # deployed: Application Default Credentials
        except Exception as e:
            print("Firebase initialization fallback note:", e)

from app.core.local_db import get_local_db

def get_db():
    try:
        return firestore.client()
    except Exception:
        return get_local_db()

