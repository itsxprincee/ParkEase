import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from urllib.parse import quote_plus


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()


# =========================================================
# DATABASE CONFIGURATION
# =========================================================

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "parkease")


# =========================================================
# ENCODE PASSWORD
# Handles special characters like @, #, :, /
# =========================================================

ENCODED_PASSWORD = quote_plus(DB_PASSWORD)


# =========================================================
# DATABASE URL
# =========================================================

DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{ENCODED_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)


# =========================================================
# DISPLAY DATABASE CONFIGURATION
# =========================================================

print("\n" + "=" * 55)
print("         PARKEASE DATABASE CONFIGURATION")
print("=" * 55)
print(f"Database User : {DB_USER}")
print(f"Database Host : {DB_HOST}")
print(f"Database Port : {DB_PORT}")
print(f"Database Name : {DB_NAME}")
print("=" * 55)


# =========================================================
# CREATE DATABASE ENGINE
# =========================================================

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,
)


# =========================================================
# VERIFY ACTUAL MYSQL CONNECTION
# =========================================================

try:
    with engine.connect() as connection:

        result = connection.execute(
            text(
                """
                SELECT
                    DATABASE() AS current_database,
                    @@hostname AS mysql_host,
                    @@port AS mysql_port
                """
            )
        ).fetchone()

        print("\n" + "=" * 55)
        print("          CONNECTED MYSQL SERVER")
        print("=" * 55)
        print(f"Current Database : {result.current_database}")
        print(f"MySQL Host       : {result.mysql_host}")
        print(f"MySQL Port       : {result.mysql_port}")
        print("=" * 55)

        # -------------------------------------------------
        # CHECK VEHICLES TABLE
        # -------------------------------------------------

        vehicle_columns = connection.execute(
            text(
                """
                SELECT COLUMN_NAME
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = :database_name
                AND TABLE_NAME = 'vehicles'
                ORDER BY ORDINAL_POSITION
                """
            ),
            {
                "database_name": DB_NAME
            },
        ).fetchall()

        print("\n" + "=" * 55)
        print("           VEHICLES TABLE COLUMNS")
        print("=" * 55)

        if vehicle_columns:
            for column in vehicle_columns:
                print(f"- {column.COLUMN_NAME}")

            column_names = [
                column.COLUMN_NAME
                for column in vehicle_columns
            ]

            print("=" * 55)

            if "user_id" in column_names:
                print(
                    "SUCCESS: vehicles.user_id EXISTS"
                )
            else:
                print(
                    "ERROR: vehicles.user_id DOES NOT EXIST"
                )

        else:
            print(
                "ERROR: vehicles table was not found "
                "in the connected database."
            )

        # -------------------------------------------------
        # AUTO-MIGRATE PARKING_LOCATIONS TABLE
        # -------------------------------------------------
        parking_columns = connection.execute(
            text(
                """
                SELECT COLUMN_NAME
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = :database_name
                AND TABLE_NAME = 'parking_locations'
                """
            ),
            {"database_name": DB_NAME},
        ).fetchall()

        if parking_columns:
            parking_column_names = [c.COLUMN_NAME for c in parking_columns]
            expected_columns = {
                "hourly_rate": "FLOAT NOT NULL DEFAULT 0.0",
                "has_ev": "BOOLEAN NOT NULL DEFAULT 0",
                "has_cctv": "BOOLEAN NOT NULL DEFAULT 0",
                "has_security_guard": "BOOLEAN NOT NULL DEFAULT 0",
                "has_covered_roof": "BOOLEAN NOT NULL DEFAULT 0",
                "is_24_7": "BOOLEAN NOT NULL DEFAULT 0",
                "has_valet": "BOOLEAN NOT NULL DEFAULT 0",
            }
            for col_name, col_def in expected_columns.items():
                if col_name not in parking_column_names:
                    print(f"Auto-migrating: Adding '{col_name}' column to 'parking_locations'...")
                    connection.execute(
                        text(f"ALTER TABLE parking_locations ADD COLUMN {col_name} {col_def}")
                    )
                    connection.commit()
                    print(f"SUCCESS: '{col_name}' column added to 'parking_locations'")
                else:
                    print(f"SUCCESS: parking_locations.{col_name} EXISTS")

        print("=" * 55 + "\n")

except Exception as error:

    print("\n" + "=" * 55)
    print("          DATABASE CONNECTION ERROR")
    print("=" * 55)
    print(error)
    print("=" * 55 + "\n")


# =========================================================
# DATABASE SESSION
# =========================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# =========================================================
# SQLALCHEMY BASE
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