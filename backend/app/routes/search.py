from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

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
        ParkingLocation.verification_status == "APPROVED"
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
            "available_slots": available_slots
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
        return {
            "message": "Parking not found"
        }

    slots = db.query(
        ParkingSlot
    ).filter(
        ParkingSlot.parking_id == parking_id
    ).all()

    return {
        "parking": location,
        "slots": slots
    }