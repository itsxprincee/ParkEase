from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from app.models.parking import ParkingLocation, ParkingSlot
from app.utils.auth import owner_required
from pydantic import BaseModel


router = APIRouter(
    prefix="/owner",
    tags=["Owner"]
)


# =========================================================
# SCHEMAS
# =========================================================

class ParkingUpdate(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    total_slots: int


# =========================================================
# GET OWNER PARKINGS
# GET /owner/my-parking
# =========================================================

@router.get("/my-parking")
def get_my_parking(
    db: Session = Depends(get_db),
    user=Depends(owner_required)
):

    locations = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.owner_id == user.id
        )
        .order_by(
            ParkingLocation.id.desc()
        )
        .all()
    )

    parking_data = []

    for location in locations:

        available_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.location_id == location.id,
                ParkingSlot.status == "available"
            )
            .count()
        )

        booked_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.location_id == location.id,
                ParkingSlot.status != "available"
            )
            .count()
        )

        parking_data.append({
            "id": location.id,
            "owner_id": location.owner_id,
            "name": location.name,
            "address": location.address,
            "latitude": location.latitude,
            "longitude": location.longitude,
            "total_slots": location.total_slots,

            "available_slots": available_slots,
            "booked_slots": booked_slots,

            "verification_status": getattr(
                location,
                "verification_status",
                "PENDING"
            ),

            "verification_submitted_at": getattr(
                location,
                "verification_submitted_at",
                None
            ),

            "verified_at": getattr(
                location,
                "verified_at",
                None
            ),

            "rejection_reason": getattr(
                location,
                "rejection_reason",
                None
            )
        })

    return parking_data


# =========================================================
# GET OWNER STATISTICS
# GET /owner/stats
# =========================================================

@router.get("/stats")
def get_owner_stats(
    db: Session = Depends(get_db),
    user=Depends(owner_required)
):

    locations = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.owner_id == user.id
        )
        .all()
    )

    total_locations = len(locations)

    total_slots = 0
    available_slots = 0
    occupied_slots = 0

    pending = 0
    approved = 0
    rejected = 0

    for location in locations:

        total_slots += location.total_slots

        available = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.location_id == location.id,
                ParkingSlot.status == "available"
            )
            .count()
        )

        occupied = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.location_id == location.id,
                ParkingSlot.status != "available"
            )
            .count()
        )

        available_slots += available
        occupied_slots += occupied

        status = getattr(
            location,
            "verification_status",
            "PENDING"
        )

        if status == "PENDING":
            pending += 1

        elif status == "APPROVED":
            approved += 1

        elif status == "REJECTED":
            rejected += 1

    return {
        "total_locations": total_locations,
        "total_slots": total_slots,
        "available_slots": available_slots,
        "occupied_slots": occupied_slots,
        "pending": pending,
        "approved": approved,
        "rejected": rejected
    }


# =========================================================
# UPDATE PARKING
# PUT /owner/update-parking/{parking_id}
# =========================================================

@router.put("/update-parking/{parking_id}")
def update_owner_parking(
    parking_id: int,
    parking: ParkingUpdate,
    db: Session = Depends(get_db),
    user=Depends(owner_required)
):

    if parking.total_slots <= 0:
        raise HTTPException(
            status_code=400,
            detail="Total slots must be greater than 0"
        )

    location = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.id == parking_id,
            ParkingLocation.owner_id == user.id
        )
        .first()
    )

    if not location:
        raise HTTPException(
            status_code=404,
            detail="Parking location not found"
        )

    slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.location_id == parking_id
        )
        .order_by(ParkingSlot.id)
        .all()
    )

    old_total = len(slots)
    new_total = parking.total_slots

    # -----------------------------------------------------
    # REDUCE SLOTS
    # -----------------------------------------------------

    if new_total < old_total:

        slots_to_remove = slots[new_total:]

        unavailable_slots = [
            slot
            for slot in slots_to_remove
            if slot.status != "available"
        ]

        if unavailable_slots:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Cannot reduce slots because some "
                    "of the slots to be removed are "
                    "currently booked or occupied."
                )
            )

        for slot in slots_to_remove:
            db.delete(slot)

    # -----------------------------------------------------
    # INCREASE SLOTS
    # -----------------------------------------------------

    elif new_total > old_total:

        for number in range(
            old_total + 1,
            new_total + 1
        ):

            new_slot = ParkingSlot(
                location_id=parking_id,
                slot_number=f"A-{number}",
                status="available"
            )

            db.add(new_slot)

    # -----------------------------------------------------
    # UPDATE PARKING DETAILS
    # -----------------------------------------------------

    location.name = parking.name.strip()
    location.address = parking.address.strip()
    location.latitude = parking.latitude
    location.longitude = parking.longitude
    location.total_slots = new_total

    db.commit()
    db.refresh(location)

    return {
        "message": "Parking updated successfully",
        "parking_id": location.id,
        "name": location.name,
        "address": location.address,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "total_slots": location.total_slots
    }


# =========================================================
# DELETE PARKING
# DELETE /owner/delete-parking/{parking_id}
# =========================================================

@router.delete("/delete-parking/{parking_id}")
def delete_owner_parking(
    parking_id: int,
    db: Session = Depends(get_db),
    user=Depends(owner_required)
):

    location = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.id == parking_id,
            ParkingLocation.owner_id == user.id
        )
        .first()
    )

    if not location:

        raise HTTPException(
            status_code=404,
            detail="Parking location not found"
        )

    slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.location_id == parking_id
        )
        .all()
    )

    # -----------------------------------------------------
    # DON'T DELETE IF SLOT IS OCCUPIED/BOOKED
    # -----------------------------------------------------

    unavailable_slots = [
        slot
        for slot in slots
        if slot.status != "available"
    ]

    if unavailable_slots:

        raise HTTPException(
            status_code=400,
            detail=(
                "Cannot delete this parking because "
                "one or more slots are currently "
                "booked or occupied."
            )
        )

    # -----------------------------------------------------
    # DELETE SLOTS
    # -----------------------------------------------------

    for slot in slots:
        db.delete(slot)

    # -----------------------------------------------------
    # DELETE PARKING
    # -----------------------------------------------------

    db.delete(location)

    db.commit()

    return {
        "message": "Parking deleted successfully",
        "parking_id": parking_id
    }


# =========================================================
# GET PARKING SLOTS
# GET /owner/slots/{parking_id}
# =========================================================

@router.get("/slots/{parking_id}")
def get_owner_slots(
    parking_id: int,
    db: Session = Depends(get_db),
    user=Depends(owner_required)
):

    location = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.id == parking_id,
            ParkingLocation.owner_id == user.id
        )
        .first()
    )

    if not location:

        raise HTTPException(
            status_code=404,
            detail="Parking location not found"
        )

    slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.location_id == parking_id
        )
        .order_by(ParkingSlot.id)
        .all()
    )

    return [
        {
            "id": slot.id,
            "slot_number": slot.slot_number,
            "status": slot.status
        }
        for slot in slots
    ]