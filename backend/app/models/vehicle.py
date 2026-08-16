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

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    vehicle_number = Column(
        String(50),
        nullable=False
    )

    vehicle_type = Column(
        String(50),
        nullable=True
    )

    vehicle_name = Column(
        String(100),
        nullable=True
    )

    # =====================================================
    # RELATIONSHIP
    # =====================================================

    user = relationship(
        "User",
        back_populates="vehicles"
    )