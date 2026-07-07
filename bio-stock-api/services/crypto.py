"""Symmetric encryption for small secrets at rest (e.g. MFA TOTP seeds).

Uses Fernet (AES-128-CBC + HMAC, from the `cryptography` package). The key is
derived from the app's JWT signing key via SHA-256 so no extra secret needs to
be provisioned — whoever can forge a session token could already impersonate
a user, so reusing that key for this purpose adds no new exposure, while
still meaning a raw DB dump alone doesn't reveal TOTP seeds.
"""
import base64
import hashlib
from functools import lru_cache

from cryptography.fernet import Fernet

from config import get_settings


@lru_cache
def _fernet() -> Fernet:
    key_material = hashlib.sha256(get_settings().signing_key.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key_material))


def encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def decrypt(token: str) -> str:
    return _fernet().decrypt(token.encode()).decode()
