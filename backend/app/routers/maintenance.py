import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.maintenance_task import MaintenanceTask, TaskStatus
from app.models.asset import Asset
from app.schemas.maintenance_task import MaintenanceTaskCreate, MaintenanceTaskUpdate, MaintenanceTaskResponse
from app.dependencies.auth import get_current_user, get_current_owner, get_staff_from_magic_link, CurrentUser

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


@router.get("/", response_model=list[MaintenanceTaskResponse], summary="List all maintenance tasks for the tenant")
async def list_tasks(
    current: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tasks = db.query(MaintenanceTask).filter(MaintenanceTask.tenant_id == current.tenant_id).all()
    return tasks


@router.get("/{task_id}", response_model=MaintenanceTaskResponse, summary="Get a single maintenance task")
async def get_task(
    task_id: str,
    current: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(MaintenanceTask).filter(
        MaintenanceTask.id == task_id,
        MaintenanceTask.tenant_id == current.tenant_id,
    ).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.post("/", response_model=MaintenanceTaskResponse, status_code=status.HTTP_201_CREATED, summary="Create maintenance task (Owner only)")
async def create_task(
    body: MaintenanceTaskCreate,
    current: CurrentUser = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    asset = db.query(Asset).filter(
        Asset.id == body.asset_id,
        Asset.tenant_id == current.tenant_id,
    ).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found in tenant")

    task = MaintenanceTask(
        id=str(uuid.uuid4()),
        tenant_id=current.tenant_id,
        **body.model_dump(),
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=MaintenanceTaskResponse, summary="Update task status / submit cost")
async def update_task(
    task_id: str,
    body: MaintenanceTaskUpdate,
    current: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(MaintenanceTask).filter(
        MaintenanceTask.id == task_id,
        MaintenanceTask.tenant_id == current.tenant_id,
    ).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    was_completed = task.status == TaskStatus.COMPLETED
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(task, field, value)

    if body.status == TaskStatus.COMPLETED and not was_completed and body.submitted_cost:
        asset = db.query(Asset).filter(Asset.id == task.asset_id).first()
        if asset:
            asset.total_maintenance_cost = (asset.total_maintenance_cost or Decimal("0.00")) + (body.submitted_cost or Decimal("0.00"))

    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_id}/proof", summary="Staff uploads proof image via magic link")
async def upload_proof(
    task_id: str,
    image_url: str,
    current: CurrentUser = Depends(get_staff_from_magic_link),
    db: Session = Depends(get_db),
):
    task = db.query(MaintenanceTask).filter(
        MaintenanceTask.id == task_id,
        MaintenanceTask.tenant_id == current.tenant_id,
        MaintenanceTask.staff_id == current.user.id,
    ).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found or not assigned to you")

    task.proof_image_url = image_url
    task.status = TaskStatus.WAITING_APPROVAL
    db.commit()
    db.refresh(task)
    return {"message": "Proof submitted successfully", "task_id": task.id, "status": task.status}
