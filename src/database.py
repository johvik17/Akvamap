import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD")
)


def save_sites(sites):
    cursor = conn.cursor()

    for site in sites:
        
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
        ON CONFLICT (site_nr) DO UPDATE
        SET
        name = EXCLUDED.name,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        capacity = EXCLUDED.capacity,
        municipality_name = EXCLUDED.municipality_name,
        county_name = EXCLUDED.county_name,
        capacity_unit = EXCLUDED.capacity_unit,
        placement_type = EXCLUDED.placement_type,
        water_type = EXCLUDED.water_type
        """,
            (
                site["siteNr"],
                site["name"],
                site["latitude"],
                site["longitude"],
                site["capacity"],
                site["placement"]["municipalityName"],
                site["placement"]["countyName"],
                site["capacityUnitType"],
                site["placementType"],
                site["waterType"]
            )
        )

    conn.commit()
    cursor.close()   
    

def get_sites_from_db():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )

    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT site_nr, name, latitude, longitude
                FROM sites
                ORDER BY site_nr
            """)

            return [
                {
                    "site_nr": row[0],
                    "name": row[1],
                    "latitude": row[2],
                    "longitude": row[3]
                }
                for row in cursor.fetchall()
            ]
    finally:
        conn.close()

