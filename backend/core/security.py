import hashlib
import secrets
import os
from typing import Optional

try:
    import bcrypt
    HAS_BCRYPT = True
except ImportError:
    HAS_BCRYPT = False


def hash_password(password: str) -> str:
    if HAS_BCRYPT:
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    return hashlib.md5(password.encode()).hexdigest()


def verify_password(plain: str, stored_hash: str) -> bool:
    if not stored_hash:
        return False
    if stored_hash.startswith("$2"):
        if HAS_BCRYPT:
            return bcrypt.checkpw(plain.encode(), stored_hash.encode())
        return False
    return hashlib.md5(plain.encode()).hexdigest() == stored_hash


def create_token() -> str:
    return secrets.token_urlsafe(32)
