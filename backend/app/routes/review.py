from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from sqlalchemy import func

from database import get_db
from app.models.review import Review
from app.models.parking import ParkingLocation
from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/review",
    tags=["Reviews"]
)


class ReviewRequest(BaseModel):
    parking_id: int
    rating: int
    comment: str


@router.post("/add")
def add_review(
    review: ReviewRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    if review.rating < 1 or review.rating > 5:
        raise HTTPException(
            status_code=400,
            detail="Rating must be between 1 and 5"
        )

    parking = db.query(ParkingLocation).filter(
        ParkingLocation.id == review.parking_id
    ).first()

    if parking is None:
        raise HTTPException(
            status_code=404,
            detail="Parking not found"
        )

    existing = db.query(Review).filter(
        Review.user_id == user.id,
        Review.parking_id == review.parking_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="You have already reviewed this parking."
        )

    new_review = Review(
        user_id=user.id,
        parking_id=review.parking_id,
        rating=review.rating,
        comment=review.comment
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    return {
        "message": "Review submitted successfully",
        "review_id": new_review.id
    }


@router.get("/{parking_id}")
def get_reviews(
    parking_id: int,
    db: Session = Depends(get_db)
):

    reviews = db.query(Review).filter(
        Review.parking_id == parking_id
    ).all()

    average = db.query(
        func.avg(Review.rating)
    ).filter(
        Review.parking_id == parking_id
    ).scalar()

    data = []

    for review in reviews:
        data.append({
            "id": review.id,
            "user_id": review.user_id,
            "rating": review.rating,
            "comment": review.comment
        })

    return {
        "average_rating": round(average, 1) if average else 0,
        "total_reviews": len(reviews),
        "reviews": data
    }


@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    review = db.query(Review).filter(
        Review.id == review_id,
        Review.user_id == user.id
    ).first()

    if review is None:
        raise HTTPException(
            status_code=404,
            detail="Review not found"
        )

    db.delete(review)
    db.commit()

    return {
        "message": "Review deleted successfully"
    }