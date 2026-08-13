from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
    Float
)
from sqlalchemy.orm import relationship

from database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # -----------------------------------------------------
    # USER
    # -----------------------------------------------------

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # -----------------------------------------------------
    # PARKING LOCATION
    # -----------------------------------------------------

    parking_location_id = Column(
        Integer,
        ForeignKey("parking_locations.id"),
        nullable=False,
        index=True
    )

    # -----------------------------------------------------
    # SLOT
    # -----------------------------------------------------

    slot_id = Column(
        Integer,
        nullable=True
    )

    # -----------------------------------------------------
    # BOOKING DETAILS
    # -----------------------------------------------------

    booking_date = Column(
        DateTime,
        default=datetime.utcnow
    )

    start_time = Column(
        String(50),
        nullable=True
    )

    end_time = Column(
        String(50),
        nullable=True
    )

    amount = Column(
        Float,
        default=0
    )

    status = Column(
        String(30),
        default="active"
    )

    qr_code = Column(
        String(500),
        nullable=True
    )

    # -----------------------------------------------------
    # RELATIONSHIPS
    # -----------------------------------------------------

    user = relationship(
        "User",
        back_populates="bookings"
    )

    parking_location = relationship(
        "ParkingLocation",
        back_populates="bookings"
    )