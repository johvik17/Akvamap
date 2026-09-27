from fastapi import FastAPI
from database import get_sites_from_db

app = FastAPI()


@app.get("/")
def root():
    return {"message": "Akvamap API"}


@app.get("/sites")
def get_sites():
    return get_sites_from_db()