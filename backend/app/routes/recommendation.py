from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from app.models.parking import ParkingLocation, ParkingSlot
import math

router = APIRouter(
    prefix="/recommend",
    tags=["Recommendation"]
)


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Returns approximate distance in KM using the Haversine formula.
    """
    R = 6371  # Earth radius in KM

    lat1 = math.radians(lat1)
    lon1 = math.radians(lon1)
    lat2 = math.radians(lat2)
    lon2 = math.radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(dlon / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


@router.get("/")
@router.get("")
def recommend_parking(
    lat: float,
    lng: float,
    db: Session = Depends(get_db)
):
    locations = (
        db.query(ParkingLocation)
        .filter(
            func.upper(func.trim(ParkingLocation.verification_status)) == "APPROVED",
            ParkingLocation.latitude.isnot(None),
            ParkingLocation.longitude.isnot(None)
        )
        .all()
    )

    recommendations = []

    for location in locations:
        try:
            loc_lat = float(location.latitude)
            loc_lng = float(location.longitude)
        except (TypeError, ValueError):
            continue

        if loc_lat == 0 and loc_lng == 0:
            continue

        available_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id,
                ParkingSlot.status == "AVAILABLE"
            )
            .count()
        )

        # Ignore full parking
        if available_slots == 0:
            continue

        distance = calculate_distance(
            lat,
            lng,
            loc_lat,
            loc_lng
        )

        total_slots = int(location.total_slots or 0)
        occupancy = (
            round(((total_slots - available_slots) / total_slots) * 100, 2)
            if total_slots > 0 else 0
        )

        recommendations.append({
            "id": location.id,
            "name": location.name,
            "address": location.address,
            "latitude": loc_lat,
            "longitude": loc_lng,
            "distance_km": round(distance, 2),
            "available_slots": available_slots,
            "total_slots": total_slots,
            "occupancy": occupancy
        })

    # Sort by nearest parking
    recommendations.sort(key=lambda x: x["distance_km"])

    return {
        "success": True,
        "total_recommendations": len(recommendations),
        "recommendations": recommendations[:5]
    }