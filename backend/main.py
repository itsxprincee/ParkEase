from fastapi import FastAPI
from database import engine, Base
from app.models.user import User
from app.routes.auth import router as auth_router
from app.models.parking import ParkingLocation, ParkingSlot
from app.routes.parking import router as parking_router
from app.models.booking import Booking
from app.routes.booking import router as booking_router
from app.routes.dashboard import router as dashboard_router
from app.routes.owner import router as owner_router
from app.routes.search import router as search_router
from app.routes.qr import router as qr_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="ParkEase API",
    description="Smart Parking Management System",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(parking_router)
app.include_router(booking_router)
app.include_router(dashboard_router)
app.include_router(owner_router)
app.include_router(search_router)
app.include_router(qr_router)

# Create database tables
Base.metadata.create_all(bind=engine)


@app.get("/")
def home():
    return {
        "message": "Welcome to ParkEase API",
        "status": "Backend Running Successfully"
    }