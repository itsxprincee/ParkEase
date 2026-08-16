from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine


# =========================================================
# IMPORT ALL MODELS
# These imports register all SQLAlchemy models before
# Base.metadata.create_all() is executed.
# =========================================================

from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.parking import ParkingLocation
from app.models.booking import Booking
from app.models.review import Review


# =========================================================
# CREATE DATABASE TABLES
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# CREATE FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="ParkEase API",
    description="Smart Parking Management System",
    version="1.0.0"
)


# =========================================================
# CORS CONFIGURATION
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# IMPORT ROUTERS
# =========================================================

from app.routes import auth
from app.routes import parking
from app.routes import booking
from app.routes import vehicle
from app.routes import dashboard
from app.routes import qr
from app.routes import review


# =========================================================
# REGISTER ROUTERS
# =========================================================

app.include_router(auth.router)

app.include_router(parking.router)

app.include_router(booking.router)

app.include_router(vehicle.router)

app.include_router(dashboard.router)

app.include_router(qr.router)

app.include_router(review.router)


# =========================================================
# ROOT ENDPOINT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Welcome to ParkEase API",
        "status": "running"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "ParkEase backend is running successfully"
    }