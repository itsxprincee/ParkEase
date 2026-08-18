import sys
sys.path.append(r"c:\Users\princ\Downloads\ParkEase\backend")
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    print("Tables in parkease:")
    tables = conn.execute(text("SHOW TABLES;")).fetchall()
    for t in tables:
        print(f"Table: {t[0]}")
        cols = conn.execute(text(f"DESCRIBE `{t[0]}`;")).fetchall()
        for c in cols:
            print(f"  Field: {c[0]}, Type: {c[1]}, Null: {c[2]}, Key: {c[3]}, Default: {c[4]}")
