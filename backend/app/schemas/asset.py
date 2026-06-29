from pydantic import BaseModel
from typing import Optional
from datetime import date
from decimal import Decimal
from app.models.asset import AssetCategory


class AssetCreate(BaseModel):
    asset_name: str
    category: AssetCategory
    purchase_date: date
    purchase_price: Decimal
    warranty_end_date: Optional[date] = None
    taxation_deadline: Optional[date] = None


class AssetUpdate(BaseModel):
    asset_name: Optional[str] = None
    category: Optional[AssetCategory] = None
    purchase_date: Optional[date] = None
    purchase_price: Optional[Decimal] = None
    warranty_end_date: Optional[date] = None
    taxation_deadline: Optional[date] = None


class AssetResponse(BaseModel):
    id: str
    tenant_id: str
    owner_id: str
    asset_name: str
    category: AssetCategory
    purchase_date: date
    purchase_price: Decimal
    warranty_end_date: Optional[date] = None
    total_maintenance_cost: Decimal
    taxation_deadline: Optional[date] = None

    model_config = {"from_attributes": True}
