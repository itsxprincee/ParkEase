from pydantic import BaseModel, Field
from typing import Literal


class VehicleCreate(BaseModel):
    vehicle_type: Literal["car", "bike"]
    vehicle_name: str = Field(..., min_length=1, max_length=100)
    vehicle_number: str = Field(..., min_length=1, max_length=30)


class VehicleUpdate(BaseModel):
    vehicle_type: Literal["car", "bike"]
    vehicle_name: str = Field(..., min_length=1, max_length=100)
    vehicle_number: str = Field(..., min_length=1, max_length=30)


class VehicleResponse(BaseModel):
    id: int
    vehicle_type: str
    vehicle_name: str
    vehicle_number: str

    class Config:
        from_attributes = True