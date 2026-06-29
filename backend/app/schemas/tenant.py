from pydantic import BaseModel


class TenantCreate(BaseModel):
    company_name: str


class TenantResponse(BaseModel):
    id: str
    company_name: str
    is_active: bool

    model_config = {"from_attributes": True}
