from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from app.models.parking import ParkingLocation
from app.models.user import User
from app.utils.auth import admin_required


router = APIRouter(
    prefix="/admin",
    tags=["Admin Verification"]
)


class RejectionRequest(BaseModel):
    reason: str


# =========================================================
# HELPER
# =========================================================

def parking_response(location, owner):

    return {
        "id": location.id,
        "owner_id": location.owner_id,

        "owner_name":
            owner.name if owner else "Unknown Owner",

        "owner_email":
            owner.email if owner else "Unknown Email",

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
            location.rejection_reason
    }


# =========================================================
# PENDING
# =========================================================

@router.get("/parking/pending")
def get_pending_parking(
    db: Session = Depends(get_db),
    admin=Depends(admin_required)
):

    locations = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.verification_status == "PENDING"
        )
        .order_by(
            ParkingLocation.verification_submitted_at.asc()
        )
        .all()
    )

    result = []

    for location in locations:

        owner = (
            db.query(User)
            .filter(User.id == location.owner_id)
            .first()
        )

        result.append(
            parking_response(location, owner)
        )

    return result


# =========================================================
# ALL VERIFICATION HISTORY
# =========================================================

@router.get("/parking/history")
def verification_history(
    db: Session = Depends(get_db),
    admin=Depends(admin_required)
):

    locations = (
        db.query(ParkingLocation)
        .order_by(
            ParkingLocation.id.desc()
        )
        .all()
    )

    result = []

    for location in locations:

        owner = (
            db.query(User)
            .filter(User.id == location.owner_id)
            .first()
        )

        result.append(
            parking_response(location, owner)
        )

    return result


# =========================================================
# ALL PARKING
# =========================================================

@router.get("/parking")
def get_all_parking(
    db: Session = Depends(get_db),
    admin=Depends(admin_required)
):

    locations = (
        db.query(ParkingLocation)
        .order_by(
            ParkingLocation.id.desc()
        )
        .all()
    )

    result = []

    for location in locations:

        owner = (
            db.query(User)
            .filter(User.id == location.owner_id)
            .first()
        )

        result.append(
            parking_response(location, owner)
        )

    return result


# =========================================================
# APPROVE
# =========================================================

@router.put("/parking/{parking_id}/approve")
@router.put("/parking/approve/{parking_id}")
def approve_parking(
    parking_id: int,
    db: Session = Depends(get_db),
    admin=Depends(admin_required)
):

    parking = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.id == parking_id
        )
        .first()
    )

    if not parking:
        raise HTTPException(
            status_code=404,
            detail="Parking location not found"
        )

    if parking.verification_status == "APPROVED":

        raise HTTPException(
            status_code=400,
            detail="Parking is already approved"
        )

    parking.verification_status = "APPROVED"

    parking.verified_at = datetime.utcnow()

    parking.rejection_reason = None

    db.commit()
    db.refresh(parking)

    return {
        "message": "Parking approved successfully",
        "parking_id": parking.id,
        "verification_status":
            parking.verification_status,
        "verified_at": parking.verified_at
    }


# =========================================================
# REJECT
# =========================================================

@router.put("/parking/{parking_id}/reject")
@router.put("/parking/reject/{parking_id}")
def reject_parking(
    parking_id: int,
    request: RejectionRequest,
    db: Session = Depends(get_db),
    admin=Depends(admin_required)
):

    parking = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.id == parking_id
        )
        .first()
    )

    if not parking:
        raise HTTPException(
            status_code=404,
            detail="Parking location not found"
        )

    reason = request.reason.strip()

    if not reason:

        raise HTTPException(
            status_code=400,
            detail="Rejection reason is required"
        )

    parking.verification_status = "REJECTED"

    parking.rejection_reason = reason

    parking.verified_at = None

    db.commit()
    db.refresh(parking)

    return {
        "message": "Parking rejected successfully",
        "parking_id": parking.id,
        "verification_status":
            parking.verification_status,
        "rejection_reason":
            parking.rejection_reason
    }


# =========================================================
# STATISTICS
# =========================================================

@router.get("/verification-stats")
def verification_stats(
    db: Session = Depends(get_db),
    admin=Depends(admin_required)
):

    total = (
        db.query(ParkingLocation)
        .count()
    )

    pending = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.verification_status == "PENDING"
        )
        .count()
    )

    approved = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.verification_status == "APPROVED"
        )
        .count()
    )

    rejected = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.verification_status == "REJECTED"
        )
        .count()
    )

    return {
        "total": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected
    }