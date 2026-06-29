import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.asset import Asset
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse
from app.dependencies.auth import get_current_user, get_current_owner, CurrentUser

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("/", response_model=list[AssetResponse], summary="List all assets for the tenant")
async def list_assets(
    current: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assets = db.query(Asset).filter(Asset.tenant_id == current.tenant_id).all()
    return assets


@router.get("/{asset_id}", response_model=AssetResponse, summary="Get a single asset")
async def get_asset(
    asset_id: str,
    current: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    asset = db.query(Asset).filter(
        Asset.id == asset_id,
        Asset.tenant_id == current.tenant_id,
    ).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return asset


@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED, summary="Create a new asset")
async def create_asset(
    body: AssetCreate,
    current: CurrentUser = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    asset = Asset(
        id=str(uuid.uuid4()),
        tenant_id=current.tenant_id,
        owner_id=current.user.id,
        **body.model_dump(),
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@router.put("/{asset_id}", response_model=AssetResponse, summary="Update an asset")
async def update_asset(
    asset_id: str,
    body: AssetUpdate,
    current: CurrentUser = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    asset = db.query(Asset).filter(
        Asset.id == asset_id,
        Asset.tenant_id == current.tenant_id,
    ).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(asset, field, value)
    db.commit()
    db.refresh(asset)
    return asset


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an asset")
async def delete_asset(
    asset_id: str,
    current: CurrentUser = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    asset = db.query(Asset).filter(
        Asset.id == asset_id,
        Asset.tenant_id == current.tenant_id,
    ).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    db.delete(asset)
    db.commit()
