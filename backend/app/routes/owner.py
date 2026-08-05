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


class ParkingUpdate(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    total_slots: int



@router.get("/my-parking")
def my_parking(
    db: Session = Depends(get_db),
    user = Depends(owner_required)
):

    return db.query(
        ParkingLocation
    ).filter(
        ParkingLocation.owner_id == user.id
    ).all()



@router.put("/update-parking/{parking_id}")
def update_parking(
    parking_id: int,
    parking: ParkingUpdate,
    db: Session = Depends(get_db),
    user = Depends(owner_required)
):

    location = db.query(
        ParkingLocation
    ).filter(
        ParkingLocation.id == parking_id,
        ParkingLocation.owner_id == user.id
    ).first()


    if not location:
        raise HTTPException(
            status_code=404,
            detail="Parking not found"
        )


    location.name = parking.name
    location.address = parking.address
    location.latitude = parking.latitude
    location.longitude = parking.longitude
    location.total_slots = parking.total_slots


    db.commit()


    return {
        "message": "Parking updated successfully"
    }



@router.delete("/delete-parking/{parking_id}")
def delete_parking(
    parking_id: int,
    db: Session = Depends(get_db),
    user = Depends(owner_required)
):

    location = db.query(
        ParkingLocation
    ).filter(
        ParkingLocation.id == parking_id,
        ParkingLocation.owner_id == user.id
    ).first()


    if not location:
        raise HTTPException(
            status_code=404,
            detail="Parking not found"
        )


    db.delete(location)
    db.commit()


    return {
        "message": "Parking deleted successfully"
    }



@router.get("/slots/{parking_id}")
def parking_slots(
    parking_id: int,
    db: Session = Depends(get_db),
    user = Depends(owner_required)
):

    slots = db.query(
        ParkingSlot
    ).filter(
        ParkingSlot.location_id == parking_id
    ).all()


    return slots