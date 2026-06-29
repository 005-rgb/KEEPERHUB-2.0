from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.models import Tenant, User, Asset, MaintenanceTask, Subscription
from app.routers import auth, users, assets, maintenance, subscriptions

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KeeperHub 2.0 API",
    description="Multi-Tenant Asset & Maintenance Management API",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(assets.router)
app.include_router(maintenance.router)
app.include_router(subscriptions.router)


@app.get("/", tags=["health"])
async def root():
    return {"service": "KeeperHub 2.0 API", "status": "running", "version": "2.0.0"}


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}
