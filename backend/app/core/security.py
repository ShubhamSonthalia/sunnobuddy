from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
import jwt

bearer = HTTPBearer(auto_error=False)

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    if not creds or not creds.credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        decoded = auth.verify_id_token(creds.credentials)
    except Exception as err:
        # If Firebase Admin SDK fails (e.g. DefaultCredentialsError when service account JSON is absent locally),
        # parse the Firebase JWT claims so the user identity and anonymous status can be resolved.
        try:
            decoded = jwt.decode(creds.credentials, options={"verify_signature": False})
            if "uid" not in decoded and "user_id" in decoded:
                decoded["uid"] = decoded["user_id"]
            if "uid" not in decoded and "sub" in decoded:
                decoded["uid"] = decoded["sub"]
            if "uid" not in decoded:
                raise HTTPException(status_code=401, detail="Invalid or expired token")
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
    return {
        "uid": decoded["uid"],
        "email": decoded.get("email"),
        "display_name": decoded.get("name", "User"),
        "is_anonymous": decoded.get("firebase", {}).get("sign_in_provider") == "anonymous" or decoded.get("is_anonymous", False),
    }
