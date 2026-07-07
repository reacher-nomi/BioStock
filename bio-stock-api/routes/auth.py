import logging
import secrets
from datetime import timedelta

import pyotp
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from config import get_settings
from database import get_db
from models.mfa import UserMFA
from models.user import User
from schemas import RefreshRequest, Token, UserLogin, UserRegister
from services.crypto import decrypt
from services.rate_limiter import enforce_rate_limit
from services.refresh_tokens import create_refresh_token, revoke_refresh_token, rotate_refresh_token
from time_utils import utcnow

settings = get_settings()
audit_log = logging.getLogger("bio-stock.audit")
SECRET_KEY = settings.signing_key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()
router = APIRouter(prefix="/auth", tags=["auth"])


def rate_limit(request: Request, db: Session = Depends(get_db)) -> None:
    """Per-IP throttle on auth endpoints, backed by the DB so it survives
    restarts and stays correct across multiple worker processes."""
    ip = request.client.host if request.client else "unknown"
    if not enforce_rate_limit(ip, db):
        raise HTTPException(status_code=429, detail="Too many attempts. Try again in a minute.")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    # jti guarantees each issued token is unique even if minted in the same
    # second as another (e.g. back-to-back register + refresh calls).
    to_encode.update({"exp": expire, "jti": secrets.token_hex(8)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def _issue_tokens(user_id: int, db: Session) -> dict:
    return {
        "access_token": create_access_token({"sub": str(user_id)}),
        "refresh_token": create_refresh_token(user_id, db),
        "token_type": "bearer",
    }


@router.post("/register", response_model=Token)
def register(user: UserRegister, _: None = Depends(rate_limit), db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(user.password)
    new_user = User(email=user.email, password_hash=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return _issue_tokens(new_user.id, db)


@router.post("/login", response_model=Token)
def login(user: UserLogin, _: None = Depends(rate_limit), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        # Audit security event without logging the password or which factor failed.
        audit_log.warning(f"login_failed user={user.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Second factor: if MFA is enabled, a valid TOTP code is required.
    mfa = db.query(UserMFA).filter(UserMFA.user_id == db_user.id, UserMFA.enabled.is_(True)).first()
    if mfa:
        if not user.otp_code or not pyotp.TOTP(decrypt(mfa.secret)).verify(user.otp_code, valid_window=1):
            audit_log.warning(f"login_mfa_failed user_id={db_user.id}")
            raise HTTPException(status_code=401, detail="Invalid or missing MFA code")

    audit_log.info(f"login_success user_id={db_user.id}")
    return _issue_tokens(db_user.id, db)


@router.post("/refresh", response_model=Token)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    """Exchange a refresh token for a new access token. Rotates the refresh
    token on every use (old one is revoked, a new one is returned)."""
    result = rotate_refresh_token(body.refresh_token, db)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    user_id, new_refresh_token = result
    return {
        "access_token": create_access_token({"sub": str(user_id)}),
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }


@router.post("/logout")
def logout(body: RefreshRequest, db: Session = Depends(get_db)):
    """Revoke a refresh token server-side. The client discards its local tokens."""
    revoke_refresh_token(body.refresh_token, db)
    return {"ok": True}


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> int:
    # Accept any currently-valid signing key (supports zero-downtime key rotation).
    for key in settings.verification_keys:
        try:
            payload = jwt.decode(credentials.credentials, key, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if user_id is None:
                break
            return int(user_id)
        except JWTError:
            continue
    raise HTTPException(status_code=401, detail="Invalid token")
