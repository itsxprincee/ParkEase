from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from app.models.booking import Booking
from app.models.parking import ParkingLocation, ParkingSlot
from app.models.vehicle import Vehicle
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
    pass_type: str | None = "HOURLY"


class BookingExtend(BaseModel):
    additional_minutes: int = 60
    additional_amount: float = 0.0


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
#
# POST /booking/create
# POST /booking/
# POST /booking
# =========================================================

@router.post("/create")
@router.post("/")
@router.post("")
def create_booking(
    data: BookingCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    # -----------------------------------------------------
    # CHECK PARKING LOCATION
    # -----------------------------------------------------

    parking = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.id == data.parking_location_id,
            func.upper(func.trim(ParkingLocation.verification_status))
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

    pass_type = str(data.pass_type or "HOURLY").upper().strip()
    last_exit_rule = getattr(parking, "last_exit_time", "11:00 PM") if pass_type == "DAILY_PASS" else None

    booking = Booking(
        user_id=user.id,
        parking_location_id=data.parking_location_id,
        slot_id=data.slot_id,
        booking_date=datetime.utcnow(),
        start_time=data.start_time.strip(),
        end_time=data.end_time.strip(),
        amount=data.amount,
        status="BOOKED",
        pass_type=pass_type,
        entry_count=0,
        is_inside=False,
        last_exit_rule=last_exit_rule
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
            "parking_location_id": booking.parking_location_id,
            "slot_id": booking.slot_id,
            "booking_date": booking.booking_date,
            "start_time": booking.start_time,
            "end_time": booking.end_time,
            "amount": booking.amount,
            "status": booking.status,
            "pass_type": booking.pass_type,
            "last_exit_rule": booking.last_exit_rule
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
            ),

            "pass_type": getattr(booking, "pass_type", "HOURLY") or "HOURLY",
            "entry_count": getattr(booking, "entry_count", 0) or 0,
            "is_inside": getattr(booking, "is_inside", False),
            "last_exit_rule": getattr(booking, "last_exit_rule", None)
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
@router.post("/cancel/{booking_id}")
@router.post("/{booking_id}/cancel")
@router.patch("/{booking_id}/cancel")
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
# VERIFY BOOKING BY ID
# GET /booking/verify/{booking_id}
# =========================================================

@router.get("/verify/{booking_id}")
def verify_booking_by_id(
    booking_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id)
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking pass not found"
        )

    parking = (
        db.query(ParkingLocation)
        .filter(ParkingLocation.id == booking.parking_location_id)
        .first()
    )

    slot = None
    if booking.slot_id:
        slot = (
            db.query(ParkingSlot)
            .filter(ParkingSlot.id == booking.slot_id)
            .first()
        )

    customer_vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.user_id == booking.user_id)
        .first()
    )

    return {
        "id": booking.id,
        "booking_id": booking.id,
        "parking_id": booking.parking_location_id,
        "parking_name": parking.name if parking else "ParkEase Hub",
        "parking_address": parking.address if parking else "City Hub",
        "slot_number": slot.slot_number if slot else "A-1",
        "vehicle_number": customer_vehicle.vehicle_number if customer_vehicle else "MH-01-AB-1234",
        "vehicle_type": customer_vehicle.vehicle_type if customer_vehicle else "Car",
        "status": booking.status or "ACTIVE",
        "booking_date": str(booking.booking_date),
        "start_time": str(booking.start_time) if booking.start_time else "10:00 AM",
        "end_time": str(booking.end_time) if booking.end_time else "12:00 PM",
        "total_amount": booking.amount or 105,
    }


# =========================================================
# VEHICLE ENTRY / CHECK-IN
# POST /booking/entry/{booking_id}
# =========================================================

@router.post("/entry/{booking_id}")
@router.post("/check-in/{booking_id}")
@router.post("/checkin/{booking_id}")
def check_in_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id)
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    parking = (
        db.query(ParkingLocation)
        .filter(ParkingLocation.id == booking.parking_location_id)
        .first()
    )

    if not parking:
        raise HTTPException(
            status_code=404,
            detail="Parking location not found"
        )

    is_owner = parking.owner_id == user.id
    is_customer = booking.user_id == user.id
    is_admin = getattr(user, "role", "").lower() == "admin"

    if not (is_owner or is_customer or is_admin):
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to check in this booking"
        )

    booking_status = str(booking.status or "").upper().strip()

    if booking_status == "CANCELLED":
        raise HTTPException(
            status_code=400,
            detail="This booking has been cancelled and cannot be checked in"
        )

    if booking_status == "COMPLETED":
        raise HTTPException(
            status_code=400,
            detail="This booking has already been completed"
        )

    is_daily_pass = (getattr(booking, "pass_type", "HOURLY") or "HOURLY").upper() == "DAILY_PASS"
    allow_multi = getattr(parking, "allow_multi_entry", True)

    if booking_status in ["ACTIVE", "PARKED", "CHECKED_IN"] and getattr(booking, "is_inside", False):
        slot_obj = db.query(ParkingSlot).filter(ParkingSlot.id == booking.slot_id).first() if booking.slot_id else None
        return {
            "success": True,
            "message": "Vehicle is already checked in and currently inside the parking facility.",
            "booking_id": booking.id,
            "status": "ACTIVE",
            "is_inside": True,
            "pass_type": booking.pass_type,
            "entry_count": booking.entry_count or 1,
            "parking_name": parking.name,
            "slot_number": slot_obj.slot_number if slot_obj else "N/A"
        }

    # Increment entry count and set inside
    booking.entry_count = (booking.entry_count or 0) + 1
    booking.is_inside = True
    booking.status = "ACTIVE"

    # Ensure slot is OCCUPIED
    if booking.slot_id:
        slot = db.query(ParkingSlot).filter(ParkingSlot.id == booking.slot_id).first()
        if slot:
            slot.status = "OCCUPIED"

    db.commit()
    db.refresh(booking)

    slot_obj = db.query(ParkingSlot).filter(ParkingSlot.id == booking.slot_id).first() if booking.slot_id else None

    entry_msg = (
        f"Multi-Entry Pass verified (Entry #{booking.entry_count})! Valid until {booking.last_exit_rule or 'gate closing'}."
        if is_daily_pass
        else f"Vehicle check-in successful! Welcome to {parking.name}."
    )

    return {
        "success": True,
        "message": entry_msg,
        "booking_id": booking.id,
        "status": "ACTIVE",
        "is_inside": True,
        "pass_type": getattr(booking, "pass_type", "HOURLY"),
        "entry_count": booking.entry_count,
        "last_exit_rule": booking.last_exit_rule,
        "parking_name": parking.name,
        "slot_number": slot_obj.slot_number if slot_obj else "N/A",
        "entry_time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    }


# =========================================================
# VEHICLE EXIT / CHECK-OUT
# POST /booking/exit/{booking_id}
# =========================================================

@router.post("/exit/{booking_id}")
@router.post("/check-out/{booking_id}")
@router.post("/checkout/{booking_id}")
def check_out_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id)
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    parking = (
        db.query(ParkingLocation)
        .filter(ParkingLocation.id == booking.parking_location_id)
        .first()
    )

    if not parking:
        raise HTTPException(
            status_code=404,
            detail="Parking location not found"
        )

    is_owner = parking.owner_id == user.id
    is_customer = booking.user_id == user.id
    is_admin = getattr(user, "role", "").lower() == "admin"

    if not (is_owner or is_customer or is_admin):
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to check out this booking"
        )

    booking_status = str(booking.status or "").upper().strip()

    if booking_status == "CANCELLED":
        raise HTTPException(
            status_code=400,
            detail="This booking was cancelled and cannot be checked out"
        )

    if booking_status == "COMPLETED":
        return {
            "success": True,
            "message": "Vehicle has already completed parking and checked out.",
            "booking_id": booking.id,
            "status": "COMPLETED",
            "parking_name": parking.name
        }

    is_daily_pass = (getattr(booking, "pass_type", "HOURLY") or "HOURLY").upper() == "DAILY_PASS"
    allow_multi = getattr(parking, "allow_multi_entry", True)

    slot_number = "N/A"
    slot = None
    if booking.slot_id:
        slot = db.query(ParkingSlot).filter(ParkingSlot.id == booking.slot_id).first()
        if slot:
            slot_number = slot.slot_number

    if is_daily_pass and allow_multi:
        # Mark as temporarily out, but keep pass valid for re-entry and slot reserved
        booking.is_inside = False
        booking.status = "ACTIVE"
        # Slot remains reserved for this daily pass holder throughout their pass period
        if slot:
            slot.status = "OCCUPIED"
        db.commit()
        db.refresh(booking)

        curfew_text = f" before {booking.last_exit_rule}" if booking.last_exit_rule else ""
        return {
            "success": True,
            "message": f"Temporary exit recorded. Unlimited Daily Pass remains active! Slot {slot_number} is reserved for your return anytime today{curfew_text}.",
            "booking_id": booking.id,
            "status": "ACTIVE",
            "is_inside": False,
            "pass_type": "DAILY_PASS",
            "last_exit_rule": booking.last_exit_rule,
            "parking_name": parking.name,
            "slot_number": slot_number,
            "exit_time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        }
    else:
        # Standard hourly or single-entry pass completion - free the slot
        if slot:
            slot.status = "AVAILABLE"
        booking.is_inside = False
        booking.status = "COMPLETED"
        db.commit()
        db.refresh(booking)

        return {
            "success": True,
            "message": f"Vehicle check-out completed! Slot {slot_number} is now AVAILABLE.",
            "booking_id": booking.id,
            "status": "COMPLETED",
            "is_inside": False,
            "parking_name": parking.name,
            "slot_number": slot_number,
            "exit_time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
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


# =========================================================
# EXTEND BOOKING PASS DURATION
#
# POST /booking/extend/{booking_id}
# =========================================================

@router.post("/extend/{booking_id}")
def extend_booking(
    booking_id: int,
    data: BookingExtend,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    booking = get_user_booking(booking_id, user.id, db)

    if str(booking.status).upper() not in ["ACTIVE", "BOOKED", "CONFIRMED", "UPCOMING"]:
        raise HTTPException(
            status_code=400,
            detail="Only active parking passes can be extended."
        )

    # Calculate new end time
    try:
        if ":" in str(booking.end_time):
            parts = str(booking.end_time).split(":")
            h = int(parts[0])
            m = int(parts[1])
            total_minutes = h * 60 + m + data.additional_minutes
            new_h = (total_minutes // 60) % 24
            new_m = total_minutes % 60
            booking.end_time = f"{new_h:02d}:{new_m:02d}"
    except Exception:
        pass

    booking.amount = float(booking.amount or 0) + float(data.additional_amount)
    db.commit()
    db.refresh(booking)

    return {
        "message": f"Parking pass extended by {data.additional_minutes} minutes!",
        "new_end_time": booking.end_time,
        "total_amount": booking.amount,
        "booking": {
            "id": booking.id,
            "end_time": booking.end_time,
            "amount": booking.amount,
            "status": booking.status
        }
    }