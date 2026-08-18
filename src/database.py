import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Koble til PostgreSQL
conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD")
)

cursor = conn.cursor()

# Sett inn én testlokalitet
cursor.execute(
    """
    INSERT INTO sites (
        site_nr,
        name,
        latitude,
        longitude,
        capacity,
        municipality_name,
        county_name,
        capacity_unit,
        placement_type,
        water_type
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """,
    (
        10029,
        "TUHOLMANE Ø",
        59.371233,
        5.216333,
        2340.0,
        "KARMØY",
        "ROGALAND",
        "TN",
        "Offshore",
        "Salt"
    )
)

conn.commit()

print("Lokalitet lagt til!")

cursor.close()
conn.close()