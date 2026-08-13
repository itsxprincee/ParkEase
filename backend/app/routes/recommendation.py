from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
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
def recommend_parking(
    lat: float,
    lng: float,
    db: Session = Depends(get_db)
):

    locations = db.query(ParkingLocation).all()

    recommendations = []

    for location in locations:

        available_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.location_id == location.id,
                ParkingSlot.status == "available"
            )
            .count()
        )

        # Ignore full parking
        if available_slots == 0:
            continue

        distance = calculate_distance(
            lat,
            lng,
            location.latitude,
            location.longitude
        )

        recommendations.append({
            "id": location.id,
            "name": location.name,
            "address": location.address,
            "latitude": location.latitude,
            "longitude": location.longitude,
            "distance_km": round(distance, 2),
            "available_slots": available_slots,
            "total_slots": location.total_slots,
            "occupancy": round(
                ((location.total_slots - available_slots) / location.total_slots) * 100,
                2
            ) if location.total_slots > 0 else 0
        })

    # Sort by nearest parking
    recommendations.sort(key=lambda x: x["distance_km"])

    return {
        "success": True,
        "total_recommendations": len(recommendations),
        "recommendations": recommendations[:5]
    }