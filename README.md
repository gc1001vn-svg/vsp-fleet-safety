# Quản lý an toàn đội tàu — XN Vận tải biển & Công tác lặn (Vietsovpetro)

Ứng dụng web nội bộ để lưu trữ và tra cứu tập trung thông tin an toàn của
đội tàu (20 tàu) và toàn Xí nghiệp: thông tin tàu, lịch sử kiểm tra an
toàn, sự cố/vi phạm, tài liệu liên quan.

**Trạng thái hiện tại: Giai đoạn 1 — Kho dữ liệu nền.** Đây là nền tảng
cho 5 giai đoạn tiếp theo (checklist đa nguồn, đồng bộ kiểm tra, AI phân
tích, báo cáo tổng hợp, AI kiểm tra qua hình ảnh/video).

## Công nghệ

- Backend: Python + FastAPI
- Database: SQLite (file local `data/fleet.db`), qua SQLAlchemy
- Giao diện: server-rendered (Jinja2), không phụ thuộc CDN/cloud ngoài
- Chạy hoàn toàn offline/nội bộ

## Cài đặt

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Chạy thử (development)

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Mở trình duyệt: http://localhost:8000

## Nạp dữ liệu mẫu (để kiểm tra giao diện, KHÔNG phải dữ liệu thật)

```bash
python -m app.seed
```

Lệnh này tạo 5 tàu mẫu + 1 lần kiểm tra mẫu + 1 sự cố mẫu, đánh dấu rõ
`[DỮ LIỆU MẪU]`. Khi có dữ liệu thật, xóa file `data/fleet.db` để làm lại
từ đầu, hoặc nhập trực tiếp qua giao diện web (Thêm tàu / Sửa).

## Cấu trúc dữ liệu

- **ships** — thông tin từng tàu (loại tàu, thông số kỹ thuật, đăng kiểm...)
- **inspections** + **inspection_findings** — lịch sử kiểm tra an toàn theo
  từng hạng mục
- **incidents** — sự cố/vi phạm (mô tả, mức độ, nguyên nhân, biện pháp
  khắc phục, trạng thái)
- **documents** — tài liệu liên quan (gắn 1 tàu cụ thể hoặc chung toàn
  Xí nghiệp)
- **attachments** — file/ảnh minh chứng đính kèm cho kiểm tra và sự cố

File đính kèm được lưu trong thư mục `uploads/`. Cả `data/` và `uploads/`
**không** được commit vào git (xem `.gitignore`) — dữ liệu chỉ tồn tại
trên máy/server chạy ứng dụng.

## Lưu ý quan trọng trước khi dùng dữ liệu thật

- Đây là **dữ liệu công ty**. Trước khi triển khai chính thức (không phải
  test), cần hỏi cấp trên/CNTT về nơi được phép lưu trữ và có backup định
  kỳ (copy file `data/fleet.db` và thư mục `uploads/`).
- Ứng dụng hiện chưa có xác thực đăng nhập (phù hợp môi trường nội bộ tin
  cậy) — nếu triển khai trên server nhiều người truy cập, cân nhắc thêm
  xác thực trước khi dùng dữ liệu thật.

## Lộ trình tiếp theo

1. ~~Kho dữ liệu nền~~ (giai đoạn này)
2. Checklist kiểm tra đa nguồn (nội bộ, cảng vụ, đăng kiểm, SOLAS/MARPOL/ISM/ISPS)
3. Đồng bộ kết quả kiểm tra vào kho dữ liệu (không nhập tay 2 lần)
4. AI phân tích & tư vấn dựa trên dữ liệu đã lưu
5. Báo cáo tổng hợp theo thời gian, xuất Word/PDF/Excel
6. AI kiểm tra qua hình ảnh/video/camera (dự án riêng, làm cuối)
