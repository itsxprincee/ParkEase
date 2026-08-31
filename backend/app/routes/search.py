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

    return {
        "parking": location,
        "slots": slots
    }