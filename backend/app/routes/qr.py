from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from app.models.booking import Booking
from app.models.parking import ParkingLocation, ParkingSlot
from app.models.user import User
from app.utils.auth import get_current_user, owner_required

import qrcode
import json
import os


router = APIRouter(
    prefix="/qr",
    tags=["QR Code"]
)


# =========================================================
# SCHEMA
# =========================================================

class QRVerifyRequest(BaseModel):
    type: str
    booking_id: int
    user_id: int | None = None
    parking_location_id: int | None = None
    slot_id: int | None = None


# =========================================================
# HELPER - CREATE QR IMAGE
# =========================================================

def create_qr_image(booking: Booking):

    qr_data = {
        "type": "PARKEASE_BOOKING",
        "booking_id": booking.id,
        "user_id": booking.user_id,
        "parking_location_id": booking.parking_location_id,
        "slot_id": booking.slot_id,
    }

    qr_data_string = json.dumps(qr_data)

    os.makedirs(
        "qrcodes",
        exist_ok=True
    )

    file_path = (
        f"qrcodes/booking_{booking.id}.png"
    )

    qr = qrcode.QRCode(
        version=None,
        box_size=10,
        border=4
    )

    qr.add_data(qr_data_string)

    qr.make(
        fit=True
    )

    qr_image = qr.make_image(
        fill_color="black",
        back_color="white"
    )

    qr_image.save(
        file_path
    )

    return file_path


# =========================================================
# GENERATE QR CODE
# CUSTOMER ONLY
# =========================================================

@router.post("/generate/{booking_id}")
def generate_qr(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):

    booking = (
        db.query(Booking)
        .filter(
            Booking.id == booking_id,
            Booking.user_id == user.id
        )
        .first()
    )

    if booking is None:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    booking_status = str(
        booking.status or ""
    ).upper()

    if booking_status == "CANCELLED":
        raise HTTPException(
            status_code=400,
            detail=(
                "QR code cannot be generated "
                "for a cancelled booking"
            )
        )

    if booking_status == "COMPLETED":
        raise HTTPException(
            status_code=400,
            detail=(
                "QR code cannot be generated "
                "for a completed booking"
            )
        )

    file_path = create_qr_image(
        booking
    )

    return {
        "success": True,
        "message": (
            "QR Code generated successfully"
        ),
        "booking_id": booking.id,
        "parking_location_id": (
            booking.parking_location_id
        ),
        "slot_id": booking.slot_id,
        "status": booking.status,
        "file": file_path,
        "download_url": (
            f"/qr/download/{booking.id}"
        )
    }


# =========================================================
# DOWNLOAD QR CODE
# CUSTOMER ONLY
# =========================================================

@router.get("/download/{booking_id}")
def download_qr(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):

    booking = (
        db.query(Booking)
        .filter(
            Booking.id == booking_id,
            Booking.user_id == user.id
        )
        .first()
    )

    if booking is None:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    booking_status = str(
        booking.status or ""
    ).upper()

    if booking_status == "CANCELLED":
        raise HTTPException(
            status_code=400,
            detail=(
                "QR code cannot be used "
                "for a cancelled booking"
            )
        )

    if booking_status == "COMPLETED":
        raise HTTPException(
            status_code=400,
            detail=(
                "QR code cannot be used "
                "for a completed booking"
            )
        )

    file_path = (
        f"qrcodes/booking_{booking.id}.png"
    )

    if not os.path.exists(
        file_path
    ):
        file_path = create_qr_image(
            booking
        )

    return FileResponse(
        path=file_path,
        media_type="image/png",
        filename=(
            f"booking_{booking.id}.png"
        )
    )


# =========================================================
# VERIFY QR CODE
# PARKING OWNER ONLY
# =========================================================

@router.post("/verify")
def verify_qr(
    data: QRVerifyRequest,
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):

    # -----------------------------------------------------
    # VALIDATE QR TYPE
    # -----------------------------------------------------

    if data.type != "PARKEASE_BOOKING":

        raise HTTPException(
            status_code=400,
            detail="Invalid ParkEase QR code"
        )

    # -----------------------------------------------------
    # GET BOOKING
    # -----------------------------------------------------

    booking = (
        db.query(Booking)
        .filter(
            Booking.id == data.booking_id
        )
        .first()
    )

    if not booking:

        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    # -----------------------------------------------------
    # SECURITY CHECK
    #
    # Owner can only scan bookings for
    # their own parking location.
    # -----------------------------------------------------

    parking = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.id
            == booking.parking_location_id
        )
        .first()
    )

    if not parking:

        raise HTTPException(
            status_code=404,
            detail="Parking location not found"
        )

    if parking.owner_id != owner.id:

        raise HTTPException(
            status_code=403,
            detail=(
                "You are not authorized to "
                "verify this parking booking"
            )
        )

    # -----------------------------------------------------
    # QR DATA VALIDATION
    # -----------------------------------------------------

    if (
        data.user_id is not None
        and data.user_id != booking.user_id
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "QR code user information "
                "does not match the booking"
            )
        )

    if (
        data.parking_location_id is not None
        and data.parking_location_id
        != booking.parking_location_id
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "QR code parking information "
                "does not match the booking"
            )
        )

    if (
        data.slot_id is not None
        and data.slot_id != booking.slot_id
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "QR code slot information "
                "does not match the booking"
            )
        )

    # -----------------------------------------------------
    # CHECK BOOKING STATUS
    # -----------------------------------------------------

    booking_status = str(
        booking.status or ""
    ).upper()

    if booking_status == "CANCELLED":

        raise HTTPException(
            status_code=400,
            detail=(
                "This booking has been cancelled"
            )
        )

    if booking_status == "COMPLETED":

        raise HTTPException(
            status_code=400,
            detail=(
                "This booking has already been completed"
            )
        )

    # -----------------------------------------------------
    # GET SLOT
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # SUCCESS RESPONSE
    # -----------------------------------------------------

    return {
        "success": True,
        "message": (
            "Valid ParkEase booking"
        ),

        "booking": {

            "id": booking.id,

            "user_id": booking.user_id,

            "parking_location_id": (
                booking.parking_location_id
            ),

            "parking_name": parking.name,

            "parking_address": (
                parking.address
            ),

            "slot_id": booking.slot_id,

            "slot_number": (
                slot.slot_number
                if slot
                else None
            ),

            "status": booking.status,

            "booking_date": (
                booking.booking_date
            ),

            "start_time": (
                str(booking.start_time)
                if booking.start_time
                else None
            ),

            "end_time": (
                str(booking.end_time)
                if booking.end_time
                else None
            ),

            "amount": booking.amount
        }
    }