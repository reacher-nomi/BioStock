import logging
import time
from collections import defaultdict
from datetime import datetime, timedelta

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
from schemas import Token, UserLogin, UserRegister

settings = get_settings()
audit_log = logging.getLogger("bio-stock.audit")
SECRET_KEY = settings.signing_key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()
router = APIRouter(prefix="/auth", tags=["auth"])

# --- Simple in-memory rate limiter (per-IP) to slow credential brute-forcing. ---
_RATE_LIMIT_MAX = 5          # attempts
_RATE_LIMIT_WINDOW = 60.0    # seconds
_attempts: dict[str, list[float]] = defaultdict(list)


def rate_limit(request: Request) -> None:
    ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    recent = [t for t in _attempts[ip] if now - t < _RATE_LIMIT_WINDOW]
    if len(recent) >= _RATE_LIMIT_MAX:
        raise HTTPException(status_code=429, detail="Too many attempts. Try again in a minute.")
    recent.append(now)
    _attempts[ip] = recent


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


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

    access_token = create_access_token({"sub": str(new_user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


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
        if not user.otp_code or not pyotp.TOTP(mfa.secret).verify(user.otp_code, valid_window=1):
            audit_log.warning(f"login_mfa_failed user_id={db_user.id}")
            raise HTTPException(status_code=401, detail="Invalid or missing MFA code")

    access_token = create_access_token({"sub": str(db_user.id)})
    audit_log.info(f"login_success user_id={db_user.id}")
    return {"access_token": access_token, "token_type": "bearer"}


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
