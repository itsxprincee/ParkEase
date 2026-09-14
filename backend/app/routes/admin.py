from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from database import get_db
from app.models.parking import ParkingLocation
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.booking import Booking
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
        "hourly_rate": getattr(location, "hourly_rate", 0.0),

        "has_ev": getattr(location, "has_ev", False),
        "has_cctv": getattr(location, "has_cctv", False),
        "has_security_guard": getattr(location, "has_security_guard", False),
        "has_covered_roof": getattr(location, "has_covered_roof", False),
        "is_24_7": getattr(location, "is_24_7", False),
        "has_valet": getattr(location, "has_valet", False),

        "image_url": location.image if hasattr(location, "image") else None,

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
            func.upper(func.trim(ParkingLocation.verification_status)) == "PENDING"
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
@router.get("/stats")
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
            func.upper(func.trim(ParkingLocation.verification_status)) == "PENDING"
        )
        .count()
    )

    approved = (
        db.query(ParkingLocation)
        .filter(
            func.upper(func.trim(ParkingLocation.verification_status)) == "APPROVED"
        )
        .count()
    )

    rejected = (
        db.query(ParkingLocation)
        .filter(
            func.upper(func.trim(ParkingLocation.verification_status)) == "REJECTED"
        )
        .count()
    )

    total_users = db.query(User).count()
    total_customers = db.query(User).filter(func.lower(User.role) == "customer").count()
    total_owners = db.query(User).filter(func.lower(User.role) == "owner").count()
    total_admins = db.query(User).filter(func.lower(User.role) == "admin").count()

    return {
        "total": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "total_users": total_users,
        "total_customers": total_customers,
        "total_owners": total_owners,
        "total_admins": total_admins,
    }


# =========================================================
# USER DIRECTORY & MANAGEMENT
# =========================================================

@router.get("/users")
def get_all_users(
    role: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
    admin=Depends(admin_required)
):
    query = db.query(User)

    if role and role.lower() != "all":
        query = query.filter(func.lower(User.role) == role.lower().strip())

    if q and q.strip():
        search_term = f"%{q.strip().lower()}%"
        query = query.filter(
            func.lower(User.name).like(search_term) |
            func.lower(User.email).like(search_term) |
            func.lower(User.phone).like(search_term)
        )

    users = query.order_by(User.id.desc()).all()

    user_list = []
    for u in users:
        u_role = (u.role or "customer").lower()
        vehicles_count = db.query(Vehicle).filter(Vehicle.user_id == u.id).count() if u_role == "customer" else 0
        parking_count = db.query(ParkingLocation).filter(ParkingLocation.owner_id == u.id).count() if u_role == "owner" else 0
        bookings_count = db.query(Booking).filter(Booking.user_id == u.id).count()

        user_list.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "phone": u.phone,
            "is_verified": bool(getattr(u, "is_verified", True)),
            "emergency_contact_name": u.emergency_contact_name,
            "emergency_contact_phone": u.emergency_contact_phone,
            "vehicles_count": vehicles_count,
            "parking_count": parking_count,
            "bookings_count": bookings_count,
        })

    return {
        "total": len(user_list),
        "users": user_list
    }