from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from pathlib import Path
import os

from database import get_db
from app.models.user import User

# Load .env
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# =========================================================
# SECURITY
# =========================================================

security = HTTPBearer()

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "parkease_secret_key"
)

ALGORITHM = "HS256"


# =========================================================
# GET CURRENT USER
# =========================================================

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

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        user = (
            db.query(User)
            .filter(User.id == int(user_id))
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        return user

    except HTTPException:
        raise

    except Exception as error:

        print("Authentication error:", error)

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


# =========================================================
# ADMIN REQUIRED
# =========================================================

def admin_required(
    user: User = Depends(get_current_user)
):

    if user.role != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return user


# =========================================================
# OWNER REQUIRED
# =========================================================

def owner_required(
    user: User = Depends(get_current_user)
):

    if user.role not in ["owner", "admin"]:

        raise HTTPException(
            status_code=403,
            detail="Owner access required"
        )

    return user