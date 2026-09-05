# CLAUDE.md — vsp-fleet-safety

App web nội bộ quản lý an toàn đội tàu XN VTB&CTL. FastAPI + SQLite + Jinja2, chạy offline.
Chi tiết: `README.md`.

## Lệnh

```bash
pip install -r requirements.txt httpx   # httpx chỉ để chạy đo
uvicorn app.main:app --reload --port 8000
python -m app.seed                      # dữ liệu mẫu
bash scripts/do.sh                      # ĐO: đạt 2/2, thoát 0
```

Chạy `scripts/do.sh` trước mỗi commit. Ngưỡng và phần còn nợ: `docs/thuoc-do.md`.

## Bẫy

- `checklist/index.html` **932 KB, 9966 dòng** — app PWA một file. **Cấm đọc cả file.**
  Dùng `grep -n` tìm chỗ cần rồi `sed -n 'A,Bp'` đọc đúng đoạn.
- `data/`, `uploads/` là **dữ liệu công ty thật**: không commit, không đọc bừa.
  `scripts/do.sh` chạy trên CSDL tạm — giữ vậy, đừng trỏ vào `data/fleet.db`.
- App **chưa có đăng nhập**. Đừng tự thêm; hỏi chủ dự án trước.

## Luật

- Tiếng Việt. Mỗi commit một việc, message **không dấu**: `feat: them bo loc theo tau`.
- **Cấm** để mật khẩu, token, số điện thoại, thông tin nội bộ công ty vào repo.
- File trong `.claude/file_khoa.txt` phải hỏi chủ dự án trước khi sửa.
- Nói "xong" phải kèm dòng `Số đo:` — hook `Stop` chặn nếu thiếu.
- Kho ghi nhớ chung mọi dự án: `github.com/gc1001vn-svg/ghi-nho`.
