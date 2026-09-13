from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from app.models.parking import ParkingLocation, ParkingSlot


router = APIRouter(
    prefix="/search",
    tags=["Search Parking"]
)


@router.get("/parking")
def search_parking(
    q: str = "",
    db: Session = Depends(get_db)
):
    query = db.query(ParkingLocation).filter(
        func.upper(func.trim(ParkingLocation.verification_status)) == "APPROVED"
    )

    if q.strip():
        search_text = f"%{q.strip().lower()}%"
        query = query.filter(
            ParkingLocation.name.ilike(search_text) |
            ParkingLocation.address.ilike(search_text)
        )

    locations = query.all()
    result = []

    for location in locations:
        available_slots = db.query(
            ParkingSlot
        ).filter(
            ParkingSlot.parking_id == location.id,
            ParkingSlot.status == "AVAILABLE"
        ).count()

        result.append({
            "id": location.id,
            "name": location.name,
            "address": location.address,
            "latitude": location.latitude,
            "longitude": location.longitude,
            "total_slots": location.total_slots,
            "available_slots": available_slots,
            "hourly_rate": getattr(location, "hourly_rate", 50.0),
            "pricing_type": getattr(location, "pricing_type", "HOURLY"),
            "daily_rate": getattr(location, "daily_rate", 10.0),
            "has_ev": getattr(location, "has_ev", False),
            "has_cctv": getattr(location, "has_cctv", False),
            "image": location.image,
            "image_url": location.image
        })

    return result


@router.get("/parking/{parking_id}")
def parking_details(
    parking_id: int,
    db: Session = Depends(get_db)
):
    location = db.query(
        ParkingLocation
    ).filter(
        ParkingLocation.id == parking_id
    ).first()

    if not location:
        raise HTTPException(
            status_code=404,
            detail="Parking not found"
        )

    slots = db.query(
        ParkingSlot
    ).filter(
        ParkingSlot.parking_id == parking_id
    ).all()

    available_slots = db.query(
        ParkingSlot
    ).filter(
        ParkingSlot.parking_id == parking_id,
        ParkingSlot.status == "AVAILABLE"
    ).count()

    slots_list = [
        {
            "id": slot.id,
            "parking_id": slot.parking_id,
            "slot_number": slot.slot_number,
            "status": slot.status,
            "vehicle_type": getattr(slot, "vehicle_type", "Car")
        }
        for slot in slots
    ]

    return {
        "parking": {
            "id": location.id,
            "owner_id": location.owner_id,
            "name": location.name,
            "address": location.address,
            "latitude": location.latitude,
            "longitude": location.longitude,
            "total_slots": location.total_slots,
            "available_slots": available_slots,
            "hourly_rate": getattr(location, "hourly_rate", 50.0),
            "pricing_type": getattr(location, "pricing_type", "HOURLY"),
            "daily_rate": getattr(location, "daily_rate", 10.0),
            "supported_vehicles": getattr(location, "supported_vehicles", "BOTH"),
            "allow_multi_entry": getattr(location, "allow_multi_entry", True),
            "last_exit_time": getattr(location, "last_exit_time", "11:00 PM"),
            "has_ev": getattr(location, "has_ev", False),
            "has_cctv": getattr(location, "has_cctv", False),
            "has_security_guard": getattr(location, "has_security_guard", False),
            "has_covered_roof": getattr(location, "has_covered_roof", False),
            "is_24_7": getattr(location, "is_24_7", False),
            "has_valet": getattr(location, "has_valet", False),
            "image": location.image,
            "image_url": location.image,
            "inside_image": getattr(location, "inside_image", None),
            "inside_image_url": getattr(location, "inside_image", None),
            "verification_status": getattr(location, "verification_status", "APPROVED")
        },
        "slots": slots_list
    }