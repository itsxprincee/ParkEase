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
# DATABASE ENGINE INITIALIZATION (MySQL with SQLite fallback)
# =========================================================

use_sqlite = False

try:
    # Auto-create database if not exists in MySQL
    server_url = f"mysql+pymysql://{DB_USER}:{ENCODED_PASSWORD}@{DB_HOST}:{DB_PORT}/mysql"
    server_engine = create_engine(server_url, pool_pre_ping=True)
    with server_engine.connect() as conn:
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
        conn.commit()
    server_engine.dispose()

    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False,
    )
    # Test connection
    with engine.connect() as test_conn:
        pass
except Exception as conn_err:
    print(f"\n[INFO] MySQL not reachable on {DB_HOST}:{DB_PORT}. Using SQLite fallback (parkease.db).")
    print("[TIP] Start XAMPP MySQL anytime to use MySQL instead.\n")
    use_sqlite = True
    DATABASE_URL = "sqlite:///./parkease.db"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
        echo=False,
    )

# =========================================================
# VERIFY ACTUAL CONNECTION
# =========================================================

try:
    with engine.connect() as connection:
        if not use_sqlite:
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
        else:
            print("\n" + "=" * 55)
            print("          CONNECTED TO SQLITE DATABASE (parkease.db)")
            print("=" * 55)

        def run_schema_migrations(conn, is_sqlite_db=False):
            if is_sqlite_db:
                # SQLite PRAGMA table_info migrations
                try:
                    cur = conn.connection.cursor()
                    # parking_locations
                    cur.execute("PRAGMA table_info(parking_locations)")
                    p_cols = [row[1] for row in cur.fetchall()]
                    if p_cols:
                        sqlite_parking_cols = {
                            "hourly_rate": "REAL DEFAULT 0.0",
                            "has_ev": "BOOLEAN DEFAULT 0",
                            "has_cctv": "BOOLEAN DEFAULT 0",
                            "has_security_guard": "BOOLEAN DEFAULT 0",
                            "has_covered_roof": "BOOLEAN DEFAULT 0",
                            "is_24_7": "BOOLEAN DEFAULT 0",
                            "has_valet": "BOOLEAN DEFAULT 0",
                            "pricing_type": "TEXT DEFAULT 'HOURLY'",
                            "daily_rate": "REAL DEFAULT 10.0",
                            "allow_multi_entry": "BOOLEAN DEFAULT 1",
                            "last_exit_time": "TEXT DEFAULT '11:00 PM'",
                            "inside_image": "TEXT DEFAULT NULL",
                            "supported_vehicles": "TEXT DEFAULT 'BOTH'",
                        }
                        for col, col_type in sqlite_parking_cols.items():
                            if col not in p_cols:
                                cur.execute(f"ALTER TABLE parking_locations ADD COLUMN {col} {col_type}")
                                conn.connection.commit()

                    # parking_slots
                    cur.execute("PRAGMA table_info(parking_slots)")
                    s_cols = [row[1] for row in cur.fetchall()]
                    if s_cols:
                        sqlite_slot_cols = {
                            "is_ev": "BOOLEAN DEFAULT 0",
                            "vehicle_type": "TEXT DEFAULT 'Car'",
                        }
                        for col, col_type in sqlite_slot_cols.items():
                            if col not in s_cols:
                                cur.execute(f"ALTER TABLE parking_slots ADD COLUMN {col} {col_type}")
                                conn.connection.commit()

                    # bookings
                    cur.execute("PRAGMA table_info(bookings)")
                    b_cols = [row[1] for row in cur.fetchall()]
                    if b_cols:
                        sqlite_booking_cols = {
                            "pass_type": "TEXT DEFAULT 'HOURLY'",
                            "entry_count": "INTEGER DEFAULT 0",
                            "is_inside": "BOOLEAN DEFAULT 0",
                            "last_exit_rule": "TEXT DEFAULT NULL",
                        }
                        for col, col_type in sqlite_booking_cols.items():
                            if col not in b_cols:
                                cur.execute(f"ALTER TABLE bookings ADD COLUMN {col} {col_type}")
                                conn.connection.commit()
                except Exception as e:
                    print("SQLite schema migration error:", e)
            else:
                # MySQL information_schema migrations
                try:
                    vehicle_columns = conn.execute(
                        text("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = :database_name AND TABLE_NAME = 'vehicles'"),
                        {"database_name": DB_NAME},
                    ).fetchall()

                    if vehicle_columns:
                        column_names = [column.COLUMN_NAME for column in vehicle_columns]
                        
                        if "owner_id" in column_names:
                            try:
                                fk_rows = conn.execute(
                                    text(
                                        """
                                        SELECT CONSTRAINT_NAME
                                        FROM information_schema.KEY_COLUMN_USAGE
                                        WHERE TABLE_SCHEMA = :database_name
                                        AND TABLE_NAME = 'vehicles'
                                        AND COLUMN_NAME = 'owner_id'
                                        AND REFERENCED_TABLE_NAME IS NOT NULL
                                        """
                                    ),
                                    {"database_name": DB_NAME},
                                ).fetchall()
                                for fk in fk_rows:
                                    conn.execute(text(f"ALTER TABLE `vehicles` DROP FOREIGN KEY `{fk.CONSTRAINT_NAME}`"))
                                    conn.commit()
                            except Exception:
                                pass

                            if "user_id" not in column_names:
                                conn.execute(text("ALTER TABLE `vehicles` CHANGE COLUMN `owner_id` `user_id` INT NOT NULL"))
                                conn.commit()
                            else:
                                conn.execute(text("ALTER TABLE `vehicles` MODIFY COLUMN `owner_id` INT NULL DEFAULT NULL"))
                                conn.commit()

                        if "user_id" not in column_names and "owner_id" not in column_names:
                            conn.execute(text("ALTER TABLE `vehicles` ADD COLUMN `user_id` INT NOT NULL"))
                            conn.commit()

                        try:
                            user_fk = conn.execute(
                                text(
                                    """
                                    SELECT CONSTRAINT_NAME
                                    FROM information_schema.KEY_COLUMN_USAGE
                                    WHERE TABLE_SCHEMA = :database_name
                                    AND TABLE_NAME = 'vehicles'
                                    AND COLUMN_NAME = 'user_id'
                                    AND REFERENCED_TABLE_NAME = 'users'
                                    """
                                ),
                                {"database_name": DB_NAME},
                            ).fetchall()
                            if not user_fk:
                                conn.execute(text("ALTER TABLE `vehicles` ADD CONSTRAINT `fk_vehicles_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE"))
                                conn.commit()
                        except Exception:
                            pass
                except Exception as e:
                    print("Vehicle migration notice:", e)

                try:
                    parking_columns = conn.execute(
                        text("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = :database_name AND TABLE_NAME = 'parking_locations'"),
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
                            "pricing_type": "VARCHAR(50) NOT NULL DEFAULT 'HOURLY'",
                            "daily_rate": "FLOAT NOT NULL DEFAULT 10.0",
                            "allow_multi_entry": "BOOLEAN NOT NULL DEFAULT 1",
                            "last_exit_time": "VARCHAR(50) NOT NULL DEFAULT '11:00 PM'",
                            "inside_image": "VARCHAR(500) NULL DEFAULT NULL",
                            "supported_vehicles": "VARCHAR(50) NOT NULL DEFAULT 'BOTH'",
                        }
                        for col_name, col_def in expected_columns.items():
                            if col_name not in parking_column_names:
                                conn.execute(text(f"ALTER TABLE parking_locations ADD COLUMN {col_name} {col_def}"))
                                conn.commit()

                    slot_columns = conn.execute(
                        text("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = :database_name AND TABLE_NAME = 'parking_slots'"),
                        {"database_name": DB_NAME},
                    ).fetchall()
                    if slot_columns:
                        slot_col_names = [c.COLUMN_NAME for c in slot_columns]
                        slot_expected = {
                            "is_ev": "BOOLEAN NOT NULL DEFAULT 0",
                            "vehicle_type": "VARCHAR(50) NULL DEFAULT 'Car'",
                        }
                        for col_name, col_def in slot_expected.items():
                            if col_name not in slot_col_names:
                                conn.execute(text(f"ALTER TABLE parking_slots ADD COLUMN {col_name} {col_def}"))
                                conn.commit()

                    booking_columns = conn.execute(
                        text("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = :database_name AND TABLE_NAME = 'bookings'"),
                        {"database_name": DB_NAME},
                    ).fetchall()
                    if booking_columns:
                        booking_col_names = [c.COLUMN_NAME for c in booking_columns]
                        booking_expected = {
                            "pass_type": "VARCHAR(50) NOT NULL DEFAULT 'HOURLY'",
                            "entry_count": "INT NOT NULL DEFAULT 0",
                            "is_inside": "BOOLEAN NOT NULL DEFAULT 0",
                            "last_exit_rule": "VARCHAR(50) NULL DEFAULT NULL",
                        }
                        for col_name, col_def in booking_expected.items():
                            if col_name not in booking_col_names:
                                conn.execute(text(f"ALTER TABLE bookings ADD COLUMN {col_name} {col_def}"))
                                conn.commit()
                except Exception as schema_err:
                    print("Schema alignment note:", schema_err)

        run_schema_migrations(connection, is_sqlite_db=use_sqlite)

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