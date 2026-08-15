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

## checklist/ — App An toàn tàu (Giai đoạn 2, công cụ độc lập)

`checklist/index.html` là một ứng dụng web PWA **độc lập, 1 file duy nhất**,
không cần server/backend — mở trực tiếp trong trình duyệt hoặc cài như app
trên điện thoại (Add to Home Screen). Đây là **app dùng chung**, gồm hai chế
độ chuyển qua lại bằng hai nút ở đầu màn hình:

### 🚢 Đi kiểm tra — dùng tại tàu

- **570 mục checklist**, chia 5 tab, xếp theo đúng **Phiếu đi tuyến kiểm tra
  tàu** của Phòng An toàn & Môi trường (tổng ≈ 7 giờ làm việc):
  - **Hồ sơ** (144 mục / 14 nhóm) — Bước 0 chuẩn bị tại phòng, Bước 1 họp mở
    đầu, rồi **ngồi tại cabin** kiểm tra hồ sơ gộp theo loại: đăng kiểm, cứu sinh,
    cứu hỏa, môi trường, thông tin liên lạc, nhân sự, SMS/ISM, ISPS, kỹ thuật,
    quyết định nội bộ, sổ tay – kế hoạch – sơ đồ được duyệt.
  - **Thực địa** (243 mục / 12 nhóm) — 12 chặng đi tuyến một chiều theo đúng
    bố trí thật của tàu, mỗi chặng ghi rõ thời lượng và người đi kèm: buồng
    lái → nóc cabin → khu nhà ở (xuống dần) → khu cứu sinh quanh khu nhà ở →
    trạm cứu hỏa → **ra mũi tàu** → boong chính đi từ mũi về lái → **giữa tàu
    nơi đặt cẩu** và thiết bị nâng, trạm hàn, kho, boong sau → bếp → buồng máy
    → an toàn điện → thử tính năng & báo động.
  - **Tổng quan** (39 mục / 5 nhóm) — mục xuyên suốt toàn tàu, phỏng vấn
    thuyền viên, diễn tập bất ngờ, họp kết thúc và công việc sau kiểm tra.
  - **Mới & PSC** (76 mục / 11 nhóm) — quy định có hiệu lực SAU 2016 mà bộ tài
    liệu nội bộ (soạn 2014–2016) chưa có: CIC 2026 chằng buộc hàng hóa, BWM,
    MARPOL Annex VI/lưu huỳnh 0,50%, EEXI/CII/SEEMP III, máy đo khí 5 khí theo
    MSC.581(110), MLC 2006, an ninh mạng ISM, SOLAS II-1/3-13 thiết bị nâng và
    tời neo hiệu lực 01/01/2026.
  - **Ngoài khơi** (68 mục / 9 nhóm) — chuẩn kiểm tra của khách hàng và tổ
    chức bên ngoài: eCMID (IMCA M149), OVID (OVIQ4), tàu DP, tàu lặn, tàu cẩu
    và tàu kéo–thả neo, kiểm tra của đăng kiểm/P&I/chủ hàng.
- Mỗi mục trích dẫn điều khoản cụ thể (SOLAS, LSA Code, MARPOL, ISM, ISPS,
  MSC Circ., TCVN, VSP-000-ATMT…) để đối chiếu khi tranh luận với đoàn kiểm tra.
- Tiêu đề mục ngắn gọn; bấm vào mục để mở **hướng dẫn kiểm tra thực tế**: các
  bước làm, chỗ cần soi đèn, con số cần đọc trên thiết bị, cách đối chiếu chéo
  giữa các hồ sơ và lỗi hay gặp. **Cả 570 mục đều đã có hướng dẫn**
  (trung bình ~300 ký tự/mục).
- **Từ điển chú thích 206 mục** cho người chưa học hàng hải: mọi từ viết tắt và
  thuật ngữ có trong từ điển đều được **gạch chân chấm** ngay trong tiêu đề, dòng
  căn cứ và phần hướng dẫn — chạm vào là hiện tên đầy đủ kèm giải thích bằng lời
  thường (SOLAS, MARPOL, ISM, HRU, EEBD, SWL, LEL, DP, mạn khô, la canh, tu chỉnh
  hải đồ, cửa kín thời tiết, đại phó, thủy thủ trưởng…). Có nút **📖 Tra từ viết
  tắt & thuật ngữ** ở đầu danh sách, tìm được cả khi gõ không dấu.
- Đánh dấu Đạt/Không đạt/N/A từng mục, ghi chú, chụp/đính kèm ảnh minh chứng.
- Mỗi mục "Không đạt" chọn được **mức độ khắc phục** theo Phiếu đi tuyến:
  ① dừng ngay · ② trước khi rời bến · ③ có thời hạn (≤30 ngày) · ④ ghi nhận
  cải tiến.
- Bấm "Lập biên bản" để nạp tự động các mục "Không đạt" và **xếp theo mức độ**.
  Mỗi dòng ghi thêm: **bộ phận phụ trách** (máy tự đoán, sửa lại được), **phân
  loại NC / Obs / khuyến nghị**, **căn cứ** (tự lấy điều khoản của chính mục đó),
  **ý kiến của tàu**, và một ô tích **"đưa mục này vào Biên bản cấp III"**.
- Từ đó xuất **hai file .docx thật** (tự sinh, không cần thư viện ngoài):
  1. **Báo cáo kết quả kiểm tra tình trạng tàu** — bản chính, dạng công văn gửi
     Giám đốc Xí nghiệp, in kèm ảnh bằng chứng và bảng tổng hợp kết quả.
  2. **Biên bản đánh giá kiểm tra cấp III** — mẫu VTB07-02-04A, **chỉ gồm những
     dòng đã tích chọn**, chia theo bộ phận, cột phân loại NC/Obs.

### 📊 Tổng hợp & phân tích — dùng tại phòng

- **Nút "Đưa vào kho phân tích"** trong màn hình lập biên bản đẩy thẳng kết quả
  vừa kiểm tra thành một kỳ kiểm tra trong kho — **không phải nhập tay hai lần**.
  Bấm lại thì cập nhật đúng kỳ đó chứ không tạo bản trùng.
- Ngoài ra vẫn **đưa hồ sơ các kỳ cũ vào** bằng 3 cách: nạp thẳng file Word
  (.docx, tự giải nén và bóc bảng phát hiện), dán bảng từ Word, hoặc nhập tay.
  Biên bản bản scan (ảnh, PDF scan) máy không đọc chữ được.
- Mỗi phát hiện gắn: mảng (boong, máy, điện, cứu sinh, cứu hỏa, hồ sơ, bếp,
  thiết bị nâng, môi trường, an ninh, con người), mức độ (NC / vi phạm / ghi
  nhận / khuyến nghị), căn cứ, thời hạn, trách nhiệm, trạng thái khắc phục.
- **Phân tích tự động**: tỷ lệ khắc phục, số quá hạn, phân bố theo mảng và
  theo loại kiểm tra, và quan trọng nhất là **lỗi lặp lại qua nhiều kỳ** —
  so khớp nội dung sau khi bỏ dấu tiếng Việt, đây là dấu hiệu hệ thống quản
  lý chưa xử lý tận gốc.
- **Kết luận điểm mạnh – điểm yếu** sinh tự động từ số liệu.
- **Xuất file Word thật** theo 4 mẫu: báo cáo điểm mạnh – điểm yếu; biên bản
  kiểm tra cấp IV (VSP-000-ATMT-452/F-001); danh mục sự ghi nhận và sự không
  phù hợp (VTB07-02-04A); báo cáo kết quả kiểm tra tình trạng tàu.

### Chung

- Dữ liệu lưu trong `localStorage` của trình duyệt (không có backend) — phù
  hợp dùng ngay tại hiện trường; sau này Giai đoạn 3 sẽ đồng bộ kết quả vào
  kho dữ liệu chính (`app/`).
- Cùng phong cách/kiến trúc với công cụ "Kiểm soát ATSKMT nhà thầu" đã có
  của XN VTB&CTL. ES5 thuần để chạy được cả trên Safari iOS đời cũ.

Muốn dùng ngay: mở file `checklist/index.html` bằng trình duyệt, hoặc host
tĩnh qua GitHub Pages nếu bật cho repo này.

**Số phiên bản:** góc trên bên phải app hiện dòng `bản <ngày>/<số>` (biến
`APP_VER` trong file). Sau khi cập nhật mà số này không đổi thì trình duyệt
đang giữ bản cũ trong bộ nhớ đệm — tải lại trang, hoặc với app đã cài ra màn
hình chính thì xóa app rồi thêm lại.

## phantich/ — đã gộp vào app chung

Trước đây là công cụ riêng. Từ bản 2026-08-15/5 nó đã được gộp vào
`checklist/index.html` thành chế độ **📊 Tổng hợp & phân tích**, để kết quả đi
kiểm tra tại tàu chảy thẳng sang phần tổng hợp. `phantich/index.html` nay chỉ
còn là trang chuyển hướng giữ cho các link cũ không hỏng; dữ liệu đã nhập
không mất vì `localStorage` gắn với tên miền chứ không gắn với đường dẫn.

## Lộ trình tiếp theo

1. ~~Kho dữ liệu nền~~ (Giai đoạn 1 — `app/`)
2. ~~Checklist kiểm tra đa nguồn~~ (Giai đoạn 2 — `checklist/`, xem trên)
3. Đồng bộ kết quả kiểm tra vào kho dữ liệu (không nhập tay 2 lần)
4. AI phân tích & tư vấn dựa trên dữ liệu đã lưu
5. Báo cáo tổng hợp theo thời gian, xuất Word/PDF/Excel
6. AI kiểm tra qua hình ảnh/video/camera (dự án riêng, làm cuối)
