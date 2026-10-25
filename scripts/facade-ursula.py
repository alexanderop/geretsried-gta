"""St. Ursula's facade (Sudetenstraße 5): the block texture repainted in the
building's vertical bands, two window bays of ochre, then two of cream, with
the storey cornices plastered over (the real render is smooth).

  uv run --with pillow --with numpy scripts/facade-ursula.py

Reads public/sprites/facade-block.webp, writes public/sprites/facade-ursula.webp:
one tile is four bays (12.8 m) wide and two storeys high, squeezed into 512 px.
"""
from pathlib import Path
import numpy as np
from PIL import Image

SPRITES = Path(__file__).resolve().parent.parent / "public" / "sprites"
OCHRE = np.array([226, 182, 112], np.float32)
CREAM = np.array([238, 230, 206], np.float32)

a = np.asarray(Image.open(SPRITES / "facade-block.webp").convert("RGB"), np.float32)
h, w, _ = a.shape
# Cornices: the grey bands at rows ~236-256 and the bottom ~492-512; plaster them over with the wall above.
for r0, r1 in ((232, 258), (488, 512)):
    a[r0:r1] = a[r0 - (r1 - r0) - 4 : r0 - 4]
wall = a.reshape(-1, 3).mean(0)
# Wall pixels: close to the plaster's colour. Their luminance becomes the band colour's texture.
dist = np.linalg.norm(a - wall, axis=2)
mask = np.clip(1 - (dist - 25) / 25, 0, 1)[..., None]
# Half the plaster grain: on the pale cream the full grain reads as stains.
lum = 1 + (a.mean(2, keepdims=True) / wall.mean() - 1) * 0.45
wide = np.concatenate([a, a], axis=1)
mask2 = np.concatenate([mask, mask], axis=1)
lum2 = np.concatenate([lum, lum], axis=1)
band = np.where(np.arange(2 * w)[None, :, None] < w, OCHRE, CREAM)
out = wide * (1 - mask2) + np.clip(band * lum2, 0, 255) * mask2
Image.fromarray(out.astype(np.uint8)).resize((512, 512), Image.LANCZOS).save(SPRITES / "facade-ursula.webp", "WEBP", quality=88)
print("facade-ursula.webp")
