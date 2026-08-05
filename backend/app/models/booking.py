from sqlalchemy import Column, Integer, String, DateTime
from database import Base
from datetime import datetime


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        nullable=False
    )

    slot_id = Column(
        Integer,
        nullable=False
    )

    vehicle_number = Column(
        String(50),
        nullable=False
    )

    booking_time = Column(
        DateTime,
        default=datetime.utcnow
    )

    status = Column(
        String(20),
        default="confirmed"
    )