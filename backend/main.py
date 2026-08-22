from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine

# =========================================================
# IMPORT ALL MODELS
# =========================================================
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.parking import ParkingLocation
from app.models.booking import Booking
from app.models.review import Review

# Create Database Tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as db_err:
    print(f"\n[WARNING] Could not connect to MySQL server: {db_err}")
    print("[TIP] Make sure your MySQL Server (or XAMPP MySQL) is started.\n")

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
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# IMPORT ROUTERS
# =========================================================
from app.routes import (
    auth,
    parking,
    booking,
    vehicle,
    dashboard,
    qr,
    review,
    admin,
    owner,
    search,
    recommendation
)

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
app.include_router(admin.router)
app.include_router(owner.router)
app.include_router(search.router)
app.include_router(recommendation.router)

# =========================================================
# ROOT & HEALTH ENDPOINTS
# =========================================================
@app.get("/")
def root():
    return {
        "message": "Welcome to ParkEase API",
        "status": "running"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "ParkEase backend is running successfully"
    }