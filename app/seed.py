"""Nạp dữ liệu MẪU (giả) để dựng khung và kiểm tra giao diện.

Chạy: python -m app.seed
Đây KHÔNG phải dữ liệu thật — xóa/thay thế bằng dữ liệu thật của Xí nghiệp
khi triển khai chính thức (xem nút "Vô hiệu hóa tàu" hoặc xóa file
data/fleet.db để làm lại từ đầu).
"""

from datetime import date, timedelta

from app.database import Base, SessionLocal, engine
from app.models import Incident, Inspection, InspectionFinding, Ship

MOCK_SHIPS = [
    dict(name="Bình Minh 01", ship_type="Tàu dịch vụ", imo_number="IMO0000001",
         build_year=2011, flag="Việt Nam", registry_status="Còn hiệu lực",
         registry_expiry_date=date.today() + timedelta(days=200), home_port="Vũng Tàu"),
    dict(name="Bình Minh 02", ship_type="Tàu dịch vụ", imo_number="IMO0000002",
         build_year=2013, flag="Việt Nam", registry_status="Sắp hết hạn",
         registry_expiry_date=date.today() + timedelta(days=25), home_port="Vũng Tàu"),
    dict(name="Yết Kiêu", ship_type="Tàu lặn", imo_number="IMO0000003",
         build_year=2009, flag="Việt Nam", registry_status="Còn hiệu lực",
         registry_expiry_date=date.today() + timedelta(days=300), home_port="Vũng Tàu"),
    dict(name="Trường Sa 15", ship_type="Tàu cẩu", imo_number="IMO0000004",
         build_year=2007, flag="Việt Nam", registry_status="Còn hiệu lực",
         registry_expiry_date=date.today() + timedelta(days=120), home_port="Vũng Tàu"),
    dict(name="Hoa Sen", ship_type="Tàu khách", imo_number="IMO0000005",
         build_year=2015, flag="Việt Nam", registry_status="Còn hiệu lực",
         registry_expiry_date=date.today() + timedelta(days=400), home_port="Vũng Tàu"),
]


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Ship).count() > 0:
            print("Đã có dữ liệu trong database — bỏ qua seed (để tránh trùng lặp).")
            return

        ships = []
        for data in MOCK_SHIPS:
            ship = Ship(**data, notes="[DỮ LIỆU MẪU] Thay bằng thông tin thật.")
            db.add(ship)
            ships.append(ship)
        db.flush()

        # Một lịch sử kiểm tra mẫu cho con tàu đầu tiên
        inspection = Inspection(
            ship_id=ships[0].id,
            inspection_date=date.today() - timedelta(days=30),
            inspector_name="Nguyễn Văn A (mẫu)",
            inspection_type="Nội bộ",
            result="Đạt có điều kiện",
            summary="[DỮ LIỆU MẪU] Kiểm tra định kỳ an toàn theo checklist VSP-000-ATMT-448.",
        )
        db.add(inspection)
        db.flush()
        db.add_all([
            InspectionFinding(inspection_id=inspection.id, item_name="Thiết bị cứu sinh", result="Đạt"),
            InspectionFinding(inspection_id=inspection.id, item_name="Hệ thống chữa cháy",
                               result="Không đạt", note="Bình chữa cháy hết hạn, cần thay thế."),
        ])

        # Một sự cố mẫu
        db.add(Incident(
            ship_id=ships[1].id,
            incident_date=date.today() - timedelta(days=10),
            title="[DỮ LIỆU MẪU] Rò rỉ dầu nhẹ tại khoang máy",
            description="Phát hiện rò rỉ dầu nhỏ trong quá trình vận hành.",
            severity="Nhẹ",
            cause="Gioăng phớt bơm dầu bị mòn.",
            corrective_action="Đã thay gioăng phớt, kiểm tra lại toàn bộ hệ thống bơm.",
            status="Đã khắc phục",
            reported_by="Trần Văn B (mẫu)",
        ))

        db.commit()
        print(f"Đã seed {len(ships)} tàu mẫu + 1 kiểm tra + 1 sự cố mẫu.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
