from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from app.models.booking import Booking
from app.models.parking import ParkingLocation, ParkingSlot
from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/booking",
    tags=["Bookings"]
)


# =========================================================
# SCHEMAS
# =========================================================

class BookingCreate(BaseModel):
    parking_location_id: int
    slot_id: int
    start_time: str = Field(
        ...,
        min_length=1,
        max_length=50
    )
    end_time: str = Field(
        ...,
        min_length=1,
        max_length=50
    )
    amount: float = 0


# =========================================================
# HELPER - GET USER BOOKING
# =========================================================

def get_user_booking(
    booking_id: int,
    user_id: int,
    db: Session
):
    booking = (
        db.query(Booking)
        .filter(
            Booking.id == booking_id,
            Booking.user_id == user_id
        )
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    return booking


# =========================================================
# CREATE BOOKING
# =========================================================

@router.post("/create")
def create_booking(
    data: BookingCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    # -----------------------------------------------------
    # CHECK PARKING
    # -----------------------------------------------------

    parking = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.id
            == data.parking_location_id,
            ParkingLocation.verification_status
            == "APPROVED"
        )
        .first()
    )

    if not parking:
        raise HTTPException(
            status_code=404,
            detail=(
                "Parking location not found "
                "or not approved"
            )
        )

    # -----------------------------------------------------
    # CHECK SLOT
    # -----------------------------------------------------

    slot = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.id == data.slot_id,
            ParkingSlot.parking_id
            == data.parking_location_id
        )
        .first()
    )

    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Parking slot not found"
        )

    # -----------------------------------------------------
    # CHECK SLOT AVAILABILITY
    # -----------------------------------------------------

    if str(slot.status).upper() != "AVAILABLE":
        raise HTTPException(
            status_code=400,
            detail="This parking slot is not available"
        )

    # -----------------------------------------------------
    # CREATE BOOKING
    # -----------------------------------------------------

    booking = Booking(
        user_id=user.id,
        parking_location_id=data.parking_location_id,
        slot_id=data.slot_id,
        booking_date=datetime.utcnow(),
        start_time=data.start_time.strip(),
        end_time=data.end_time.strip(),
        amount=data.amount,
        status="BOOKED"
    )

    # Reserve slot
    slot.status = "OCCUPIED"

    db.add(booking)
    db.commit()
    db.refresh(booking)

    return {
        "success": True,
        "message": "Parking booked successfully",
        "booking": {
            "id": booking.id,
            "user_id": booking.user_id,
            "parking_location_id": (
                booking.parking_location_id
            ),
            "slot_id": booking.slot_id,
            "booking_date": booking.booking_date,
            "start_time": booking.start_time,
            "end_time": booking.end_time,
            "amount": booking.amount,
            "status": booking.status
        }
    }


# =========================================================
# GET MY BOOKINGS
#
# GET /booking/my-bookings
# =========================================================

@router.get("/my-bookings")
def get_my_bookings(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    bookings = (
        db.query(Booking)
        .filter(
            Booking.user_id == user.id
        )
        .order_by(
            Booking.id.desc()
        )
        .all()
    )

    result = []

    for booking in bookings:

        parking = (
            db.query(ParkingLocation)
            .filter(
                ParkingLocation.id
                == booking.parking_location_id
            )
            .first()
        )

        slot = None

        if booking.slot_id:
            slot = (
                db.query(ParkingSlot)
                .filter(
                    ParkingSlot.id
                    == booking.slot_id
                )
                .first()
            )

        result.append({
            "id": booking.id,

            # Frontend compatibility
            "parking_id": (
                booking.parking_location_id
            ),

            "parking_location_id": (
                booking.parking_location_id
            ),

            "slot_id": booking.slot_id,

            "parking_name": (
                parking.name
                if parking
                else "Unknown Parking"
            ),

            "address": (
                parking.address
                if parking
                else None
            ),

            "slot_number": (
                slot.slot_number
                if slot
                else None
            ),

            "booking_date": (
                booking.booking_date
            ),

            "start_time": (
                booking.start_time
            ),

            "end_time": (
                booking.end_time
            ),

            "amount": (
                booking.amount
            ),

            "status": (
                booking.status
            )
        })

    return result


# =========================================================
# START PARKING
#
# BOOKED -> ACTIVE
# =========================================================

@router.patch("/{booking_id}/start")
def start_parking(
    booking_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    booking = get_user_booking(
        booking_id,
        user.id,
        db
    )

    booking_status = str(
        booking.status or ""
    ).upper().strip()

    if booking_status != "BOOKED":
        raise HTTPException(
            status_code=400,
            detail=(
                "Only a booked parking session "
                "can be started."
            )
        )

    booking.status = "ACTIVE"

    db.commit()
    db.refresh(booking)

    return {
        "success": True,
        "message": "Parking session started successfully",
        "booking_id": booking.id,
        "status": booking.status
    }


# =========================================================
# COMPLETE PARKING / EXIT
#
# ACTIVE -> COMPLETED
#
# AFTER THIS CUSTOMER CAN GIVE REVIEW
# =========================================================

@router.patch("/{booking_id}/complete")
def complete_parking(
    booking_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    booking = get_user_booking(
        booking_id,
        user.id,
        db
    )

    booking_status = str(
        booking.status or ""
    ).upper().strip()

    if booking_status != "ACTIVE":
        raise HTTPException(
            status_code=400,
            detail=(
                "Only an active parking session "
                "can be completed."
            )
        )

    # Complete booking
    booking.status = "COMPLETED"

    # Release parking slot
    if booking.slot_id:

        slot = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.id
                == booking.slot_id
            )
            .first()
        )

        if slot:
            slot.status = "AVAILABLE"

    db.commit()
    db.refresh(booking)

    return {
        "success": True,
        "message": (
            "Parking completed successfully. "
            "You can now give a review."
        ),
        "booking_id": booking.id,
        "parking_location_id": (
            booking.parking_location_id
        ),
        "status": booking.status,
        "can_review": True
    }


# =========================================================
# CANCEL BOOKING
#
# DELETE /booking/{booking_id}
# =========================================================

@router.delete("/{booking_id}")
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    booking = get_user_booking(
        booking_id,
        user.id,
        db
    )

    booking_status = str(
        booking.status or ""
    ).upper().strip()

    # Only BOOKED bookings can be cancelled
    if booking_status != "BOOKED":
        raise HTTPException(
            status_code=400,
            detail=(
                "Only booked parking reservations "
                "can be cancelled."
            )
        )

    # Release slot
    if booking.slot_id:

        slot = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.id
                == booking.slot_id
            )
            .first()
        )

        if slot:
            slot.status = "AVAILABLE"

    # Update booking status
    booking.status = "CANCELLED"

    db.commit()
    db.refresh(booking)

    return {
        "success": True,
        "message": "Booking cancelled successfully",
        "booking_id": booking.id,
        "status": booking.status
    }


# =========================================================
# GET SINGLE BOOKING
#
# KEEP THIS AFTER STATIC ROUTES
# =========================================================

@router.get("/{booking_id}")
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    booking = get_user_booking(
        booking_id,
        user.id,
        db
    )

    parking = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.id
            == booking.parking_location_id
        )
        .first()
    )

    slot = None

    if booking.slot_id:
        slot = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.id
                == booking.slot_id
            )
            .first()
        )

    return {
        "id": booking.id,
        "user_id": booking.user_id,

        # Both names for frontend compatibility
        "parking_id": (
            booking.parking_location_id
        ),

        "parking_location_id": (
            booking.parking_location_id
        ),

        "slot_id": booking.slot_id,

        "parking_name": (
            parking.name
            if parking
            else "Unknown Parking"
        ),

        "address": (
            parking.address
            if parking
            else None
        ),

        "slot_number": (
            slot.slot_number
            if slot
            else None
        ),

        "booking_date": (
            booking.booking_date
        ),

        "start_time": (
            booking.start_time
        ),

        "end_time": (
            booking.end_time
        ),

        "amount": (
            booking.amount
        ),

        "status": (
            booking.status
        )
    }