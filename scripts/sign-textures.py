"""Small flat sign textures drawn in code (no Codex run needed): the Am Stern additions from Alex's photos of 2026-10-27.

  python3 scripts/sign-textures.py

Writes public/sprites/rossmann-disc.webp (the O of rossmann-letters as a round disc on a white rim),
ladestation.webp (the blue EV-charging sign), denns-bio.webp (denns' light-green "Bio Markt" disc) and
denns-door.webp (denns' glass front with the sliding door, built on denns-front).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "public" / "sprites"
FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
S = 512


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT, size)


def rossmann_disc() -> None:
    # The letters texture squeezes "ROSSMANN" (7.26 : 1) into a square; its O (columns 57-132) stretched back is round.
    o = Image.open(OUT / "rossmann-letters.webp").convert("RGBA").crop((57, 0, 132, 512)).resize((440, 440), Image.LANCZOS)
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(im).ellipse((8, 8, S - 8, S - 8), fill=(240, 240, 238, 255))
    im.alpha_composite(o, (36, 36))
    im.save(OUT / "rossmann-disc.webp", quality=90)


def ladestation() -> None:
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((16, 16, S - 16, S - 16), 36, fill=(242, 244, 246, 255))
    d.rounded_rectangle((34, 34, S - 34, S - 34), 26, fill=(40, 92, 170, 255))
    w = (245, 247, 250, 255)
    # The charging column with its cable, and the car beside it.
    d.rounded_rectangle((92, 110, 196, 330), 14, fill=w)
    d.rectangle((112, 134, 176, 190), fill=(40, 92, 170, 255))
    d.line((196, 200, 232, 200, 232, 300, 270, 300), fill=w, width=14)
    d.rounded_rectangle((262, 214, 432, 316), 30, fill=w)
    d.polygon(((290, 214), (318, 160), (392, 160), (414, 214)), fill=w)
    d.polygon(((304, 208), (324, 174), (386, 174), (402, 208)), fill=(40, 92, 170, 255))
    d.ellipse((282, 298, 330, 346), fill=(40, 92, 170, 255))
    d.ellipse((370, 298, 418, 346), fill=(40, 92, 170, 255))
    d.text((S / 2, 418), "LADESTATION", font=font(46), fill=w, anchor="mm")
    im.save(OUT / "ladestation.webp", quality=90)


def denns_bio() -> None:
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((6, 6, S - 6, S - 6), fill=(255, 255, 255, 255))
    d.ellipse((22, 22, S - 22, S - 22), fill=(155, 210, 145, 255))
    green = (38, 92, 40, 255)
    d.text((S / 2, 205), "Bio", font=font(170), fill=green, anchor="mm")
    d.text((S / 2, 345), "Markt", font=font(104), fill=green, anchor="mm")
    im.save(OUT / "denns-bio.webp", quality=90)


def denns_door() -> None:
    # denns-front's shop interior behind a full-height glass front: dark frames, a fixed pane each side, the two
    # sliding leaves in the middle with green stickers, the round grey "Bio" disc in the top light over them.
    im = Image.open(OUT / "denns-front.webp").convert("RGBA").resize((S, S))
    glass = Image.new("RGBA", (S, S), (70, 86, 96, 70))
    im.alpha_composite(glass)
    d = ImageDraw.Draw(im)
    frame = (62, 66, 70, 255)
    d.rectangle((0, 0, S - 1, S - 1), outline=frame, width=14)
    d.rectangle((0, 0, S, 92), fill=None, outline=frame, width=0)
    d.line((0, 92, S, 92), fill=frame, width=12)
    for x in (128, 384):
        d.line((x, 0, x, S), fill=frame, width=12)
    d.line((256, 92, 256, S), fill=frame, width=8)
    for x in (232, 280):
        d.line((x, 270, x, 330), fill=(200, 202, 204, 255), width=6)
    for x0 in (150, 300):
        d.rounded_rectangle((x0, 360, x0 + 60, 420), 8, fill=(120, 190, 90, 255))
    d.ellipse((216, 14, 296, 84), fill=(120, 124, 128, 255))
    d.text((256, 49), "Bio", font=font(34), fill=(235, 235, 235, 255), anchor="mm")
    im.save(OUT / "denns-door.webp", quality=90)


rossmann_disc()
ladestation()
denns_bio()
denns_door()
