from sqlalchemy import Column, Integer, String, ForeignKey

from database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    parking_id = Column(
        Integer,
        ForeignKey("parking_locations.id"),
        nullable=False,
        index=True
    )

    # Only one review per completed booking
    booking_id = Column(
        Integer,
        ForeignKey("bookings.id"),
        nullable=False,
        unique=True,
        index=True
    )

    rating = Column(
        Integer,
        nullable=False
    )

    comment = Column(
        String(500),
        nullable=False
    )