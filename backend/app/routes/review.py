from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db

from app.models.review import Review
from app.models.booking import Booking
from app.models.parking import ParkingLocation
from app.models.user import User

from app.utils.auth import get_current_user


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/review",
    tags=["Reviews"]
)


# =========================================================
# ADD REVIEW
#
# Only customers who:
# 1. Booked the parking
# 2. Own the booking
# 3. Have COMPLETED the booking / exited
# can submit a review.
# =========================================================

@router.post("/add")
@router.post("/")
@router.post("")
def add_review(
    data: dict,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    # -----------------------------------------------------
    # GET DATA
    # -----------------------------------------------------

    booking_id = data.get("booking_id")
    parking_id = data.get("parking_id")
    rating = data.get("rating")
    comment = data.get("comment", "").strip()

    # -----------------------------------------------------
    # VALIDATE RATING
    # -----------------------------------------------------

    if rating is None:
        raise HTTPException(
            status_code=400,
            detail="Rating is required"
        )

    try:
        rating = int(rating)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=400,
            detail="Rating must be a number between 1 and 5"
        )

    if rating < 1 or rating > 5:
        raise HTTPException(
            status_code=400,
            detail="Rating must be between 1 and 5"
        )

    # -----------------------------------------------------
    # VALIDATE COMMENT
    # -----------------------------------------------------

    if not comment:
        raise HTTPException(
            status_code=400,
            detail="Review comment is required"
        )

    if len(comment) > 500:
        raise HTTPException(
            status_code=400,
            detail="Review comment cannot exceed 500 characters"
        )

    # -----------------------------------------------------
    # GET BOOKING OR FIND LATEST USER BOOKING FOR PARKING
    # -----------------------------------------------------

    booking = None
    if booking_id:
        booking = (
            db.query(Booking)
            .filter(
                Booking.id == booking_id,
                Booking.user_id == user.id
            )
            .first()
        )
    elif parking_id:
        booking = (
            db.query(Booking)
            .filter(
                Booking.parking_location_id == parking_id,
                Booking.user_id == user.id
            )
            .order_by(Booking.id.desc())
            .first()
        )

    if not booking:
        # Check if user has any booking or if parking exists
        if parking_id:
            p_check = db.query(ParkingLocation).filter(ParkingLocation.id == parking_id).first()
            if not p_check:
                raise HTTPException(status_code=404, detail="Parking facility not found")
            raise HTTPException(
                status_code=400,
                detail="You need a booking at this facility to submit a verified driver review."
            )
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    parking_id = booking.parking_location_id

    # -----------------------------------------------------
    # CHECK IF REVIEW ALREADY EXISTS FOR THIS BOOKING
    # -----------------------------------------------------

    existing_review = (
        db.query(Review)
        .filter(
            Review.booking_id == booking.id
        )
        .first()
    )

    if existing_review:
        # Update existing review with latest feedback
        existing_review.rating = rating
        existing_review.comment = comment
        db.commit()
        db.refresh(existing_review)
        return {
            "success": True,
            "message": "Review updated successfully",
            "review": {
                "id": existing_review.id,
                "booking_id": existing_review.booking_id,
                "parking_id": existing_review.parking_id,
                "rating": existing_review.rating,
                "comment": existing_review.comment
            }
        }

    # -----------------------------------------------------
    # CREATE REVIEW
    # -----------------------------------------------------

    new_review = Review(
        user_id=user.id,
        parking_id=parking_id,
        booking_id=booking.id,
        rating=rating,
        comment=comment
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {
        "success": True,
        "message": "Review submitted successfully",
        "review": {
            "id": new_review.id,
            "booking_id": new_review.booking_id,
            "parking_id": new_review.parking_id,
            "rating": new_review.rating,
            "comment": new_review.comment
        }
    }


# =========================================================
# GET ALL REVIEWS FOR A PARKING LOCATION
# =========================================================

@router.get("/{parking_id}")
def get_parking_reviews(
    parking_id: int,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # CHECK PARKING EXISTS
    # -----------------------------------------------------

    parking = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.id == parking_id
        )
        .first()
    )

    if not parking:
        raise HTTPException(
            status_code=404,
            detail="Parking location not found"
        )

    # -----------------------------------------------------
    # GET REVIEWS
    # -----------------------------------------------------

    reviews = (
        db.query(Review, User.name)
        .outerjoin(User, Review.user_id == User.id)
        .filter(
            Review.parking_id == parking_id
        )
        .order_by(
            Review.id.desc()
        )
        .all()
    )

    # -----------------------------------------------------
    # CALCULATE AVERAGE RATING
    # -----------------------------------------------------

    average_rating = (
        db.query(
            func.avg(Review.rating)
        )
        .filter(
            Review.parking_id == parking_id
        )
        .scalar()
    )

    # -----------------------------------------------------
    # FORMAT REVIEWS
    # -----------------------------------------------------

    review_list = []

    for review, user_name in reviews:

        review_list.append(
            {
                "id": review.id,
                "user_id": review.user_id,
                "user_name": user_name or "Verified Driver",
                "booking_id": review.booking_id,
                "parking_id": review.parking_id,
                "rating": review.rating,
                "comment": review.comment
            }
        )

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {
        "success": True,
        "parking_id": parking_id,
        "total_reviews": len(reviews),
        "average_rating": (
            round(float(average_rating), 1)
            if average_rating is not None
            else 0
        ),
        "reviews": review_list
    }


# =========================================================
# CHECK WHETHER CURRENT USER CAN REVIEW A BOOKING
#
# Useful for the frontend to decide whether to show the
# "Write a Review" button.
# =========================================================

@router.get("/can-review/{booking_id}")
def can_review_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    # -----------------------------------------------------
    # GET USER'S BOOKING
    # -----------------------------------------------------

    booking = (
        db.query(Booking)
        .filter(
            Booking.id == booking_id,
            Booking.user_id == user.id
        )
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    # -----------------------------------------------------
    # CHECK BOOKING STATUS
    # -----------------------------------------------------

    booking_status = str(
        booking.status or ""
    ).upper()

    if booking_status != "COMPLETED":

        return {
            "can_review": False,
            "reason": (
                "You can review this parking only after "
                "exiting and completing your booking"
            )
        }

    # -----------------------------------------------------
    # CHECK EXISTING REVIEW
    # -----------------------------------------------------

    existing_review = (
        db.query(Review)
        .filter(
            Review.booking_id == booking.id
        )
        .first()
    )

    if existing_review:

        return {
            "can_review": False,
            "reason": "You have already reviewed this booking",
            "review_id": existing_review.id
        }

    # -----------------------------------------------------
    # USER CAN REVIEW
    # -----------------------------------------------------

    return {
        "can_review": True,
        "booking_id": booking.id,
        "parking_id": booking.parking_location_id
    }