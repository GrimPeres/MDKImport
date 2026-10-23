#!/usr/bin/env python3
"""Recover product imagery directly from the official MDK PDF, without stock photos."""
import io
import json
from pathlib import Path
import fitz
from PIL import Image, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parent
PDF = ROOT / "MDKimport-Catalogue-2026-2027-FR.pdf"
DATA = ROOT / "catalogue-data.js"
OUT = ROOT / "fotos"
PAGES = (34, 87, 92, 93, 98)
doc = fitz.open(PDF)
for number in PAGES:
    page = doc[number - 1]
    pictures = []
    seen = set()
    for entry in page.get_images(full=True):
        xref, w, h = entry[:3]
        if xref in seen or w < 48 or h < 48 or (w == 134 and h == 98):
            continue
        seen.add(xref)
        try:
            blob = doc.extract_image(xref)["image"]
            im = Image.open(io.BytesIO(blob)).convert("RGB")
            pictures.append(im)
        except Exception:
            pass
    if pictures:
        width = 900
        cell_w, cell_h = 280, 260
        cols = min(3, len(pictures))
        rows = (len(pictures) + cols - 1) // cols
        board = Image.new("RGB", (width, rows * cell_h + 28), "#ffffff")
        for i, im in enumerate(pictures):
            thumb = ImageOps.contain(im, (cell_w - 20, cell_h - 20), Image.Resampling.LANCZOS)
            x = (i % cols) * (width // cols) + (width // cols - thumb.width) // 2
            y = (i // cols) * cell_h + (cell_h - thumb.height) // 2
            board.paste(thumb, (x, y))
    else:
        # No embedded product photo on page 34: show an honest catalogue excerpt.
        pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
        im = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        board = ImageOps.contain(im, (900, 1150), Image.Resampling.LANCZOS)
    filename = f"p{number:03d}-catalogue.jpg"
    board.save(OUT / filename, "JPEG", quality=88, optimize=True)
    print(number, len(pictures), filename)

prefix = "window.MDK_CATALOGUE="
source = DATA.read_text(encoding="utf-8")
assert source.startswith(prefix)
items = json.loads(source[len(prefix):].strip().rstrip(";"))
for p in items:
    if p["page"] in PAGES and not p.get("images"):
        p["images"] = [f"p{p['page']:03d}-catalogue.jpg"]
DATA.write_text(prefix + json.dumps(items, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
