from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from sqlalchemy.orm import Session

from database import get_db
from app.models.user import User
import os


security = HTTPBearer()


SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "parkease_secret_key"
)

ALGORITHM = "HS256"


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")


        user = db.query(User).filter(
            User.id == int(user_id)
        ).first()


        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )


        return user


    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )



def admin_required(
    user: User = Depends(get_current_user)
):

    if user.role != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )


    return user

def owner_required(
    user: User = Depends(get_current_user)
):

    if user.role not in ["owner", "admin"]:

        raise HTTPException(
            status_code=403,
            detail="Owner access required"
        )

    return user