from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from database import get_db
from app.models.parking import ParkingLocation, ParkingSlot
from app.models.booking import Booking
from app.models.user import User
from app.models.vehicle import Vehicle
from app.utils.auth import owner_required
from pydantic import BaseModel


router = APIRouter(
    prefix="/owner",
    tags=["Owner"]
)


# =========================================================
# SCHEMAS
# =========================================================

class ParkingUpdate(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    total_slots: int


# =========================================================
# GET OWNER PARKINGS
# GET /owner/my-parking
# =========================================================

@router.get("/my-parking")
def get_my_parking(
    db: Session = Depends(get_db),
    user=Depends(owner_required)
):

    locations = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.owner_id == user.id
        )
        .order_by(
            ParkingLocation.id.desc()
        )
        .all()
    )

    parking_data = []

    for location in locations:

        available_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id,
                ParkingSlot.status == "AVAILABLE"
            )
            .count()
        )

        booked_slots = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id,
                ParkingSlot.status != "AVAILABLE"
            )
            .count()
        )

        parking_data.append({
            "id": location.id,
            "owner_id": location.owner_id,
            "name": location.name,
            "address": location.address,
            "latitude": location.latitude,
            "longitude": location.longitude,
            "total_slots": location.total_slots,

            "available_slots": available_slots,
            "booked_slots": booked_slots,

            "verification_status": getattr(
                location,
                "verification_status",
                "PENDING"
            ),

            "verification_submitted_at": getattr(
                location,
                "verification_submitted_at",
                None
            ),

            "verified_at": getattr(
                location,
                "verified_at",
                None
            ),

            "rejection_reason": getattr(
                location,
                "rejection_reason",
                None
            )
        })

    return parking_data


# =========================================================
# GET OWNER STATISTICS
# GET /owner/stats
# =========================================================

@router.get("/stats")
def get_owner_stats(
    db: Session = Depends(get_db),
    user=Depends(owner_required)
):

    locations = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.owner_id == user.id
        )
        .all()
    )

    total_locations = len(locations)

    total_slots = 0
    available_slots = 0
    occupied_slots = 0

    pending = 0
    approved = 0
    rejected = 0

    for location in locations:

        total_slots += location.total_slots

        available = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id,
                ParkingSlot.status == "AVAILABLE"
            )
            .count()
        )

        occupied = (
            db.query(ParkingSlot)
            .filter(
                ParkingSlot.parking_id == location.id,
                ParkingSlot.status != "AVAILABLE"
            )
            .count()
        )

        available_slots += available
        occupied_slots += occupied

        status = getattr(
            location,
            "verification_status",
            "PENDING"
        )

        if status == "PENDING":
            pending += 1

        elif status == "APPROVED":
            approved += 1

        elif status == "REJECTED":
            rejected += 1

    return {
        "total_locations": total_locations,
        "total_slots": total_slots,
        "available_slots": available_slots,
        "occupied_slots": occupied_slots,
        "pending": pending,
        "approved": approved,
        "rejected": rejected
    }


# =========================================================
# GET OWNER LIVE DASHBOARD & OCCUPANCY
# GET /owner/live-dashboard
# =========================================================

@router.get("/live-dashboard")
def get_owner_live_dashboard(
    db: Session = Depends(get_db),
    user=Depends(owner_required)
):
    locations = (
        db.query(ParkingLocation)
        .filter(ParkingLocation.owner_id == user.id)
        .order_by(ParkingLocation.id.desc())
        .all()
    )

    loc_ids = [loc.id for loc in locations]

    if not loc_ids:
        return {
            "total_facilities": 0,
            "total_slots": 0,
            "available_slots": 0,
            "booked_count": 0,
            "entered_count": 0,
            "completed_count": 0,
            "maintenance_slots": 0,
            "total_revenue": 0.0,
            "today_revenue": 0.0,
            "facilities": [],
            "live_bookings": [],
        }

    all_slots = (
        db.query(ParkingSlot)
        .filter(ParkingSlot.parking_id.in_(loc_ids))
        .all()
    )

    total_slots_count = sum(loc.total_slots for loc in locations)
    available_slots_count = len([s for s in all_slots if str(s.status).upper() == "AVAILABLE"])
    maintenance_slots_count = len([s for s in all_slots if str(s.status).upper() == "MAINTENANCE"])

    all_bookings = (
        db.query(Booking)
        .filter(Booking.parking_location_id.in_(loc_ids))
        .order_by(Booking.id.desc())
        .all()
    )

    booked_count = len([b for b in all_bookings if str(b.status).upper() in ["BOOKED", "CONFIRMED"]])
    entered_count = len([b for b in all_bookings if str(b.status).upper() in ["ACTIVE", "PARKED", "CHECKED_IN"]])
    completed_count = len([b for b in all_bookings if str(b.status).upper() == "COMPLETED"])

    valid_bookings = [b for b in all_bookings if str(b.status).upper() not in ["CANCELLED"]]
    total_revenue = sum(float(b.amount or 0) for b in valid_bookings)

    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    seven_days_ago = today_start - timedelta(days=6)
    thirty_days_ago = today_start - timedelta(days=29)
    year_start = datetime(now.year, 1, 1)

    today_revenue = sum(
        float(b.amount or 0)
        for b in valid_bookings
        if b.booking_date and b.booking_date >= today_start
    )

    weekly_revenue = sum(
        float(b.amount or 0)
        for b in valid_bookings
        if b.booking_date and b.booking_date >= seven_days_ago
    )

    monthly_revenue = sum(
        float(b.amount or 0)
        for b in valid_bookings
        if b.booking_date and b.booking_date >= thirty_days_ago
    )

    yearly_revenue = sum(
        float(b.amount or 0)
        for b in valid_bookings
        if b.booking_date and b.booking_date >= year_start
    )

    # 1. Today Hourly Breakdown
    today_hours = [
        {"label": "06:00 - 09:00", "min_h": 6, "max_h": 9, "amount": 0.0, "count": 0},
        {"label": "09:00 - 12:00", "min_h": 9, "max_h": 12, "amount": 0.0, "count": 0},
        {"label": "12:00 - 15:00", "min_h": 12, "max_h": 15, "amount": 0.0, "count": 0},
        {"label": "15:00 - 18:00", "min_h": 15, "max_h": 18, "amount": 0.0, "count": 0},
        {"label": "18:00 - 21:00", "min_h": 18, "max_h": 21, "amount": 0.0, "count": 0},
        {"label": "21:00 - 00:00", "min_h": 21, "max_h": 24, "amount": 0.0, "count": 0},
    ]
    for b in valid_bookings:
        if b.booking_date and b.booking_date >= today_start:
            hour = b.booking_date.hour
            for slot_h in today_hours:
                if slot_h["min_h"] <= hour < slot_h["max_h"]:
                    slot_h["amount"] += float(b.amount or 0)
                    slot_h["count"] += 1
                    break

    # 2. Weekly Daily Breakdown (Last 7 Days)
    weekly_days = []
    for i in range(7):
        day_date = seven_days_ago + timedelta(days=i)
        day_str = day_date.strftime("%a")
        day_start = datetime(day_date.year, day_date.month, day_date.day)
        day_end = day_start + timedelta(days=1)
        day_amt = sum(
            float(b.amount or 0)
            for b in valid_bookings
            if b.booking_date and day_start <= b.booking_date < day_end
        )
        day_cnt = len([
            b for b in valid_bookings
            if b.booking_date and day_start <= b.booking_date < day_end
        ])
        weekly_days.append({
            "label": day_str,
            "date": day_date.strftime("%b %d"),
            "amount": day_amt,
            "count": day_cnt,
        })

    # 3. Monthly Weekly Breakdown (4 Weeks)
    monthly_weeks = [
        {"label": "Week 1", "amount": 0.0, "count": 0},
        {"label": "Week 2", "amount": 0.0, "count": 0},
        {"label": "Week 3", "amount": 0.0, "count": 0},
        {"label": "Week 4", "amount": 0.0, "count": 0},
    ]
    for b in valid_bookings:
        if b.booking_date and b.booking_date >= thirty_days_ago:
            days_diff = (now - b.booking_date).days
            if days_diff < 7:
                monthly_weeks[3]["amount"] += float(b.amount or 0)
                monthly_weeks[3]["count"] += 1
            elif days_diff < 14:
                monthly_weeks[2]["amount"] += float(b.amount or 0)
                monthly_weeks[2]["count"] += 1
            elif days_diff < 21:
                monthly_weeks[1]["amount"] += float(b.amount or 0)
                monthly_weeks[1]["count"] += 1
            else:
                monthly_weeks[0]["amount"] += float(b.amount or 0)
                monthly_weeks[0]["count"] += 1

    # 4. Yearly Monthly Breakdown (Jan - Dec)
    yearly_months = []
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for m_idx, m_name in enumerate(month_names, start=1):
        m_amt = sum(
            float(b.amount or 0)
            for b in valid_bookings
            if b.booking_date and b.booking_date.year == now.year and b.booking_date.month == m_idx
        )
        m_cnt = len([
            b for b in valid_bookings
            if b.booking_date and b.booking_date.year == now.year and b.booking_date.month == m_idx
        ])
        yearly_months.append({
            "label": m_name,
            "amount": m_amt,
            "count": m_cnt,
        })

    facility_breakdowns = []
    for loc in locations:
        loc_slots = [s for s in all_slots if s.parking_id == loc.id]
        loc_bookings = [b for b in all_bookings if b.parking_location_id == loc.id]
        loc_valid_bookings = [b for b in loc_bookings if str(b.status).upper() not in ["CANCELLED"]]

        loc_avail = len([s for s in loc_slots if str(s.status).upper() == "AVAILABLE"])
        loc_maint = len([s for s in loc_slots if str(s.status).upper() == "MAINTENANCE"])
        loc_booked = len([b for b in loc_bookings if str(b.status).upper() in ["BOOKED", "CONFIRMED"]])
        loc_entered = len([b for b in loc_bookings if str(b.status).upper() in ["ACTIVE", "PARKED", "CHECKED_IN"]])

        tot = loc.total_slots or len(loc_slots) or 1
        occ_rate = round(((loc_entered + loc_booked) / tot) * 100) if tot > 0 else 0

        loc_total_rev = sum(float(b.amount or 0) for b in loc_valid_bookings)
        loc_today_rev = sum(float(b.amount or 0) for b in loc_valid_bookings if b.booking_date and b.booking_date >= today_start)
        loc_weekly_rev = sum(float(b.amount or 0) for b in loc_valid_bookings if b.booking_date and b.booking_date >= seven_days_ago)
        loc_monthly_rev = sum(float(b.amount or 0) for b in loc_valid_bookings if b.booking_date and b.booking_date >= thirty_days_ago)
        loc_yearly_rev = sum(float(b.amount or 0) for b in loc_valid_bookings if b.booking_date and b.booking_date >= year_start)

        facility_breakdowns.append({
            "id": loc.id,
            "name": loc.name,
            "address": loc.address,
            "hourly_rate": loc.hourly_rate,
            "total_slots": loc.total_slots,
            "available_slots": loc_avail,
            "booked_count": loc_booked,
            "entered_count": loc_entered,
            "maintenance_count": loc_maint,
            "occupancy_rate": min(occ_rate, 100),
            "total_revenue": loc_total_rev,
            "today_revenue": loc_today_rev,
            "weekly_revenue": loc_weekly_rev,
            "monthly_revenue": loc_monthly_rev,
            "yearly_revenue": loc_yearly_rev,
            "verification_status": loc.verification_status,
            "image": loc.image,
            "image_url": loc.image,
            "inside_image": getattr(loc, "inside_image", None),
            "inside_image_url": getattr(loc, "inside_image", None)
        })

    live_bookings_data = []
    for b in all_bookings[:50]:
        cust = db.query(User).filter(User.id == b.user_id).first()
        veh = db.query(Vehicle).filter(Vehicle.user_id == b.user_id).first()
        s_obj = db.query(ParkingSlot).filter(ParkingSlot.id == b.slot_id).first() if b.slot_id else None
        p_obj = next((l for l in locations if l.id == b.parking_location_id), None)

        st_upper = str(b.status or "BOOKED").upper().strip()
        is_inside = getattr(b, "is_inside", False) or (st_upper in ["ACTIVE", "PARKED", "CHECKED_IN"])
        is_entered = is_inside
        is_booked = st_upper in ["BOOKED", "CONFIRMED"]

        live_bookings_data.append({
            "id": b.id,
            "booking_id": b.id,
            "user_id": b.user_id,
            "customer_name": cust.name if cust else "Driver",
            "customer_email": cust.email if cust else "N/A",
            "vehicle_number": veh.vehicle_number if veh else "MH-01-AB-1234",
            "vehicle_name": veh.vehicle_name if veh else "Vehicle",
            "vehicle_type": veh.vehicle_type if veh else "4-Wheeler",
            "parking_location_id": b.parking_location_id,
            "parking_name": p_obj.name if p_obj else "Parking Facility",
            "slot_id": b.slot_id,
            "slot_number": s_obj.slot_number if s_obj else "A-1",
            "booking_date": str(b.booking_date),
            "start_time": str(b.start_time) if b.start_time else "Now",
            "end_time": str(b.end_time) if b.end_time else "Open",
            "amount": float(b.amount or 0),
            "status": st_upper,
            "is_entered": is_entered,
            "is_inside": is_inside,
            "is_booked": is_booked,
            "pass_type": getattr(b, "pass_type", "HOURLY") or "HOURLY",
            "entry_count": getattr(b, "entry_count", 0) or 0,
            "last_exit_rule": getattr(b, "last_exit_rule", None) or (p_obj.last_exit_time if p_obj else None),
        })

    return {
        "total_facilities": len(locations),
        "total_slots": total_slots_count,
        "available_slots": available_slots_count,
        "booked_count": booked_count,
        "entered_count": entered_count,
        "completed_count": completed_count,
        "maintenance_slots": maintenance_slots_count,
        "total_revenue": total_revenue,
        "today_revenue": today_revenue,
        "weekly_revenue": weekly_revenue,
        "monthly_revenue": monthly_revenue,
        "yearly_revenue": yearly_revenue,
        "revenue_breakdowns": {
            "today": today_hours,
            "weekly": weekly_days,
            "monthly": monthly_weeks,
            "yearly": yearly_months,
        },
        "facilities": facility_breakdowns,
        "live_bookings": live_bookings_data,
    }


# =========================================================
# GET REVENUE ANALYTICS SPECIFIC ENDPOINT
# GET /owner/revenue-analytics
# =========================================================

@router.get("/revenue-analytics")
def get_revenue_analytics(
    db: Session = Depends(get_db),
    user=Depends(owner_required)
):
    dashboard = get_owner_live_dashboard(db=db, user=user)
    return {
        "total_revenue": dashboard.get("total_revenue", 0),
        "today_revenue": dashboard.get("today_revenue", 0),
        "weekly_revenue": dashboard.get("weekly_revenue", 0),
        "monthly_revenue": dashboard.get("monthly_revenue", 0),
        "yearly_revenue": dashboard.get("yearly_revenue", 0),
        "breakdowns": dashboard.get("revenue_breakdowns", {}),
    }


# =========================================================
# UPDATE PARKING
# PUT /owner/update-parking/{parking_id}
# =========================================================

@router.put("/update-parking/{parking_id}")
def update_owner_parking(
    parking_id: int,
    parking: ParkingUpdate,
    db: Session = Depends(get_db),
    user=Depends(owner_required)
):

    if parking.total_slots <= 0:
        raise HTTPException(
            status_code=400,
            detail="Total slots must be greater than 0"
        )

    location = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.id == parking_id,
            ParkingLocation.owner_id == user.id
        )
        .first()
    )

    if not location:
        raise HTTPException(
            status_code=404,
            detail="Parking location not found"
        )

    slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking_id
        )
        .order_by(ParkingSlot.id)
        .all()
    )

    old_total = len(slots)
    new_total = parking.total_slots

    # -----------------------------------------------------
    # REDUCE SLOTS
    # -----------------------------------------------------

    if new_total < old_total:

        slots_to_remove = slots[new_total:]

        unavailable_slots = [
            slot
            for slot in slots_to_remove
            if slot.status != "AVAILABLE"
        ]

        if unavailable_slots:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Cannot reduce slots because some "
                    "of the slots to be removed are "
                    "currently booked or occupied."
                )
            )

        for slot in slots_to_remove:
            db.delete(slot)

    # -----------------------------------------------------
    # INCREASE SLOTS
    # -----------------------------------------------------

    elif new_total > old_total:

        for number in range(
            old_total + 1,
            new_total + 1
        ):

            new_slot = ParkingSlot(
                parking_id=parking_id,
                slot_number=f"A-{number}",
                status="AVAILABLE"
            )

            db.add(new_slot)

    # -----------------------------------------------------
    # UPDATE PARKING DETAILS
    # -----------------------------------------------------

    location.name = parking.name.strip()
    location.address = parking.address.strip()
    location.latitude = parking.latitude
    location.longitude = parking.longitude
    location.total_slots = new_total

    db.commit()
    db.refresh(location)

    return {
        "message": "Parking updated successfully",
        "parking_id": location.id,
        "name": location.name,
        "address": location.address,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "total_slots": location.total_slots
    }


# =========================================================
# DELETE PARKING
# DELETE /owner/delete-parking/{parking_id}
# =========================================================

@router.delete("/delete-parking/{parking_id}")
def delete_owner_parking(
    parking_id: int,
    db: Session = Depends(get_db),
    user=Depends(owner_required)
):

    location = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.id == parking_id,
            ParkingLocation.owner_id == user.id
        )
        .first()
    )

    if not location:

        raise HTTPException(
            status_code=404,
            detail="Parking location not found"
        )

    slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking_id
        )
        .all()
    )

    # -----------------------------------------------------
    # DON'T DELETE IF SLOT IS OCCUPIED/BOOKED
    # -----------------------------------------------------

    unavailable_slots = [
        slot
        for slot in slots
        if slot.status != "AVAILABLE"
    ]

    if unavailable_slots:

        raise HTTPException(
            status_code=400,
            detail=(
                "Cannot delete this parking because "
                "one or more slots are currently "
                "booked or occupied."
            )
        )

    # -----------------------------------------------------
    # DELETE SLOTS
    # -----------------------------------------------------

    for slot in slots:
        db.delete(slot)

    # -----------------------------------------------------
    # DELETE PARKING
    # -----------------------------------------------------

    db.delete(location)

    db.commit()

    return {
        "message": "Parking deleted successfully",
        "parking_id": parking_id
    }


# =========================================================
# GET PARKING SLOTS
# GET /owner/slots/{parking_id}
# =========================================================

@router.get("/slots/{parking_id}")
def get_owner_slots(
    parking_id: int,
    db: Session = Depends(get_db),
    user=Depends(owner_required)
):

    location = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.id == parking_id,
            ParkingLocation.owner_id == user.id
        )
        .first()
    )

    if not location:

        raise HTTPException(
            status_code=404,
            detail="Parking location not found"
        )

    slots = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.parking_id == parking_id
        )
        .order_by(ParkingSlot.id)
        .all()
    )

    return [
        {
            "id": slot.id,
            "slot_number": slot.slot_number,
            "status": slot.status
        }
        for slot in slots
    ]