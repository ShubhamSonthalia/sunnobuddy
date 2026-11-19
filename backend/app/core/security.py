from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth

bearer = HTTPBearer()

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        decoded = auth.verify_id_token(creds.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return {
        "uid": decoded["uid"],
        "email": decoded.get("email"),
        "display_name": decoded.get("name", "User"),
        "is_anonymous": decoded.get("firebase", {}).get("sign_in_provider") == "anonymous",
    }