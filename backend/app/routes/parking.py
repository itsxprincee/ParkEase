from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from database import get_db
from app.models.parking import ParkingLocation, ParkingSlot
from app.models.user import User
from app.utils.auth import get_current_user, owner_required


router = APIRouter(
    prefix="/parking",
    tags=["Parking"]
)


# =========================================================
# SCHEMAS
# =========================================================

class ParkingCreate(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    total_slots: int


class ParkingUpdate(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    total_slots: int


class SlotCreate(BaseModel):
    slot_number: str = Field(
        ...,
        min_length=1,
        max_length=50
    )


class SlotUpdate(BaseModel):
    slot_number: str = Field(
        ...,
        min_length=1,
        max_length=50
    )


class SlotStatusUpdate(BaseModel):
    status: str = Field(
        ...,
        min_length=1,
        max_length=20
    )


# =========================================================
# HELPER FUNCTION
# =========================================================

def get_owner_parking(
    parking_id: int,
    owner: User,
    db: Session
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

    return parking


# =========================================================
# CREATE PARKING
# =========================================================

@router.post("/create")
def create_parking(
    data: ParkingCreate,
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):

    if data.total_slots <= 0:
        raise HTTPException(
            status_code=400,
            detail="Total slots must be greater than 0"
        )

    parking = ParkingLocation(
        owner_id=owner.id,
        name=data.name.strip(),
        address=data.address.strip(),
        latitude=data.latitude,
        longitude=data.longitude,
        total_slots=data.total_slots,
        verification_status="PENDING",
        verification_submitted_at=datetime.utcnow(),
        verified_at=None,
        rejection_reason=None
    )

    db.add(parking)
    db.commit()
    db.refresh(parking)

    return {
        "message": (
            "Parking submitted successfully "
            "for ParkEase verification."
        ),
        "parking_id": parking.id,
        "owner_id": owner.id,
        "verification_status": (
            parking.verification_status
        ),
        "verification_message": (
            "Your parking is pending verification. "
            "ParkEase verification may take up to 24 hours."
        )
    }


# =========================================================
# CUSTOMER - GET ALL APPROVED PARKING
#
# THIS FIXES:
# GET /parking -> 404 Not Found
# =========================================================

@router.get("")
@router.get("/")
def get_all_parking(
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

    result = []

    for location in locations:

        total_created_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id
            )
            .count()
        )

        available_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id,
                ParkingSlot.status == "AVAILABLE"
            )
            .count()
        )

        occupied_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id,
                ParkingSlot.status == "OCCUPIED"
            )
            .count()
        )

        maintenance_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id,
                ParkingSlot.status == "MAINTENANCE"
            )
            .count()
        )

        result.append(
            {
                "id": location.id,
                "name": location.name,
                "address": location.address,
                "latitude": location.latitude,
                "longitude": location.longitude,

                "total_slots": location.total_slots,

                "created_slots": total_created_slots,
                "available_slots": available_slots,
                "occupied_slots": occupied_slots,
                "maintenance_slots": maintenance_slots,

                "verification_status": (
                    location.verification_status
                )
            }
        )

    return result


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

    result = []

    for location in locations:

        available_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id,
                ParkingSlot.status == "AVAILABLE"
            )
            .count()
        )

        result.append(
            {
                "id": location.id,
                "name": location.name,
                "address": location.address,
                "latitude": location.latitude,
                "longitude": location.longitude,
                "total_slots": location.total_slots,
                "available_slots": available_slots,
                "verification_status": (
                    location.verification_status
                )
            }
        )

    return result


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

    result = []

    for location in locations:

        created_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id
            )
            .count()
        )

        available_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id,
                ParkingSlot.status == "AVAILABLE"
            )
            .count()
        )

        occupied_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id,
                ParkingSlot.status == "OCCUPIED"
            )
            .count()
        )

        maintenance_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id,
                ParkingSlot.status == "MAINTENANCE"
            )
            .count()
        )

        result.append(
            {
                "id": location.id,
                "name": location.name,
                "address": location.address,
                "latitude": location.latitude,
                "longitude": location.longitude,
                "total_slots": location.total_slots,

                "created_slots": created_slots,
                "available_slots": available_slots,
                "occupied_slots": occupied_slots,
                "maintenance_slots": maintenance_slots,

                "verification_status": (
                    location.verification_status
                ),
                "verification_submitted_at": (
                    location.verification_submitted_at
                ),
                "verified_at": location.verified_at,
                "rejection_reason": (
                    location.rejection_reason
                )
            }
        )

    return result


# =========================================================
# OWNER - GET ONE PARKING LOCATION
# =========================================================

@router.get("/owner/{parking_id}")
def get_owner_parking_details(
    parking_id: int,
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):

    parking = get_owner_parking(
        parking_id,
        owner,
        db
    )

    total_slots_created = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id
        )
        .count()
    )

    available_slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id,
            ParkingSlot.status == "AVAILABLE"
        )
        .count()
    )

    occupied_slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id,
            ParkingSlot.status == "OCCUPIED"
        )
        .count()
    )

    maintenance_slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id,
            ParkingSlot.status == "MAINTENANCE"
        )
        .count()
    )

    return {
        "id": parking.id,
        "name": parking.name,
        "address": parking.address,
        "latitude": parking.latitude,
        "longitude": parking.longitude,
        "total_slots": parking.total_slots,

        "verification_status": (
            parking.verification_status
        ),
        "verification_submitted_at": (
            parking.verification_submitted_at
        ),
        "verified_at": parking.verified_at,
        "rejection_reason": (
            parking.rejection_reason
        ),

        "slot_statistics": {
            "configured_capacity": (
                parking.total_slots
            ),
            "created_slots": (
                total_slots_created
            ),
            "available_slots": (
                available_slots
            ),
            "occupied_slots": (
                occupied_slots
            ),
            "maintenance_slots": (
                maintenance_slots
            )
        }
    }


# =========================================================
# OWNER - UPDATE PARKING
# =========================================================

@router.put("/owner/{parking_id}")
def update_parking(
    parking_id: int,
    data: ParkingUpdate,
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):

    parking = get_owner_parking(
        parking_id,
        owner,
        db
    )

    if data.total_slots <= 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Total slots must be greater than 0"
            )
        )

    created_slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id
        )
        .count()
    )

    if data.total_slots < created_slots:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Total slots cannot be less than "
                f"the {created_slots} slots already created."
            )
        )

    parking.name = data.name.strip()
    parking.address = data.address.strip()
    parking.latitude = data.latitude
    parking.longitude = data.longitude
    parking.total_slots = data.total_slots

    if parking.verification_status == "REJECTED":
        parking.verification_status = "PENDING"
        parking.verification_submitted_at = (
            datetime.utcnow()
        )
        parking.verified_at = None
        parking.rejection_reason = None

    db.commit()
    db.refresh(parking)

    return {
        "message": "Parking updated successfully",
        "parking_id": parking.id,
        "verification_status": (
            parking.verification_status
        )
    }


# =========================================================
# OWNER - GET ALL SLOTS
# =========================================================

@router.get("/owner/{parking_id}/slots")
def get_parking_slots(
    parking_id: int,
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):

    parking = get_owner_parking(
        parking_id,
        owner,
        db
    )

    slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id
        )
        .order_by(
            ParkingSlot.id.asc()
        )
        .all()
    )

    total = len(slots)

    available = len([
        slot
        for slot in slots
        if slot.status == "AVAILABLE"
    ])

    occupied = len([
        slot
        for slot in slots
        if slot.status == "OCCUPIED"
    ])

    maintenance = len([
        slot
        for slot in slots
        if slot.status == "MAINTENANCE"
    ])

    return {
        "parking_id": parking.id,
        "parking_name": parking.name,
        "configured_capacity": parking.total_slots,
        "created_slots": total,
        "available_slots": available,
        "occupied_slots": occupied,
        "maintenance_slots": maintenance,

        "slots": [
            {
                "id": slot.id,
                "parking_id": slot.parking_id,
                "slot_number": slot.slot_number,
                "status": slot.status
            }
            for slot in slots
        ]
    }


# =========================================================
# OWNER - CREATE PARKING SLOT
# =========================================================

@router.post("/owner/{parking_id}/slots")
def create_parking_slot(
    parking_id: int,
    data: SlotCreate,
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):

    parking = get_owner_parking(
        parking_id,
        owner,
        db
    )

    slot_number = data.slot_number.strip()

    if not slot_number:
        raise HTTPException(
            status_code=400,
            detail=(
                "Slot number cannot be empty"
            )
        )

    created_slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id
        )
        .count()
    )

    if created_slots >= parking.total_slots:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Maximum parking capacity of "
                f"{parking.total_slots} slots has been reached."
            )
        )

    existing_slot = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id,
            ParkingSlot.slot_number == slot_number
        )
        .first()
    )

    if existing_slot:
        raise HTTPException(
            status_code=400,
            detail=(
                "A slot with this number already exists"
            )
        )

    slot = ParkingSlot(
        parking_id=parking.id,
        slot_number=slot_number,
        status="AVAILABLE"
    )

    db.add(slot)
    db.commit()
    db.refresh(slot)

    return {
        "message": (
            "Parking slot created successfully"
        ),
        "slot": {
            "id": slot.id,
            "parking_id": slot.parking_id,
            "slot_number": slot.slot_number,
            "status": slot.status
        }
    }


# =========================================================
# OWNER - UPDATE SLOT NUMBER
# =========================================================

@router.put(
    "/owner/{parking_id}/slots/{slot_id}"
)
def update_parking_slot(
    parking_id: int,
    slot_id: int,
    data: SlotUpdate,
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):

    parking = get_owner_parking(
        parking_id,
        owner,
        db
    )

    slot = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.id == slot_id,
            ParkingSlot.parking_id == parking.id
        )
        .first()
    )

    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Parking slot not found"
        )

    slot_number = data.slot_number.strip()

    if not slot_number:
        raise HTTPException(
            status_code=400,
            detail=(
                "Slot number cannot be empty"
            )
        )

    duplicate_slot = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id,
            ParkingSlot.slot_number == slot_number,
            ParkingSlot.id != slot.id
        )
        .first()
    )

    if duplicate_slot:
        raise HTTPException(
            status_code=400,
            detail=(
                "A slot with this number already exists"
            )
        )

    slot.slot_number = slot_number

    db.commit()
    db.refresh(slot)

    return {
        "message": (
            "Parking slot updated successfully"
        ),
        "slot": {
            "id": slot.id,
            "parking_id": slot.parking_id,
            "slot_number": slot.slot_number,
            "status": slot.status
        }
    }


# =========================================================
# OWNER - UPDATE SLOT STATUS
# =========================================================

@router.patch(
    "/owner/{parking_id}/slots/{slot_id}/status"
)
def update_slot_status(
    parking_id: int,
    slot_id: int,
    data: SlotStatusUpdate,
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):

    parking = get_owner_parking(
        parking_id,
        owner,
        db
    )

    slot = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.id == slot_id,
            ParkingSlot.parking_id == parking.id
        )
        .first()
    )

    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Parking slot not found"
        )

    allowed_statuses = [
        "AVAILABLE",
        "OCCUPIED",
        "MAINTENANCE"
    ]

    new_status = (
        data.status.upper().strip()
    )

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid status. Allowed values are: "
                "AVAILABLE, OCCUPIED, MAINTENANCE"
            )
        )

    slot.status = new_status

    db.commit()
    db.refresh(slot)

    return {
        "message": (
            "Slot status updated successfully"
        ),
        "slot": {
            "id": slot.id,
            "parking_id": slot.parking_id,
            "slot_number": slot.slot_number,
            "status": slot.status
        }
    }


# =========================================================
# OWNER - DELETE PARKING SLOT
# =========================================================

@router.delete(
    "/owner/{parking_id}/slots/{slot_id}"
)
def delete_parking_slot(
    parking_id: int,
    slot_id: int,
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):

    parking = get_owner_parking(
        parking_id,
        owner,
        db
    )

    slot = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.id == slot_id,
            ParkingSlot.parking_id == parking.id
        )
        .first()
    )

    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Parking slot not found"
        )

    if slot.status == "OCCUPIED":
        raise HTTPException(
            status_code=400,
            detail=(
                "An occupied parking slot cannot be deleted. "
                "Change its status first."
            )
        )

    db.delete(slot)
    db.commit()

    return {
        "message": (
            "Parking slot deleted successfully"
        ),
        "slot_id": slot_id
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

    parking = get_owner_parking(
        parking_id,
        owner,
        db
    )

    db.delete(parking)
    db.commit()

    return {
        "message": "Parking deleted successfully",
        "parking_id": parking_id
    }


# =========================================================
# CUSTOMER - GET ONE APPROVED PARKING
#
# KEEP THIS ROUTE LAST
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
            ParkingLocation.verification_status
            == "APPROVED"
        )
        .first()
    )

    if not parking:
        raise HTTPException(
            status_code=404,
            detail=(
                "Parking not found or not approved"
            )
        )

    total_slots_created = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id
        )
        .count()
    )

    available_slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id,
            ParkingSlot.status == "AVAILABLE"
        )
        .count()
    )

    occupied_slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id,
            ParkingSlot.status == "OCCUPIED"
        )
        .count()
    )

    maintenance_slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id,
            ParkingSlot.status == "MAINTENANCE"
        )
        .count()
    )

    return {
        "id": parking.id,
        "name": parking.name,
        "address": parking.address,
        "latitude": parking.latitude,
        "longitude": parking.longitude,
        "total_slots": parking.total_slots,

        "created_slots": total_slots_created,
        "available_slots": available_slots,
        "occupied_slots": occupied_slots,
        "maintenance_slots": maintenance_slots,

        "verification_status": (
            parking.verification_status
        )
    }