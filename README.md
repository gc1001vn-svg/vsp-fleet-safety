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

- **637 mục checklist**, chia 6 tab, xếp theo đúng **Phiếu đi tuyến kiểm tra
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
- Giao diện làm cho **điện thoại**: đầu trang tự thu gọn khi cuộn (còn ~83 px),
  tab một hàng cuộn ngang, ba nút **Đạt / Không đạt / Không áp dụng** ghi rõ chữ
  và chiếm hết bề ngang; thanh lọc **Tất cả · Chưa xét · Không đạt · Đạt** kèm số
  đếm, và ô ☰ nhảy thẳng tới nhóm cần đến.
- Mỗi mục trích dẫn điều khoản cụ thể (SOLAS, LSA Code, MARPOL, ISM, ISPS,
  MSC Circ., TCVN, VSP-000-ATMT…) để đối chiếu khi tranh luận với đoàn kiểm tra.
- Thiết bị hàng hải và ấn phẩm được viết thành **quy trình từng bước** (BƯỚC 1,
  BƯỚC 2…): hải đồ và cách tu chỉnh, ấn phẩm hàng hải, radar, GPS, EPIRB, SART,
  AIS, VHF/MF/HF DSC, ECDIS, NAVTEX, đo sâu, VDR, la bàn từ, la bàn con quay,
  BNWAS, máy lái tự động, đèn hành hải, còi, đo gió, thử máy lái 12 giờ.
- Tiêu đề mục ngắn gọn; bấm vào mục để mở **hướng dẫn kiểm tra thực tế**: các
  bước làm, chỗ cần soi đèn, con số cần đọc trên thiết bị, cách đối chiếu chéo
  giữa các hồ sơ và lỗi hay gặp. **Cả 637 mục đều đã có hướng dẫn**
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
- **Nạp hồ sơ các năm trước hàng loạt**: chọn một lúc nhiều file .docx, máy tự
  đoán loại kiểm tra (cấp III / cấp IV / tình trạng tàu / PSC / đăng kiểm / chủ
  hàng), ngày và số biên bản từ nội dung hoặc tên file, rồi tách bảng phát hiện
  thành từng dòng. Vẫn có cách dán bảng từ Word và nhập tay cho từng kỳ.
  Biên bản bản scan (ảnh, PDF chụp) máy không đọc chữ được.
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

### 🔍 Tìm kiếm trong checklist

Nút **🔍 Tìm** trong dải lọc mở ô tìm kiếm gộp cả 6 tab. Thấy lỗi ngoài hiện
trường thì gõ vài chữ là ra đúng mục, chấm điểm và **chụp ảnh ngay tại kết
quả**; ảnh và mã mục theo sang biên bản khi bấm *Nạp từ checklist*.

Chấm điểm theo **từ trọn vẹn** chứ không theo chuỗi con, cộng điểm khi trúng
nguyên cụm và khi các từ nằm gần nhau. Gõ **có dấu** thì khớp đúng dấu ăn điểm
áp đảo — đây là cách duy nhất tách "bảo ôn" khỏi "thông báo ổn định" sau khi bỏ
dấu. Mặc định bắt buộc trúng mọi từ; không mục nào đạt mới nới ra và báo rõ là
kết quả gần đúng.

### 👁 Tab QUAN SÁT — 65 mục nhìn là thấy

Bốn tab cũ kiểm tra theo hồ sơ và theo thiết bị, không có mục nào bắt phải xem
rỉ sét, dầu mỡ, nước la canh, ngăn nắp, vật để sai chỗ. Sáu nhóm bổ sung:

1. Ăn mòn, sơn & bảo dưỡng kết cấu (14) · 2. Vệ sinh, rò rỉ & môi trường (13)
3. Ngăn nắp & chằng buộc (8) · 4. Vật để sai chỗ & vật cấm (12)
5. Lối đi, chống ngã & bảo hộ (10) · 6. Biển báo, nhận biết & thiết bị (8)

Mỗi mục ghi đủ sáu phần: dấu hiệu nhìn thấy, vị trí hay gặp, chuẩn đúng là thế
nào, cách hướng dẫn thuyền viên, khắc phục, chống tái diễn.

### 📖 Hướng dẫn làm đúng cho từng mục

Phần *xem lưu ý* sẵn có nói **cách kiểm tra**. Phần này nói **chuẩn đúng là gì**
và **cách chỉ lại cho thuyền viên** khi thấy họ làm sai, kèm lỗi hay gặp.

Thư viện 49 mẫu theo chủ đề, gắn vào mục bằng **khớp cụm từ** — tách thành từ
rời thì "thử", "van", "quản lý" khớp lung tung (bản thử đầu tiên gắn nhầm
"Radar — thử vận hành" vào mẫu máy đo khí). Bắt buộc trúng ở **tiêu đề** mục
mới tính là đúng chủ đề. Kết quả: **384 mục có mẫu chủ đề riêng, 188 mục dùng
nguyên tắc chung** (app ghi rõ mục nào đang dùng mẫu chung), 65 mục tab QUAN
SÁT đã có hướng dẫn viết riêng.

### 📓 Sổ ghi nhận chuyến đi

Quét trực tiếp **không báo động, không cắt ngang**. Mọi thứ máy thấy rơi vào sổ.
Xong chuyến bấm **📓 Sổ**, soát lại, bỏ cái không cần, đưa một lượt sang biên bản.

- **So khớp cục bộ** gắn lỗi máy mô tả vào 1 trong 637 mục, không tốn thêm lượt
  gọi API. Gắn được thì tự đánh dấu mục đó *Không đạt* kèm ảnh và điền căn cứ.
- Gán nhầm tệ hơn không gán, nên ngoài điểm số còn đòi: một **cặp từ liền nhau**
  của câu mô tả phải nằm trong tiêu đề mục, và mục đầu phải hơn mục nhì một
  khoảng rõ rệt. Thử 10 tình huống thật: 8 tự gắn đúng, 2 ca máy tự nhận không
  chắc và đưa 3 mục gợi ý để bấm chọn.
- Lỗi **không mục nào khớp** vẫn vào biên bản, kèm nút bổ sung thẳng vào
  checklist (nhóm *Mục tự thêm* trong tab QUAN SÁT).
- Nút **📸 chụp tay** cho chỗ máy không biết là vi phạm.
- **Sổ mẫu lỗi** nhớ lại mọi thứ đã ghi nhận và nhắc cho máy ở các lần quét sau,
  ưu tiên thứ do anh tự chụp.

### 📄 Hai file báo cáo — bám đúng mẫu công văn của đơn vị

Bảng vi phạm theo đúng mẫu thật: **TT/No. · Những công việc phải làm ·
Khắc phục / thời hạn · Ghi chú**. Các dòng song ngữ Việt–Nga (Кас, Кому,
Рекомендации, С уважением, Рассылка) giữ đúng như công văn gốc.

**Cột "Khắc phục / thời hạn" app tự đề xuất** theo đúng quy ước đang dùng:

| Trạng thái dòng | In ra |
|---|---|
| Đã khắc phục | `Đã khắc phục` |
| Chưa được cấp | `Chưa được cấp` |
| Phát hiện mới, mức ① | `Ngay lập tức(mới)` |
| Phát hiện mới, mức ② | `Trước khi rời bến(mới)` |
| Phát hiện mới, mức ③ | `09/2026(mới)` — hẹn tháng sau |
| Phát hiện mới, mức ④ | `Lên kế hoạch(mới)` |
| Tồn đọng kỳ trước | như trên, bỏ đuôi `(mới)` |

Nút **⏱ Đề xuất thời hạn** bù cho mọi dòng còn trống; sửa lại từng dòng được.

**Cột "Ghi chú"** (trước là *Ý kiến của tàu*) là chỗ ghi cách khắc phục gửi
xuống tàu để tàu tự ghi ý kiến thêm. Để trống thì tự lấy phần *Biện pháp khắc
phục* đã soạn.

Điền ô **Đánh giá lại — theo biên bản ngày** thì câu mở đầu tự chuyển sang thể
đánh giá lại: *"Theo Biên bản kiểm tra ngày …, ngày … đoàn kiểm tra đã tiến
hành đánh giá lại tàu … tại …"*.

### Ba bản xuất

- **📷 Bản kèm ảnh** — 5 cột, có cột *Biện pháp khắc phục & chống tái diễn* ngay
  cạnh cột nội dung, in kèm ảnh bằng chứng.
- **🖊 Bản in để ký** — 4 cột, không ảnh, **không** có hai cột đó. Muốn đưa vào
  thì app hỏi một câu, mặc định là không.
- **📋 Biên bản cấp III** — giữ nguyên.

### 📈 Báo cáo tổng hợp theo thời gian (tab BÁO CÁO)

Gộp mọi kỳ kiểm tra của **mọi tàu** trong một khoảng ngày — khác với báo cáo
điểm mạnh–điểm yếu vốn chỉ gộp theo một tàu. Dùng để viết báo cáo quý và báo
cáo năm.

- Chọn khoảng bằng nút nhanh (Quý này / Quý trước / Năm nay / Năm trước / Tất cả)
  hoặc gõ tay từ ngày – đến ngày. Số liệu tính lại ngay trên màn hình.
- Nội dung tổng hợp: diễn biến theo quý, xếp hạng tàu theo mức cần chú ý, phân
  bố theo bộ phận và loại kiểm tra, **lỗi lặp lại trên cùng một tàu** qua nhiều
  kỳ, danh sách quá hạn kèm số ngày trễ, và phần nhận xét – kiến nghị tự soạn.
- **Xuất Word (.docx)** — 6 mục đánh số, bảng kẻ ô, dòng ký tên, dùng chung bộ
  đóng gói `docxPackage` với các mẫu biên bản khác.
- **Xuất Excel (.xlsx) thật** — 6 trang tính: Tổng quan · Theo quý · Theo tàu ·
  Toàn bộ phát hiện (để tự lọc) · Lỗi lặp lại · Quá hạn. Số ghi vào ô dạng số
  nên cộng và vẽ biểu đồ được ngay. Bộ ghi `xlsxPackage` tự viết bằng
  SpreadsheetML, dùng lại `_zipStore`/`_crc32` của .docx — không thư viện ngoài,
  chuỗi ghi thẳng vào ô (`inlineStr`) nên khỏi dựng bảng sharedStrings.
- **PDF:** không sinh trực tiếp. Sinh PDF có dấu tiếng Việt đúng phông đòi hỏi
  nhúng font vào file, nặng và dễ vỡ chữ; mở file Word rồi *Lưu thành PDF* cho
  kết quả tốt hơn hẳn. App có ghi rõ điều này ngay dưới nút tải.

### 📹 Quét trực tiếp qua camera

Mở camera, vừa đi vừa giơ máy — máy tự soi từng khung hình, báo lỗi ngay trên
màn hình, bấm một cái là dòng đó vào biên bản kèm ảnh. Vào từ nút nổi
**📹 Quét trực tiếp** ở chế độ *Đi kiểm tra*, hoặc từ tab **🤖 TRỢ LÝ**.

- Claude nhận **ảnh, không nhận luồng video**. Nên đây là chụp khung hình theo
  nhịp (mặc định 6 giây) rồi gửi từng cái — gần như trực tiếp, không phải trực
  tiếp thật. Mỗi lượt là một request `POST /v1/messages` không streaming,
  `output_config.effort = "low"` cho nhanh, `max_tokens` 2000.
- **Lọc khung trùng để đỡ tốn tiền:** mỗi nhịp lấy vân tay 48×36 điểm sáng từ
  khung hình, so với khung trước; lệch dưới ngưỡng thì bỏ qua, không gọi API.
  Đứng yên hay quay lại chỗ đã soi đều không mất tiền. Bỏ qua liên tiếp 5 lần
  thì soi ép một cái, để người cố tình giơ máy đứng im vẫn được soi.
- **Lọc phát hiện trùng:** so bằng Jaccard trên token đã bỏ dấu (`similar` ≥ 0.55)
  với các phát hiện đã có trong phiên, nên giơ máy vào đúng cái bình chữa cháy
  đó 5 lần cũng chỉ ra một dòng.
- **Trần lượt và trần tiền**, chạm là tự dừng (mặc định 60 lượt / ~1 USD). Gặp
  lỗi 401/403/429 là dừng hẳn chứ không gọi tiếp. Chuyển sang app khác hay tắt
  màn hình cũng tự dừng (`visibilitychange`). Giữ màn hình sáng bằng
  Screen Wake Lock khi đang quét.
- Bối cảnh **không** gửi kèm dữ liệu đội tàu — system prompt gọn (~1,3 KB), chỉ
  ảnh và tên khu vực đang kiểm tra (tùy chọn). Vừa rẻ vừa đỡ lộ dữ liệu.
- Có công tắc **tự ghi thẳng vào biên bản** cho ai muốn đi nhanh, và bộ đếm
  lượt / phát hiện / tiền đã tiêu hiện ngay trên màn hình.
- Ảnh khung hình đi thẳng vào `photos` của dòng vi phạm nên xuất .docx là có ảnh.

### 🤖 Trợ lý AI (tab TRỢ LÝ trong chế độ Tổng hợp & phân tích)

- Gọi **thẳng Claude API từ trình duyệt**, không qua máy chủ trung gian nào —
  header `anthropic-dangerous-direct-browser-access: true`, endpoint
  `POST https://api.anthropic.com/v1/messages`, có streaming (SSE) nên câu trả
  lời hiện dần chứ không đợi im lặng.
- **Chìa khóa API do người dùng tự tạo** ở `platform.claude.com/settings/keys`
  và lưu trong `localStorage` của chính máy đó. App có hướng dẫn lấy chìa khóa
  6 bước ngay trên màn hình (kèm link bấm thẳng) và nút **🔌 Thử kết nối** gọi
  một lượt 16 token để xác nhận chìa khóa dùng được trước khi hỏi thật.
  Không có chìa khóa nào nằm trong mã nguồn.
- Bối cảnh gửi kèm được dựng từ dữ liệu trong máy: danh sách tàu, từng kỳ kiểm
  tra với đủ phát hiện (bộ phận, NC/Obs, căn cứ, hạn, trạng thái), phần máy đã
  tự tính (tỷ lệ khắc phục, quá hạn, **lỗi lặp lại qua nhiều kỳ**) và phiếu
  checklist đang làm dở. Giới hạn 260 dòng phát hiện để khỏi phình chi phí.
- **Công tắc "Gửi kèm dữ liệu hồ sơ"** cho phép tắt hẳn phần dữ liệu — chỉ gửi
  câu hỏi. Đây là dữ liệu công ty nên app cảnh báo rõ trước khi dùng thật.
- Chọn được mô hình (Opus 5 mặc định / Sonnet 5 / Haiku 4.5), hiện số token và
  chi phí ước tính tích lũy.
- Lỗi được dịch sang tiếng Việt dễ hiểu: sai chìa khóa, hết hạn mức, hết tiền,
  mất mạng, mở bằng `file://` thay vì https.

**Soi ảnh / video tìm lỗi (vision):**

- Đính tối đa 6 ảnh mỗi lượt: **📷 Chụp ảnh** (mở thẳng camera điện thoại),
  **🖼 Chọn ảnh**, hoặc **🎬 Video**. Ảnh được nén xuống cạnh dài 1600 px, JPEG 0.8
  ngay trên máy trước khi gửi.
- **Claude không xem video trực tiếp được** (chỉ nhận JPEG/PNG/GIF/WebP), nên app
  tự tách video thành 6 khung hình cách đều bằng `<video>` + canvas — toàn bộ xử
  lý trên máy, file video không rời khỏi điện thoại.
- Bấm **🔎 Soi ảnh tìm lỗi**: mô hình chỉ ra điểm không an toàn nhìn thấy được,
  nói rõ thấy ở ảnh nào, và với mỗi lỗi trả về đủ **ba phần: lỗi → khắc phục ngay
  → chống tái diễn** (sửa vào đâu trong PMS/SMS/checklist tuần/huấn luyện).
- Kết quả kèm một khối JSON để máy đọc lại, dựng thành thẻ có nút
  **＋ Đưa vào biên bản** — đẩy thẳng vào biên bản đang lập với bộ phận, phân loại,
  mức độ, căn cứ và **chính tấm ảnh làm bằng chứng**. Bộ bóc JSON chịu được rác
  quanh khối (thử lại bằng cách cắt từ `{` đầu tới `}` cuối).
- Mỗi dòng phát hiện đã nhập có nút **🛠 Hỏi cách khắc phục** — tự soạn câu hỏi
  kèm tên tàu, bộ phận, nội dung và căn cứ, hỏi nguyên nhân gốc + cách khắc phục
  + biện pháp chống tái diễn.
- Ảnh chỉ được gửi lại ở lượt có ảnh mới nhất; các lượt cũ thay bằng ghi chú để
  không đội chi phí qua từng lượt hỏi.
- App nhắc rõ giới hạn: máy nhìn ảnh có thể sai, ảnh mờ/tối thì không kết luận
  được, hạn dùng và kết quả thử phải xuống tàu kiểm mới biết.

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
3. Đồng bộ kết quả kiểm tra vào kho dữ liệu (không nhập tay 2 lần) — **chưa làm**
4. ~~AI phân tích & tư vấn dựa trên dữ liệu đã lưu~~ (tab TRỢ LÝ)
5. ~~Báo cáo tổng hợp theo thời gian, xuất Word/Excel~~ (xem trên; PDF thì
   xuất Word rồi Lưu thành PDF)
6. ~~AI kiểm tra qua hình ảnh/video/camera~~ (Quét trực tiếp + Soi ảnh)

**Về mục 3:** `checklist/` là trang tĩnh trên GitHub Pages, không có máy chủ;
`app/` là FastAPI chạy trong mạng nội bộ. Điện thoại ngoài công trường không
gọi thẳng vào `app/` được. Hai hướng khả dĩ: (a) xuất/nhập một file JSON để
chuyển dữ liệu hai chiều mà không cần kết nối trực tiếp, hoặc (b) mở một điểm
tiếp nhận có xác thực trên `app/`, việc này phải hỏi bộ phận CNTT trước.
