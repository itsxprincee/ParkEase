import sys
sys.path.append(r"c:\Users\princ\Downloads\ParkEase\backend")

from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.parking import ParkingLocation, ParkingSlot
from app.models.booking import Booking
from app.models.review import Review

from database import SessionLocal
from app.routes.parking import ensure_parking_slots

db = SessionLocal()
try:
    locations = db.query(ParkingLocation).all()
    print(f"Total Parking Locations in DB: {len(locations)}")
    for loc in locations:
        ensure_parking_slots(loc, db)
        total_slots = loc.total_slots
        created_slots = db.query(ParkingSlot).filter(ParkingSlot.parking_id == loc.id).count()
        available_slots = db.query(ParkingSlot).filter(ParkingSlot.parking_id == loc.id, ParkingSlot.status == "AVAILABLE").count()
        print(f"Location ID={loc.id}, Name='{loc.name}', Status={loc.verification_status}: total_slots={total_slots}, created={created_slots}, available={available_slots}")
finally:
    db.close()
