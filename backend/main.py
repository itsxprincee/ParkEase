from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine


# =========================================================
# IMPORT ALL MODELS
# =========================================================

from app.models.user import User
from app.models.parking import ParkingLocation, ParkingSlot
from app.models.booking import Booking
from app.models.vehicle import Vehicle


# =========================================================
# IMPORT ROUTES
# =========================================================

from app.routes.auth import router as auth_router
from app.routes.parking import router as parking_router
from app.routes.admin import router as admin_router
from app.routes.vehicle import router as vehicle_router


# =========================================================
# CREATE FASTAPI APP
# =========================================================

app = FastAPI(
    title="ParkEase API",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Local development
        "http://localhost:5173",
        "http://127.0.0.1:5173",

        # Live ParkEase frontend
        "https://itsxprincee.github.io"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# =========================================================
# DATABASE
# =========================================================

Base.metadata.create_all(
    bind=engine
)


# =========================================================
# ROUTES
# =========================================================

app.include_router(auth_router)
app.include_router(parking_router)
app.include_router(admin_router)
app.include_router(vehicle_router)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "ParkEase API is running"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }