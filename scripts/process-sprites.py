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
# top, two panels, the valance at the bottom; painted seamless left to right, so only resized. Angel Nails' ground floor
# (the pink pillar, the white door, the window with its price list and face poster under a band of nail photos) is a
# shop front of its own, opaque, 2:1, stored square.
for name in ["bakery-front", "shop-front", "awning", "angel-nails-front"]:
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

# Polizeiinspektion Geretsried (Jeschkenstraße 31): the "civic" facade (white render, two tall small-pane windows per
# storey, painted seamless, so only resized), one field of the solar canopy's panels seen from above (a deck part's
# texture, opaque), and the blue POLIZEI star sign on the N gable (keyed and squared like the Post board).
for name in ["facade-civic", "solar-field"]:
    src = find(name)
    if src is not None:
        Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
        print(f"{name}.webp")
sign = find("polizei-sign")
if sign is not None:
    keyed = np.asarray(key_magenta_fast(Image.open(sign))).copy()
    solid = keyed[..., 3] > 160
    keyed[solid, :3] = np.asarray(Image.open(sign).convert("RGB"))[solid]
    im = Image.fromarray(keyed)
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    square_ = Image.new("RGBA", (512, 512), (32, 49, 113, 0))
    square_.alpha_composite(im.resize((504, 504), Image.LANCZOS), (4, 4))
    square_.save(OUT / "polizei-sign.webp", "WEBP", quality=92)
    print("polizei-sign.webp")

# The Am Stern block (Sudetenstraße 29–43): the red "PENNY. Am Stern" board and the boards painted on the roofs for the
# top-down camera (ROSSMANN, EDEKA, denns), keyed and squared like the Post board (their own colours kept inside); the
# face of the red Am Stern pylon with its four stacked panels (opaque, 1:3, stored square); a row of nested shopping
# trolleys seen from above, a prop sprite like the letter box.
for name in ["penny-sign", "roof-rossmann", "roof-edeka", "roof-denns"]:
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
pylon = find("am-stern-pylon")
if pylon is not None:
    Image.open(pylon).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / "am-stern-pylon.webp", "WEBP", quality=92)
    print("am-stern-pylon.webp")
trolleys = find("trolley-row")
if trolleys is not None:
    im = keep_main_shape(key_magenta_fast(Image.open(trolleys)))
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    k = 256 / max(im.size)
    im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS).save(OUT / "trolley-row.webp", "WEBP", quality=90)
    print("trolley-row.webp")

# EDEKA Heininger & Dietz (Breslauer Weg 113): the blue EDEKA logo box and the Fleischwaren + opening-hours boards
# (keyed and squared like the Post board, their own colours kept inside); one bay of the blue-grey upper wall with its
# porthole and the yellow pylon's face (opaque, stored square; the pylon cut to its face). The yellow band is laid out
# here: Codex's lettering ("Heininger & Dietz", 3:1) is stretched wide as the photo's extended letters are and put
# into a 20:1 band of its own yellow between its grey rails, starting 35 % in (the logo stands left of it), so the
# wallSign's 20:1 rectangle shows it in proportion.
for name in ["edeka-logo", "edeka-boards"]:
    src = find(name)
    if src is None:
        continue
    keyed = np.asarray(key_magenta_fast(Image.open(src))).copy()
    solid = keyed[..., 3] > 160
    keyed[solid, :3] = np.asarray(Image.open(src).convert("RGB"))[solid]
    im = Image.fromarray(keyed)
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    square_ = Image.new("RGBA", (512, 512), (40, 80, 180, 0))
    square_.alpha_composite(im.resize((504, 504), Image.LANCZOS), (4, 4))
    square_.save(OUT / f"{name}.webp", "WEBP", quality=92)
    print(f"{name}.webp")
panels = find("edeka-panels")
if panels is not None:
    Image.open(panels).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / "edeka-panels.webp", "WEBP", quality=90)
    print("edeka-panels.webp")
face = find("edeka-pylon")
if face is not None:
    im = Image.open(face).convert("RGB")
    a = np.asarray(im, np.int32)
    # The face: the columns that are not the white surround.
    cols = np.nonzero((a.min(axis=2) < 200).mean(axis=0) > 0.5)[0]
    im.crop((int(cols[0]), 0, int(cols[-1]) + 1, im.height)).resize((512, 512), Image.LANCZOS).save(OUT / "edeka-pylon.webp", "WEBP", quality=92)
    print("edeka-pylon.webp")
band = find("edeka-band")
if band is not None:
    src = Image.open(band).convert("RGB")
    w, h = src.size
    a = np.asarray(src, np.int32)
    # The grey rails: the rows at top and bottom whose left end is not yellow (blue channel high); the ink: red low.
    grey = np.nonzero(a[:, 4, 2] > 120)[0]
    top = int(max([r for r in grey if r < h // 2], default=0)) + 1
    bottom = int(min([r for r in grey if r > h // 2], default=h - 1))
    yellow = tuple(int(v) for v in np.median(a[top + 4:top + 24, 4:w // 20].reshape(-1, 3), axis=0))
    H = 128
    W = H * 20
    out = Image.new("RGB", (W, H), yellow)
    rail = round(H * top / h)
    out.paste(src.crop((0, 0, w, top)).resize((W, rail)), (0, 0))
    out.paste(src.crop((0, bottom, w, h)).resize((W, H - round(H * bottom / h))), (0, round(H * bottom / h)))
    ink = np.nonzero((a[top + 4:bottom - 4, :, 0] < 120).any(axis=0))[0]
    ink = ink[(ink > w // 40) & (ink < w - w // 40)]
    text = src.crop((int(ink[0]) - 8, top, int(ink[-1]) + 8, bottom))
    tw = round(W * 0.48)
    out.paste(text.resize((tw, round(H * bottom / h) - rail), Image.LANCZOS), (round(W * 0.355), rail))
    out.resize((512, 512), Image.LANCZOS).save(OUT / "edeka-band.webp", "WEBP", quality=92)
    print("edeka-band.webp")

# denns BioMarkt (Sudetenstraße 29 C): the green "denns BioMarkt" letters keyed and cropped tight to the ink, then
# stretched square (the wallSign's rectangle gives them back their aspect); one 4 x 3 m bay of the dark-framed shop
# front with posters and one 4 x 3 m piece of the striped cladding at the NW end with its window (opaque, square).
letters = find("denns-letters")
if letters is not None:
    keyed = np.asarray(key_magenta_fast(Image.open(letters))).copy()
    solid = keyed[..., 3] > 160
    keyed[solid, :3] = np.asarray(Image.open(letters).convert("RGB"))[solid]
    im = Image.fromarray(keyed)
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    print("denns-letters aspect", round(im.width / im.height, 2))
    im.resize((512, 512), Image.LANCZOS).save(OUT / "denns-letters.webp", "WEBP", quality=92)
    print("denns-letters.webp")
for name in ["denns-front", "denns-cladding"]:
    src = find(name)
    if src is not None:
        Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
        print(f"{name}.webp")

# Rossmann (Sudetenstraße 33): the red ROSSMANN letters with the logo disc as the O, keyed, cropped to the ink and
# stretched square like denns'; one bay of the drugstore's dark-framed glazing with posters (opaque, square).
letters = find("rossmann-letters")
if letters is not None:
    keyed = np.asarray(key_magenta_fast(Image.open(letters))).copy()
    solid = keyed[..., 3] > 160
    keyed[solid, :3] = np.asarray(Image.open(letters).convert("RGB"))[solid]
    im = Image.fromarray(keyed)
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    print("rossmann-letters aspect", round(im.width / im.height, 2))
    im.resize((512, 512), Image.LANCZOS).save(OUT / "rossmann-letters.webp", "WEBP", quality=92)
    print("rossmann-letters.webp")
front = find("rossmann-front")
if front is not None:
    Image.open(front).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / "rossmann-front.webp", "WEBP", quality=90)
    print("rossmann-front.webp")

# Takko Fashion (Sudetenstraße 29b): the yellow TAKKO panel keyed off magenta and cropped to the panel, stretched square
# like the letters above (the wallSign gives it back its aspect); one bay of the dark-framed shop window (opaque).
sign = find("takko-sign")
if sign is not None:
    keyed = np.asarray(key_magenta_fast(Image.open(sign))).copy()
    solid = keyed[..., 3] > 160
    keyed[solid, :3] = np.asarray(Image.open(sign).convert("RGB"))[solid]
    im = Image.fromarray(keyed)
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    print("takko-sign aspect", round(im.width / im.height, 2))
    im.resize((512, 512), Image.LANCZOS).save(OUT / "takko-sign.webp", "WEBP", quality=92)
    print("takko-sign.webp")
front = find("takko-front")
if front is not None:
    Image.open(front).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / "takko-front.webp", "WEBP", quality=90)
    print("takko-front.webp")

# Orterer Getränkemarkt (Sudetenstraße 29a): the round-topped Orterer board keyed off magenta and cropped, stretched
# square like the Takko panel; one bay of the shaded arcade with crates in front of the glazing (opaque); a row of crates
# on a pallet seen from above (a prop, keyed and cropped like the trolleys). The white pier under the board is a
# window-free patch of the white render facade, so it matches the band over it.
sign = find("orterer-logo")
if sign is not None:
    keyed = np.asarray(key_magenta_fast(Image.open(sign))).copy()
    solid = keyed[..., 3] > 160
    keyed[solid, :3] = np.asarray(Image.open(sign).convert("RGB"))[solid]
    im = Image.fromarray(keyed)
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    print("orterer-logo aspect", round(im.width / im.height, 2))
    im.resize((512, 512), Image.LANCZOS).save(OUT / "orterer-logo.webp", "WEBP", quality=92)
    print("orterer-logo.webp")
arcade = find("orterer-arcade")
if arcade is not None:
    Image.open(arcade).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / "orterer-arcade.webp", "WEBP", quality=90)
    print("orterer-arcade.webp")
crates = find("crate-stack")
if crates is not None:
    im = keep_main_shape(key_magenta_fast(Image.open(crates)))
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    k = 256 / max(im.size)
    im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS).save(OUT / "crate-stack.webp", "WEBP", quality=90)
    print("crate-stack.webp", im.size)
if (OUT / "facade-render.webp").exists() and not (OUT / "orterer-pier.webp").exists():
    Image.open(OUT / "facade-render.webp").convert("RGB").crop((200, 50, 310, 230)).resize((512, 512), Image.LANCZOS).save(OUT / "orterer-pier.webp", "WEBP", quality=88)
    print("orterer-pier.webp")

# Ahorn Apotheke (Sudetenstraße 41): the light-green "Ahorn-Apotheke" letters with the maple leaf keyed off magenta and
# cropped to the ink, stretched square like denns'; the white light-box board on the end wall and one bay of the
# glazing with the green window film (opaque, square); the projecting sign's face is the pharmacy "A" prop stretched
# to a square material layer (the box's panel gives it back its aspect).
letters = find("ahorn-letters")
if letters is not None:
    keyed = np.asarray(key_magenta_fast(Image.open(letters))).copy()
    solid = keyed[..., 3] > 160
    keyed[solid, :3] = np.asarray(Image.open(letters).convert("RGB"))[solid]
    im = Image.fromarray(keyed)
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    print("ahorn-letters aspect", round(im.width / im.height, 2))
    im.resize((512, 512), Image.LANCZOS).save(OUT / "ahorn-letters.webp", "WEBP", quality=92)
    print("ahorn-letters.webp")
for name in ["ahorn-board", "ahorn-front"]:
    src = find(name)
    if src is not None:
        Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
        print(f"{name}.webp")
if (OUT / "pharmacy-a.webp").exists() and not (OUT / "ahorn-a.webp").exists():
    Image.open(OUT / "pharmacy-a.webp").convert("RGBA").resize((512, 512), Image.LANCZOS).save(OUT / "ahorn-a.webp", "WEBP", quality=92)
    print("ahorn-a.webp")

# Bar Café da Daniele (Sudetenstraße 39): the crimson fascia (opaque, cut above the strip Codex drew under its rim,
# stretched square); the grey script "da Daniele Bar·Café" with the cup keyed off magenta and cropped to the ink; the
# car park's barrier sign stack (opaque, square).
fascia = find("daniele-fascia")
if fascia is not None:
    im = Image.open(fascia).convert("RGB")
    im = im.crop((0, 0, im.width, round(im.height * 0.915)))
    print("daniele-fascia aspect", round(im.width / im.height, 2))
    im.resize((512, 512), Image.LANCZOS).save(OUT / "daniele-fascia.webp", "WEBP", quality=90)
    print("daniele-fascia.webp")
script = find("daniele-script")
if script is not None:
    keyed = np.asarray(key_magenta_fast(Image.open(script))).copy()
    solid = keyed[..., 3] > 160
    keyed[solid, :3] = np.asarray(Image.open(script).convert("RGB"))[solid]
    im = Image.fromarray(keyed)
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    print("daniele-script aspect", round(im.width / im.height, 2))
    im.resize((512, 512), Image.LANCZOS).save(OUT / "daniele-script.webp", "WEBP", quality=92)
    print("daniele-script.webp")
parking = find("daniele-parking")
if parking is not None:
    im = Image.open(parking).convert("RGB")
    print("daniele-parking aspect", round(im.width / im.height, 2))
    im.resize((512, 512), Image.LANCZOS).save(OUT / "daniele-parking.webp", "WEBP", quality=90)
    print("daniele-parking.webp")

# TEDi (Sudetenstraße 26): the blue box with the yellow ring and "TEDi" (opaque, stretched square; the wallSign gives it
# back its aspect), the glazed stairwell strip with blue spandrels and one bay of the store's glazing (opaque, square);
# a goods rack seen from above (a prop, keyed and cropped like the crates).
for name in ["tedi-sign", "tedi-stair", "tedi-front"]:
    src = find(name)
    if src is not None:
        Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
        print(f"{name}.webp")
rack = find("goods-rack")
if rack is not None:
    im = keep_main_shape(key_magenta_fast(Image.open(rack)))
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    k = 256 / max(im.size)
    im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS).save(OUT / "goods-rack.webp", "WEBP", quality=90)
    print("goods-rack.webp", im.size)

# Woolworth (Sudetenstraße 27): the red WOOLWORTH channel letters keyed off magenta and cropped to the ink, stretched
# square like denns' (the wallSign gives them back their aspect); one bay of the store's glazing (opaque, square).
letters = find("woolworth-letters")
if letters is not None:
    keyed = np.asarray(key_magenta_fast(Image.open(letters))).copy()
    solid = keyed[..., 3] > 160
    keyed[solid, :3] = np.asarray(Image.open(letters).convert("RGB"))[solid]
    im = Image.fromarray(keyed)
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    print("woolworth-letters aspect", round(im.width / im.height, 2))
    im.resize((512, 512), Image.LANCZOS).save(OUT / "woolworth-letters.webp", "WEBP", quality=92)
    print("woolworth-letters.webp")
front = find("woolworth-front")
if front is not None:
    Image.open(front).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / "woolworth-front.webp", "WEBP", quality=90)
    print("woolworth-front.webp")

# B&L Hairstyling (Sudetenstraße 28): the black fascia board, its logo-panel window and glazed bay, and the
# neighbour's (Versicherungsmakler Georgiadis) grey board and blue "GE" window; all opaque, stretched square.
for name in ["bl-board", "bl-window", "bl-glass", "georgiadis-board", "ge-window"]:
    src = find(name)
    if src is not None:
        Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
        print(f"{name}.webp")

# GG Radsport (Marienburgweg 25): the red fascia, one glazed bay and the door bay with the red panel (opaque,
# stretched square); the green A-board's face keyed like the bakery board, and the three parked bikes in their stand
# from above (keyed, cropped; not cut to the main shape, the three bikes are separate blobs).
for name in ["gg-fascia", "gg-glass", "gg-door"]:
    src = find(name)
    if src is not None:
        Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
        print(f"{name}.webp")
for name, main in [("gg-aboard", True), ("bike-rack", False)]:
    src = find(name)
    if src is None:
        continue
    im = key_magenta_fast(Image.open(src))
    im = keep_main_shape(im) if main else im
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    k = 256 / max(im.size)
    im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
    print(f"{name}.webp", im.size)

# Aphrodite Aesthetic (Marienburgweg 25): the anthracite fascia with the gold script, its strokes thickened so the
# thin script survives the 512 px square and the play camera; one glazed bay, the door bay and the house entrance with
# its letterbox panel (all opaque, stretched square; the wallSign gives them back their aspect).
fascia = find("aphrodite-fascia")
if fascia is not None:
    from PIL import ImageFilter
    im = Image.open(fascia).convert("RGB")
    gold = im.convert("L").point(lambda v: 255 if v > 90 else 0).filter(ImageFilter.MaxFilter(7))
    board = Image.new("RGB", im.size, (25, 31, 39))
    board.paste(Image.new("RGB", im.size, (201, 169, 106)), mask=gold)
    board.resize((512, 512), Image.LANCZOS).save(OUT / "aphrodite-fascia.webp", "WEBP", quality=92)
    print("aphrodite-fascia.webp")
for name in ["aphrodite-glass", "aphrodite-door", "mb-house-door"]:
    src = find(name)
    if src is not None:
        Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
        print(f"{name}.webp")

# Nexial / the insurance office (Marienburgweg 25): the white nexial IT-SERVICES panel and the slate Württembergische
# fascia, cut out of their magenta margin (opaque, stretched square; the wallSign gives them back their aspect),
# and one glazed bay and the door bay with their top lights.
for name in ["nexial-panel", "wv-fascia"]:
    src = find(name)
    if src is not None:
        im = Image.open(src).convert("RGB")
        a = np.asarray(im).astype(int)
        board = ~((a[..., 0] > 200) & (a[..., 1] < 80) & (a[..., 2] > 200))
        ys, xs = np.nonzero(board)
        im = im.crop((xs.min() + 2, ys.min() + 2, xs.max() - 1, ys.max() - 1))
        im.resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=92)
        print(f"{name}.webp", im.size)
for name in ["wv-glass", "wv-door"]:
    src = find(name)
    if src is not None:
        Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
        print(f"{name}.webp")

# Sun Style / Versicherungsmakler Kafka (Sudetenstraße 24): Sun Style's black fascia and service board and Kafka's grey
# panel, cut out of their magenta margin (opaque, stretched square; the wallSign gives them back their aspect), and
# the white-framed glazed bay, the door bay and the maroon-brown bay window's cladding.
for name in ["sunstyle-fascia", "sunstyle-board", "kafka-sign"]:
    src = find(name)
    if src is not None:
        im = Image.open(src).convert("RGB")
        a = np.asarray(im).astype(int)
        board = ~((a[..., 0] > 200) & (a[..., 1] < 80) & (a[..., 2] > 200))
        ys, xs = np.nonzero(board)
        im = im.crop((xs.min() + 2, ys.min() + 2, xs.max() - 1, ys.max() - 1))
        im.resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=92)
        print(f"{name}.webp", im.size)
for name in ["sunstyle-glass", "sunstyle-door", "sunstyle-bay"]:
    src = find(name)
    if src is not None:
        Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
        print(f"{name}.webp")

# Spielwaren Krömer (Sudetenstraße 20): the white sign with blue "Spielwaren" and red "Krömer", cut out of its magenta
# margin (opaque, stretched square; the wallSign gives it back its aspect), the blue-framed shop window and door, the
# upper floors' window with its yellow lintel, and the blue stairwell strip (its white wall margins cropped off).
for name in ["kroemer-sign"]:
    src = find(name)
    if src is not None:
        im = Image.open(src).convert("RGB")
        a = np.asarray(im).astype(int)
        board = ~((a[..., 0] > 200) & (a[..., 1] < 80) & (a[..., 2] > 200))
        ys, xs = np.nonzero(board)
        im = im.crop((xs.min() + 2, ys.min() + 2, xs.max() - 1, ys.max() - 1))
        im.resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=92)
        print(f"{name}.webp", im.size)
for name in ["kroemer-glass", "kroemer-door", "kroemer-window"]:
    src = find(name)
    if src is not None:
        Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
        print(f"{name}.webp")
stripe = find("kroemer-stripe")
if stripe is not None:
    im = Image.open(stripe).convert("RGB")
    a = np.asarray(im).astype(int)
    blue = (a[..., 2] > 120) & (a[..., 0] < 90) & (a[..., 1] < 120)
    xs = np.nonzero(blue.mean(axis=0) > 0.5)[0]
    im.crop((xs.min(), 0, xs.max() + 1, im.height)).resize((256, 512), Image.LANCZOS).save(OUT / "kroemer-stripe.webp", "WEBP", quality=90)
    print("kroemer-stripe.webp", xs.min(), xs.max())

# Gasthof Geiger (Tattenkofener Straße 1): the dark beam over the black script "Gasthof Geiger", keyed and cropped to the
# ink, stretched square (loose letters on the render); the same letters without the beam on a cream board with a brown
# rim for the roof (2.45:1, opaque); the window in its grey-green baroque surround and the door with its lamp (opaque).
sign = find("geiger-sign")
if sign is not None:
    keyed = np.asarray(key_magenta_fast(Image.open(sign))).copy()
    solid = keyed[..., 3] > 160
    keyed[solid, :3] = np.asarray(Image.open(sign).convert("RGB"))[solid]
    im = Image.fromarray(keyed)
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    print("geiger-sign aspect", round(im.width / im.height, 2))
    im.resize((512, 512), Image.LANCZOS).save(OUT / "geiger-sign.webp", "WEBP", quality=92)
    # The letters: the rows under the first fully transparent gap below the beam.
    a = np.asarray(im.getchannel("A")) > 24
    rows = a.any(axis=1)
    gap = int(np.argmax(~rows[np.argmax(rows):])) + int(np.argmax(rows))
    letters = im.crop((0, gap, im.width, im.height))
    letters = letters.crop(letters.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox())
    board = Image.new("RGBA", (980, 400), (92, 62, 40, 255))
    board.alpha_composite(Image.new("RGBA", (944, 364), (238, 228, 204, 255)), (18, 18))
    k = min(820 / letters.width, 260 / letters.height)
    lw, lh = round(letters.width * k), round(letters.height * k)
    board.alpha_composite(letters.resize((lw, lh), Image.LANCZOS), ((980 - lw) // 2, (400 - lh) // 2))
    board.convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / "geiger-board.webp", "WEBP", quality=92)
    print("geiger-sign.webp geiger-board.webp")
for name in ["geiger-window", "geiger-door"]:
    src = find(name)
    if src is not None:
        Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
        print(f"{name}.webp")

# Petruskirche (Egerlandstraße 39): the tower clock's red bars and hands and the round emblem with its cross, keyed
# (loose on the render); the gable's glass strip, the louvre, the small window and the tower door, opaque. All square.
for name in ["petrus-clock", "petrus-emblem"]:
    src = find(name)
    if src is not None:
        keyed = key_magenta_fast(Image.open(src))
        keyed.crop(keyed.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox()).resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=92)
        print(f"{name}.webp")
for name in ["petrus-glass", "petrus-louvre", "petrus-window", "petrus-door"]:
    src = find(name)
    if src is not None:
        Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
        print(f"{name}.webp")

# Metzgerei Länger (Amselweg 9): the black cow painted on the wall and the crest sign, keyed and cropped to the shape,
# stretched square (the wall shows round them); the shop window, the entrance with the pig board and the house door, the
# menu boards, an upper-floor window and the roof board (opaque). The awning's red and white stripes (a canopy texture:
# the wall at the top, the stripes running out from it, a darker valance at the bottom) and the red-brown pilaster
# render are drawn here, not painted.
for name in ["metz-cow", "metz-crest"]:
    src = find(name)
    if src is not None:
        keyed = np.asarray(key_magenta_fast(Image.open(src))).copy()
        solid = keyed[..., 3] > 160
        keyed[solid, :3] = np.asarray(Image.open(src).convert("RGB"))[solid]
        im = Image.fromarray(keyed)
        im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
        print(f"{name} aspect", round(im.width / im.height, 2))
        im.resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=92)
for name in ["metz-window", "metz-door", "metz-boards", "metz-upwin", "metz-board"]:
    src = find(name)
    if src is not None:
        Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
        print(f"{name}.webp")
if find("metz-cow") is not None:
    rng = np.random.default_rng(219)
    stripes = np.zeros((512, 512, 3), dtype=np.float32)
    red = (np.arange(512) // 64) % 2 == 0
    stripes[:, red] = (196, 38, 42)
    stripes[:, ~red] = (246, 244, 238)
    stripes[440:] *= 0.86
    stripes += rng.normal(0, 4, (512, 512, 1))
    Image.fromarray(np.clip(stripes, 0, 255).astype(np.uint8)).save(OUT / "metz-awning.webp", "WEBP", quality=90)
    pilaster = np.full((512, 512, 3), (140, 102, 108), dtype=np.float32) + rng.normal(0, 5, (512, 512, 1))
    Image.fromarray(np.clip(pilaster, 0, 255).astype(np.uint8)).save(OUT / "metz-pilaster.webp", "WEBP", quality=88)
    print("metz-awning.webp metz-pilaster.webp")

# Orterer Getränkemarkt (Banater Straße 3): a wide blue-framed window with crates and posters behind the glass (opaque).
src = find("orterer-window")
if src is not None:
    Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / "orterer-window.webp", "WEBP", quality=90)
    print("orterer-window.webp")

# Kaufland (Bayerwaldstraße 2): the white band with the red K logo and "Kaufland" (opaque, 3:1, stored square).
src = find("kaufland-band")
if src is not None:
    Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / "kaufland-band.webp", "WEBP", quality=92)
    print("kaufland-band.webp")

# Sudetenstraße 11–15 (Dolce Gelato): the white plate with "Dolce Gelato", keyed and squared like the Mühlenbäck boards
# (its own colours kept inside); the ice-cream café's glazing with the cone banner and the recessed passage with its
# wooden house door (opaque, stored square; the wallSign gives them back their aspect); and a white plastic table with
# two chairs from above (keyed, cropped; the slats' holes keep the chairs apart, so not cut to the main shape).
src = find("dolce-gelato-sign")
if src is not None:
    keyed = np.asarray(key_magenta_fast(Image.open(src))).copy()
    solid = keyed[..., 3] > 160
    keyed[solid, :3] = np.asarray(Image.open(src).convert("RGB"))[solid]
    im = Image.fromarray(keyed)
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    square_ = Image.new("RGBA", (512, 512), (200, 200, 200, 0))
    square_.alpha_composite(im.resize((504, 504), Image.LANCZOS), (4, 4))
    square_.save(OUT / "dolce-gelato-sign.webp", "WEBP", quality=92)
    print("dolce-gelato-sign.webp")
for name in ["dolce-gelato-front", "passage-door"]:
    src = find(name)
    if src is not None:
        Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
        print(f"{name}.webp")
src = find("gelato-terrace")
if src is not None:
    im = key_magenta_fast(Image.open(src))
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    k = 256 / max(im.size)
    im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS).save(OUT / "gelato-terrace.webp", "WEBP", quality=90)
    print("gelato-terrace.webp", im.size)

# Stroblume (Sudetenstraße 15): the red valance with the white "Stroblume" script, cropped to the lettering and its
# swirls, then padded with the fabric's own red to the sign box's front (8.7 x 0.9 m) so the letters keep their shape
# (opaque, stored square; the wallSign stretches it back). A plant table from above and the red heart sign on its
# stand (keyed, cropped).
src = find("stroblume-sign")
if src is not None:
    im = Image.open(src).convert("RGB")
    w, h = im.size
    im = im.crop((round(w * 0.02), round(h * 0.25), round(w * 0.98), round(h * 0.73)))
    red = tuple(int(c) for c in np.median(np.asarray(im).reshape(-1, 3), axis=0))
    band = Image.new("RGB", (round(im.height * 8.7 / 0.9), im.height), red)
    band.paste(im, ((band.width - im.width) // 2, 0))
    band.resize((512, 512), Image.LANCZOS).save(OUT / "stroblume-sign.webp", "WEBP", quality=92)
    print("stroblume-sign.webp", red)
for name in ["stroblume-plants", "stroblume-heart"]:
    src = find(name)
    if src is not None:
        im = Image.open(src)
        # Codex's sprite skill may hand back an already keyed PNG: keep its alpha then.
        im = im.convert("RGBA") if im.mode == "RGBA" and im.getchannel("A").getextrema()[0] < 255 else key_magenta_fast(im)
        im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
        k = 256 / max(im.size)
        im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
        print(f"{name}.webp", im.size)

# VR Bank München Land (Sudetenstraße 11): the blue letters and logo on the white wall, cropped to the lettering and
# padded with the wall's own white to the sign box's front (7.0 x 0.9 m), like stroblume-sign, and cut in two at the
# corner between the two walls it spans. The two orange ground-floor
# fronts (the windows, the entrance) as they are.
src = find("vr-bank-sign")
if src is not None:
    im = Image.open(src).convert("RGB")
    a = np.asarray(im).astype(int)
    wall = tuple(int(c) for c in np.median(a.reshape(-1, 3), axis=0))
    ys, xs = np.nonzero(np.abs(a - np.array(wall)).sum(axis=2) > 60)
    pad = round((ys.max() - ys.min()) * 0.12)
    im = im.crop((xs.min() - pad, ys.min() - pad, xs.max() + pad, ys.max() + pad))
    band = Image.new("RGB", (max(im.width, round(im.height * 7.0 / 0.9)), round(max(im.width, round(im.height * 7.0 / 0.9)) * 0.9 / 7.0)), wall)
    band.paste(im, ((band.width - im.width) // 2, (band.height - im.height) // 2))
    # The box spans walls 5 and 4 of the outline (2.26 + 4.73 m of its 7.0 m): one half for each wall's wallSign.
    cut = round(band.width * 2.26 / 7.0)
    band.crop((0, 0, cut, band.height)).resize((512, 512), Image.LANCZOS).save(OUT / "vr-bank-logo.webp", "WEBP", quality=92)
    band.crop((cut, 0, band.width, band.height)).resize((512, 512), Image.LANCZOS).save(OUT / "vr-bank-sign.webp", "WEBP", quality=92)
    print("vr-bank-logo.webp, vr-bank-sign.webp", wall, im.size)
for name in ["vr-bank-front", "vr-bank-door"]:
    src = find(name)
    if src is not None:
        Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
        print(f"{name}.webp")

# KIND Augenoptik (Sudetenstraße 10): the blue board with the white serif "KIND", padded with its own blue to the
# 4:1 of one board on the sign box (3.6 x 0.9 m); the corner shop's glazing and the Kirchweg side's roller shutters
# (opaque, stored square); the A-board with the poster (keyed, cropped).
src = find("kind-sign")
if src is not None:
    im = Image.open(src).convert("RGB")
    blue = tuple(int(c) for c in np.median(np.asarray(im).reshape(-1, 3), axis=0))
    band = Image.new("RGB", (max(im.width, im.height * 4), im.height), blue)
    band.paste(im, ((band.width - im.width) // 2, 0))
    band.resize((512, 512), Image.LANCZOS).save(OUT / "kind-sign.webp", "WEBP", quality=92)
    print("kind-sign.webp", blue)
for name in ["kind-front", "kind-side"]:
    src = find(name)
    if src is not None:
        Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
        print(f"{name}.webp")
src = find("kind-aboard")
if src is not None:
    im = Image.open(src)
    im = im.convert("RGBA") if im.mode == "RGBA" and im.getchannel("A").getextrema()[0] < 255 else key_magenta_fast(im)
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
    k = 256 / max(im.size)
    im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS).save(OUT / "kind-aboard.webp", "WEBP", quality=90)
    print("kind-aboard.webp", im.size)

# Bistro Malor (Sudetenstraße 10): the ground floor's glazed doors (opaque, stored square); a terrace table
# with two rattan chairs and a white planter of laurel from above (keyed, cropped).
src = find("malor-front")
if src is not None:
    Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / "malor-front.webp", "WEBP", quality=90)
    print("malor-front.webp")
for name in ["malor-terrace", "malor-hedge"]:
    src = find(name)
    if src is not None:
        im = key_magenta_fast(Image.open(src))
        im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox())
        k = 256 / max(im.size)
        im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=90)
        print(f"{name}.webp", im.size)

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
