from datetime import date
from typing import Optional
from fastapi import HTTPException
from firebase_admin import firestore
from app.core.firebase import get_db
from app.services.encryption_service import encrypt, decrypt


def _col(uid: str):
    return get_db().collection("users").document(uid).collection("mindlogEntries")


def _iso(ts):
    return ts.isoformat() if ts else None


def _to_entry(doc, uid: str) -> dict:
    d = doc.to_dict()
    return {
        "entry_id": doc.id,
        "title": decrypt(d["encryptedTitle"], d["titleNonce"], uid),
        "content": decrypt(d["encryptedContent"], d["contentNonce"], uid),
        "entry_date": d["entryDate"],
        "created_at": _iso(d.get("createdAt")),
        "updated_at": _iso(d.get("updatedAt")),
        "analysis_status": d.get("analysisStatus", "pending"),
    }


def _get_doc_or_404(uid: str, entry_id: str):
    doc = _col(uid).document(entry_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Entry not found")
    return doc


def create_entry(uid: str, title: str, content: str, entry_date: date) -> dict:
    t = encrypt(title, uid)
    c = encrypt(content, uid)
    ref = _col(uid).document()
    ref.set({
        "entryId": ref.id,
        "encryptedTitle": t["ciphertext"],
        "titleNonce": t["nonce"],
        "encryptedContent": c["ciphertext"],
        "contentNonce": c["nonce"],
        "entryDate": entry_date.isoformat(),
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
        "analysisStatus": "pending",
    })
    return {"entry_id": ref.id, "analysis_status": "pending"}


def list_entries(uid: str, start: Optional[date], end: Optional[date]) -> list:
    q = _col(uid)
    if start:
        q = q.where("entryDate", ">=", start.isoformat())
    if end:
        q = q.where("entryDate", "<=", end.isoformat())
    q = q.order_by("entryDate", direction=firestore.Query.DESCENDING)
    return [_to_entry(doc, uid) for doc in q.stream()]


def get_entry(uid: str, entry_id: str) -> dict:
    return _to_entry(_get_doc_or_404(uid, entry_id), uid)


def update_entry(uid: str, entry_id: str, title, content, entry_date) -> dict:
    _get_doc_or_404(uid, entry_id)
    updates = {"updatedAt": firestore.SERVER_TIMESTAMP}
    if title is not None:
        t = encrypt(title, uid)
        updates["encryptedTitle"], updates["titleNonce"] = t["ciphertext"], t["nonce"]
    if content is not None:
        c = encrypt(content, uid)
        updates["encryptedContent"], updates["contentNonce"] = c["ciphertext"], c["nonce"]
        updates["analysisStatus"] = "pending"  # content badla, analysis dobara hoga
    if entry_date is not None:
        updates["entryDate"] = entry_date.isoformat()
    _col(uid).document(entry_id).update(updates)
    return get_entry(uid, entry_id)


def delete_entry(uid: str, entry_id: str) -> None:
    _get_doc_or_404(uid, entry_id)
    _col(uid).document(entry_id).delete()
    get_db().collection("users").document(uid).collection("emotionAnalyses").document(entry_id).delete()


def calendar_dates(uid: str) -> list:
    docs = _col(uid).select(["entryDate"]).stream()  # content decrypt nahi hota
    return sorted({d.to_dict()["entryDate"] for d in docs})