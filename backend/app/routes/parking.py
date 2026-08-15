from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Form,
    UploadFile,
    File
)

from sqlalchemy.orm import Session

from database import get_db

from app.models.parking import ParkingLocation
from app.models.user import User

from app.utils.auth import (
    get_current_user,
    owner_required
)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/parking",
    tags=["Parking"]
)


# =========================================================
# CREATE PARKING
# =========================================================

@router.post("/create")
async def create_parking(
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
    # VALIDATE TOTAL SLOTS
    # -----------------------------------------------------

    if total_slots <= 0:

        raise HTTPException(
            status_code=400,
            detail="Total slots must be greater than 0"
        )


    # -----------------------------------------------------
    # VALIDATE IMAGE
    # -----------------------------------------------------

    allowed_types = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ]

    if image.content_type not in allowed_types:

        raise HTTPException(
            status_code=400,
            detail=(
                "Only JPG, JPEG, PNG and WEBP "
                "images are allowed"
            )
        )


    # =====================================================
    # CREATE PARKING
    # =====================================================

    parking = ParkingLocation(

        owner_id=owner.id,

        name=name.strip(),

        address=address.strip(),

        latitude=latitude,

        longitude=longitude,

        total_slots=total_slots,

        verification_status="PENDING",

        verification_submitted_at=datetime.utcnow(),

        verified_at=None,

        rejection_reason=None
    )


    db.add(parking)

    db.commit()

    db.refresh(parking)


    # =====================================================
    # RESPONSE
    # =====================================================

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
            "ParkEase verification may take up to 24 hours."
    }


# =========================================================
# OWNER - GET MY PARKING
# IMPORTANT: MUST COME BEFORE /{parking_id}
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

            "id":
                location.id,

            "name":
                location.name,

            "address":
                location.address,

            "latitude":
                location.latitude,

            "longitude":
                location.longitude,

            "total_slots":
                location.total_slots,

            "verification_status":
                location.verification_status,

            "verification_submitted_at":
                location.verification_submitted_at,

            "verified_at":
                location.verified_at,

            "rejection_reason":
                location.rejection_reason

        }

        for location in locations
    ]


# =========================================================
# OWNER - GET ONE PARKING FOR EDITING
# IMPORTANT: MUST COME BEFORE /{parking_id}
# =========================================================

@router.get("/owner/{parking_id}")
def get_owner_parking(

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
            detail="Parking location not found"
        )


    return {

        "id":
            parking.id,

        "name":
            parking.name,

        "address":
            parking.address,

        "latitude":
            parking.latitude,

        "longitude":
            parking.longitude,

        "total_slots":
            parking.total_slots,

        "verification_status":
            parking.verification_status,

        "verification_submitted_at":
            parking.verification_submitted_at,

        "verified_at":
            parking.verified_at,

        "rejection_reason":
            parking.rejection_reason
    }


# =========================================================
# OWNER - UPDATE PARKING
# =========================================================

@router.put("/owner/{parking_id}")
def update_parking(

    parking_id: int,

    name: str = Form(...),

    address: str = Form(...),

    latitude: float = Form(...),

    longitude: float = Form(...),

    total_slots: int = Form(...),

    db: Session = Depends(get_db),

    owner: User = Depends(owner_required)

):

    # -----------------------------------------------------
    # VALIDATE TOTAL SLOTS
    # -----------------------------------------------------

    if total_slots <= 0:

        raise HTTPException(
            status_code=400,
            detail="Total slots must be greater than 0"
        )


    # -----------------------------------------------------
    # FIND OWNER'S PARKING
    # -----------------------------------------------------

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
            detail="Parking location not found"
        )


    # =====================================================
    # UPDATE DETAILS
    # =====================================================

    parking.name = name.strip()

    parking.address = address.strip()

    parking.latitude = latitude

    parking.longitude = longitude

    parking.total_slots = total_slots


    # =====================================================
    # RE-SUBMIT FOR VERIFICATION
    # =====================================================

    parking.verification_status = "PENDING"

    parking.verification_submitted_at = datetime.utcnow()

    parking.verified_at = None

    parking.rejection_reason = None


    # =====================================================
    # SAVE
    # =====================================================

    db.commit()

    db.refresh(parking)


    return {

        "message":
            "Parking updated successfully and submitted for verification.",

        "parking_id":
            parking.id,

        "verification_status":
            parking.verification_status,

        "verification_message":
            "Your updated parking location is now pending "
            "ParkEase verification."
    }


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


    db.delete(parking)

    db.commit()


    return {

        "message":
            "Parking deleted successfully",

        "parking_id":
            parking_id
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

            "id":
                location.id,

            "name":
                location.name,

            "address":
                location.address,

            "latitude":
                location.latitude,

            "longitude":
                location.longitude,

            "total_slots":
                location.total_slots,

            "verification_status":
                location.verification_status

        }

        for location in locations
    ]


# =========================================================
# CUSTOMER - GET ONE APPROVED PARKING
# IMPORTANT: KEEP THIS LAST
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

        "id":
            parking.id,

        "name":
            parking.name,

        "address":
            parking.address,

        "latitude":
            parking.latitude,

        "longitude":
            parking.longitude,

        "total_slots":
            parking.total_slots,

        "verification_status":
            parking.verification_status
    }