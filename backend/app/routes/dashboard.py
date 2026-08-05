from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db

from app.models.parking import ParkingLocation, ParkingSlot
from app.models.booking import Booking
from app.utils.auth import admin_required

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/")
def dashboard(
    db: Session = Depends(get_db),
    user = Depends(admin_required)
):

    total_locations = db.query(
        ParkingLocation
    ).count()


    total_slots = db.query(
        ParkingSlot
    ).count()


    available_slots = db.query(
        ParkingSlot
    ).filter(
        ParkingSlot.status == "available"
    ).count()


    booked_slots = db.query(
        ParkingSlot
    ).filter(
        ParkingSlot.status == "booked"
    ).count()


    total_bookings = db.query(
        Booking
    ).count()


    active_bookings = db.query(
        Booking
    ).filter(
        Booking.status == "confirmed"
    ).count()


    cancelled_bookings = db.query(
        Booking
    ).filter(
        Booking.status == "cancelled"
    ).count()


    return {
        "total_locations": total_locations,
        "total_slots": total_slots,
        "available_slots": available_slots,
        "booked_slots": booked_slots,
        "total_bookings": total_bookings,
        "active_bookings": active_bookings,
        "cancelled_bookings": cancelled_bookings
    }