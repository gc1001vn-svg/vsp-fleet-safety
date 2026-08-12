from datetime import date

from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app import models
from app.constants import REGISTRY_STATUS_SUGGESTIONS, SHIP_TYPE_SUGGESTIONS
from app.database import get_db
from app.utils import parse_optional_date, parse_optional_float, parse_optional_int

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


@router.get("/")
def list_ships(request: Request, q: str = "", ship_type: str = "", db: Session = Depends(get_db)):
    query = db.query(models.Ship).filter(models.Ship.is_active.is_(True))
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(models.Ship.name.ilike(like), models.Ship.imo_number.ilike(like))
        )
    if ship_type:
        query = query.filter(models.Ship.ship_type == ship_type)
    ships = query.order_by(models.Ship.name).all()

    existing_types = sorted(
        {s.ship_type for s in db.query(models.Ship.ship_type).distinct() if s.ship_type}
    )

    return templates.TemplateResponse(
        request,
        "ships_list.html",
        {
            "request": request,
            "ships": ships,
            "q": q,
            "ship_type": ship_type,
            "existing_types": existing_types,
        },
    )


@router.get("/ships/new")
def new_ship_form(request: Request):
    return templates.TemplateResponse(
        request,
        "ship_form.html",
        {
            "request": request,
            "ship": None,
            "ship_type_suggestions": SHIP_TYPE_SUGGESTIONS,
            "registry_status_suggestions": REGISTRY_STATUS_SUGGESTIONS,
        },
    )


@router.post("/ships/new")
async def create_ship(request: Request, db: Session = Depends(get_db)):
    form = await request.form()
    ship = models.Ship(
        name=form.get("name", "").strip(),
        ship_type=(form.get("ship_type") or "").strip() or None,
        imo_number=(form.get("imo_number") or "").strip() or None,
        call_sign=(form.get("call_sign") or "").strip() or None,
        build_year=parse_optional_int(form.get("build_year")),
        flag=(form.get("flag") or "").strip() or None,
        gross_tonnage=parse_optional_float(form.get("gross_tonnage")),
        length_m=parse_optional_float(form.get("length_m")),
        width_m=parse_optional_float(form.get("width_m")),
        main_engine_power=(form.get("main_engine_power") or "").strip() or None,
        home_port=(form.get("home_port") or "").strip() or None,
        registry_status=(form.get("registry_status") or "").strip() or None,
        registry_expiry_date=parse_optional_date(form.get("registry_expiry_date")),
        notes=(form.get("notes") or "").strip() or None,
    )
    db.add(ship)
    db.commit()
    db.refresh(ship)
    return RedirectResponse(f"/ships/{ship.id}", status_code=303)


@router.get("/ships/{ship_id}")
def ship_detail(ship_id: int, request: Request, db: Session = Depends(get_db)):
    ship = db.query(models.Ship).filter(models.Ship.id == ship_id).first()
    if not ship:
        return RedirectResponse("/", status_code=303)

    inspection_ids = [i.id for i in ship.inspections]
    incident_ids = [i.id for i in ship.incidents]
    attachments = (
        db.query(models.Attachment)
        .filter(
            or_(
                (models.Attachment.entity_type == "inspection")
                & (models.Attachment.entity_id.in_(inspection_ids or [-1])),
                (models.Attachment.entity_type == "incident")
                & (models.Attachment.entity_id.in_(incident_ids or [-1])),
            )
        )
        .all()
    )
    attachments_by_entity: dict[tuple[str, int], list] = {}
    for a in attachments:
        attachments_by_entity.setdefault((a.entity_type, a.entity_id), []).append(a)

    return templates.TemplateResponse(
        request,
        "ship_detail.html",
        {
            "request": request,
            "ship": ship,
            "attachments_by_entity": attachments_by_entity,
            "today": date.today().isoformat(),
        },
    )


@router.get("/ships/{ship_id}/edit")
def edit_ship_form(ship_id: int, request: Request, db: Session = Depends(get_db)):
    ship = db.query(models.Ship).filter(models.Ship.id == ship_id).first()
    if not ship:
        return RedirectResponse("/", status_code=303)
    return templates.TemplateResponse(
        request,
        "ship_form.html",
        {
            "request": request,
            "ship": ship,
            "ship_type_suggestions": SHIP_TYPE_SUGGESTIONS,
            "registry_status_suggestions": REGISTRY_STATUS_SUGGESTIONS,
        },
    )


@router.post("/ships/{ship_id}/edit")
async def update_ship(ship_id: int, request: Request, db: Session = Depends(get_db)):
    ship = db.query(models.Ship).filter(models.Ship.id == ship_id).first()
    if not ship:
        return RedirectResponse("/", status_code=303)

    form = await request.form()
    ship.name = form.get("name", "").strip()
    ship.ship_type = (form.get("ship_type") or "").strip() or None
    ship.imo_number = (form.get("imo_number") or "").strip() or None
    ship.call_sign = (form.get("call_sign") or "").strip() or None
    ship.build_year = parse_optional_int(form.get("build_year"))
    ship.flag = (form.get("flag") or "").strip() or None
    ship.gross_tonnage = parse_optional_float(form.get("gross_tonnage"))
    ship.length_m = parse_optional_float(form.get("length_m"))
    ship.width_m = parse_optional_float(form.get("width_m"))
    ship.main_engine_power = (form.get("main_engine_power") or "").strip() or None
    ship.home_port = (form.get("home_port") or "").strip() or None
    ship.registry_status = (form.get("registry_status") or "").strip() or None
    ship.registry_expiry_date = parse_optional_date(form.get("registry_expiry_date"))
    ship.notes = (form.get("notes") or "").strip() or None
    db.commit()
    return RedirectResponse(f"/ships/{ship.id}", status_code=303)


@router.post("/ships/{ship_id}/deactivate")
def deactivate_ship(ship_id: int, db: Session = Depends(get_db)):
    ship = db.query(models.Ship).filter(models.Ship.id == ship_id).first()
    if ship:
        ship.is_active = False
        db.commit()
    return RedirectResponse("/", status_code=303)
