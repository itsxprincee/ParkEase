from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from app.models.vehicle import Vehicle
from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicles"]
)


# =========================================================
# GET MY VEHICLES
# =========================================================

@router.get("/my")
def get_my_vehicles(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    vehicles = (
        db.query(Vehicle)
        .filter(
            Vehicle.user_id == user.id
        )
        .order_by(
            Vehicle.id.desc()
        )
        .all()
    )

    return [
        {
            "id": vehicle.id,
            "vehicle_number": vehicle.vehicle_number,
            "vehicle_type": vehicle.vehicle_type,
            "vehicle_name": vehicle.vehicle_name
        }
        for vehicle in vehicles
    ]


# =========================================================
# ADD VEHICLE
# =========================================================

@router.post("/add")
@router.post("/")
@router.post("")
def add_vehicle(
    data: dict,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    vehicle_number = (
        data.get("vehicle_number")
        or ""
    ).strip().upper()

    vehicle_type = (
        data.get("vehicle_type")
        or "Car"
    ).strip()

    vehicle_name = (
        data.get("vehicle_name")
        or ""
    ).strip()

    if not vehicle_number:
        raise HTTPException(
            status_code=400,
            detail="Vehicle number is required"
        )

    existing_vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.user_id == user.id,
            Vehicle.vehicle_number == vehicle_number
        )
        .first()
    )

    if existing_vehicle:
        raise HTTPException(
            status_code=400,
            detail="This vehicle is already added"
        )

    vehicle = Vehicle(
        user_id=user.id,
        vehicle_number=vehicle_number,
        vehicle_type=vehicle_type,
        vehicle_name=vehicle_name
    )

    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    return {
        "success": True,
        "message": "Vehicle added successfully",
        "id": vehicle.id,
        "vehicle_number": vehicle.vehicle_number,
        "vehicle_type": vehicle.vehicle_type,
        "vehicle_name": vehicle.vehicle_name,
        "vehicle": {
            "id": vehicle.id,
            "vehicle_number": vehicle.vehicle_number,
            "vehicle_type": vehicle.vehicle_type,
            "vehicle_name": vehicle.vehicle_name
        }
    }


# =========================================================
# UPDATE VEHICLE
# =========================================================

@router.put("/{vehicle_id}")
def update_vehicle(
    vehicle_id: int,
    data: dict,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == vehicle_id,
            Vehicle.user_id == user.id
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    vehicle_number = (
        data.get("vehicle_number")
        or ""
    ).strip().upper()

    vehicle_type = (
        data.get("vehicle_type")
        or "Car"
    ).strip()

    vehicle_name = (
        data.get("vehicle_name")
        or ""
    ).strip()

    if not vehicle_number:
        raise HTTPException(
            status_code=400,
            detail="Vehicle number is required"
        )

    # Check for duplicate if number changed
    if vehicle_number != vehicle.vehicle_number:
        existing = (
            db.query(Vehicle)
            .filter(
                Vehicle.user_id == user.id,
                Vehicle.vehicle_number == vehicle_number,
                Vehicle.id != vehicle_id
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Another vehicle with this number already exists"
            )

    vehicle.vehicle_number = vehicle_number
    vehicle.vehicle_type = vehicle_type
    vehicle.vehicle_name = vehicle_name

    db.commit()
    db.refresh(vehicle)

    return {
        "success": True,
        "message": "Vehicle updated successfully",
        "vehicle": {
            "id": vehicle.id,
            "vehicle_number": vehicle.vehicle_number,
            "vehicle_type": vehicle.vehicle_type,
            "vehicle_name": vehicle.vehicle_name
        }
    }


# =========================================================
# DELETE VEHICLE
# =========================================================

@router.delete("/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == vehicle_id,
            Vehicle.user_id == user.id
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    db.delete(vehicle)
    db.commit()

    return {
        "success": True,
        "message": "Vehicle deleted successfully"
    }