from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey
)

from sqlalchemy.orm import relationship

from database import Base


# =========================================================
# PARKING LOCATION
# =========================================================

class ParkingLocation(Base):

    __tablename__ = "parking_locations"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    owner_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    name = Column(
        String(255),
        nullable=False
    )

    address = Column(
        String(500),
        nullable=False
    )

    latitude = Column(
        Float,
        nullable=False
    )

    longitude = Column(
        Float,
        nullable=False
    )

    total_slots = Column(
        Integer,
        nullable=False,
        default=0
    )

    # =====================================================
    # PARKING IMAGE
    # =====================================================

    image = Column(
        String(500),
        nullable=True
    )

    # =====================================================
    # VERIFICATION
    # =====================================================

    verification_status = Column(
        String(20),
        nullable=False,
        default="PENDING"
    )

    verification_submitted_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    verified_at = Column(
        DateTime,
        nullable=True
    )

    rejection_reason = Column(
        String(500),
        nullable=True
    )

    # =====================================================
    # RELATIONSHIPS
    # =====================================================

    owner = relationship(
        "User",
        back_populates="parking_locations"
    )

    slots = relationship(
        "ParkingSlot",
        back_populates="parking_location",
        cascade="all, delete-orphan"
    )

    bookings = relationship(
        "Booking",
        back_populates="parking_location",
        cascade="all, delete-orphan"
    )


# =========================================================
# PARKING SLOT
# =========================================================

class ParkingSlot(Base):

    __tablename__ = "parking_slots"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    parking_id = Column(
        Integer,
        ForeignKey("parking_locations.id"),
        nullable=False,
        index=True
    )

    slot_number = Column(
        String(50),
        nullable=False
    )

    status = Column(
        String(20),
        nullable=False,
        default="AVAILABLE"
    )

    # =====================================================
    # PARKING LOCATION RELATIONSHIP
    # =====================================================

    parking_location = relationship(
        "ParkingLocation",
        back_populates="slots"
    )

    # =====================================================
    # BOOKINGS RELATIONSHIP
    # =====================================================

    bookings = relationship(
        "Booking",
        back_populates="slot"
    )