"""Multi-factor authentication (TOTP) enrollment and verification.

A user enrolls (setup), scans the otpauth URI into an authenticator app, then
confirms a code to enable MFA. Once enabled, login requires a valid TOTP code.
"""
import logging

import pyotp
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.mfa import UserMFA
from models.user import User
from routes.auth import verify_token
from schemas import MFAVerify

router = APIRouter(prefix="/auth/mfa", tags=["mfa"])
audit_log = logging.getLogger("bio-stock.audit")


@router.get("/status")
def mfa_status(db: Session = Depends(get_db), user_id: int = Depends(verify_token)):
    rec = db.query(UserMFA).filter(UserMFA.user_id == user_id).first()
    return {"enabled": bool(rec and rec.enabled)}


@router.post("/setup")
def mfa_setup(db: Session = Depends(get_db), user_id: int = Depends(verify_token)):
    user = db.query(User).filter(User.id == user_id).first()
    rec = db.query(UserMFA).filter(UserMFA.user_id == user_id).first()
    secret = pyotp.random_base32()
    if rec:
        rec.secret = secret
        rec.enabled = False
    else:
        rec = UserMFA(user_id=user_id, secret=secret, enabled=False)
        db.add(rec)
    db.commit()

    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=user.email, issuer_name="Bio-Stock")
    return {"secret": secret, "otpauth_uri": uri}


@router.post("/verify")
def mfa_verify(body: MFAVerify, db: Session = Depends(get_db), user_id: int = Depends(verify_token)):
    rec = db.query(UserMFA).filter(UserMFA.user_id == user_id).first()
    if not rec:
        raise HTTPException(status_code=400, detail="MFA not set up")
    if not pyotp.TOTP(rec.secret).verify(body.code, valid_window=1):
        audit_log.warning(f"mfa_verify_failed user_id={user_id}")
        raise HTTPException(status_code=401, detail="Invalid code")
    rec.enabled = True
    db.commit()
    audit_log.info(f"mfa_enabled user_id={user_id}")
    return {"enabled": True}
