import random
import string
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import OTPRequest, OTPVerify, TokenResponse
from app.config import settings
from jose import jwt

router = APIRouter(prefix="/auth", tags=["auth"])

_otp_store: dict[str, str] = {}


def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def _create_access_token(user_id: str, tenant_id: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": user_id, "tenant_id": tenant_id, "role": role, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


@router.post("/request-otp", summary="Request OTP for Owner login")
async def request_otp(body: OTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.phone_number == body.phone_number,
        User.role == UserRole.OWNER,
    ).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner not found with this phone number")

    otp = _generate_otp()
    _otp_store[body.phone_number] = otp
    return {
        "message": "OTP sent (mock). Check server logs for dev OTP.",
        "dev_otp": otp,
    }


@router.post("/verify-otp", response_model=TokenResponse, summary="Verify OTP and get JWT token")
async def verify_otp(body: OTPVerify, db: Session = Depends(get_db)):
    stored_otp = _otp_store.get(body.phone_number)
    if not stored_otp or stored_otp != body.otp_code:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired OTP")

    user = db.query(User).filter(
        User.phone_number == body.phone_number,
        User.role == UserRole.OWNER,
    ).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner not found")

    if not user.tenant.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant account is inactive")

    del _otp_store[body.phone_number]
    token = _create_access_token(user.id, user.tenant_id, user.role.value)
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        tenant_id=user.tenant_id,
        role=user.role.value,
        preferred_language=user.preferred_language.value,
    )
