import uuid
from sqlalchemy import String, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    OWNER = "OWNER"
    STAFF = "STAFF"


class Language(str, enum.Enum):
    ID = "ID"
    EN = "EN"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String, ForeignKey("tenants.id"), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(20), nullable=False)
    owner_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    preferred_language: Mapped[Language] = mapped_column(Enum(Language), default=Language.ID, nullable=False)

    tenant = relationship("Tenant", back_populates="users")
    staff_members = relationship("User", backref="owner", foreign_keys=[owner_id])
    assets = relationship("Asset", back_populates="owner", foreign_keys="Asset.owner_id")
    maintenance_tasks = relationship("MaintenanceTask", back_populates="staff", foreign_keys="MaintenanceTask.staff_id")
