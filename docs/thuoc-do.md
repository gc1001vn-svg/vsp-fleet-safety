# Thước đo của repo `vsp-fleet-safety`

Luật chung: `ghi-nho/cong-cu/thuoc_do.md`. Bảng này là phần riêng của repo này.

| Đo cái gì | Lệnh | Ngưỡng đạt | Đo ở đâu |
|---|---|---|---|
| Cú pháp · đường GET · test | `bash scripts/do.sh` | 3/3, thoát 0 | máy ảo được |
| Riêng test | `python3 -m unittest discover -s tests` | 6 test, 0 lỗi | máy ảo được |

Cần cài trước: `pip install -r requirements.txt httpx`.

`scripts/do.sh` đo ba mục:

1. `python3 -m compileall -q app` — mọi file Python biên dịch được.
2. Mọi đường GET không có tham số trong sơ đồ OpenAPI (hiện 4 đường) trả mã 200.
3. `tests/test_app.py` — 6 test.

Tất cả chạy trên **CSDL SQLite tạm**, không đụng `data/fleet.db`; file đính kèm ghi vào
thư mục tạm, không đụng `uploads/`.

## `tests/test_app.py` đo gì

- **`app/utils.py`**: `parse_optional_date` · `parse_optional_float` · `parse_optional_int`
  — giá trị đúng, ô trống, `None`, và giá trị sai định dạng.
- **`save_upload`**: hai file trùng tên `anh.jpg` phải ra hai đường dẫn khác nhau
  (không đè lên nhau), giữ đuôi `.jpg`, ghi đúng thư mục con, file có thật trên đĩa.
- **Luồng thêm dữ liệu**: `POST /ships/new` → `POST /ships/{id}/inspections/new`
  (kèm một hạng mục kiểm tra) → `POST /ships/{id}/incidents/new`, rồi mở lại 7 trang
  chi tiết và trang sửa, đòi mã 200.
- **Mã không có**: `GET /ships/999999` phải chuyển về trang chủ, không lỗi 500.

## Còn nợ

- `POST /documents/new` (tải tài liệu lên) và các đường `/delete`, `/deactivate`,
  `/edit` dạng POST chưa đo.
- Chưa đo phần lọc và tìm kiếm ở trang chủ (`?q=`, `?ship_type=`).
- `checklist/index.html` (app PWA 932 KB) không có test nào.

## Việc không cần đo

Sửa chữ, đổi tên file, thêm ghi chú, cập nhật tài liệu, thêm checklist mẫu.
Ghi `Số đo: không cần — <lý do>`.
