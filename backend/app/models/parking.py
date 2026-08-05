from sqlalchemy import Column, Integer, String, Float
from database import Base


class ParkingLocation(Base):
    __tablename__ = "parking_locations"

    id = Column(Integer, primary_key=True, index=True)

    owner_id = Column(
        Integer,
        nullable=False
    )

    name = Column(
        String(100),
        nullable=False
    )

    address = Column(
        String(255),
        nullable=False
    )

    latitude = Column(Float)

    longitude = Column(Float)

    total_slots = Column(
        Integer,
        default=0
    )


class ParkingSlot(Base):
    __tablename__ = "parking_slots"

    id = Column(Integer, primary_key=True, index=True)

    location_id = Column(
        Integer,
        nullable=False
    )

    slot_number = Column(
        String(20),
        nullable=False
    )

    status = Column(
        String(20),
        default="available"
    )