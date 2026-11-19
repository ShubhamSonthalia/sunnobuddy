from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.utils.response_utils import ok
from app.core.firebase import get_db
from firebase_admin import firestore

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.get("/me")
def me(user=Depends(get_current_user)):
    return ok(user)

@router.get("/db-test")
def db_test(user=Depends(get_current_user)):
    db = get_db()
    ref = db.collection("users").document(user["uid"])
    ref.set({"lastLoginAt": firestore.SERVER_TIMESTAMP}, merge=True)
    return ok({"uid": user["uid"], "database": "connected"})