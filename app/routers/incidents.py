from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app import models
from app.constants import INCIDENT_SEVERITY_OPTIONS, INCIDENT_STATUS_OPTIONS
from app.database import get_db
from app.utils import parse_optional_date, save_upload

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


@router.get("/ships/{ship_id}/incidents/new")
def new_incident_form(ship_id: int, request: Request, db: Session = Depends(get_db)):
    ship = db.query(models.Ship).filter(models.Ship.id == ship_id).first()
    if not ship:
        return RedirectResponse("/", status_code=303)
    return templates.TemplateResponse(
        request,
        "incident_form.html",
        {
            "request": request,
            "ship": ship,
            "incident": None,
            "severity_options": INCIDENT_SEVERITY_OPTIONS,
            "status_options": INCIDENT_STATUS_OPTIONS,
        },
    )


@router.post("/ships/{ship_id}/incidents/new")
async def create_incident(ship_id: int, request: Request, db: Session = Depends(get_db)):
    ship = db.query(models.Ship).filter(models.Ship.id == ship_id).first()
    if not ship:
        return RedirectResponse("/", status_code=303)

    form = await request.form()
    incident = models.Incident(
        ship_id=ship_id,
        incident_date=parse_optional_date(form.get("incident_date")),
        title=(form.get("title") or "").strip(),
        description=(form.get("description") or "").strip() or None,
        severity=(form.get("severity") or "").strip() or None,
        cause=(form.get("cause") or "").strip() or None,
        corrective_action=(form.get("corrective_action") or "").strip() or None,
        status=(form.get("status") or "Mới ghi nhận").strip(),
        reported_by=(form.get("reported_by") or "").strip() or None,
    )
    db.add(incident)
    db.flush()

    for upload in form.getlist("photos"):
        if getattr(upload, "filename", ""):
            original_name, rel_path = await save_upload(upload, f"incidents/{incident.id}")
            db.add(
                models.Attachment(
                    entity_type="incident",
                    entity_id=incident.id,
                    file_name=original_name,
                    file_path=rel_path,
                )
            )

    db.commit()
    return RedirectResponse(f"/incidents/{incident.id}", status_code=303)


@router.get("/incidents/{incident_id}")
def incident_detail(incident_id: int, request: Request, db: Session = Depends(get_db)):
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        return RedirectResponse("/", status_code=303)
    attachments = (
        db.query(models.Attachment)
        .filter(models.Attachment.entity_type == "incident", models.Attachment.entity_id == incident_id)
        .all()
    )
    return templates.TemplateResponse(
        request,
        "incident_detail.html",
        {"request": request, "incident": incident, "ship": incident.ship, "attachments": attachments},
    )


@router.get("/incidents/{incident_id}/edit")
def edit_incident_form(incident_id: int, request: Request, db: Session = Depends(get_db)):
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        return RedirectResponse("/", status_code=303)
    return templates.TemplateResponse(
        request,
        "incident_form.html",
        {
            "request": request,
            "ship": incident.ship,
            "incident": incident,
            "severity_options": INCIDENT_SEVERITY_OPTIONS,
            "status_options": INCIDENT_STATUS_OPTIONS,
        },
    )


@router.post("/incidents/{incident_id}/edit")
async def update_incident(incident_id: int, request: Request, db: Session = Depends(get_db)):
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        return RedirectResponse("/", status_code=303)

    form = await request.form()
    incident.incident_date = parse_optional_date(form.get("incident_date"))
    incident.title = (form.get("title") or "").strip()
    incident.description = (form.get("description") or "").strip() or None
    incident.severity = (form.get("severity") or "").strip() or None
    incident.cause = (form.get("cause") or "").strip() or None
    incident.corrective_action = (form.get("corrective_action") or "").strip() or None
    incident.status = (form.get("status") or "Mới ghi nhận").strip()
    incident.reported_by = (form.get("reported_by") or "").strip() or None

    for upload in form.getlist("photos"):
        if getattr(upload, "filename", ""):
            original_name, rel_path = await save_upload(upload, f"incidents/{incident.id}")
            db.add(
                models.Attachment(
                    entity_type="incident",
                    entity_id=incident.id,
                    file_name=original_name,
                    file_path=rel_path,
                )
            )

    db.commit()
    return RedirectResponse(f"/incidents/{incident.id}", status_code=303)


@router.post("/incidents/{incident_id}/delete")
def delete_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if incident:
        ship_id = incident.ship_id
        db.delete(incident)
        db.commit()
        return RedirectResponse(f"/ships/{ship_id}", status_code=303)
    return RedirectResponse("/", status_code=303)
