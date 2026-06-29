import uuid
import decimal
from sqlalchemy import String, Enum, ForeignKey, Date, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum as py_enum


class TaskStatus(str, py_enum.Enum):
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    WAITING_APPROVAL = "WAITING_APPROVAL"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"


class MaintenanceTask(Base):
    __tablename__ = "maintenance_tasks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String, ForeignKey("tenants.id"), nullable=False)
    asset_id: Mapped[str] = mapped_column(String, ForeignKey("assets.id"), nullable=False)
    staff_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.ASSIGNED, nullable=False)
    task_description: Mapped[str] = mapped_column(Text, nullable=False)
    due_date: Mapped[object] = mapped_column(Date, nullable=False)
    submitted_cost: Mapped[decimal.Decimal] = mapped_column(Numeric(15, 2), default=decimal.Decimal("0.00"), nullable=False)
    proof_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    vendor_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    tenant = relationship("Tenant", back_populates="maintenance_tasks")
    asset = relationship("Asset", back_populates="maintenance_tasks")
    staff = relationship("User", back_populates="maintenance_tasks", foreign_keys=[staff_id])
