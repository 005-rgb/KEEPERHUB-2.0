from fastapi import Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.config import settings
from jose import JWTError, jwt
from cryptography.fernet import Fernet, InvalidToken
import base64
import json

bearer_scheme = HTTPBearer(auto_error=False)


def _fernet() -> Fernet:
    key = base64.urlsafe_b64encode(settings.magic_link_secret[:32].ljust(32).encode())
    return Fernet(key)


def create_magic_link_token(staff_id: str, tenant_id: str) -> str:
    payload = json.dumps({"staff_id": staff_id, "tenant_id": tenant_id})
    return _fernet().encrypt(payload.encode()).decode()


def decode_magic_link_token(token: str) -> dict:
    try:
        payload = _fernet().decrypt(token.encode())
        return json.loads(payload)
    except (InvalidToken, Exception):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid magic link token")


class CurrentUser:
    def __init__(self, user: User, tenant_id: str):
        self.user = user
        self.tenant_id = tenant_id


async def get_current_owner(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> CurrentUser:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        tenant_id: str = payload.get("tenant_id")
        role: str = payload.get("role")
        if not user_id or not tenant_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id, User.tenant_id == tenant_id).first()
    if not user or not user.tenant.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    if user.role != UserRole.OWNER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner access required")
    return CurrentUser(user=user, tenant_id=tenant_id)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> CurrentUser:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        tenant_id: str = payload.get("tenant_id")
        if not user_id or not tenant_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id, User.tenant_id == tenant_id).first()
    if not user or not user.tenant.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return CurrentUser(user=user, tenant_id=tenant_id)


async def get_staff_from_magic_link(
    token: str = Query(..., alias="token"),
    db: Session = Depends(get_db),
) -> CurrentUser:
    data = decode_magic_link_token(token)
    staff_id = data.get("staff_id")
    tenant_id = data.get("tenant_id")
    if not staff_id or not tenant_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid magic link")

    user = db.query(User).filter(User.id == staff_id, User.tenant_id == tenant_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Staff not found")
    if user.role != UserRole.STAFF:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff access required")
    return CurrentUser(user=user, tenant_id=tenant_id)
