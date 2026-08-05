from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from app.models.parking import ParkingLocation, ParkingSlot
from app.utils.auth import get_current_user
from pydantic import BaseModel


router = APIRouter(
    prefix="/parking",
    tags=["Parking"]
)


class ParkingCreate(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    total_slots: int


@router.post("/create")
def create_parking(
    parking: ParkingCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):

    new_location = ParkingLocation(
        owner_id=user.id,
        name=parking.name,
        address=parking.address,
        latitude=parking.latitude,
        longitude=parking.longitude,
        total_slots=parking.total_slots
    )

    db.add(new_location)
    db.commit()
    db.refresh(new_location)


    for i in range(1, parking.total_slots + 1):

        slot = ParkingSlot(
            location_id=new_location.id,
            slot_number=f"A-{i}",
            status="available"
        )

        db.add(slot)


    db.commit()


    return {
        "message": "Parking location created successfully",
        "parking_id": new_location.id,
        "owner_id": user.id,
        "slots_created": parking.total_slots
    }


@router.get("/")
def get_parking_locations(
    db: Session = Depends(get_db)
):

    locations = db.query(
        ParkingLocation
    ).all()


    return locations