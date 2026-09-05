# Thước đo của repo `vsp-fleet-safety`

Luật chung: `ghi-nho/cong-cu/thuoc_do.md`. Bảng này là phần riêng của repo này.

| Đo cái gì | Lệnh | Ngưỡng đạt | Đo ở đâu |
|---|---|---|---|
| Cú pháp Python + mọi đường GET trả 200 | `bash scripts/do.sh` | 2/2, thoát 0 | máy ảo được |

Cần cài trước: `pip install -r requirements.txt httpx`.

`scripts/do.sh` làm hai việc:

1. `python3 -m compileall -q app` — mọi file Python biên dịch được.
2. Mở app bằng `TestClient`, gọi mọi đường GET không có tham số trong sơ đồ OpenAPI
   (hiện 4 đường), đòi mã 200. Chạy trên **CSDL SQLite tạm**, không đụng `data/fleet.db`.

## Còn nợ

- Đường có tham số (`/ships/{ship_id}`, `/incidents/{incident_id}`…) chưa đo — cần tạo
  dữ liệu mẫu trước. Đường `POST` (thêm tàu, thêm sự cố, tải file) cũng chưa.
- Chưa có test cho logic tính toán trong `app/utils.py`, `app/models.py`.

Nợ này nghĩa là: sửa mấy chỗ đó thì `scripts/do.sh` xanh **không chứng minh được gì**.
Muốn sửa thì dựng cách đo trước — `ghi-nho/quyet-dinh/2026-09-05-chua-do-duoc-thi-khong-sua.md`.

## Việc không cần đo

Sửa chữ, đổi tên file, thêm ghi chú, cập nhật tài liệu, thêm checklist mẫu.
Ghi `Số đo: không cần — <lý do>`.
