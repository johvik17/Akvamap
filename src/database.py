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
            INSERT INTO sites (site_nr, name, latitude, longitude)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (site_nr) DO NOTHING
            """,
            (
                site["siteNr"],
                site["name"],
                site["latitude"],
                site["longitude"]
            )
        )

    conn.commit()
    cursor.close()   


