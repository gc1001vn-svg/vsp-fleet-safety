from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.database import Base, UPLOAD_DIR, engine
from app.routers import documents, incidents, inspections, ships

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Quản lý an toàn đội tàu - XN VTB&CTL")

app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(ships.router)
app.include_router(inspections.router)
app.include_router(incidents.router)
app.include_router(documents.router)
