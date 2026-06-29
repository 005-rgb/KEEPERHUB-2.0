from pydantic import BaseModel
from app.models.subscription import PlanType


class SubscriptionResponse(BaseModel):
    id: str
    tenant_id: str
    plan_type: PlanType
    is_active: bool

    model_config = {"from_attributes": True}


class SubscriptionUpdate(BaseModel):
    plan_type: PlanType
