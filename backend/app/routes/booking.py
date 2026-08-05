from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from app.models.parking import ParkingSlot
from app.models.booking import Booking
from app.utils.auth import get_current_user

from pydantic import BaseModel


router = APIRouter(
    prefix="/booking",
    tags=["Booking"]
)


class BookingRequest(BaseModel):
    slot_id: int
    vehicle_number: str



@router.post("/create")
def create_booking(
    booking: BookingRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):

    slot = db.query(
        ParkingSlot
    ).filter(
        ParkingSlot.id == booking.slot_id
    ).first()


    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Slot not found"
        )


    if slot.status == "booked":
        raise HTTPException(
            status_code=400,
            detail="Slot already booked"
        )


    new_booking = Booking(
        user_id=user.id,
        slot_id=booking.slot_id,
        vehicle_number=booking.vehicle_number
    )


    slot.status = "booked"


    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)


    return {
        "message": "Slot booked successfully",
        "booking_id": new_booking.id,
        "user_id": user.id
    }



@router.get("/my-bookings")
def my_bookings(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):

    bookings = db.query(
        Booking
    ).filter(
        Booking.user_id == user.id
    ).all()


    return bookings

@router.delete("/cancel/{booking_id}")
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):

    booking = db.query(
        Booking
    ).filter(
        Booking.id == booking_id,
        Booking.user_id == user.id
    ).first()


    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )


    slot = db.query(
        ParkingSlot
    ).filter(
        ParkingSlot.id == booking.slot_id
    ).first()


    slot.status = "available"


    db.delete(booking)
    db.commit()


    return {
        "message": "Booking cancelled successfully"
    }