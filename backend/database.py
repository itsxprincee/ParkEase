import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Load .env file for local development
load_dotenv()


# =========================================================
# DATABASE CONFIGURATION
# =========================================================

# Railway MySQL variables
# Falls back to local .env variables for local development

DB_USER = (
    os.getenv("MYSQLUSER")
    or os.getenv("DB_USER")
    or "root"
)

DB_PASSWORD = (
    os.getenv("MYSQLPASSWORD")
    or os.getenv("DB_PASSWORD")
    or "123456"
)

DB_HOST = (
    os.getenv("MYSQLHOST")
    or os.getenv("DB_HOST")
    or "127.0.0.1"
)

DB_PORT = (
    os.getenv("MYSQLPORT")
    or os.getenv("DB_PORT")
    or "3306"
)

DB_NAME = (
    os.getenv("MYSQLDATABASE")
    or os.getenv("DB_NAME")
    or "parkease"
)


# =========================================================
# DATABASE URL
# =========================================================

DATABASE_URL = (
    f"mysql+pymysql://"
    f"{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)


# =========================================================
# ENGINE
# =========================================================

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
)


# =========================================================
# SESSION
# =========================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# =========================================================
# BASE
# =========================================================

Base = declarative_base()


# =========================================================
# DATABASE DEPENDENCY
# =========================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()