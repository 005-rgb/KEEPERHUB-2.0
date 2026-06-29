from pydantic import BaseModel
from typing import Optional
from app.models.user import UserRole, Language


class UserCreate(BaseModel):
    full_name: str
    phone_number: str
    preferred_language: Language = Language.ID


class UserResponse(BaseModel):
    id: str
    tenant_id: str
    role: UserRole
    full_name: str
    phone_number: str
    owner_id: Optional[str] = None
    preferred_language: Language

    model_config = {"from_attributes": True}


class MagicLinkCreate(BaseModel):
    staff_id: str
