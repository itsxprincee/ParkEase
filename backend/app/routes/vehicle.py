from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Literal

from database import get_db
from app.models.vehicle import Vehicle
from app.routes.auth import get_current_user


router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicles"]
)


# =========================================================
# SCHEMAS
# =========================================================

class VehicleCreate(BaseModel):
    vehicle_type: Literal["car", "bike"]
    vehicle_name: str = Field(
        ...,
        min_length=1,
        max_length=100
    )
    vehicle_number: str = Field(
        ...,
        min_length=1,
        max_length=30
    )


class VehicleUpdate(BaseModel):
    vehicle_type: Literal["car", "bike"]
    vehicle_name: str = Field(
        ...,
        min_length=1,
        max_length=100
    )
    vehicle_number: str = Field(
        ...,
        min_length=1,
        max_length=30
    )


class VehicleResponse(BaseModel):
    id: int
    vehicle_type: str
    vehicle_name: str
    vehicle_number: str

    class Config:
        from_attributes = True


# =========================================================
# GET MY VEHICLES
# =========================================================

@router.get(
    "/my",
    response_model=list[VehicleResponse]
)
def get_my_vehicles(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    vehicles = (
        db.query(Vehicle)
        .filter(
            Vehicle.owner_id == current_user.id
        )
        .order_by(
            Vehicle.id.desc()
        )
        .all()
    )

    return vehicles


# =========================================================
# ADD VEHICLE
# =========================================================

@router.post(
    "/add",
    response_model=VehicleResponse
)
def add_vehicle(
    vehicle_data: VehicleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    vehicle_number = (
        vehicle_data.vehicle_number
        .strip()
        .upper()
    )

    vehicle_name = (
        vehicle_data.vehicle_name
        .strip()
    )

    if not vehicle_name:
        raise HTTPException(
            status_code=400,
            detail="Vehicle name is required."
        )

    if not vehicle_number:
        raise HTTPException(
            status_code=400,
            detail="Vehicle number is required."
        )

    # -----------------------------------------------------
    # CHECK DUPLICATE VEHICLE
    # -----------------------------------------------------

    existing_vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.owner_id == current_user.id,
            Vehicle.vehicle_number == vehicle_number
        )
        .first()
    )

    if existing_vehicle:
        raise HTTPException(
            status_code=400,
            detail="This vehicle is already added."
        )

    # -----------------------------------------------------
    # CREATE VEHICLE
    # -----------------------------------------------------

    vehicle = Vehicle(
        owner_id=current_user.id,
        vehicle_type=vehicle_data.vehicle_type.lower(),
        vehicle_name=vehicle_name,
        vehicle_number=vehicle_number
    )

    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    return vehicle


# =========================================================
# UPDATE VEHICLE
# =========================================================

@router.put(
    "/{vehicle_id}",
    response_model=VehicleResponse
)
def update_vehicle(
    vehicle_id: int,
    vehicle_data: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == vehicle_id,
            Vehicle.owner_id == current_user.id
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found."
        )

    vehicle_number = (
        vehicle_data.vehicle_number
        .strip()
        .upper()
    )

    vehicle_name = (
        vehicle_data.vehicle_name
        .strip()
    )

    if not vehicle_name:
        raise HTTPException(
            status_code=400,
            detail="Vehicle name is required."
        )

    if not vehicle_number:
        raise HTTPException(
            status_code=400,
            detail="Vehicle number is required."
        )

    # -----------------------------------------------------
    # CHECK DUPLICATE NUMBER
    # -----------------------------------------------------

    duplicate = (
        db.query(Vehicle)
        .filter(
            Vehicle.owner_id == current_user.id,
            Vehicle.vehicle_number == vehicle_number,
            Vehicle.id != vehicle_id
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail=(
                "Another vehicle with this number "
                "already exists."
            )
        )

    # -----------------------------------------------------
    # UPDATE
    # -----------------------------------------------------

    vehicle.vehicle_type = (
        vehicle_data.vehicle_type.lower()
    )

    vehicle.vehicle_name = vehicle_name
    vehicle.vehicle_number = vehicle_number

    db.commit()
    db.refresh(vehicle)

    return vehicle


# =========================================================
# DELETE VEHICLE
# =========================================================

@router.delete(
    "/{vehicle_id}"
)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == vehicle_id,
            Vehicle.owner_id == current_user.id
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found."
        )

    db.delete(vehicle)
    db.commit()

    return {
        "message": "Vehicle deleted successfully."
    }