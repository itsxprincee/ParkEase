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

    # =====================================================
    # USER
    # =====================================================

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # =====================================================
    # PARKING LOCATION
    # =====================================================

    parking_location_id = Column(
        Integer,
        ForeignKey("parking_locations.id"),
        nullable=False,
        index=True
    )

    # =====================================================
    # PARKING SLOT
    # =====================================================

    slot_id = Column(
        Integer,
        ForeignKey("parking_slots.id"),
        nullable=True,
        index=True
    )

    # =====================================================
    # BOOKING DETAILS
    # =====================================================

    booking_date = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
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
        default="active",
        nullable=False
    )

    qr_code = Column(
        String(500),
        nullable=True
    )

    pass_type = Column(
        String(50),
        default="HOURLY",
        nullable=False
    )

    entry_count = Column(
        Integer,
        default=0,
        nullable=False
    )

    is_inside = Column(
        Boolean,
        default=False,
        nullable=False
    )

    last_exit_rule = Column(
        String(50),
        nullable=True
    )

    # =====================================================
    # RELATIONSHIPS
    # =====================================================

    user = relationship(
        "User",
        back_populates="bookings"
    )

    parking_location = relationship(
        "ParkingLocation",
        back_populates="bookings"
    )

    slot = relationship(
        "ParkingSlot",
        back_populates="bookings"
    )