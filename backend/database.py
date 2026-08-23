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


# Auto-create database if not exists
try:
    server_url = f"mysql+pymysql://{DB_USER}:{ENCODED_PASSWORD}@{DB_HOST}:{DB_PORT}/mysql"
    server_engine = create_engine(server_url, pool_pre_ping=True)
    with server_engine.connect() as conn:
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
        conn.commit()
    server_engine.dispose()
except Exception:
    pass

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
        # AUTO-MIGRATE VEHICLES TABLE
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
            {"database_name": DB_NAME},
        ).fetchall()

        if vehicle_columns:
            column_names = [column.COLUMN_NAME for column in vehicle_columns]
            
            # If owner_id exists and has constraints, resolve it
            if "owner_id" in column_names:
                try:
                    # Find and drop any FK constraint referencing owner_id
                    fk_rows = connection.execute(
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
                        print(f"Auto-migrating: Dropping legacy FK `{fk.CONSTRAINT_NAME}` on vehicles.owner_id...")
                        connection.execute(text(f"ALTER TABLE `vehicles` DROP FOREIGN KEY `{fk.CONSTRAINT_NAME}`"))
                        connection.commit()
                except Exception as e:
                    print("Note on dropping legacy vehicles FK:", e)

                if "user_id" not in column_names:
                    print("Auto-migrating: Renaming `owner_id` to `user_id` in `vehicles` table...")
                    connection.execute(text("ALTER TABLE `vehicles` CHANGE COLUMN `owner_id` `user_id` INT NOT NULL"))
                    connection.commit()
                else:
                    # Make owner_id nullable so inserts with user_id don't fail
                    print("Auto-migrating: Making legacy `owner_id` nullable in `vehicles` table...")
                    connection.execute(text("ALTER TABLE `vehicles` MODIFY COLUMN `owner_id` INT NULL DEFAULT NULL"))
                    connection.commit()

            # Ensure user_id column exists
            if "user_id" not in column_names and "owner_id" not in column_names:
                print("Auto-migrating: Adding `user_id` to `vehicles` table...")
                connection.execute(text("ALTER TABLE `vehicles` ADD COLUMN `user_id` INT NOT NULL"))
                connection.commit()

            # Ensure user_id FK constraint exists
            try:
                user_fk = connection.execute(
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
                    print("Auto-migrating: Adding FK on `vehicles.user_id` referencing `users(id)`...")
                    connection.execute(text("ALTER TABLE `vehicles` ADD CONSTRAINT `fk_vehicles_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE"))
                    connection.commit()
            except Exception as e:
                print("Note on vehicles.user_id FK constraint:", e)

            print("SUCCESS: vehicles table schema aligned with user_id.")

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

        # -------------------------------------------------
        # AUTO-MIGRATE PARKING_SLOTS TABLE
        # -------------------------------------------------
        slot_columns = connection.execute(
            text(
                """
                SELECT COLUMN_NAME
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = :database_name
                AND TABLE_NAME = 'parking_slots'
                """
            ),
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
                    print(f"Auto-migrating: Adding '{col_name}' column to 'parking_slots'...")
                    connection.execute(
                        text(f"ALTER TABLE parking_slots ADD COLUMN {col_name} {col_def}")
                    )
                    connection.commit()
                    print(f"SUCCESS: '{col_name}' column added to 'parking_slots'")

        # -------------------------------------------------
        # AUTO-MIGRATE PARKING_LOCATIONS TABLE (DAILY PASS)
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
            parking_col_names = [c.COLUMN_NAME for c in parking_columns]
            parking_expected = {
                "pricing_type": "VARCHAR(50) NOT NULL DEFAULT 'HOURLY'",
                "daily_rate": "FLOAT NOT NULL DEFAULT 10.0",
                "allow_multi_entry": "BOOLEAN NOT NULL DEFAULT 1",
                "last_exit_time": "VARCHAR(50) NOT NULL DEFAULT '11:00 PM'",
            }
            for col_name, col_def in parking_expected.items():
                if col_name not in parking_col_names:
                    print(f"Auto-migrating: Adding '{col_name}' to 'parking_locations'...")
                    connection.execute(
                        text(f"ALTER TABLE parking_locations ADD COLUMN {col_name} {col_def}")
                    )
                    connection.commit()
                    print(f"SUCCESS: '{col_name}' added to 'parking_locations'")

        # -------------------------------------------------
        # AUTO-MIGRATE BOOKINGS TABLE (MULTI-ENTRY PASS)
        # -------------------------------------------------
        booking_columns = connection.execute(
            text(
                """
                SELECT COLUMN_NAME
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = :database_name
                AND TABLE_NAME = 'bookings'
                """
            ),
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
                    print(f"Auto-migrating: Adding '{col_name}' to 'bookings'...")
                    connection.execute(
                        text(f"ALTER TABLE bookings ADD COLUMN {col_name} {col_def}")
                    )
                    connection.commit()
                    print(f"SUCCESS: '{col_name}' added to 'bookings'")

        # -------------------------------------------------
        # ENSURE CASCADE DELETION ON FOREIGN KEYS
        # -------------------------------------------------
        try:
            fk_checks = [
                ("parking_slots", "parking_id", "parking_locations", "id"),
                ("bookings", "parking_location_id", "parking_locations", "id"),
                ("reviews", "parking_id", "parking_locations", "id"),
            ]
            for table, col, ref_table, ref_col in fk_checks:
                fk_rows = connection.execute(
                    text(
                        """
                        SELECT CONSTRAINT_NAME, DELETE_RULE
                        FROM information_schema.REFERENTIAL_CONSTRAINTS
                        WHERE CONSTRAINT_SCHEMA = :database_name
                        AND TABLE_NAME = :table_name
                        AND REFERENCED_TABLE_NAME = :ref_table_name
                        """
                    ),
                    {
                        "database_name": DB_NAME,
                        "table_name": table,
                        "ref_table_name": ref_table,
                    },
                ).fetchall()
                for fk in fk_rows:
                    if fk.DELETE_RULE != "CASCADE":
                        print(f"Auto-migrating: Setting ON DELETE CASCADE on `{table}`.`{fk.CONSTRAINT_NAME}`...")
                        connection.execute(text(f"ALTER TABLE `{table}` DROP FOREIGN KEY `{fk.CONSTRAINT_NAME}`"))
                        connection.execute(text(f"ALTER TABLE `{table}` ADD CONSTRAINT `{fk.CONSTRAINT_NAME}` FOREIGN KEY (`{col}`) REFERENCES `{ref_table}`(`{ref_col}`) ON DELETE CASCADE"))
                        connection.commit()
                        print(f"SUCCESS: `{table}`.`{fk.CONSTRAINT_NAME}` updated to ON DELETE CASCADE")
        except Exception as fk_err:
            print("FK Cascade Migration note:", fk_err)

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