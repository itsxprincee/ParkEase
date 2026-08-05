from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from app.models.booking import Booking
from app.utils.auth import get_current_user

import qrcode
import uuid
import os


router = APIRouter(
    prefix="/qr",
    tags=["QR Code"]
)


@router.post("/generate/{booking_id}")
def generate_qr(
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


    qr_data = str(uuid.uuid4())


    file_path = f"qr_{booking_id}.png"


    img = qrcode.make(qr_data)

    img.save(file_path)


    return {
        "message": "QR generated successfully",
        "booking_id": booking_id,
        "qr_code": qr_data,
        "file": file_path
    }