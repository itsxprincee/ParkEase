# app/models/__init__.py

from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.parking import ParkingLocation, ParkingSlot
from app.models.booking import Booking
from app.models.review import Review

__all__ = [
    "User",
    "Vehicle",
    "ParkingLocation",
    "ParkingSlot",
    "Booking",
    "Review",
]