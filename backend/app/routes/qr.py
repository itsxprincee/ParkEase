from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database import get_db
from app.models.booking import Booking
from app.utils.auth import get_current_user

import qrcode
import os

router = APIRouter(
    prefix="/qr",
    tags=["QR Code"]
)


@router.post("/generate/{booking_id}")
def generate_qr(
    booking_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
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

    qr_data = f"""
Booking ID: {booking.id}
User ID: {booking.user_id}
Vehicle Number: {booking.vehicle_number}
"""

    os.makedirs("qrcodes", exist_ok=True)

    file_path = f"qrcodes/booking_{booking.id}.png"

    img = qrcode.QRCode(
        version=1,
        box_size=10,
        border=4
    )

    img.add_data(qr_data)
    img.make(fit=True)

    qr_image = img.make_image(
        fill_color="black",
        back_color="white"
    )

    qr_image.save(file_path)

    return {
        "message": "QR Code generated successfully",
        "booking_id": booking.id,
        "vehicle_number": booking.vehicle_number,
        "file": file_path,
        "download_url": f"/qr/download/{booking.id}"
    }


@router.get("/download/{booking_id}")
def download_qr(
    booking_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
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

    file_path = f"qrcodes/booking_{booking.id}.png"

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="QR code not found. Generate it first."
        )

    return FileResponse(
        path=file_path,
        media_type="image/png",
        filename=f"booking_{booking.id}.png"
    )