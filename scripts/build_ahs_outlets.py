"""scripts/ahs.json -> public/seed-ahs.json: AHS yang BELUM ada di data outlet ditambahkan sebagai outlet baru.

AHS dianggap sudah ada (tidak ditambahkan) bila dalam radius 300 m ada outlet lama dengan nama inti yang
sama (mis. "AHS - A SEN" = "A SEN AHS"), atau berjarak <= 5 m. Outlet baru diberi kategori "AHS (NEW)" dan
is_new=true (label NEW di aplikasi). Kecamatan/kelurahan/kota versi publikasi diisi dari batas desa
Kemendagri 2020 (point-in-polygon, di luar repo); skrip ini memakai kecamatan & kota dari file AHS.

Pemakaian: python3 scripts/convert_ahs.py AHS_Jakarta_Bekasi.xlsx && python3 scripts/build_ahs_outlets.py
Lalu naikkan nilai ahsSeeded (ganti nama flag/versi) bila ingin perangkat lama memuat ulang data AHS.
"""
import json
import math
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
seed = json.loads((ROOT / "public" / "seed-outlets.json").read_text(encoding="utf-8"))
ahs = json.loads((ROOT / "scripts" / "ahs.json").read_text(encoding="utf-8"))
STOP = {"AHS", "AQUA", "EXPRESS", "APT", "TOKO", "TK", "APARTEMEN", "APARTEMENT", "AGEN", "DEPOT", "SO", "W", "R", "1"}


def core(n):
    return {w for w in re.sub(r"[^A-Z0-9 ]", " ", n.upper()).split() if w not in STOP}


def dist(a, b, c, d):
    return math.hypot((a - c) * 111000, (b - d) * 111000 * math.cos(math.radians(a)))


def exists(a):
    ca = core(a["name"])
    for o in seed:
        d = dist(a["latitude"], a["longitude"], o["latitude"], o["longitude"])
        if d > 300:
            continue
        co = core(o["name"])
        if d <= 5 or (ca and co and (ca <= co or co <= ca or len(ca & co) >= 2)):
            return True
    return False


out = []
for a in ahs:
    if exists(a):
        continue
    out.append({"id": a["id"], "outlet_code": "", "name": a["name"], "address": a["address"], "kelurahan": "",
                "kecamatan": a["kecamatan"], "city": a["city"], "salesman": "", "rayon": "", "category": "AHS (NEW)",
                "latitude": a["latitude"], "longitude": a["longitude"], "is_active": True,
                "created_at": "2026-11-01T00:00:00.000Z", "updated_at": "2026-11-01T00:00:00.000Z",
                "phone": a["phone"], "is_new": True})
(ROOT / "public" / "seed-ahs.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"{len(out)} AHS baru (dari {len(ahs)}; {len(ahs) - len(out)} sudah ada di data outlet)")
