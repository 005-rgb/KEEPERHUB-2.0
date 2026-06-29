from pydantic import BaseModel
from typing import Optional
from datetime import date
from decimal import Decimal
from app.models.maintenance_task import TaskStatus


class MaintenanceTaskCreate(BaseModel):
    asset_id: str
    staff_id: str
    task_description: str
    due_date: date


class MaintenanceTaskUpdate(BaseModel):
    status: Optional[TaskStatus] = None
    submitted_cost: Optional[Decimal] = None
    proof_image_url: Optional[str] = None
    vendor_name: Optional[str] = None


class MaintenanceTaskResponse(BaseModel):
    id: str
    tenant_id: str
    asset_id: str
    staff_id: str
    status: TaskStatus
    task_description: str
    due_date: date
    submitted_cost: Decimal
    proof_image_url: Optional[str] = None
    vendor_name: Optional[str] = None

    model_config = {"from_attributes": True}
