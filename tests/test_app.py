"""Test cho vsp-fleet-safety. Chay: python3 -m unittest discover -s tests -v

Doi CSDL sang file tam TRUOC khi import app, de khong dung vao data/fleet.db that.
"""
import asyncio
import os
import tempfile
import unittest
from datetime import date

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.database as db

_TAM = tempfile.mkdtemp()
db.engine = create_engine(
    f"sqlite:///{os.path.join(_TAM, 'thu.db')}", connect_args={"check_same_thread": False}
)
db.SessionLocal = sessionmaker(bind=db.engine, autoflush=False, autocommit=False)

from fastapi.testclient import TestClient  # noqa: E402

from app import utils  # noqa: E402
from app.main import app  # noqa: E402

utils.UPLOAD_DIR = os.path.join(_TAM, "uploads")


class DocGiaTriTuForm(unittest.TestCase):
    """app/utils.py: ba ham doc gia tri tu form, deu phai chiu duoc o trong."""

    def test_ngay(self):
        self.assertEqual(utils.parse_optional_date("2026-09-05"), date(2026, 9, 5))
        self.assertIsNone(utils.parse_optional_date(""))
        self.assertIsNone(utils.parse_optional_date(None))
        with self.assertRaises(ValueError):
            utils.parse_optional_date("05/09/2026")

    def test_so_thuc(self):
        self.assertEqual(utils.parse_optional_float("1234.5"), 1234.5)
        self.assertIsNone(utils.parse_optional_float(""))
        self.assertIsNone(utils.parse_optional_float("mot nghin"))

    def test_so_nguyen(self):
        self.assertEqual(utils.parse_optional_int("2018"), 2018)
        self.assertIsNone(utils.parse_optional_int(""))
        self.assertIsNone(utils.parse_optional_int("2018.5"))


class LuuFileDinhKem(unittest.TestCase):
    """save_upload: giu ten goc, dat ten file moi khong trung, ghi dung thu muc."""

    def test_luu_hai_file_cung_ten(self):
        from fastapi import UploadFile

        async def luu(ten):
            with tempfile.SpooledTemporaryFile() as buf:
                f = UploadFile(filename=ten, file=buf)
                await f.write(b"noi dung anh")
                await f.seek(0)
                return await utils.save_upload(f, "inspections/1")

        (ten1, duong1) = asyncio.run(luu("anh.jpg"))
        (ten2, duong2) = asyncio.run(luu("anh.jpg"))

        self.assertEqual(ten1, "anh.jpg")
        self.assertEqual(ten2, "anh.jpg")
        self.assertNotEqual(duong1, duong2)  # trung ten thi khong duoc de len nhau
        for duong in (duong1, duong2):
            self.assertTrue(duong.startswith("uploads/inspections/1/"))
            self.assertTrue(duong.endswith(".jpg"))
            that = os.path.join(utils.UPLOAD_DIR, duong.split("uploads/", 1)[1])
            self.assertTrue(os.path.exists(that))


class LuongThemDuLieu(unittest.TestCase):
    """Them tau -> them kiem tra -> them su co, roi mo lai tung trang chi tiet."""

    @classmethod
    def setUpClass(cls):
        cls.c = TestClient(app)

    def test_luong_day_du(self):
        r = self.c.post("/ships/new", data={"name": "Tau Thu Nghiem", "build_year": "2018"})
        self.assertEqual(r.status_code, 200)  # da di theo chuyen huong
        ma_tau = int(r.url.path.rsplit("/", 1)[1])

        r = self.c.post(
            f"/ships/{ma_tau}/inspections/new",
            data={
                "inspection_date": "2026-09-05",
                "inspector_name": "Nguoi kiem tra",
                "inspection_type": "Cap III",
                "result": "Dat",
                "item_name": "Phao cuu sinh",
                "item_result": "Dat",
                "item_note": "",
            },
        )
        self.assertEqual(r.status_code, 200)
        ma_kt = int(r.url.path.rsplit("/", 1)[1])

        r = self.c.post(
            f"/ships/{ma_tau}/incidents/new",
            data={"incident_date": "2026-09-05", "title": "Su co thu nghiem", "severity": "Nhe"},
        )
        self.assertEqual(r.status_code, 200)
        ma_sc = int(r.url.path.rsplit("/", 1)[1])

        for duong in (
            f"/ships/{ma_tau}",
            f"/ships/{ma_tau}/edit",
            f"/inspections/{ma_kt}",
            f"/incidents/{ma_sc}",
            f"/incidents/{ma_sc}/edit",
            f"/ships/{ma_tau}/inspections/new",
            f"/ships/{ma_tau}/incidents/new",
        ):
            with self.subTest(duong=duong):
                self.assertEqual(self.c.get(duong).status_code, 200)

    def test_ma_khong_co_thi_ve_trang_chu(self):
        r = self.c.get("/ships/999999")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.url.path, "/")


if __name__ == "__main__":
    unittest.main()
