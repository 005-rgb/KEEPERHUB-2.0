from pydantic import BaseModel


class OTPRequest(BaseModel):
    phone_number: str


class OTPVerify(BaseModel):
    phone_number: str
    otp_code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    tenant_id: str
    role: str
    preferred_language: str


class MagicLinkResponse(BaseModel):
    magic_link_token: str
    staff_id: str
