from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field

from database import get_db
from app.models.parking import ParkingLocation, ParkingSlot
from app.models.booking import Booking
from app.models.review import Review
from app.models.user import User
from app.utils.auth import get_current_user, owner_required


router = APIRouter(
    prefix="/parking",
    tags=["Parking"]
)


# =========================================================
# SCHEMAS
# =========================================================

class ParkingCreate(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    total_slots: int


class ParkingUpdate(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    total_slots: int


class SlotCreate(BaseModel):
    slot_number: str = Field(
        ...,
        min_length=1,
        max_length=50
    )
    status: str | None = "AVAILABLE"
    is_ev: bool | None = False
    vehicle_type: str | None = "Car"


class SlotUpdate(BaseModel):
    slot_number: str = Field(
        ...,
        min_length=1,
        max_length=50
    )
    status: str | None = None
    is_ev: bool | None = None
    vehicle_type: str | None = None


class SlotStatusUpdate(BaseModel):
    status: str = Field(
        ...,
        min_length=1,
        max_length=20
    )


# =========================================================
# HELPER FUNCTION
# =========================================================

def get_owner_parking(
    parking_id: int,
    owner: User,
    db: Session
):
    parking = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.id == parking_id,
            ParkingLocation.owner_id == owner.id
        )
        .first()
    )

    if not parking:
        raise HTTPException(
            status_code=404,
            detail="Parking location not found"
        )

    return parking


def ensure_parking_slots(parking: ParkingLocation, db: Session):
    if not parking or not parking.total_slots or parking.total_slots <= 0:
        return

    count = (
        db.query(ParkingSlot)
        .filter(ParkingSlot.parking_id == parking.id)
        .count()
    )

    if count == 0:
        supported = getattr(parking, "supported_vehicles", "BOTH") or "BOTH"
        for i in range(1, parking.total_slots + 1):
            if supported == "BIKE":
                v_type = "Bike"
            elif supported == "CAR":
                v_type = "Car"
            else:
                v_type = "Bike" if i > int(parking.total_slots * 0.7) else "Car"

            db.add(
                ParkingSlot(
                    parking_id=parking.id,
                    slot_number=f"A{i}",
                    status="AVAILABLE",
                    vehicle_type=v_type
                )
            )
        db.commit()


def parse_bool(val) -> bool:
    if isinstance(val, bool):
        return val
    if isinstance(val, str):
        return val.lower() in ("true", "1", "yes", "on")
    if isinstance(val, (int, float)):
        return val == 1
    return False


# =========================================================
# CREATE PARKING
# =========================================================

@router.post("/create")
@router.post("/")
@router.post("")
async def create_parking(
    request: Request,
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):
    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        name = str(form.get("name") or "").strip()
        address = str(form.get("address") or "").strip()
        try:
            latitude = float(form.get("latitude"))
            longitude = float(form.get("longitude"))
            total_slots = int(form.get("total_slots"))
            hourly_rate = float(form.get("hourly_rate") or 0)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail="Invalid numbers for latitude, longitude, total_slots, or hourly_rate"
            )
        pricing_type = str(form.get("pricing_type") or "HOURLY").upper().strip()
        supported_vehicles = str(form.get("supported_vehicles") or "BOTH").upper().strip()
        if supported_vehicles not in ("CAR", "BIKE", "BOTH"):
            supported_vehicles = "BOTH"
        try:
            daily_rate = float(form.get("daily_rate") or 10.0)
        except (ValueError, TypeError):
            daily_rate = 10.0
        allow_multi_entry = parse_bool(form.get("allow_multi_entry") if "allow_multi_entry" in form else True)
        last_exit_time = str(form.get("last_exit_time") or "11:00 PM").strip()
        has_ev = parse_bool(form.get("has_ev"))
        has_cctv = parse_bool(form.get("has_cctv"))
        has_security_guard = parse_bool(form.get("has_security_guard"))
        has_covered_roof = parse_bool(form.get("has_covered_roof"))
        is_24_7 = parse_bool(form.get("is_24_7"))
        has_valet = parse_bool(form.get("has_valet"))
        
        # Entrance and Inside Images
        img_field = form.get("image") or form.get("entrance_image")
        image_str = None
        if img_field and hasattr(img_field, "filename") and img_field.filename:
            contents = await img_field.read()
            import base64
            b64 = base64.b64encode(contents).decode("utf-8")
            image_str = f"data:{img_field.content_type or 'image/jpeg'};base64,{b64}"
        elif isinstance(img_field, str) and img_field.strip():
            image_str = img_field.strip()

        inside_field = form.get("inside_image") or form.get("interior_image")
        inside_image_str = None
        if inside_field and hasattr(inside_field, "filename") and inside_field.filename:
            contents = await inside_field.read()
            import base64
            b64 = base64.b64encode(contents).decode("utf-8")
            inside_image_str = f"data:{inside_field.content_type or 'image/jpeg'};base64,{b64}"
        elif isinstance(inside_field, str) and inside_field.strip():
            inside_image_str = inside_field.strip()
    else:
        try:
            body = await request.json()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid request body")
        name = str(body.get("name") or "").strip()
        address = str(body.get("address") or "").strip()
        try:
            latitude = float(body.get("latitude"))
            longitude = float(body.get("longitude"))
            total_slots = int(body.get("total_slots"))
            hourly_rate = float(body.get("hourly_rate") or 0)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail="Invalid numbers for latitude, longitude, total_slots, or hourly_rate"
            )
        pricing_type = str(body.get("pricing_type") or "HOURLY").upper().strip()
        supported_vehicles = str(body.get("supported_vehicles") or "BOTH").upper().strip()
        if supported_vehicles not in ("CAR", "BIKE", "BOTH"):
            supported_vehicles = "BOTH"
        try:
            daily_rate = float(body.get("daily_rate") or 10.0)
        except (ValueError, TypeError):
            daily_rate = 10.0
        allow_multi_entry = parse_bool(body.get("allow_multi_entry") if "allow_multi_entry" in body else True)
        last_exit_time = str(body.get("last_exit_time") or "11:00 PM").strip()
        has_ev = parse_bool(body.get("has_ev"))
        has_cctv = parse_bool(body.get("has_cctv"))
        has_security_guard = parse_bool(body.get("has_security_guard"))
        has_covered_roof = parse_bool(body.get("has_covered_roof"))
        is_24_7 = parse_bool(body.get("is_24_7"))
        has_valet = parse_bool(body.get("has_valet"))
        image_str = body.get("image") or body.get("image_url") or body.get("entrance_image")
        inside_image_str = body.get("inside_image") or body.get("inside_image_url") or body.get("interior_image")

    if not name:
        raise HTTPException(status_code=400, detail="Parking name is required")
    if not address:
        raise HTTPException(status_code=400, detail="Parking address is required")
    if total_slots <= 0:
        raise HTTPException(status_code=400, detail="Total slots must be greater than 0")

    if hourly_rate < 0:
        raise HTTPException(status_code=400, detail="Hourly rate cannot be negative")

    parking = ParkingLocation(
        owner_id=owner.id,
        name=name,
        address=address,
        latitude=latitude,
        longitude=longitude,
        total_slots=total_slots,
        hourly_rate=hourly_rate,
        pricing_type=pricing_type,
        supported_vehicles=supported_vehicles,
        daily_rate=daily_rate,
        allow_multi_entry=allow_multi_entry,
        last_exit_time=last_exit_time,
        has_ev=has_ev,
        has_cctv=has_cctv,
        has_security_guard=has_security_guard,
        has_covered_roof=has_covered_roof,
        is_24_7=is_24_7,
        has_valet=has_valet,
        image=image_str,
        inside_image=inside_image_str,
        verification_status="PENDING",
        verification_submitted_at=datetime.utcnow(),
        verified_at=None,
        rejection_reason=None
    )

    db.add(parking)
    db.commit()
    db.refresh(parking)

    # Auto-generate slots
    for i in range(1, total_slots + 1):
        if supported_vehicles == "BIKE":
            v_type = "Bike"
        elif supported_vehicles == "CAR":
            v_type = "Car"
        else:
            v_type = "Bike" if i > int(total_slots * 0.7) else "Car"

        slot = ParkingSlot(
            parking_id=parking.id,
            slot_number=f"A{i}",
            status="AVAILABLE",
            vehicle_type=v_type
        )
        db.add(slot)
    db.commit()

    return {
        "message": (
            "Parking submitted successfully "
            "for ParkEase verification."
        ),
        "parking_id": parking.id,
        "owner_id": owner.id,
        "verification_status": parking.verification_status,
        "verification_message": (
            "Your parking is pending verification. "
            "ParkEase verification may take up to 24 hours."
        )
    }


# =========================================================
# CUSTOMER - GET ALL APPROVED PARKING
# =========================================================

@router.get("")
@router.get("/")
def get_all_parking(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):

    locations = (
        db.query(ParkingLocation)
        .filter(
            func.upper(func.trim(ParkingLocation.verification_status)) == "APPROVED"
        )
        .order_by(
            ParkingLocation.id.desc()
        )
        .all()
    )

    result = []

    for location in locations:
        ensure_parking_slots(location, db)

        total_created_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id
            )
            .count()
        )

        available_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id,
                ParkingSlot.status == "AVAILABLE"
            )
            .count()
        )

        occupied_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id,
                ParkingSlot.status == "OCCUPIED"
            )
            .count()
        )

        maintenance_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id,
                ParkingSlot.status == "MAINTENANCE"
            )
            .count()
        )

        result.append(
            {
                "id": location.id,
                "name": location.name,
                "address": location.address,
                "latitude": location.latitude,
                "longitude": location.longitude,
                "total_slots": location.total_slots,
                "hourly_rate": location.hourly_rate,
                "pricing_type": getattr(location, "pricing_type", "HOURLY") or "HOURLY",
                "supported_vehicles": getattr(location, "supported_vehicles", "BOTH") or "BOTH",
                "daily_rate": getattr(location, "daily_rate", 10.0) if getattr(location, "daily_rate", 10.0) is not None else 10.0,
                "allow_multi_entry": getattr(location, "allow_multi_entry", True),
                "last_exit_time": getattr(location, "last_exit_time", "11:00 PM") or "11:00 PM",
                "has_ev": location.has_ev,
                "has_cctv": location.has_cctv,
                "has_security_guard": location.has_security_guard,
                "has_covered_roof": location.has_covered_roof,
                "is_24_7": location.is_24_7,
                "has_valet": location.has_valet,
                "image": location.image,
                "image_url": location.image,
                "inside_image": getattr(location, "inside_image", None),
                "inside_image_url": getattr(location, "inside_image", None),
                "created_slots": total_created_slots,
                "available_slots": available_slots,
                "occupied_slots": occupied_slots,
                "maintenance_slots": maintenance_slots,
                "verification_status": location.verification_status
            }
        )

    return result


# =========================================================
# CUSTOMER - GET APPROVED PARKING ONLY
# =========================================================

@router.get("/approved")
def get_approved_parking(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):

    locations = (
        db.query(ParkingLocation)
        .filter(
            func.upper(func.trim(ParkingLocation.verification_status)) == "APPROVED"
        )
        .order_by(
            ParkingLocation.id.desc()
        )
        .all()
    )

    result = []

    for location in locations:
        ensure_parking_slots(location, db)

        available_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id,
                ParkingSlot.status == "AVAILABLE"
            )
            .count()
        )

        result.append(
            {
                "id": location.id,
                "name": location.name,
                "address": location.address,
                "latitude": location.latitude,
                "longitude": location.longitude,
                "total_slots": location.total_slots,
                "hourly_rate": location.hourly_rate,
                "pricing_type": getattr(location, "pricing_type", "HOURLY") or "HOURLY",
                "supported_vehicles": getattr(location, "supported_vehicles", "BOTH") or "BOTH",
                "daily_rate": getattr(location, "daily_rate", 10.0) if getattr(location, "daily_rate", 10.0) is not None else 10.0,
                "allow_multi_entry": getattr(location, "allow_multi_entry", True),
                "last_exit_time": getattr(location, "last_exit_time", "11:00 PM") or "11:00 PM",
                "has_ev": location.has_ev,
                "has_cctv": location.has_cctv,
                "has_security_guard": location.has_security_guard,
                "has_covered_roof": location.has_covered_roof,
                "is_24_7": location.is_24_7,
                "has_valet": location.has_valet,
                "available_slots": available_slots,
                "image": location.image,
                "image_url": location.image,
                "inside_image": getattr(location, "inside_image", None),
                "inside_image_url": getattr(location, "inside_image", None),
                "verification_status": location.verification_status
            }
        )

    return result


# =========================================================
# CUSTOMER - GET ONE APPROVED PARKING LOCATION
#
# GET /parking/{parking_id}
# =========================================================

@router.get("/{parking_id}")
def get_customer_parking_details(
    parking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    parking = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.id == parking_id,
            func.upper(func.trim(ParkingLocation.verification_status)) == "APPROVED"
        )
        .first()
    )

    if not parking:
        raise HTTPException(
            status_code=404,
            detail="Parking location not found or not approved"
        )

    ensure_parking_slots(parking, db)

    available_slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id,
            ParkingSlot.status == "AVAILABLE"
        )
        .count()
    )

    return {
        "id": parking.id,
        "name": parking.name,
        "address": parking.address,
        "latitude": parking.latitude,
        "longitude": parking.longitude,
        "total_slots": parking.total_slots,
        "hourly_rate": parking.hourly_rate,
        "pricing_type": getattr(parking, "pricing_type", "HOURLY") or "HOURLY",
        "supported_vehicles": getattr(parking, "supported_vehicles", "BOTH") or "BOTH",
        "daily_rate": getattr(parking, "daily_rate", 10.0) if getattr(parking, "daily_rate", 10.0) is not None else 10.0,
        "allow_multi_entry": getattr(parking, "allow_multi_entry", True),
        "last_exit_time": getattr(parking, "last_exit_time", "11:00 PM") or "11:00 PM",
        "has_ev": parking.has_ev,
        "has_cctv": parking.has_cctv,
        "has_security_guard": parking.has_security_guard,
        "has_covered_roof": parking.has_covered_roof,
        "is_24_7": parking.is_24_7,
        "has_valet": parking.has_valet,
        "available_slots": available_slots,
        "image": parking.image,
        "image_url": parking.image,
        "inside_image": getattr(parking, "inside_image", None),
        "inside_image_url": getattr(parking, "inside_image", None),
        "verification_status": parking.verification_status
    }


# =========================================================
# CUSTOMER - GET AVAILABLE PARKING SLOTS
#
# GET /parking/{parking_id}/slots
# =========================================================

@router.get("/{parking_id}/slots")
def get_customer_parking_slots(
    parking_id: int,
    db: Session = Depends(get_db)
):

    parking = (
        db.query(ParkingLocation)
        .filter(ParkingLocation.id == parking_id)
        .first()
    )

    if not parking:
        raise HTTPException(
            status_code=404,
            detail="Parking location not found"
        )

    # Auto-generate slots if needed
    ensure_parking_slots(parking, db)

    slots = (
        db.query(ParkingSlot)
        .filter(ParkingSlot.parking_id == parking.id)
        .order_by(ParkingSlot.id.asc())
        .all()
    )

    return {
        "parking_id": parking.id,
        "parking_name": parking.name,
        "total_slots": len(slots),
        "total_available_slots": sum(1 for s in slots if str(s.status).upper() == "AVAILABLE"),
        "slots": [
            {
                "id": slot.id,
                "parking_id": slot.parking_id,
                "slot_number": slot.slot_number,
                "status": slot.status,
                "is_ev": bool(getattr(slot, "is_ev", False)),
                "vehicle_type": getattr(slot, "vehicle_type", "Car") or "Car",
                "is_occupied": str(slot.status).upper() != "AVAILABLE"
            }
            for slot in slots
        ]
    }


# =========================================================
# OWNER - GET MY PARKING
# =========================================================

@router.get("/owner/my-parking")
def get_my_parking(
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):

    locations = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.owner_id == owner.id
        )
        .order_by(
            ParkingLocation.id.desc()
        )
        .all()
    )

    result = []

    for location in locations:
        ensure_parking_slots(location, db)

        created_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id
            )
            .count()
        )

        available_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id,
                ParkingSlot.status == "AVAILABLE"
            )
            .count()
        )

        occupied_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id,
                ParkingSlot.status == "OCCUPIED"
            )
            .count()
        )

        maintenance_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id,
                ParkingSlot.status == "MAINTENANCE"
            )
            .count()
        )

        result.append(
            {
                "id": location.id,
                "name": location.name,
                "address": location.address,
                "latitude": location.latitude,
                "longitude": location.longitude,
                "total_slots": location.total_slots,
                "hourly_rate": location.hourly_rate,
                "pricing_type": getattr(location, "pricing_type", "HOURLY") or "HOURLY",
                "supported_vehicles": getattr(location, "supported_vehicles", "BOTH") or "BOTH",
                "has_ev": location.has_ev,
                "has_cctv": location.has_cctv,
                "has_security_guard": location.has_security_guard,
                "has_covered_roof": location.has_covered_roof,
                "is_24_7": location.is_24_7,
                "has_valet": location.has_valet,
                "created_slots": created_slots,
                "available_slots": available_slots,
                "occupied_slots": occupied_slots,
                "maintenance_slots": maintenance_slots,
                "verification_status": location.verification_status,
                "verification_submitted_at": (
                    location.verification_submitted_at
                ),
                "verified_at": location.verified_at,
                "rejection_reason": location.rejection_reason
            }
        )

    return result


# =========================================================
# OWNER - GET ONE PARKING LOCATION
# =========================================================

@router.get("/owner/{parking_id}")
def get_owner_parking_details(
    parking_id: int,
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):

    parking = get_owner_parking(
        parking_id,
        owner,
        db
    )

    ensure_parking_slots(parking, db)

    total_slots_created = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id
        )
        .count()
    )

    available_slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id,
            ParkingSlot.status == "AVAILABLE"
        )
        .count()
    )

    occupied_slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id,
            ParkingSlot.status == "OCCUPIED"
        )
        .count()
    )

    maintenance_slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id,
            ParkingSlot.status == "MAINTENANCE"
        )
        .count()
    )

    return {
        "id": parking.id,
        "name": parking.name,
        "address": parking.address,
        "latitude": parking.latitude,
        "longitude": parking.longitude,
        "total_slots": parking.total_slots,
        "hourly_rate": parking.hourly_rate,
        "pricing_type": getattr(parking, "pricing_type", "HOURLY") or "HOURLY",
        "supported_vehicles": getattr(parking, "supported_vehicles", "BOTH") or "BOTH",
        "has_ev": parking.has_ev,
        "has_cctv": parking.has_cctv,
        "has_security_guard": parking.has_security_guard,
        "has_covered_roof": parking.has_covered_roof,
        "is_24_7": parking.is_24_7,
        "has_valet": parking.has_valet,
        "verification_status": parking.verification_status,
        "verification_submitted_at": (
            parking.verification_submitted_at
        ),
        "verified_at": parking.verified_at,
        "rejection_reason": parking.rejection_reason,
        "slot_statistics": {
            "configured_capacity": parking.total_slots,
            "created_slots": total_slots_created,
            "available_slots": available_slots,
            "occupied_slots": occupied_slots,
            "maintenance_slots": maintenance_slots
        }
    }


# =========================================================
# OWNER - UPDATE PARKING
# =========================================================

@router.put("/owner/{parking_id}")
async def update_parking(
    parking_id: int,
    request: Request,
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):

    parking = get_owner_parking(
        parking_id,
        owner,
        db
    )

    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        name = str(form.get("name") or "").strip()
        address = str(form.get("address") or "").strip()
        try:
            latitude = float(form.get("latitude"))
            longitude = float(form.get("longitude"))
            total_slots = int(form.get("total_slots"))
            hourly_rate = float(form.get("hourly_rate") or parking.hourly_rate)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail="Invalid numbers for latitude, longitude, total_slots, or hourly_rate"
            )
        if "pricing_type" in form:
            parking.pricing_type = str(form.get("pricing_type")).upper().strip()
        if "supported_vehicles" in form:
            v_val = str(form.get("supported_vehicles")).upper().strip()
            if v_val in ("CAR", "BIKE", "BOTH"):
                parking.supported_vehicles = v_val
        if "daily_rate" in form:
            try:
                parking.daily_rate = float(form.get("daily_rate"))
            except (ValueError, TypeError):
                pass
        if "allow_multi_entry" in form:
            parking.allow_multi_entry = parse_bool(form.get("allow_multi_entry"))
        if "last_exit_time" in form:
            parking.last_exit_time = str(form.get("last_exit_time")).strip()
        if "has_ev" in form:
            parking.has_ev = parse_bool(form.get("has_ev"))
        if "has_cctv" in form:
            parking.has_cctv = parse_bool(form.get("has_cctv"))
        if "has_security_guard" in form:
            parking.has_security_guard = parse_bool(form.get("has_security_guard"))
        if "has_covered_roof" in form:
            parking.has_covered_roof = parse_bool(form.get("has_covered_roof"))
        if "is_24_7" in form:
            parking.is_24_7 = parse_bool(form.get("is_24_7"))
        if "has_valet" in form:
            parking.has_valet = parse_bool(form.get("has_valet"))
    else:
        try:
            body = await request.json()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid request body")
        name = str(body.get("name") or "").strip()
        address = str(body.get("address") or "").strip()
        try:
            latitude = float(body.get("latitude"))
            longitude = float(body.get("longitude"))
            total_slots = int(body.get("total_slots"))
            hourly_rate = float(body.get("hourly_rate") if body.get("hourly_rate") is not None else parking.hourly_rate)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail="Invalid numbers for latitude, longitude, total_slots, or hourly_rate"
            )
        if "pricing_type" in body:
            parking.pricing_type = str(body.get("pricing_type")).upper().strip()
        if "supported_vehicles" in body:
            v_val = str(body.get("supported_vehicles")).upper().strip()
            if v_val in ("CAR", "BIKE", "BOTH"):
                parking.supported_vehicles = v_val
        if "daily_rate" in body:
            try:
                parking.daily_rate = float(body.get("daily_rate"))
            except (ValueError, TypeError):
                pass
        if "allow_multi_entry" in body:
            parking.allow_multi_entry = parse_bool(body.get("allow_multi_entry"))
        if "last_exit_time" in body:
            parking.last_exit_time = str(body.get("last_exit_time")).strip()
        if "has_ev" in body:
            parking.has_ev = parse_bool(body.get("has_ev"))
        if "has_cctv" in body:
            parking.has_cctv = parse_bool(body.get("has_cctv"))
        if "has_security_guard" in body:
            parking.has_security_guard = parse_bool(body.get("has_security_guard"))
        if "has_covered_roof" in body:
            parking.has_covered_roof = parse_bool(body.get("has_covered_roof"))
        if "is_24_7" in body:
            parking.is_24_7 = parse_bool(body.get("is_24_7"))
        if "has_valet" in body:
            parking.has_valet = parse_bool(body.get("has_valet"))

    if not name:
        raise HTTPException(status_code=400, detail="Parking name is required")
    if not address:
        raise HTTPException(status_code=400, detail="Parking address is required")
    if total_slots <= 0:
        raise HTTPException(status_code=400, detail="Total slots must be greater than 0")

    created_slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id
        )
        .count()
    )

    if total_slots < created_slots:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Total slots cannot be less than "
                f"the {created_slots} slots already created."
            )
        )

    if hourly_rate < 0:
        raise HTTPException(status_code=400, detail="Hourly rate cannot be negative")

    parking.name = name
    parking.address = address
    parking.latitude = latitude
    parking.longitude = longitude
    parking.total_slots = total_slots
    parking.hourly_rate = hourly_rate

    if parking.verification_status == "REJECTED":
        parking.verification_status = "PENDING"
        parking.verification_submitted_at = datetime.utcnow()
        parking.verified_at = None
        parking.rejection_reason = None

    db.commit()
    db.refresh(parking)

    return {
        "message": "Parking updated successfully",
        "parking_id": parking.id,
        "verification_status": parking.verification_status
    }


# =========================================================
# OWNER - GET ALL SLOTS
# =========================================================

@router.get("/owner/{parking_id}/slots")
def get_parking_slots(
    parking_id: int,
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):

    parking = get_owner_parking(
        parking_id,
        owner,
        db
    )

    # Auto-generate slots if not created yet
    created_count = (
        db.query(ParkingSlot)
        .filter(ParkingSlot.parking_id == parking.id)
        .count()
    )

    if created_count == 0 and parking.total_slots > 0:
        for i in range(1, parking.total_slots + 1):
            db.add(
                ParkingSlot(
                    parking_id=parking.id,
                    slot_number=f"A{i}",
                    status="AVAILABLE"
                )
            )
        db.commit()

    slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id
        )
        .order_by(
            ParkingSlot.id.asc()
        )
        .all()
    )

    total = len(slots)

    available = len([
        slot
        for slot in slots
        if slot.status == "AVAILABLE"
    ])

    occupied = len([
        slot
        for slot in slots
        if slot.status == "OCCUPIED"
    ])

    maintenance = len([
        slot
        for slot in slots
        if slot.status == "MAINTENANCE"
    ])

    return {
        "parking_id": parking.id,
        "parking_name": parking.name,
        "configured_capacity": parking.total_slots,
        "created_slots": total,
        "available_slots": available,
        "occupied_slots": occupied,
        "maintenance_slots": maintenance,
        "slots": [
            {
                "id": slot.id,
                "parking_id": slot.parking_id,
                "slot_number": slot.slot_number,
                "status": slot.status,
                "is_ev": getattr(slot, "is_ev", False),
                "vehicle_type": getattr(slot, "vehicle_type", "Car")
            }
            for slot in slots
        ]
    }


# =========================================================
# OWNER - CREATE PARKING SLOT
# =========================================================

@router.post("/owner/{parking_id}/slots")
def create_parking_slot(
    parking_id: int,
    data: SlotCreate,
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):

    parking = get_owner_parking(
        parking_id,
        owner,
        db
    )

    slot_number = data.slot_number.strip()

    if not slot_number:
        raise HTTPException(
            status_code=400,
            detail="Slot number cannot be empty"
        )

    created_slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id
        )
        .count()
    )

    if created_slots >= parking.total_slots:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Maximum parking capacity of "
                f"{parking.total_slots} slots has been reached."
            )
        )

    existing_slot = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id,
            ParkingSlot.slot_number == slot_number
        )
        .first()
    )

    if existing_slot:
        raise HTTPException(
            status_code=400,
            detail="A slot with this number already exists"
        )

    status_val = (data.status or "AVAILABLE").upper().strip()
    if status_val not in ["AVAILABLE", "OCCUPIED", "MAINTENANCE"]:
        status_val = "AVAILABLE"

    slot = ParkingSlot(
        parking_id=parking.id,
        slot_number=slot_number,
        status=status_val,
        is_ev=bool(data.is_ev),
        vehicle_type=data.vehicle_type or "Car"
    )

    db.add(slot)
    db.commit()
    db.refresh(slot)

    return {
        "message": "Parking slot created successfully",
        "slot": {
            "id": slot.id,
            "parking_id": slot.parking_id,
            "slot_number": slot.slot_number,
            "status": slot.status,
            "is_ev": slot.is_ev,
            "vehicle_type": slot.vehicle_type
        }
    }


# =========================================================
# OWNER - UPDATE SLOT
# =========================================================

@router.put("/owner/{parking_id}/slots/{slot_id}")
def update_parking_slot(
    parking_id: int,
    slot_id: int,
    data: SlotUpdate,
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):

    parking = get_owner_parking(
        parking_id,
        owner,
        db
    )

    slot = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.id == slot_id,
            ParkingSlot.parking_id == parking.id
        )
        .first()
    )

    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Parking slot not found"
        )

    slot_number = data.slot_number.strip()

    if not slot_number:
        raise HTTPException(
            status_code=400,
            detail="Slot number cannot be empty"
        )

    duplicate_slot = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id,
            ParkingSlot.slot_number == slot_number,
            ParkingSlot.id != slot.id
        )
        .first()
    )

    if duplicate_slot:
        raise HTTPException(
            status_code=400,
            detail="A slot with this number already exists"
        )

    slot.slot_number = slot_number

    if data.status:
        st = data.status.upper().strip()
        if st in ["AVAILABLE", "OCCUPIED", "MAINTENANCE"]:
            slot.status = st

    if data.is_ev is not None:
        slot.is_ev = bool(data.is_ev)

    if data.vehicle_type is not None:
        slot.vehicle_type = data.vehicle_type

    db.commit()
    db.refresh(slot)

    return {
        "message": "Parking slot updated successfully",
        "slot": {
            "id": slot.id,
            "parking_id": slot.parking_id,
            "slot_number": slot.slot_number,
            "status": slot.status,
            "is_ev": slot.is_ev,
            "vehicle_type": slot.vehicle_type
        }
    }


# =========================================================
# OWNER - UPDATE SLOT STATUS
# =========================================================

@router.patch(
    "/owner/{parking_id}/slots/{slot_id}/status"
)
def update_slot_status(
    parking_id: int,
    slot_id: int,
    data: SlotStatusUpdate,
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):

    parking = get_owner_parking(
        parking_id,
        owner,
        db
    )

    slot = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.id == slot_id,
            ParkingSlot.parking_id == parking.id
        )
        .first()
    )

    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Parking slot not found"
        )

    allowed_statuses = [
        "AVAILABLE",
        "OCCUPIED",
        "MAINTENANCE"
    ]

    new_status = data.status.upper().strip()

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid status. Allowed values are: "
                "AVAILABLE, OCCUPIED, MAINTENANCE"
            )
        )

    slot.status = new_status

    db.commit()
    db.refresh(slot)

    return {
        "message": "Slot status updated successfully",
        "slot": {
            "id": slot.id,
            "parking_id": slot.parking_id,
            "slot_number": slot.slot_number,
            "status": slot.status
        }
    }


# =========================================================
# OWNER - DELETE PARKING SLOT
# =========================================================

@router.delete(
    "/owner/{parking_id}/slots/{slot_id}"
)
def delete_parking_slot(
    parking_id: int,
    slot_id: int,
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):

    parking = get_owner_parking(
        parking_id,
        owner,
        db
    )

    slot = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.id == slot_id,
            ParkingSlot.parking_id == parking.id
        )
        .first()
    )

    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Parking slot not found"
        )

    if slot.status == "OCCUPIED":
        raise HTTPException(
            status_code=400,
            detail=(
                "An occupied parking slot cannot be deleted. "
                "Change its status first."
            )
        )

    db.delete(slot)
    db.commit()

    return {
        "message": "Parking slot deleted successfully",
        "slot_id": slot_id
    }


# =========================================================
# OWNER - DELETE PARKING
# =========================================================

@router.delete("/owner/{parking_id}")
def delete_parking(
    parking_id: int,
    db: Session = Depends(get_db),
    owner: User = Depends(owner_required)
):

    parking = get_owner_parking(
        parking_id,
        owner,
        db
    )

    # Clean up dependent child records
    booking_ids = [b.id for b in db.query(Booking.id).filter(Booking.parking_location_id == parking.id).all()]
    if booking_ids:
        db.query(Review).filter(Review.booking_id.in_(booking_ids)).delete(synchronize_session=False)
    db.query(Review).filter(Review.parking_id == parking.id).delete(synchronize_session=False)
    db.query(Booking).filter(Booking.parking_location_id == parking.id).delete(synchronize_session=False)
    db.query(ParkingSlot).filter(ParkingSlot.parking_id == parking.id).delete(synchronize_session=False)

    db.delete(parking)
    db.commit()

    return {
        "message": "Parking deleted successfully",
        "parking_id": parking_id
    }


# =========================================================
# CUSTOMER - GET ONE APPROVED PARKING
#
# KEEP THIS ROUTE LAST
# =========================================================

@router.get("/{parking_id}")
def get_parking(
    parking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):

    parking = (
        db.query(ParkingLocation)
        .filter(ParkingLocation.id == parking_id)
        .first()
    )

    if not parking:
        raise HTTPException(
            status_code=404,
            detail="Parking location not found"
        )

    is_owner = parking.owner_id == user.id
    is_admin = getattr(user, "role", "").lower() == "admin"
    is_approved = str(parking.verification_status or "").upper().strip() == "APPROVED"

    if not (is_approved or is_owner or is_admin):
        raise HTTPException(
            status_code=403,
            detail="This parking facility is currently pending verification"
        )

    ensure_parking_slots(parking, db)

    total_slots_created = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id
        )
        .count()
    )

    available_slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id,
            ParkingSlot.status == "AVAILABLE"
        )
        .count()
    )

    occupied_slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id,
            ParkingSlot.status == "OCCUPIED"
        )
        .count()
    )

    maintenance_slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking.id,
            ParkingSlot.status == "MAINTENANCE"
        )
        .count()
    )

    return {
        "id": parking.id,
        "name": parking.name,
        "address": parking.address,
        "latitude": parking.latitude,
        "longitude": parking.longitude,
        "total_slots": parking.total_slots,
        "hourly_rate": parking.hourly_rate,
        "has_ev": parking.has_ev,
        "has_cctv": parking.has_cctv,
        "has_security_guard": parking.has_security_guard,
        "has_covered_roof": parking.has_covered_roof,
        "is_24_7": parking.is_24_7,
        "has_valet": parking.has_valet,
        "created_slots": total_slots_created,
        "available_slots": available_slots,
        "occupied_slots": occupied_slots,
        "maintenance_slots": maintenance_slots,
        "verification_status": parking.verification_status
    }