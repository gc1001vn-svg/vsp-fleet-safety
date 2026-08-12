from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app import models
from app.constants import FINDING_RESULT_OPTIONS, INSPECTION_RESULT_OPTIONS, INSPECTION_TYPE_SUGGESTIONS
from app.database import get_db
from app.utils import parse_optional_date, save_upload

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


@router.get("/ships/{ship_id}/inspections/new")
def new_inspection_form(ship_id: int, request: Request, db: Session = Depends(get_db)):
    ship = db.query(models.Ship).filter(models.Ship.id == ship_id).first()
    if not ship:
        return RedirectResponse("/", status_code=303)
    return templates.TemplateResponse(
        request,
        "inspection_form.html",
        {
            "request": request,
            "ship": ship,
            "inspection": None,
            "findings": [],
            "inspection_type_suggestions": INSPECTION_TYPE_SUGGESTIONS,
            "inspection_result_options": INSPECTION_RESULT_OPTIONS,
            "finding_result_options": FINDING_RESULT_OPTIONS,
        },
    )


@router.post("/ships/{ship_id}/inspections/new")
async def create_inspection(ship_id: int, request: Request, db: Session = Depends(get_db)):
    ship = db.query(models.Ship).filter(models.Ship.id == ship_id).first()
    if not ship:
        return RedirectResponse("/", status_code=303)

    form = await request.form()
    inspection = models.Inspection(
        ship_id=ship_id,
        inspection_date=parse_optional_date(form.get("inspection_date")),
        inspector_name=(form.get("inspector_name") or "").strip() or None,
        inspection_type=(form.get("inspection_type") or "").strip() or None,
        result=(form.get("result") or "").strip() or None,
        summary=(form.get("summary") or "").strip() or None,
    )
    db.add(inspection)
    db.flush()  # cần inspection.id trước khi commit

    item_names = form.getlist("item_name")
    item_results = form.getlist("item_result")
    item_notes = form.getlist("item_note")
    for name, res, note in zip(item_names, item_results, item_notes):
        name = (name or "").strip()
        if name:
            db.add(
                models.InspectionFinding(
                    inspection_id=inspection.id,
                    item_name=name,
                    result=(res or "").strip() or None,
                    note=(note or "").strip() or None,
                )
            )

    for upload in form.getlist("photos"):
        if getattr(upload, "filename", ""):
            original_name, rel_path = await save_upload(upload, f"inspections/{inspection.id}")
            db.add(
                models.Attachment(
                    entity_type="inspection",
                    entity_id=inspection.id,
                    file_name=original_name,
                    file_path=rel_path,
                )
            )

    db.commit()
    return RedirectResponse(f"/inspections/{inspection.id}", status_code=303)


@router.get("/inspections/{inspection_id}")
def inspection_detail(inspection_id: int, request: Request, db: Session = Depends(get_db)):
    inspection = db.query(models.Inspection).filter(models.Inspection.id == inspection_id).first()
    if not inspection:
        return RedirectResponse("/", status_code=303)
    attachments = (
        db.query(models.Attachment)
        .filter(models.Attachment.entity_type == "inspection", models.Attachment.entity_id == inspection_id)
        .all()
    )
    return templates.TemplateResponse(
        request,
        "inspection_detail.html",
        {"request": request, "inspection": inspection, "ship": inspection.ship, "attachments": attachments},
    )


@router.post("/inspections/{inspection_id}/delete")
def delete_inspection(inspection_id: int, db: Session = Depends(get_db)):
    inspection = db.query(models.Inspection).filter(models.Inspection.id == inspection_id).first()
    if inspection:
        ship_id = inspection.ship_id
        db.delete(inspection)
        db.commit()
        return RedirectResponse(f"/ships/{ship_id}", status_code=303)
    return RedirectResponse("/", status_code=303)
