import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.subscription import Subscription
from app.schemas.subscription import SubscriptionResponse, SubscriptionUpdate
from app.dependencies.auth import get_current_owner, CurrentUser

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("/me", response_model=SubscriptionResponse, summary="Get tenant subscription info")
async def get_subscription(
    current: CurrentUser = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    sub = db.query(Subscription).filter(Subscription.tenant_id == current.tenant_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
    return sub


@router.patch("/me", response_model=SubscriptionResponse, summary="Update subscription plan")
async def update_subscription(
    body: SubscriptionUpdate,
    current: CurrentUser = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    sub = db.query(Subscription).filter(Subscription.tenant_id == current.tenant_id).first()
    if not sub:
        sub = Subscription(
            id=str(uuid.uuid4()),
            tenant_id=current.tenant_id,
            plan_type=body.plan_type,
        )
        db.add(sub)
    else:
        sub.plan_type = body.plan_type
    db.commit()
    db.refresh(sub)
    return sub
