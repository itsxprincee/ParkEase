from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    owner_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    vehicle_type = Column(
        String(20),
        nullable=False
    )

    vehicle_name = Column(
        String(100),
        nullable=False
    )

    vehicle_number = Column(
        String(30),
        nullable=False
    )

    user = relationship(
        "User",
        back_populates="vehicles"
    )