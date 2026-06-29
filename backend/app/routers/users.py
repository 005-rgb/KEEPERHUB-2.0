import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse, MagicLinkCreate
from app.schemas.auth import MagicLinkResponse
from app.dependencies.auth import get_current_owner, CurrentUser, create_magic_link_token

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/staff", response_model=list[UserResponse], summary="List all staff for the owner's tenant")
async def list_staff(
    current: CurrentUser = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    staff = db.query(User).filter(
        User.tenant_id == current.tenant_id,
        User.role == UserRole.STAFF,
    ).all()
    return staff


@router.post("/staff", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Add new staff member")
async def create_staff(
    body: UserCreate,
    current: CurrentUser = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(
        User.phone_number == body.phone_number,
        User.tenant_id == current.tenant_id,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Staff with this phone number already exists")

    staff = User(
        id=str(uuid.uuid4()),
        tenant_id=current.tenant_id,
        role=UserRole.STAFF,
        full_name=body.full_name,
        phone_number=body.phone_number,
        owner_id=current.user.id,
        preferred_language=body.preferred_language,
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff


@router.delete("/staff/{staff_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Remove a staff member")
async def delete_staff(
    staff_id: str,
    current: CurrentUser = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    staff = db.query(User).filter(
        User.id == staff_id,
        User.tenant_id == current.tenant_id,
        User.role == UserRole.STAFF,
    ).first()
    if not staff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found")
    db.delete(staff)
    db.commit()


@router.post("/staff/magic-link", response_model=MagicLinkResponse, summary="Generate magic link for staff upload access")
async def generate_magic_link(
    body: MagicLinkCreate,
    current: CurrentUser = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    staff = db.query(User).filter(
        User.id == body.staff_id,
        User.tenant_id == current.tenant_id,
        User.role == UserRole.STAFF,
    ).first()
    if not staff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found")

    token = create_magic_link_token(staff.id, current.tenant_id)
    return MagicLinkResponse(magic_link_token=token, staff_id=staff.id)
