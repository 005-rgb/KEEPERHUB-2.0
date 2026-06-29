import uuid
from sqlalchemy import String, Enum, ForeignKey, Date, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum
import decimal


class AssetCategory(str, enum.Enum):
    PROPERTY = "PROPERTY"
    VEHICLE = "VEHICLE"
    ELECTRONIC = "ELECTRONIC"
    LUXURY_GOODS = "LUXURY_GOODS"


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String, ForeignKey("tenants.id"), nullable=False)
    owner_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    asset_name: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[AssetCategory] = mapped_column(Enum(AssetCategory), nullable=False)
    purchase_date: Mapped[object] = mapped_column(Date, nullable=False)
    purchase_price: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    warranty_end_date: Mapped[object | None] = mapped_column(Date, nullable=True)
    total_maintenance_cost: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), default=decimal.Decimal("0.00"), nullable=False)
    taxation_deadline: Mapped[object | None] = mapped_column(Date, nullable=True)

    tenant = relationship("Tenant", back_populates="assets")
    owner = relationship("User", back_populates="assets", foreign_keys=[owner_id])
    maintenance_tasks = relationship("MaintenanceTask", back_populates="asset", cascade="all, delete-orphan")
