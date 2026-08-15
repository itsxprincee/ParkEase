from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form
)
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pathlib import Path
from datetime import datetime
import shutil
import uuid

from database import get_db
from app.models.parking import ParkingLocation
from app.models.user import User
from app.utils.auth import get_current_user, owner_required


router = APIRouter(
    prefix="/parking",
    tags=["Parking"]
)


# =========================================================
# IMAGE UPLOAD DIRECTORY
# =========================================================

UPLOAD_DIR = Path("uploads/parking")

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# =========================================================
# CREATE PARKING
# =========================================================

@router.post("/create")
def create_parking(
    name: str = Form(...),
    address: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    total_slots: int = Form(...),
    image: UploadFile = File(...),

    db: Session = Depends(get_db),

    owner: User = Depends(owner_required)
):

    # -----------------------------------------------------
    # VALIDATE SLOTS
    # -----------------------------------------------------

    if total_slots <= 0:
        raise HTTPException(
            status_code=400,
            detail="Total slots must be greater than 0"
        )

    # -----------------------------------------------------
    # VALIDATE NAME
    # -----------------------------------------------------

    if not name.strip():
        raise HTTPException(
            status_code=400,
            detail="Parking name is required"
        )

    # -----------------------------------------------------
    # VALIDATE ADDRESS
    # -----------------------------------------------------

    if not address.strip():
        raise HTTPException(
            status_code=400,
            detail="Parking address is required"
        )

    # -----------------------------------------------------
    # VALIDATE IMAGE
    # -----------------------------------------------------

    if not image:
        raise HTTPException(
            status_code=400,
            detail="Parking image is required"
        )

    allowed_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    }

    original_name = image.filename or ""

    extension = Path(
        original_name
    ).suffix.lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, JPEG, PNG and WEBP images are allowed"
        )

    # -----------------------------------------------------
    # GENERATE UNIQUE IMAGE NAME
    # -----------------------------------------------------

    unique_filename = (
        f"{uuid.uuid4().hex}{extension}"
    )

    image_path = (
        UPLOAD_DIR /
        unique_filename
    )

    # -----------------------------------------------------
    # SAVE IMAGE
    # -----------------------------------------------------

    try:

        with image_path.open("wb") as buffer:

            shutil.copyfileobj(
                image.file,
                buffer
            )

    except Exception as error:

        print(
            "Image upload error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to save parking image"
        )

    # -----------------------------------------------------
    # CREATE PARKING
    # -----------------------------------------------------

    parking = ParkingLocation(
        owner_id=owner.id,
        name=name.strip(),
        address=address.strip(),
        latitude=latitude,
        longitude=longitude,
        total_slots=total_slots,

        verification_status="PENDING",

        verification_submitted_at=datetime.utcnow(),

        image=unique_filename
    )

    try:

        db.add(parking)

        db.commit()

        db.refresh(parking)

    except Exception as error:

        db.rollback()

        # Delete uploaded image if database failed

        try:
            if image_path.exists():
                image_path.unlink()
        except Exception:
            pass

        print(
            "Create parking database error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to create parking location"
        )

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {
        "message":
            "Parking submitted successfully for ParkEase verification.",

        "parking_id":
            parking.id,

        "owner_id":
            owner.id,

        "verification_status":
            parking.verification_status,

        "verification_message":
            "Your parking is pending verification. "
            "ParkEase verification may take up to 24 hours.",

        "image":
            parking.image
    }


# =========================================================
# CUSTOMER - GET APPROVED PARKING ONLY
# =========================================================

@router.get("/approved")
def get_approved_parking(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):

    locations = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.verification_status == "APPROVED"
        )
        .order_by(
            ParkingLocation.id.desc()
        )
        .all()
    )

    return [
        {
            "id": location.id,
            "name": location.name,
            "address": location.address,
            "latitude": location.latitude,
            "longitude": location.longitude,
            "total_slots": location.total_slots,
            "verification_status":
                location.verification_status,
            "image":
                location.image
        }
        for location in locations
    ]


# =========================================================
# CUSTOMER - GET ONE APPROVED PARKING
# =========================================================

@router.get("/{parking_id}")
def get_parking(
    parking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):

    parking = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.id == parking_id,
            ParkingLocation.verification_status == "APPROVED"
        )
        .first()
    )

    if not parking:

        raise HTTPException(
            status_code=404,
            detail="Parking not found or not approved"
        )

    return {
        "id": parking.id,
        "name": parking.name,
        "address": parking.address,
        "latitude": parking.latitude,
        "longitude": parking.longitude,
        "total_slots": parking.total_slots,
        "verification_status":
            parking.verification_status,
        "image":
            parking.image
    }


# =========================================================
# OWNER - GET MY PARKING
# =========================================================

@router.get("/owner/my-parking")
def get_my_parking(
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):

    locations = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.owner_id == owner.id
        )
        .order_by(
            ParkingLocation.id.desc()
        )
        .all()
    )

    return [
        {
            "id": location.id,
            "name": location.name,
            "address": location.address,
            "latitude": location.latitude,
            "longitude": location.longitude,
            "total_slots": location.total_slots,

            "verification_status":
                location.verification_status,

            "verification_submitted_at":
                location.verification_submitted_at,

            "verified_at":
                location.verified_at,

            "rejection_reason":
                location.rejection_reason,

            "image":
                location.image
        }
        for location in locations
    ]


# =========================================================
# OWNER - DELETE PARKING
# =========================================================

@router.delete("/owner/{parking_id}")
def delete_parking(
    parking_id: int,
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):

    parking = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.id == parking_id,
            ParkingLocation.owner_id == owner.id
        )
        .first()
    )

    if not parking:

        raise HTTPException(
            status_code=404,
            detail="Parking not found"
        )

    # -----------------------------------------------------
    # DELETE IMAGE
    # -----------------------------------------------------

    if parking.image:

        image_path = (
            UPLOAD_DIR /
            parking.image
        )

        try:

            if image_path.exists():
                image_path.unlink()

        except Exception as error:

            print(
                "Unable to delete parking image:",
                error
            )

    # -----------------------------------------------------
    # DELETE DATABASE RECORD
    # -----------------------------------------------------

    db.delete(parking)

    db.commit()

    return {
        "message":
            "Parking deleted successfully",

        "parking_id":
            parking_id
    }