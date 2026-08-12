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

## checklist/ — Kiểm tra an toàn tàu (Giai đoạn 2, công cụ độc lập)

`checklist/index.html` là một ứng dụng web PWA **độc lập, 1 file duy nhất**,
không cần server/backend — mở trực tiếp trong trình duyệt hoặc cài như app
trên điện thoại (Add to Home Screen). Dùng khi đi kiểm tra thực địa trên tàu.

- 211 mục checklist tổng hợp từ 12 nguồn (nội bộ VSP, PSC, ISM/ISPS...), chia
  3 tab theo đúng quy trình thực tế: **Hồ sơ** → **Thực địa** (nóc cabin →
  buồng lái → khu nhà ở → mũi tàu → boong chính → nhà bếp → buồng máy) →
  **Tổng quan**.
- Đánh dấu Đạt/Không đạt/N/A từng mục, ghi chú, chụp/đính kèm ảnh minh chứng.
- Lập **Biên bản kiểm tra an toàn tàu**, nạp tự động các mục "Không đạt",
  xuất file **.docx thật** (tự sinh, không cần thư viện ngoài) hoặc in trực
  tiếp.
- Dữ liệu lưu trong `localStorage` của trình duyệt (không có backend) — phù
  hợp dùng ngay tại hiện trường; sau này Giai đoạn 3 sẽ đồng bộ kết quả vào
  kho dữ liệu chính (`app/`) để không phải nhập tay 2 lần.
- Cùng phong cách/kiến trúc với công cụ "Kiểm soát ATSKMT nhà thầu" đã có
  của XN VTB&CTL.

Muốn dùng ngay: mở file `checklist/index.html` bằng trình duyệt, hoặc host
tĩnh qua GitHub Pages nếu bật cho repo này.

## Lộ trình tiếp theo

1. ~~Kho dữ liệu nền~~ (Giai đoạn 1 — `app/`)
2. ~~Checklist kiểm tra đa nguồn~~ (Giai đoạn 2 — `checklist/`, xem trên)
3. Đồng bộ kết quả kiểm tra vào kho dữ liệu (không nhập tay 2 lần)
4. AI phân tích & tư vấn dựa trên dữ liệu đã lưu
5. Báo cáo tổng hợp theo thời gian, xuất Word/PDF/Excel
6. AI kiểm tra qua hình ảnh/video/camera (dự án riêng, làm cuối)
