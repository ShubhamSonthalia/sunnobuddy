import firebase_admin
from firebase_admin import credentials, firestore
from app.core.config import settings

if not firebase_admin._apps:
    if settings.google_application_credentials:
        cred = credentials.Certificate(settings.google_application_credentials)
        firebase_admin.initialize_app(cred, {"projectId": settings.firebase_project_id})
    else:
        firebase_admin.initialize_app(options={"projectId": settings.firebase_project_id})  # deployed: Application Default Credentials

def get_db():
    return firestore.client()