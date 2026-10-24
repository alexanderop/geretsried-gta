"""Turn Codex-generated PNGs into game-ready WebP sprites in public/sprites/.

  python3 scripts/process-sprites.py <codex-output-dir> [<newer-dir> ...]

Expects <dir>/<name>/<name>.png for the sheets in SHEETS (on #FF00FF, keyed
out and cut per grid cell), the textures in TEXTURES (made seamless), and the
loose combat sheets weapon-icons, pickups and fx (cut out per blob, see save_blobs).
"""
from __future__ import annotations

import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageEnhance

SRCS = [Path(a) for a in sys.argv[1:]]


def find(name: str) -> Path | None:
    """Latest Codex run wins: later directories on the command line override earlier ones. Accepts <dir>/<name>/<name>.png or <dir>/<name>.png."""
    hits = [p for d in SRCS for p in (d / name / f"{name}.png", d / f"{name}.png") if p.exists()]
    return hits[-1] if hits else None

OUT = Path(__file__).resolve().parent.parent / "public" / "sprites"
OUT.mkdir(parents=True, exist_ok=True)

# name in Codex dir -> (output name, brightness, saturation)
TEXTURES = {
    "pavement": ("pavement", 1.0, 1.0),
    "roof-flat": ("roof-flat", 1.0, 1.0),
    "forest": ("forest", 0.95, 0.85),
    "water": ("water", 0.85, 0.85),
    "farmland": ("farmland", 0.95, 0.85),
}


def make_seamless(im: Image.Image, band: float = 0.12) -> Image.Image:
    """Blend each edge with the half-rolled image so the tile wraps without a seam."""
    a = np.asarray(im, dtype=np.float32)
    h, w = a.shape[:2]
    rolled = np.roll(np.roll(a, h // 2, axis=0), w // 2, axis=1)
    def ramp(n: int) -> np.ndarray:
        d = np.minimum(np.arange(n), np.arange(n)[::-1]) / (n * band)
        return np.clip(d, 0, 1)
    weight = np.minimum.outer(ramp(h), ramp(w))[..., None]
    return Image.fromarray((a * weight + rolled * (1 - weight)).astype(np.uint8))


def key_magenta(im: Image.Image) -> Image.Image:
    """Alpha from distance to pure magenta, then pull magenta spill out of soft edges."""
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            d = ((255 - r) ** 2 + g ** 2 + (255 - b) ** 2) ** 0.5
            a = max(0.0, min(1.0, (d - 60) / 90))
            # Pull magenta out everywhere: the generator bakes it into edge pixels too.
            spill = max(0, min(r, b) - g)
            r, b = r - spill, b - spill
            px[x, y] = (r, g, b, int(a * 255))
    return im


def keep_main_shape(cell: Image.Image) -> Image.Image:
    """Drop specks (e.g. a neighbour's mirror poking into this cell): keep the largest blob and what touches its box."""
    w, h = cell.size
    alpha = cell.getchannel("A").load()
    seen = bytearray(w * h)
    blobs = []
    for sy in range(h):
        for sx in range(w):
            if seen[sy * w + sx] or alpha[sx, sy] <= 24:
                continue
            stack, pixels = [(sx, sy)], []
            seen[sy * w + sx] = 1
            while stack:
                x, y = stack.pop()
                pixels.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and alpha[nx, ny] > 24:
                        seen[ny * w + nx] = 1
                        stack.append((nx, ny))
            blobs.append(pixels)
    main = max(blobs, key=len)
    x0, x1 = min(p[0] for p in main) - 12, max(p[0] for p in main) + 12
    y0, y1 = min(p[1] for p in main) - 12, max(p[1] for p in main) + 12
    px = cell.load()
    for blob in blobs:
        if blob is main or all(x0 <= x <= x1 and y0 <= y <= y1 for x, y in blob):
            continue
        for x, y in blob:
            px[x, y] = (0, 0, 0, 0)
    return cell


def save_cells(sheet: Image.Image, cols: int, rows: int, prefix: str, length: int) -> None:
    """Crop each grid cell to its opaque pixels and save it `length` px along its long side."""
    cw, ch = sheet.width / cols, sheet.height / rows
    for row in range(rows):
        for col in range(cols):
            cell = sheet.crop((round(col * cw), round(row * ch), round((col + 1) * cw), round((row + 1) * ch)))
            cell = keep_main_shape(cell)
            box = cell.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox()
            if box is None:
                raise SystemExit(f"{prefix}: empty cell {col},{row}")
            cell = cell.crop(box)
            scale = length / max(cell.size)
            cell = cell.resize((round(cell.width * scale), round(cell.height * scale)), Image.LANCZOS)
            index = row * cols + col
            cell.save(OUT / f"{prefix}-{index}.webp", "WEBP", quality=90)
            print(f"{prefix}-{index}.webp {cell.size}")


SHEETS = {"cars": (2, 4, "car", 256, 1.0), "peds": (4, 1, "ped", 128, 1.0), "trees": (4, 2, "tree", 256, 0.8)}
for name, (cols, rows, prefix, length, saturation) in SHEETS.items():
    path = find(name)
    if path is None:
        print(f"skip {name}: missing")
        continue
    sheet = key_magenta(Image.open(path))
    if saturation != 1.0:
        alpha = sheet.getchannel("A")
        sheet = ImageEnhance.Color(sheet.convert("RGB")).enhance(saturation).convert("RGBA")
        sheet.putalpha(alpha)
    save_cells(sheet, cols, rows, prefix, length)

for name, (out, gain, saturation) in TEXTURES.items():
    path = find(name)
    if path is None:
        print(f"skip {name}: missing")
        continue
    im = make_seamless(Image.open(path).convert("RGB")).resize((512, 512), Image.LANCZOS)
    if gain != 1.0:
        im = im.point(lambda v: min(255, int(v * gain)))
    if saturation != 1.0:
        im = ImageEnhance.Color(im).enhance(saturation)
    im.save(OUT / f"{out}.webp", "WEBP", quality=85)
    print(f"{out}.webp")


# GTA 2 style textures, painted seamless already: only resized, so windows and slabs keep their edges.
GTA2 = ["facade-block", "facade-house", "facade-shop", "facade-industrial", "road", "sidewalk", "lawn"]
for name in GTA2:
    path = find(name)
    if path is None:
        print(f"skip {name}: missing")
        continue
    Image.open(path).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=88)
    print(f"{name}.webp")


def detail(im: Image.Image, contrast: float) -> Image.Image:
    """Grey luminance detail around 128: the renderer multiplies it (x2) with a roof colour measured in the photo."""
    a = np.asarray(im.convert("L"), dtype=np.float32)
    return Image.fromarray(np.clip(128 + (a - a.mean()) * contrast, 0, 255).astype(np.uint8))


roof = find("roof-tiles")
if roof is not None:
    detail(Image.open(roof).resize((512, 512), Image.LANCZOS), 1.6).save(OUT / "roof-tiles.webp", "WEBP", quality=88)
    print("roof-tiles.webp")
detail(Image.open(OUT / "roof-flat.webp"), 1.6).save(OUT / "roof-gravel.webp", "WEBP", quality=88)
print("roof-gravel.webp")


def key_magenta_fast(im: Image.Image) -> Image.Image:
    """key_magenta on whole arrays: same alpha ramp and spill pull, for the large combat sheets."""
    a = np.asarray(im.convert("RGB"), dtype=np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    d = np.sqrt((255 - r) ** 2 + g**2 + (255 - b) ** 2)
    alpha = np.clip((d - 60) / 90, 0, 1)
    spill = np.clip(np.minimum(r, b) - g, 0, None)
    out = np.dstack([r - spill, g, b - spill, alpha * 255]).astype(np.uint8)
    return Image.fromarray(out)


def blobs(sheet: Image.Image, gap: int) -> list[tuple[int, int, int, int, np.ndarray]]:
    """Sprites on a sheet that is not a grid: groups of opaque pixels closer than `gap` px (a flame and its sparks are one),
    as (x0, y0, x1, y1, mask), sorted in rows top to bottom, left to right."""
    alpha = np.asarray(sheet.getchannel("A")) > 24
    h, w = alpha.shape
    cell = 4
    gh, gw = -(-h // cell), -(-w // cell)
    coarse = np.zeros((gh, gw), bool)
    for y in range(gh):
        for x in range(gw):
            coarse[y, x] = alpha[y * cell:(y + 1) * cell, x * cell:(x + 1) * cell].any()
    # Grow by the gap, then flood-fill the coarse cells into groups.
    k = max(1, gap // cell)
    padded = np.pad(coarse, k)
    grown = np.zeros_like(coarse)
    for dy in range(2 * k + 1):
        for dx in range(2 * k + 1):
            grown |= padded[dy:dy + gh, dx:dx + gw]
    labels = np.zeros((gh, gw), int)
    n = 0
    for sy in range(gh):
        for sx in range(gw):
            if not grown[sy, sx] or labels[sy, sx]:
                continue
            n += 1
            stack = [(sy, sx)]
            labels[sy, sx] = n
            while stack:
                y, x = stack.pop()
                for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= ny < gh and 0 <= nx < gw and grown[ny, nx] and not labels[ny, nx]:
                        labels[ny, nx] = n
                        stack.append((ny, nx))
    full = np.kron(labels, np.ones((cell, cell), int))[:h, :w]
    out = []
    for i in range(1, n + 1):
        mask = (full == i) & alpha
        if mask.sum() < 400:
            continue
        ys, xs = np.nonzero(mask)
        out.append((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1, mask))
    # Rows: a sprite starts a new row when its centre is below the previous row's bottom.
    out.sort(key=lambda b: (b[1] + b[3]) / 2)
    rows: list[list] = []
    for b in out:
        if rows and (b[1] + b[3]) / 2 < max(r[3] for r in rows[-1]):
            rows[-1].append(b)
        else:
            rows.append([b])
    return [b for row in rows for b in sorted(row, key=lambda b: b[0])]


def save_blobs(name: str, names: list[str], length: int, gap: int, single: frozenset[str] = frozenset(), grey: frozenset[str] = frozenset()) -> None:
    """Key a loose sheet, cut each sprite out by its blob and save it `length` px along its long side as <name>.webp."""
    path = find(name)
    if path is None:
        print(f"skip {name}: missing")
        return
    sheet = key_magenta_fast(Image.open(path))
    found = blobs(sheet, gap)
    if len(found) != len(names):
        raise SystemExit(f"{name}: found {len(found)} sprites, expected {len(names)}: {[b[:4] for b in found]}")
    px = np.asarray(sheet).copy()
    for (x0, y0, x1, y1, mask), out in zip(found, names):
        crop = px[y0:y1, x0:x1].copy()
        # Only this blob: a neighbour's glow reaching into the box stays out.
        crop[..., 3] = np.where(mask[y0:y1, x0:x1], crop[..., 3], 0)
        im = Image.fromarray(crop)
        if out in single:
            # A pair drawn as one (two tracers): keep the bigger one.
            im = keep_main_shape(im.copy())
            im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
        if out in grey:
            # Soot and smoke have no colour: this also drops the last pink of the key in their speckled edges.
            alpha = im.getchannel("A")
            im = im.convert("L").convert("RGBA")
            im.putalpha(alpha)
        scale = length / max(im.size)
        im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
        im.save(OUT / f"{out}.webp", "WEBP", quality=90)
        print(f"{out}.webp {im.size}")


# Combat sheets: loose sprites, not on a grid. Weapon icons for the HUD, pickups and effects for the renderer.
WEAPON_ICONS = ["fist", "pistol", "smg", "shotgun", "molotov", "rocket", "flamer"]
save_blobs("weapon-icons", [f"icon-{n}" for n in WEAPON_ICONS], 128, 4)
save_blobs("pickups", [f"pickup-{n}" for n in ["pistol", "smg", "shotgun", "molotov", "rocket", "flamer", "health", "armour"]], 256, 8)
save_blobs("fx", [f"fx-{n}" for n in ["muzzle", "tracer", "blast-early", "blast-big", "smoke", "fire", "wreck", "scorch"]], 256, 16, frozenset({"fx-tracer"}), frozenset({"fx-scorch", "fx-smoke"}))
