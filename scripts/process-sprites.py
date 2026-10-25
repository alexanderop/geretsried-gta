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
    # Cafe Waldmann's laminate is a pale, greyish oak: Codex painted it honey-orange.
    "floor-wood": ("floor-wood", 1.12, 0.5),
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

# Street furniture, petrol station and GTA 2 props (loose sheets, lamps painted unlit: the renderer lights them).
save_blobs("trafficlight", [f"signal-{n}" for n in ["mast", "pole", "head", "button", "stopline", "zebra", "bollard", "lamp"]], 256, 40)
save_blobs("fuel-props", [f"fuel-{n}" for n in ["island", "pump", "pylon", "air", "barrels", "wash", "kiosk", "drum"]], 256, 12)
save_blobs("gta-props", [f"prop-{n}" for n in ["phone", "church", "spray", "star", "package", "heart", "shelter", "glass"]], 256, 16)
# The phone without its ring: the biggest blob of the ringing booth.
ringing = OUT / "prop-phone.webp"
if ringing.exists():
    quiet = keep_main_shape(Image.open(ringing).convert("RGBA"))
    quiet = quiet.crop(quiet.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    quiet.save(OUT / "prop-phone-quiet.webp", "WEBP", quality=90)
    print("prop-phone-quiet.webp", quiet.size)
# People in poses: cops on foot, a tough guy, the armed player, the knocked out.
save_blobs("people", [f"pose-{n}" for n in ["cop-aim", "cop-run", "thug-punch", "player-pistol", "player-smg", "player-throw", "body-man", "body-cop"]], 160, 16)

# Cafe Waldmann: its furniture seen from above, and the shop sign (a material, 4:1 at the top of its layer, sharper than a sprite).
save_blobs("cafe-props", [f"cafe-{n}" for n in ["cakes", "planter", "umbrella", "table", "espresso", "bistro"]], 256, 12)
save_blobs("cafe-extras", ["cafe-slice", "cafe-toilet"], 160, 12)
# The umbrellas' aubergine reads as brown from 54 m up: lighter, a touch more purple.
umbrella = OUT / "cafe-umbrella.webp"
if find("cafe-props") is not None and umbrella.exists():
    im = Image.open(umbrella).convert("RGBA")
    alpha = im.getchannel("A")
    im = ImageEnhance.Color(ImageEnhance.Brightness(im.convert("RGB")).enhance(1.45)).enhance(1.25).convert("RGBA")
    im.putalpha(alpha)
    im.save(umbrella, "WEBP", quality=90)
    print("cafe-umbrella.webp brightened")
sign = find("cafe-sign")
if sign is not None:
    Image.open(sign).convert("RGB").resize((512, 128), Image.LANCZOS).save(OUT / "cafe-sign.webp", "WEBP", quality=92)
    print("cafe-sign.webp")

# The regional bus (MVV / RVO), 12 m long: one sprite, nose right, cut to its body and scaled to 512 px along it.
bus = find("bus")
if bus is not None:
    im = keep_main_shape(key_magenta_fast(Image.open(bus)))
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    k = 512 / im.width
    im.resize((512, round(im.height * k)), Image.LANCZOS).save(OUT / "bus-rvo.webp", "WEBP", quality=90)
    print("bus-rvo.webp")

# Places (src/world/places): the German pharmacy "A" seen from above, a prop sprite on its post.
pharmacy = find("apotheke-a")
if pharmacy is not None:
    im = keep_main_shape(key_magenta_fast(Image.open(pharmacy)))
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    im.resize((256, round(im.height * 256 / im.width)), Image.LANCZOS).save(OUT / "pharmacy-a.webp", "WEBP", quality=90)
    print("pharmacy-a.webp")
# Rehmaus Apotheke's loose red letters: a wall-sign material, square with the lettering stretched to fill it and a
# few transparent pixels round it (materials wrap), so the render shows between the letters.
lettering = find("rehmaus-sign")
if lettering is not None:
    im = key_magenta_fast(Image.open(lettering))
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    square_ = Image.new("RGBA", (512, 512), (231, 84, 74, 0))
    square_.alpha_composite(im.resize((504, 504), Image.LANCZOS), (4, 4))
    square_.save(OUT / "rehmaus-sign.webp", "WEBP", quality=92)
    print("rehmaus-sign.webp")

# Sparkasse Händelstraße: the red flag, the yield sign at its corner and the roof's solar array, prop sprites seen from above;
# and the Mühlenbäck's sidewalk board with its logo.
for name in ["sparkasse-flag", "yield-sign", "solar-panels", "bakery-board"]:
    path = find(name)
    if path is None:
        continue
    im = keep_main_shape(key_magenta_fast(Image.open(path)))
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    k = 256 / max(im.size)
    im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
    print(f"{name}.webp")
# Its loose red "Sparkasse" with the S logo (keyed and squared like rehmaus-sign), and the bank's ground floor:
# grey render with two tall windows, red bands and a lamp, 2:1 and opaque, stored square (a wall sign stretches it back).
lettering = find("sparkasse-sign")
if lettering is not None:
    im = key_magenta_fast(Image.open(lettering))
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    square_ = Image.new("RGBA", (512, 512), (255, 59, 48, 0))
    square_.alpha_composite(im.resize((504, 504), Image.LANCZOS), (4, 4))
    square_.save(OUT / "sparkasse-sign.webp", "WEBP", quality=92)
    print("sparkasse-sign.webp")
windows = find("sparkasse-windows")
if windows is not None:
    Image.open(windows).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / "sparkasse-windows.webp", "WEBP", quality=90)
    print("sparkasse-windows.webp")

# Rathaus Geretsried: its facade (cream render, ochre window surrounds, teal and white striped shutters; two bays by two
# storeys like facade-house, painted seamless, so only resized), the tower's clock over "RATHAUS" (opaque, 4:5, stored
# square), the arched door with its chevron leaves (keyed and squared like rehmaus-sign), and an ochre corner
# pilaster: the quoin sheet keyed, cut to the short blocks' width so both walls at a corner can use it, stored square.
facade = find("facade-rathaus")
if facade is not None:
    Image.open(facade).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / "facade-rathaus.webp", "WEBP", quality=88)
    print("facade-rathaus.webp")
tower = find("rathaus-tower")
if tower is not None:
    Image.open(tower).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / "rathaus-tower.webp", "WEBP", quality=90)
    print("rathaus-tower.webp")
door = find("rathaus-door")
if door is not None:
    im = key_magenta_fast(Image.open(door))
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    square_ = Image.new("RGBA", (512, 512), (219, 178, 103, 0))
    square_.alpha_composite(im.resize((504, 504), Image.LANCZOS), (4, 4))
    square_.save(OUT / "rathaus-door.webp", "WEBP", quality=90)
    print("rathaus-door.webp")
quoins = find("rathaus-quoins")
if quoins is not None:
    im = key_magenta_fast(Image.open(quoins))
    left, top, right, bottom = im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox()
    im = im.crop((left + 4, top, left + round((right - left) * 0.58), bottom))
    im.convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / "rathaus-quoins.webp", "WEBP", quality=90)
    print("rathaus-quoins.webp")

# Maria Hilf: a window-less white render any place can tint (facade "plaster": grey, its mean lifted to 240 like
# facade-render's plaster, made seamless), the rose window and the main doors (keyed and squared like rehmaus-sign),
# and the big gridded nave window and the tower's belfry face (opaque, 2:3, stored square).
plaster = find("facade-plaster")
if plaster is not None:
    a = np.asarray(Image.open(plaster).convert("L").resize((512, 512), Image.LANCZOS), np.float32)
    a = np.clip(240 + (a - a.mean()) * 1.6, 0, 255).astype(np.uint8)
    make_seamless(Image.fromarray(a).convert("RGB")).save(OUT / "facade-plaster.webp", "WEBP", quality=88)
    print("facade-plaster.webp")
for name in ["church-rose", "church-door"]:
    src = find(name)
    if src is None:
        continue
    im = key_magenta_fast(Image.open(src))
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    square_ = Image.new("RGBA", (512, 512), (36, 38, 39, 0))
    square_.alpha_composite(im.resize((504, 504), Image.LANCZOS), (4, 4))
    square_.save(OUT / f"{name}.webp", "WEBP", quality=90)
    print(f"{name}.webp")
for name in ["church-window", "church-belfry"]:
    src = find(name)
    if src is not None:
        Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
        print(f"{name}.webp")

# Mühlenbäck's shop row (Sudetenstraße 19): the bakery's white board with "Mühlenbäck" and its red round logo, Angel
# Nails' pink board and a plain red board with no text (each keyed and squared like rehmaus-sign), and a shop's ground
# floor under a grey fascia, glazing and a door in aluminium frames (opaque, 2:1, stored square), as a bakery and as
# any shop. The boards keep their own colours inside: the spill pull would turn Angel Nails' pink a dusty red.
for name in ["muehlenbaeck-sign", "angel-nails-sign", "shop-board-red"]:
    src = find(name)
    if src is None:
        continue
    keyed = np.asarray(key_magenta_fast(Image.open(src))).copy()
    solid = keyed[..., 3] > 160
    keyed[solid, :3] = np.asarray(Image.open(src).convert("RGB"))[solid]
    im = Image.fromarray(keyed)
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    square_ = Image.new("RGBA", (512, 512), (200, 200, 200, 0))
    square_.alpha_composite(im.resize((504, 504), Image.LANCZOS), (4, 4))
    square_.save(OUT / f"{name}.webp", "WEBP", quality=92)
    print(f"{name}.webp")
# An awning's fabric seen from above in neutral greys (a canopy part's texture, times its colour): the wall at the
# top, two panels, the valance at the bottom; painted seamless left to right, so only resized.
for name in ["bakery-front", "shop-front", "awning"]:
    src = find(name)
    if src is not None:
        Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
        print(f"{name}.webp")

# Post Filiale 571 (Sudetenstraße 34): the newsagent's sign band (Merkur, LOTTO, GerLTZ, SZ over AZ) and a yellow
# Deutsche Post board, keyed and squared like the Mühlenbäck boards (their own colours kept inside); the top of a glass
# canopy (a canopy part's texture): its steel opaque, the panes Codex left magenta turned into pale glass at 55 % alpha,
# which alpha-to-coverage draws see-through; the yellow letter box and a brown bin, prop sprites seen from above.
for name in ["gerltz-signs", "post-sign"]:
    src = find(name)
    if src is None:
        continue
    keyed = np.asarray(key_magenta_fast(Image.open(src))).copy()
    solid = keyed[..., 3] > 160
    keyed[solid, :3] = np.asarray(Image.open(src).convert("RGB"))[solid]
    im = Image.fromarray(keyed)
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    square_ = Image.new("RGBA", (512, 512), (200, 200, 200, 0))
    square_.alpha_composite(im.resize((504, 504), Image.LANCZOS), (4, 4))
    square_.save(OUT / f"{name}.webp", "WEBP", quality=92)
    print(f"{name}.webp")
glass = find("canopy-glass")
if glass is not None:
    keyed = np.asarray(key_magenta_fast(Image.open(glass).convert("RGB").resize((512, 512), Image.LANCZOS)), np.float32)
    a = keyed[..., 3:4] / 255
    pane = np.array([222, 232, 236], np.float32)
    rgb = keyed[..., :3] * a + pane * (1 - a)
    alpha = (a + (1 - a) * 0.55) * 255
    Image.fromarray(np.concatenate([rgb, alpha], axis=2).round().astype(np.uint8), "RGBA").save(OUT / "canopy-glass.webp", "WEBP", quality=92, exact=True)
    print("canopy-glass.webp")
for name in ["post-box", "litter-bin"]:
    path = find(name)
    if path is None:
        continue
    im = keep_main_shape(key_magenta_fast(Image.open(path)))
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    k = 256 / max(im.size)
    im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
    print(f"{name}.webp")

# Automobilwerkstatt Wilhelm (Wallensteinstraße 4): the navy "AUTO MOBIL robert wilhelm" board with its orange round
# logo and the EINGANG box, and the big navy "4" on the glass (both keyed and squared like the Mühlenbäck boards, their
# own colours kept inside); the hall's frosted window band, white frames and six panes, half a mullion at each end so
# repeated strips join (opaque, 3:1, stored square).
for name in ["werkstatt-sign", "werkstatt-4"]:
    src = find(name)
    if src is None:
        continue
    keyed = np.asarray(key_magenta_fast(Image.open(src))).copy()
    solid = keyed[..., 3] > 160
    keyed[solid, :3] = np.asarray(Image.open(src).convert("RGB"))[solid]
    im = Image.fromarray(keyed)
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    square_ = Image.new("RGBA", (512, 512), (46, 59, 77, 0))
    square_.alpha_composite(im.resize((504, 504), Image.LANCZOS), (4, 4))
    square_.save(OUT / f"{name}.webp", "WEBP", quality=92)
    print(f"{name}.webp")
band = find("werkstatt-windows")
if band is not None:
    Image.open(band).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / "werkstatt-windows.webp", "WEBP", quality=90)
    print("werkstatt-windows.webp")

# Aldi Süd Stein (Sudetenstraße 68): the ALDI SÜD logo on its navy panel in the gable (keyed and squared like the
# Mühlenbäck boards, its own colours kept inside), and a blue disabled bay painted on the car park, a prop sprite seen
# from above: painted portrait and turned on its side, since a prop's length runs along the image's width.
lettering = find("aldi-logo")
if lettering is not None:
    keyed = np.asarray(key_magenta_fast(Image.open(lettering))).copy()
    solid = keyed[..., 3] > 160
    keyed[solid, :3] = np.asarray(Image.open(lettering).convert("RGB"))[solid]
    im = Image.fromarray(keyed)
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    square_ = Image.new("RGBA", (512, 512), (48, 61, 111, 0))
    square_.alpha_composite(im.resize((504, 504), Image.LANCZOS), (4, 4))
    square_.save(OUT / "aldi-logo.webp", "WEBP", quality=92)
    print("aldi-logo.webp")
bay = find("disabled-bay")
if bay is not None:
    im = keep_main_shape(key_magenta_fast(Image.open(bay)))
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox()).transpose(Image.Transpose.ROTATE_90)
    im.resize((256, round(im.height * 256 / im.width)), Image.LANCZOS).save(OUT / "disabled-bay.webp", "WEBP", quality=90)
    print("disabled-bay.webp")

canopy = find("fuel-canopy")
if canopy is not None:
    Image.open(canopy).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / "canopy.webp", "WEBP", quality=88)
    print("canopy.webp")

# Run cycles: Codex paints each person over the 4 x 2 guide of scripts/walk-poses.py (sheet walk-<set>), the hips at
# each cell's centre. Every frame goes on one canvas, hips at its centre, so the frames line up; the frames' median
# height (shoulders and arms) becomes 1.2 m, the width the pose sprites are drawn at (PERSON_W in entities.ts).
WALK_SETS = ["ped-0", "ped-1", "ped-2", "ped-3", "cop", "thug"]
WALK_CANVAS = (240, 200)  # WALK_M in mesh.ts, at 100 px per meter


def save_walk(name: str) -> None:
    path = find(f"walk-{name}")
    if path is None:
        print(f"skip walk-{name}: missing")
        return
    sheet = np.asarray(key_magenta_fast(Image.open(path)))
    h, w = sheet.shape[:2]
    cells = [sheet[round(r * h / 2):round((r + 1) * h / 2), round(c * w / 4):round((c + 1) * w / 4)] for r in range(2) for c in range(4)]
    cells = [np.asarray(keep_main_shape(Image.fromarray(c.copy()))) for c in cells]
    spans = []
    for c in cells:
        ys = np.nonzero((c[..., 3] > 24).any(axis=1))[0]
        if len(ys) == 0:
            raise SystemExit(f"walk-{name}: empty frame")
        spans.append(ys[-1] - ys[0])
    k = 120 / float(np.median(spans))
    for i, c in enumerate(cells):
        im = Image.fromarray(c)
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        canvas = Image.new("RGBA", WALK_CANVAS, (0, 0, 0, 0))
        # Cell centre on canvas centre; paste clips whatever reaches past the canvas.
        canvas.paste(im, ((WALK_CANVAS[0] - im.width) // 2, (WALK_CANVAS[1] - im.height) // 2), im)
        canvas.save(OUT / f"walk-{name}-{i}.webp", "WEBP", quality=90)
    print(f"walk-{name}-0..7.webp x{k:.2f}")


for name in WALK_SETS:
    save_walk(name)
