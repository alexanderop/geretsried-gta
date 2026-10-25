"""A plain rendered facade for place dressings (src/world/places) to colour:
the block texture with its warm plaster made a neutral off-white, so a
dressing's `wallColour` sets the render's colour (light grey-blue for the
Rehmaus Apotheke) instead of darkening yellow. Windows and cornices stay.

  uv run --with pillow --with numpy scripts/facade-render.py

Reads public/sprites/facade-block.webp, writes public/sprites/facade-render.webp
(same tile: two bays by two storeys).
"""
from pathlib import Path
import numpy as np
from PIL import Image

SPRITES = Path(__file__).resolve().parent.parent / "public" / "sprites"
# The plaster's new colour: a touch under white, so the grain still shows at full wallColour.
RENDER = np.array([240, 240, 240], np.float32)

a = np.asarray(Image.open(SPRITES / "facade-block.webp").convert("RGB"), np.float32)
wall = np.median(a.reshape(-1, 3), 0)
# Wall pixels: close to the plaster's colour. Their luminance becomes the new plaster's texture.
dist = np.linalg.norm(a - wall, axis=2)
mask = np.clip(1 - (dist - 30) / 30, 0, 1)[..., None]
lum = 1 + (a.mean(2, keepdims=True) / wall.mean() - 1) * 0.6
# The rest (window frames, sills, cornices) loses its yellow too: grey at its own brightness.
grey = np.repeat(a.mean(2, keepdims=True), 3, axis=2) * 1.08
out = np.clip(grey, 0, 255) * (1 - mask) + np.clip(RENDER * lum, 0, 255) * mask
# The glass keeps its colour: dark pixels with more blue-green than red.
glass = ((a[..., 2] > a[..., 0] + 8) & (a.mean(2) < 110))[..., None]
out = np.where(glass, a, out)
Image.fromarray(out.astype(np.uint8)).save(SPRITES / "facade-render.webp", "WEBP", quality=88)
print("facade-render.webp")
