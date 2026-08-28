from database import SessionLocal
from app.models.user import User
from app.models.parking import ParkingLocation, ParkingSlot
from app.models.vehicle import Vehicle
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_demo_data():
    db = SessionLocal()
    try:
        print("\n[SEEDER] Running comprehensive demo data sync...")

        # 1. Ensure owner and customer exist
        owner = db.query(User).filter(User.email == "owner@parkease.io").first()
        if not owner:
            owner = User(
                name="Facility Owner",
                email="owner@parkease.io",
                hashed_password=pwd_context.hash("password123"),
                role="owner",
                is_verified=True
            )
            db.add(owner)
            db.commit()
            db.refresh(owner)

        customer = db.query(User).filter(User.email == "customer@parkease.io").first()
        if not customer:
            customer = User(
                name="City Driver",
                email="customer@parkease.io",
                hashed_password=pwd_context.hash("password123"),
                role="customer",
                is_verified=True
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)

        admin = db.query(User).filter(User.email == "admin@parkease.io").first()
        if not admin:
            admin = User(
                name="Admin User",
                email="admin@parkease.io",
                hashed_password=pwd_context.hash("password123"),
                role="admin",
                is_verified=True
            )
            db.add(admin)
            db.commit()

        # 2. Add Customer Vehicles
        if db.query(Vehicle).filter(Vehicle.user_id == customer.id).count() == 0:
            vehicles = [
                Vehicle(user_id=customer.id, vehicle_number="MH 02 AB 1234", vehicle_type="Car", vehicle_name="Tata Nexon EV"),
                Vehicle(user_id=customer.id, vehicle_number="KA 01 XY 9876", vehicle_type="Car", vehicle_name="Hyundai Creta"),
                Vehicle(user_id=customer.id, vehicle_number="DL 05 EV 5555", vehicle_type="Bike", vehicle_name="Ather 450X"),
            ]
            for v in vehicles:
                db.add(v)
            db.commit()

        # 3. Add Parking Facilities
        facilities = [
            {
                "name": "Phoenix Marketcity Hub",
                "address": "LBS Marg, Kurla West, Mumbai, Maharashtra 400070",
                "latitude": 19.0864,
                "longitude": 72.8890,
                "total_slots": 12,
                "hourly_rate": 50.0,
                "daily_rate": 120.0,
                "pricing_type": "BOTH",
                "supported_vehicles": "BOTH",
                "has_ev": False,
                "has_cctv": True,
                "has_security_guard": True,
                "has_covered_roof": True,
                "is_24_7": True,
                "has_valet": False,
                "allow_multi_entry": True,
                "last_exit_time": "11:00 PM",
                "verification_status": "APPROVED",
            },
            {
                "name": "Nexus Grand Tech Hub",
                "address": "Hosur Road, Koramangala, Bengaluru, Karnataka 560095",
                "latitude": 12.9352,
                "longitude": 77.6245,
                "total_slots": 10,
                "hourly_rate": 40.0,
                "daily_rate": 100.0,
                "pricing_type": "BOTH",
                "supported_vehicles": "CAR",
                "has_ev": False,
                "has_cctv": True,
                "has_security_guard": True,
                "has_covered_roof": True,
                "is_24_7": True,
                "has_valet": False,
                "allow_multi_entry": True,
                "last_exit_time": "11:30 PM",
                "verification_status": "APPROVED",
            },
            {
                "name": "DLF CyberHub Smart Parking",
                "address": "DLF Phase 2, Sector 24, Gurugram, Haryana 122002",
                "latitude": 28.4950,
                "longitude": 77.0895,
                "total_slots": 15,
                "hourly_rate": 60.0,
                "daily_rate": 150.0,
                "pricing_type": "BOTH",
                "supported_vehicles": "BOTH",
                "has_ev": False,
                "has_cctv": True,
                "has_security_guard": True,
                "has_covered_roof": True,
                "is_24_7": True,
                "has_valet": False,
                "allow_multi_entry": True,
                "last_exit_time": "11:00 PM",
                "verification_status": "APPROVED",
            },
            {
                "name": "Inorbit Prime Deck",
                "address": "Mindspace, HITEC City, Hyderabad, Telangana 500081",
                "latitude": 17.4348,
                "longitude": 78.3867,
                "total_slots": 8,
                "hourly_rate": 35.0,
                "daily_rate": 90.0,
                "pricing_type": "BOTH",
                "supported_vehicles": "BIKE",
                "has_ev": False,
                "has_cctv": True,
                "has_security_guard": True,
                "has_covered_roof": True,
                "is_24_7": True,
                "has_valet": False,
                "allow_multi_entry": True,
                "last_exit_time": "10:30 PM",
                "verification_status": "APPROVED",
            },
        ]

        for f_data in facilities:
            facility = db.query(ParkingLocation).filter(ParkingLocation.name == f_data["name"]).first()
            if not facility:
                facility = ParkingLocation(
                    owner_id=owner.id,
                    **f_data
                )
                db.add(facility)
                db.commit()
                db.refresh(facility)

            # Ensure slots exist for this facility
            existing_slots = db.query(ParkingSlot).filter(ParkingSlot.parking_id == facility.id).count()
            if existing_slots == 0:
                for i in range(1, facility.total_slots + 1):
                    slot_num = f"A{i:02d}"
                    is_occupied = (i > 8)
                    slot = ParkingSlot(
                        parking_id=facility.id,
                        slot_number=slot_num,
                        vehicle_type="Bike" if facility.supported_vehicles == "BIKE" else "Car",
                        is_ev=False,
                        status="OCCUPIED" if is_occupied else "AVAILABLE"
                    )
                    db.add(slot)
                db.commit()

        print(f"[SEEDER] Successfully synchronized facilities and slots!")

    except Exception as e:
        print(f"[SEEDER ERROR]: {e}")
        db.rollback()
    finally:
        db.close()
