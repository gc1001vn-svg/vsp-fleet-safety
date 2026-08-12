from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app import models
from app.constants import DOC_TYPE_SUGGESTIONS
from app.database import get_db
from app.utils import parse_optional_date, save_upload

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


@router.get("/documents")
def list_documents(
    request: Request,
    q: str = "",
    doc_type: str = "",
    ship_id: str = "",
    db: Session = Depends(get_db),
):
    query = db.query(models.Document)
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(models.Document.title.ilike(like), models.Document.doc_number.ilike(like))
        )
    if doc_type:
        query = query.filter(models.Document.doc_type == doc_type)
    if ship_id == "general":
        query = query.filter(models.Document.ship_id.is_(None))
    elif ship_id:
        query = query.filter(models.Document.ship_id == int(ship_id))

    documents = query.order_by(models.Document.issue_date.desc().nullslast()).all()
    ships = db.query(models.Ship).filter(models.Ship.is_active.is_(True)).order_by(models.Ship.name).all()
    existing_types = sorted(
        {d.doc_type for d in db.query(models.Document.doc_type).distinct() if d.doc_type}
    )

    return templates.TemplateResponse(
        request,
        "documents_list.html",
        {
            "request": request,
            "documents": documents,
            "ships": ships,
            "q": q,
            "doc_type": doc_type,
            "ship_id": ship_id,
            "existing_types": existing_types,
        },
    )


@router.get("/documents/new")
def new_document_form(request: Request, ship_id: str = "", db: Session = Depends(get_db)):
    ships = db.query(models.Ship).filter(models.Ship.is_active.is_(True)).order_by(models.Ship.name).all()
    return templates.TemplateResponse(
        request,
        "document_form.html",
        {
            "request": request,
            "document": None,
            "ships": ships,
            "preselected_ship_id": ship_id,
            "doc_type_suggestions": DOC_TYPE_SUGGESTIONS,
        },
    )


@router.post("/documents/new")
async def create_document(request: Request, db: Session = Depends(get_db)):
    form = await request.form()
    ship_id_raw = (form.get("ship_id") or "").strip()

    document = models.Document(
        ship_id=int(ship_id_raw) if ship_id_raw else None,
        doc_type=(form.get("doc_type") or "").strip() or None,
        title=(form.get("title") or "").strip(),
        doc_number=(form.get("doc_number") or "").strip() or None,
        issue_date=parse_optional_date(form.get("issue_date")),
        issuing_org=(form.get("issuing_org") or "").strip() or None,
        notes=(form.get("notes") or "").strip() or None,
    )
    db.add(document)
    db.flush()

    upload = form.get("file")
    if upload is not None and getattr(upload, "filename", ""):
        original_name, rel_path = await save_upload(upload, f"documents/{document.id}")
        document.file_name = original_name
        document.file_path = rel_path

    db.commit()
    if document.ship_id:
        return RedirectResponse(f"/ships/{document.ship_id}", status_code=303)
    return RedirectResponse("/documents", status_code=303)


@router.post("/documents/{document_id}/delete")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if document:
        ship_id = document.ship_id
        db.delete(document)
        db.commit()
        if ship_id:
            return RedirectResponse(f"/ships/{ship_id}", status_code=303)
    return RedirectResponse("/documents", status_code=303)
