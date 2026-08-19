from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta

from database import get_db
from app.models.user import User

from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from pathlib import Path
import os
import secrets
import smtplib


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE)


# =========================================================
# DEBUG SMTP CONFIGURATION
# =========================================================

print("========================================")
print("ParkEase SMTP Configuration")
print("ENV FILE:", ENV_FILE)
print("ENV EXISTS:", ENV_FILE.exists())
print("SMTP EMAIL:", os.getenv("SMTP_EMAIL"))
print(
    "SMTP PASSWORD SET:",
    bool(os.getenv("SMTP_PASSWORD"))
)
print("========================================")


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# =========================================================
# SECURITY
# =========================================================

security = HTTPBearer()


# =========================================================
# PASSWORD
# =========================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# =========================================================
# JWT
# =========================================================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "parkease_secret_key"
)

ALGORITHM = "HS256"


# =========================================================
# EMAIL SETTINGS
# =========================================================

SMTP_HOST = os.getenv(
    "SMTP_HOST",
    "smtp.gmail.com"
)

SMTP_PORT = int(
    os.getenv(
        "SMTP_PORT",
        "587"
    )
)

SMTP_EMAIL = os.getenv(
    "SMTP_EMAIL",
    ""
)

SMTP_PASSWORD = os.getenv(
    "SMTP_PASSWORD",
    ""
)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173"
)


# =========================================================
# SIGNUP OTP STORAGE
# =========================================================

signup_otps = {}


# =========================================================
# VERIFIED SIGNUP EMAILS
# =========================================================

verified_signup = {}


# =========================================================
# SCHEMAS
# =========================================================

class SendSignupOTPRequest(BaseModel):
    name: str
    email: EmailStr
    role: str = "customer"


class VerifySignupOTPRequest(BaseModel):
    email: EmailStr
    otp: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "customer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# =========================================================
# GET CURRENT USER
# =========================================================
#
# Used by:
#
# app/routes/vehicle.py
#
# This reads the JWT sent by the frontend:
#
# Authorization: Bearer <token>
#
# =========================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    # -----------------------------------------------------
    # DECODE JWT
    # -----------------------------------------------------

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    # -----------------------------------------------------
    # GET USER ID
    # -----------------------------------------------------

    user_id = payload.get("sub")

    if not user_id:

        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    # -----------------------------------------------------
    # FIND USER
    # -----------------------------------------------------

    try:
        user_id = int(user_id)

    except (TypeError, ValueError):

        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    current_user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not current_user:

        raise HTTPException(
            status_code=401,
            detail="User account not found.",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    return current_user


# =========================================================
# EMAIL VALIDATION
# =========================================================

def check_smtp_configuration():

    if not SMTP_EMAIL:

        raise Exception(
            "SMTP_EMAIL is not configured."
        )

    if not SMTP_PASSWORD:

        raise Exception(
            "SMTP_PASSWORD is not configured."
        )


# =========================================================
# SEND EMAIL
# =========================================================

def send_email(
    recipient_email: str,
    subject: str,
    html_content: str
):

    check_smtp_configuration()

    message = MIMEMultipart(
        "alternative"
    )

    message["Subject"] = subject
    message["From"] = SMTP_EMAIL
    message["To"] = recipient_email

    message.attach(
        MIMEText(
            html_content,
            "html"
        )
    )

    with smtplib.SMTP(
        SMTP_HOST,
        SMTP_PORT,
        timeout=30
    ) as server:

        server.ehlo()

        server.starttls()

        server.ehlo()

        server.login(
            SMTP_EMAIL,
            SMTP_PASSWORD
        )

        server.sendmail(
            SMTP_EMAIL,
            recipient_email,
            message.as_string()
        )


# =========================================================
# SEND SIGNUP OTP EMAIL
# =========================================================

def send_signup_otp_email(
    recipient_email: str,
    otp: str
):

    html = f"""
<html>

    <body style="
        margin:0;
        padding:0;
        background:#f3f4f6;
        font-family:Arial,sans-serif;
    ">

        <div style="
            max-width:600px;
            margin:40px auto;
            background:white;
            border-radius:20px;
            padding:40px;
            box-shadow:0 8px 30px rgba(0,0,0,0.08);
        ">

            <div style="
                width:55px;
                height:55px;
                border-radius:15px;
                background:#2563eb;
                color:white;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:28px;
                font-weight:bold;
                margin-bottom:20px;
            ">
                P
            </div>

            <h1 style="
                color:#111827;
                margin:0 0 8px 0;
            ">
                Verify your email
            </h1>

            <p style="
                color:#6b7280;
                font-size:15px;
                line-height:1.6;
            ">
                Welcome to ParkEase.
                Use the verification code below
                to verify your email address.
            </p>

            <div style="
                margin:30px 0;
                padding:22px;
                background:#eff6ff;
                border:1px solid #dbeafe;
                border-radius:15px;
                text-align:center;
            ">

                <p style="
                    margin:0 0 8px 0;
                    color:#6b7280;
                    font-size:13px;
                ">
                    Your verification code
                </p>

                <div style="
                    font-size:36px;
                    letter-spacing:10px;
                    font-weight:bold;
                    color:#2563eb;
                ">
                    {otp}
                </div>

            </div>

            <p style="
                color:#6b7280;
                font-size:13px;
                line-height:1.5;
            ">
                This OTP is valid for 10 minutes.
            </p>

            <p style="
                color:#9ca3af;
                font-size:12px;
                margin-top:30px;
            ">
                If you did not request this verification,
                you can safely ignore this email.
            </p>

            <hr style="
                border:none;
                border-top:1px solid #e5e7eb;
                margin:30px 0;
            ">

            <p style="
                color:#9ca3af;
                font-size:12px;
            ">
                © 2026 ParkEase
            </p>

        </div>

    </body>

</html>
"""

    send_email(
        recipient_email,
        "Verify your ParkEase email",
        html
    )


# =========================================================
# SEND SIGNUP OTP
# =========================================================

@router.post("/send-signup-otp")
def send_signup_otp(
    request: SendSignupOTPRequest,
    db: Session = Depends(get_db)
):

    email = request.email.strip().lower()
    name = request.name.strip()
    role = request.role.strip().lower()

    # -----------------------------------------------------
    # VALIDATE NAME
    # -----------------------------------------------------

    if not name:

        raise HTTPException(
            status_code=400,
            detail="Please enter your name."
        )

    # -----------------------------------------------------
    # VALIDATE ROLE
    # -----------------------------------------------------

    if role not in [
        "customer",
        "owner"
    ]:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid role. Choose customer or owner."
            )
        )

    # -----------------------------------------------------
    # CHECK EXISTING USER
    # -----------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail=(
                "An account with this email already "
                "exists. Please sign in."
            )
        )

    # -----------------------------------------------------
    # GENERATE OTP
    # -----------------------------------------------------

    otp = str(
        secrets.randbelow(900000) + 100000
    )

    expires_at = (
        datetime.utcnow()
        + timedelta(minutes=10)
    )

    # -----------------------------------------------------
    # STORE OTP
    # -----------------------------------------------------

    signup_otps[email] = {

        "otp": otp,

        "name": name,

        "role": role,

        "expires_at": expires_at,

        "attempts": 0
    }

    # -----------------------------------------------------
    # REMOVE OLD VERIFICATION
    # -----------------------------------------------------

    verified_signup.pop(
        email,
        None
    )

    # -----------------------------------------------------
    # SEND EMAIL
    # -----------------------------------------------------

    try:

        send_signup_otp_email(
            email,
            otp
        )

    except Exception as error:

        print(
            "Signup OTP email error:",
            error
        )

        signup_otps.pop(
            email,
            None
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to send verification email. "
                "Please check the Gmail SMTP configuration."
            )
        )

    return {
        "message":
            "Verification OTP sent successfully.",

        "email":
            email,

        "expires_in":
            600
    }


# =========================================================
# VERIFY SIGNUP OTP
# =========================================================

@router.post("/verify-signup-otp")
def verify_signup_otp(
    request: VerifySignupOTPRequest
):

    email = request.email.strip().lower()
    otp = request.otp.strip()

    # -----------------------------------------------------
    # CHECK OTP REQUEST
    # -----------------------------------------------------

    otp_data = signup_otps.get(
        email
    )

    if not otp_data:

        raise HTTPException(
            status_code=400,
            detail=(
                "No verification code found. "
                "Please request a new OTP."
            )
        )

    # -----------------------------------------------------
    # CHECK EXPIRATION
    # -----------------------------------------------------

    if datetime.utcnow() > otp_data["expires_at"]:

        signup_otps.pop(
            email,
            None
        )

        raise HTTPException(
            status_code=400,
            detail=(
                "This OTP has expired. "
                "Please request a new OTP."
            )
        )

    # -----------------------------------------------------
    # CHECK ATTEMPTS
    # -----------------------------------------------------

    if otp_data["attempts"] >= 5:

        signup_otps.pop(
            email,
            None
        )

        raise HTTPException(
            status_code=400,
            detail=(
                "Too many incorrect attempts. "
                "Please request a new OTP."
            )
        )

    # -----------------------------------------------------
    # VERIFY OTP
    # -----------------------------------------------------

    if otp != otp_data["otp"]:

        otp_data["attempts"] += 1

        raise HTTPException(
            status_code=400,
            detail="Incorrect verification code."
        )

    # -----------------------------------------------------
    # SAVE VERIFIED EMAIL
    # -----------------------------------------------------

    verified_signup[email] = {

        "name":
            otp_data["name"],

        "role":
            otp_data["role"],

        "verified_at":
            datetime.utcnow()
    }

    # -----------------------------------------------------
    # REMOVE OTP
    # -----------------------------------------------------

    signup_otps.pop(
        email,
        None
    )

    return {

        "message":
            "Email verified successfully.",

        "verified":
            True,

        "email":
            email,

        "name":
            otp_data["name"],

        "role":
            otp_data["role"]
    }


# =========================================================
# REGISTER
# =========================================================

@router.post("/register")
def register(
    user: RegisterRequest,
    db: Session = Depends(get_db)
):

    email = user.email.strip().lower()
    name = user.name.strip()
    role = user.role.strip().lower()

    # -----------------------------------------------------
    # CHECK EMAIL VERIFICATION
    # -----------------------------------------------------

    verification = verified_signup.get(
        email
    )

    if not verification:

        raise HTTPException(
            status_code=400,
            detail=(
                "Please verify your email before "
                "creating your account."
            )
        )

    # -----------------------------------------------------
    # CHECK ROLE
    # -----------------------------------------------------

    if role not in [
        "customer",
        "owner"
    ]:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid role. Choose customer or owner."
            )
        )

    # -----------------------------------------------------
    # CHECK VERIFIED ROLE
    # -----------------------------------------------------

    if verification["role"] != role:

        raise HTTPException(
            status_code=400,
            detail=(
                "Signup information does not match "
                "the verified email."
            )
        )

    # -----------------------------------------------------
    # CHECK EXISTING USER
    # -----------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if existing_user:

        verified_signup.pop(
            email,
            None
        )

        raise HTTPException(
            status_code=400,
            detail=(
                "An account with this email already exists."
            )
        )

    # -----------------------------------------------------
    # VALIDATE PASSWORD
    # -----------------------------------------------------

    if len(user.password) < 6:

        raise HTTPException(
            status_code=400,
            detail=(
                "Password must contain at least "
                "6 characters."
            )
        )

    # -----------------------------------------------------
    # HASH PASSWORD
    # -----------------------------------------------------

    hashed_password = pwd_context.hash(
        user.password
    )

    # -----------------------------------------------------
    # CREATE USER
    # -----------------------------------------------------

    new_user = User(
        name=name,
        email=email,
        hashed_password=hashed_password,
        role=role,
        is_verified=True
    )

    db.add(
        new_user
    )

    db.commit()

    db.refresh(
        new_user
    )

    # -----------------------------------------------------
    # REMOVE VERIFICATION DATA
    # -----------------------------------------------------

    verified_signup.pop(
        email,
        None
    )

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {

        "message":
            "Account created successfully.",

        "user_id":
            new_user.id,

        "user": {

            "id":
                new_user.id,

            "name":
                new_user.name,

            "email":
                new_user.email,

            "role":
                new_user.role
        }
    }


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
def login(
    user: LoginRequest,
    db: Session = Depends(get_db)
):

    email = user.email.strip().lower()

    # -----------------------------------------------------
    # FIND USER
    # -----------------------------------------------------

    db_user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if not db_user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    # -----------------------------------------------------
    # VERIFY PASSWORD
    # -----------------------------------------------------

    if not pwd_context.verify(
        user.password,
        db_user.hashed_password
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    # -----------------------------------------------------
    # CREATE JWT
    # -----------------------------------------------------

    token_data = {

        "sub":
            str(db_user.id),

        "role":
            db_user.role,

        "exp":
            datetime.utcnow()
            + timedelta(days=7)
    }

    token = jwt.encode(
        token_data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {

        "access_token":
            token,

        "token_type":
            "bearer",

        "user": {

            "id":
                db_user.id,

            "name":
                db_user.name,

            "email":
                db_user.email,

            "role":
                db_user.role
        }
    }


# =========================================================
# SEND PASSWORD RESET EMAIL
# =========================================================

def send_reset_email(
    recipient_email: str,
    reset_link: str
):

    html = f"""
<html>

    <body style="
        margin:0;
        padding:0;
        background:#f3f4f6;
        font-family:Arial,sans-serif;
    ">

        <div style="
            max-width:600px;
            margin:40px auto;
            background:white;
            border-radius:20px;
            padding:40px;
            box-shadow:0 8px 30px rgba(0,0,0,0.08);
        ">

            <h1 style="
                color:#2563eb;
                margin-bottom:8px;
            ">
                ParkEase
            </h1>

            <h2>
                Reset your password
            </h2>

            <p style="
                color:#4b5563;
                line-height:1.6;
            ">
                We received a request to reset
                your ParkEase account password.
            </p>

            <div style="
                margin:30px 0;
            ">

                <a
                    href="{reset_link}"
                    style="
                        display:inline-block;
                        padding:14px 24px;
                        background:#2563eb;
                        color:white;
                        text-decoration:none;
                        border-radius:10px;
                        font-weight:bold;
                    "
                >
                    Reset Password
                </a>

            </div>

            <p style="
                color:#6b7280;
                font-size:13px;
                line-height:1.5;
            ">
                This password reset link will
                expire in 15 minutes.
            </p>

            <p style="
                color:#9ca3af;
                font-size:12px;
                margin-top:30px;
            ">
                If you did not request this,
                you can safely ignore this email.
            </p>

            <hr style="
                border:none;
                border-top:1px solid #e5e7eb;
                margin:30px 0;
            ">

            <p style="
                color:#9ca3af;
                font-size:12px;
            ">
                © 2026 ParkEase
            </p>

        </div>

    </body>

</html>
"""

    send_email(
        recipient_email,
        "Reset your ParkEase password",
        html
    )


# =========================================================
# FORGOT PASSWORD
# =========================================================

@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):

    email = request.email.strip().lower()

    db_user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    # -----------------------------------------------------
    # DO NOT REVEAL ACCOUNT EXISTENCE
    # -----------------------------------------------------

    if not db_user:

        return {

            "message":
                "If an account exists with this email, "
                "a password reset link has been sent."
        }

    # -----------------------------------------------------
    # GENERATE RESET TOKEN
    # -----------------------------------------------------

    expires_at = (
        datetime.utcnow()
        + timedelta(minutes=15)
    )

    token_data = {

        "user_id":
            db_user.id,

        "purpose":
            "password_reset",

        "exp":
            expires_at
    }

    signed_token = jwt.encode(
        token_data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    # -----------------------------------------------------
    # CREATE RESET LINK
    # -----------------------------------------------------

    reset_link = (
        f"{FRONTEND_URL}/reset-password"
        f"?token={signed_token}"
    )

    # -----------------------------------------------------
    # SEND EMAIL
    # -----------------------------------------------------

    try:

        send_reset_email(
            db_user.email,
            reset_link
        )

    except Exception as error:

        print(
            "Password reset email error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to send password reset email."
            )
        )

    return {

        "message":
            "If an account exists with this email, "
            "a password reset link has been sent."
    }


# =========================================================
# RESET PASSWORD
# =========================================================

@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # VALIDATE PASSWORD
    # -----------------------------------------------------

    if len(request.new_password) < 6:

        raise HTTPException(
            status_code=400,
            detail=(
                "Password must contain at least "
                "6 characters."
            )
        )

    # -----------------------------------------------------
    # VERIFY TOKEN
    # -----------------------------------------------------

    try:

        token_data = jwt.decode(
            request.token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

    except JWTError:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid or expired reset link."
            )
        )

    # -----------------------------------------------------
    # CHECK PURPOSE
    # -----------------------------------------------------

    if token_data.get(
        "purpose"
    ) != "password_reset":

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid password reset link."
            )
        )

    # -----------------------------------------------------
    # FIND USER
    # -----------------------------------------------------

    user_id = token_data.get(
        "user_id"
    )

    db_user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not db_user:

        raise HTTPException(
            status_code=404,
            detail="User account not found."
        )

    # -----------------------------------------------------
    # UPDATE PASSWORD
    # -----------------------------------------------------

    db_user.hashed_password = (
        pwd_context.hash(
            request.new_password
        )
    )

    db.commit()

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {

        "message":
            "Password reset successfully."
    }


# =========================================================
# PROFILE MANAGEMENT SCHEMAS
# =========================================================

class UpdateProfileRequest(BaseModel):
    name: str
    email: EmailStr


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# =========================================================
# GET CURRENT USER PROFILE
# GET /auth/me
# =========================================================

@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "is_verified": getattr(current_user, "is_verified", True)
    }


# =========================================================
# UPDATE PROFILE
# PUT /auth/profile
# =========================================================

@router.put("/profile")
def update_profile(
    request: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_name = request.name.strip()
    new_email = request.email.strip().lower()

    if not new_name:
        raise HTTPException(
            status_code=400,
            detail="Name cannot be empty."
        )

    if new_email != current_user.email:
        existing = (
            db.query(User)
            .filter(
                User.email == new_email,
                User.id != current_user.id
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail="An account with this email address already exists."
            )
        current_user.email = new_email

    current_user.name = new_name

    db.commit()
    db.refresh(current_user)

    return {
        "success": True,
        "message": "Profile updated successfully.",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role
        }
    }


# =========================================================
# CHANGE PASSWORD
# PUT /auth/change-password
# =========================================================

@router.put("/change-password")
def change_password(
    request: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not pwd_context.verify(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect."
        )

    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="New password must be at least 6 characters."
        )

    current_user.hashed_password = pwd_context.hash(request.new_password)
    db.commit()

    return {
        "success": True,
        "message": "Password changed successfully."
    }