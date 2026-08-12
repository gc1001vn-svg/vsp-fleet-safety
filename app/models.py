from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Ship(Base):
    """Một con tàu trong đội tàu của Xí nghiệp."""

    __tablename__ = "ships"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    ship_type = Column(String(100))  # Tàu dịch vụ / Tàu lặn / Tàu cẩu / Tàu khách / Tàu công trình...
    imo_number = Column(String(50))
    call_sign = Column(String(50))
    build_year = Column(Integer)
    flag = Column(String(100))
    gross_tonnage = Column(Float)
    length_m = Column(Float)
    width_m = Column(Float)
    main_engine_power = Column(String(100))
    home_port = Column(String(200))
    registry_status = Column(String(100))  # tình trạng đăng kiểm
    registry_expiry_date = Column(Date)
    notes = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    inspections = relationship(
        "Inspection", back_populates="ship", cascade="all, delete-orphan",
        order_by="desc(Inspection.inspection_date)",
    )
    incidents = relationship(
        "Incident", back_populates="ship", cascade="all, delete-orphan",
        order_by="desc(Incident.incident_date)",
    )
    documents = relationship(
        "Document", back_populates="ship", cascade="all, delete-orphan",
        order_by="desc(Document.issue_date)",
    )


class Inspection(Base):
    """Một lần kiểm tra an toàn trên một con tàu."""

    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True)
    ship_id = Column(Integer, ForeignKey("ships.id"), nullable=False)
    inspection_date = Column(Date, nullable=False)
    inspector_name = Column(String(200))
    inspection_type = Column(String(100))  # Nội bộ / Cảng vụ / Đăng kiểm / Khác
    result = Column(String(50))  # Đạt / Không đạt / Đạt có điều kiện
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ship = relationship("Ship", back_populates="inspections")
    findings = relationship(
        "InspectionFinding", back_populates="inspection", cascade="all, delete-orphan"
    )


class InspectionFinding(Base):
    """Một hạng mục cụ thể được ghi nhận trong một lần kiểm tra."""

    __tablename__ = "inspection_findings"

    id = Column(Integer, primary_key=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    item_name = Column(String(300), nullable=False)  # hạng mục kiểm tra
    result = Column(String(50))  # Đạt / Không đạt / Không áp dụng
    note = Column(Text)

    inspection = relationship("Inspection", back_populates="findings")


class Incident(Base):
    """Sự cố / vi phạm ghi nhận trên một con tàu."""

    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True)
    ship_id = Column(Integer, ForeignKey("ships.id"), nullable=False)
    incident_date = Column(Date, nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    severity = Column(String(50))  # Nhẹ / Trung bình / Nghiêm trọng
    cause = Column(Text)
    corrective_action = Column(Text)
    status = Column(String(50), default="Mới ghi nhận")
    reported_by = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ship = relationship("Ship", back_populates="incidents")


class Document(Base):
    """Tài liệu liên quan: quyết định, công văn, checklist, thông tư... có thể gắn 1 tàu hoặc chung xí nghiệp."""

    __tablename__ = "documents"

    id = Column(Integer, primary_key=True)
    ship_id = Column(Integer, ForeignKey("ships.id"), nullable=True)  # NULL = tài liệu chung toàn xí nghiệp
    doc_type = Column(String(100))  # Quyết định / Công văn / Checklist / Thông tư / Biên bản...
    title = Column(String(300), nullable=False)
    doc_number = Column(String(100))  # số hiệu văn bản
    issue_date = Column(Date)
    issuing_org = Column(String(200))
    notes = Column(Text)
    file_path = Column(String(500))
    file_name = Column(String(300))
    created_at = Column(DateTime, default=datetime.utcnow)

    ship = relationship("Ship", back_populates="documents")


class Attachment(Base):
    """File đính kèm (ảnh minh chứng...) gắn với một inspection hoặc incident bất kỳ."""

    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True)
    entity_type = Column(String(50), nullable=False)  # "inspection" | "incident"
    entity_id = Column(Integer, nullable=False)
    file_name = Column(String(300), nullable=False)
    file_path = Column(String(500), nullable=False)
    description = Column(String(300))
    uploaded_at = Column(DateTime, default=datetime.utcnow)
