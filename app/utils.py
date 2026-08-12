import os
import uuid

from fastapi import UploadFile

from app.database import UPLOAD_DIR


async def save_upload(file: UploadFile, subfolder: str) -> tuple[str, str]:
    """Lưu file upload vào uploads/<subfolder>/, trả về (tên gốc, đường dẫn tương đối)."""
    folder = os.path.join(UPLOAD_DIR, subfolder)
    os.makedirs(folder, exist_ok=True)

    ext = os.path.splitext(file.filename or "")[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest = os.path.join(folder, unique_name)

    content = await file.read()
    with open(dest, "wb") as out:
        out.write(content)

    rel_path = os.path.join("uploads", subfolder, unique_name)
    return file.filename or unique_name, rel_path


def parse_optional_date(value: str | None):
    from datetime import date

    if not value:
        return None
    return date.fromisoformat(value)


def parse_optional_float(value: str | None):
    if not value:
        return None
    try:
        return float(value)
    except ValueError:
        return None


def parse_optional_int(value: str | None):
    if not value:
        return None
    try:
        return int(value)
    except ValueError:
        return None
