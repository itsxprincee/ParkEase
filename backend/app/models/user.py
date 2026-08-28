from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    hashed_password = Column(
        String(255),
        nullable=False
    )

    role = Column(
        String(20),
        nullable=False,
        default="customer"
    )

    phone = Column(
        String(20),
        nullable=True
    )

    emergency_contact_name = Column(
        String(100),
        nullable=True
    )

    emergency_contact_phone = Column(
        String(20),
        nullable=True
    )

    emergency_contact_note = Column(
        String(255),
        nullable=True
    )

    # =====================================================
    # EMAIL VERIFICATION
    # =====================================================

    is_verified = Column(
        Boolean,
        nullable=False,
        default=False
    )

    verification_otp = Column(
        String(6),
        nullable=True
    )

    otp_expires_at = Column(
        DateTime,
        nullable=True
    )

    # =====================================================
    # PARKING LOCATIONS
    # =====================================================

    parking_locations = relationship(
        "ParkingLocation",
        back_populates="owner",
        cascade="all, delete-orphan"
    )

    # =====================================================
    # BOOKINGS
    # =====================================================

    bookings = relationship(
        "Booking",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # =====================================================
    # VEHICLES
    # IMPORTANT:
    # Vehicle.user must use:
    # back_populates="vehicles"
    # =====================================================

    vehicles = relationship(
        "Vehicle",
        back_populates="user",
        cascade="all, delete-orphan"
    )