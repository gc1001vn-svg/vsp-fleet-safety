#!/usr/bin/env bash
# Lenh do cua repo vsp-fleet-safety. Chay: bash scripts/do.sh
# In ra dong "So do: <dat>/<tong> muc dat". Thoat 1 neu co muc sai.
# Nguong dat: tat ca. Xem docs/thuoc-do.md.
set -u
GOC="$(cd "$(dirname "$0")/.." && pwd)"
cd "$GOC"

dat=0; tong=0; sai=()
ghi() { tong=$((tong + 1)); if [ "$1" = 0 ]; then dat=$((dat + 1)); else sai+=("$2"); fi; }

python3 -m compileall -q app >/dev/null 2>&1; ghi $? "compileall app"

python3 - <<'PY'
import os, sys, tempfile
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Doi sang CSDL tam, khong dung vao data/fleet.db that.
import app.database as db
tam = os.path.join(tempfile.mkdtemp(), "thu.db")
db.engine = create_engine(f"sqlite:///{tam}", connect_args={"check_same_thread": False})
db.SessionLocal = sessionmaker(bind=db.engine, autoflush=False, autocommit=False)

from fastapi.testclient import TestClient
from app.main import app

# Moi duong dan GET khong co tham so -> phai tra 200.
# Lay tu so do OpenAPI: router long nhau khong hien trong app.routes.
duong = sorted(
    d for d, m in app.openapi()["paths"].items()
    if "get" in m and "{" not in d
)
loi = []
with TestClient(app) as c:
    for d in duong:
        try:
            ma = c.get(d).status_code
        except Exception as e:
            loi.append(f"{d} -> {type(e).__name__}")
            continue
        if ma != 200:
            loi.append(f"{d} -> {ma}")
print(f"duong_GET={len(duong)}")
for l in loi:
    print(f"LOI {l}")
sys.exit(1 if loi or not duong else 0)
PY
ghi $? "duong GET tra 200"

echo "So do: $dat/$tong muc dat"
if [ "${#sai[@]}" -gt 0 ]; then
  printf 'Sai: %s\n' "${sai[@]}"
  exit 1
fi
