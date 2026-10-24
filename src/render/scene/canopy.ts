/**
 * Petrol station canopies: a flat sheet-metal roof at CANOPY_Z on pillars,
 * with a coloured fascia band round its edge, and no walls, so cars drive
 * underneath. Roof and band fade to see-through over the player, like tree
 * crowns. The price sign on its pole and the air and water post stand by it.
 */
import { SHADOW_DIR, SHADOW_PER_M } from "#/map/photo.ts"
import { CANOPY_Z, PILLAR_R, type Spot } from "#/sim/stations.ts"
import { triangulate, signedArea } from "./geometry.ts"
import { FADES, Material, MeshBuilder, Mode, prop, spriteQuad, type Rgba, type SpriteBoxes } from "./mesh.ts"
import { column } from "./street.ts"

export type Canopy = {
  readonly ring: ReadonlyArray<number>
  readonly angle: number
  readonly pillars: ReadonlyArray<{ readonly x: number; readonly y: number }>
  readonly band: Rgba
  readonly pylon: Spot | null
  readonly air: Spot | null
}

/** Each station's fascia colour: plain bands, no brand. */
export const STATION_BANDS: ReadonlyArray<Rgba> = [
  [200, 40, 40, 255],
  [30, 90, 190, 255],
  [30, 140, 70, 255],
  [235, 170, 20, 255],
]

const WHITE: Rgba = [255, 255, 255, 255]
const EDGE: Rgba = [240, 240, 236, 255]
const SHADOW: Rgba = [14, 22, 40, 100]
const BAND_M = 0.75
/** On top: a white rim and the coloured band inside it, so the station reads from straight above. Corners overlap a little, unseen. */
const RIM_M = 0.18
const TOP_BAND_M = 0.55
const TILE_M = 6
const Z_SHADOW = 0.1
const PYLON_Z = 5.8

export const canopy = (m: MeshBuilder, boxes: SpriteBoxes, c: Canopy) => {
  const { ring } = c
  const n = ring.length / 2
  if (n < 3) return
  const cos = Math.cos(c.angle)
  const sin = Math.sin(c.angle)
  const tris = triangulate(ring)
  const top = CANOPY_Z
  const roof = (x: number, y: number) => m.vertex(x, y, top, (x * cos + y * sin) / TILE_M, (-x * sin + y * cos) / TILE_M, WHITE, Mode.material + FADES, Material.canopy)
  const ids = Array.from({ length: n }, (_, i) => roof(ring[i * 2] ?? 0, ring[i * 2 + 1] ?? 0))
  for (let t = 0; t + 2 < tris.length; t += 3) m.tri(ids[tris[t] ?? 0] ?? 0, ids[tris[t + 1] ?? 0] ?? 0, ids[tris[t + 2] ?? 0] ?? 0)

  // The fascia: a band of colour hanging from the roof edge all round, lit by which way it faces, with a white edge on top.
  const orient = signedArea(ring) >= 0 ? 1 : -1
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const ax = ring[i * 2] ?? 0
    const ay = ring[i * 2 + 1] ?? 0
    const bx = ring[j * 2] ?? 0
    const by = ring[j * 2 + 1] ?? 0
    const len = Math.hypot(bx - ax, by - ay)
    if (len < 1e-3) continue
    const wx = (orient * (by - ay)) / len
    const wy = (orient * -(bx - ax)) / len
    const light = 0.7 + 0.3 * Math.max(0, -(wx * SHADOW_DIR[0] + wy * SHADOW_DIR[1]))
    const band: Rgba = [c.band[0] * light, c.band[1] * light, c.band[2] * light, 255]
    const v = (x: number, y: number, z: number, col: Rgba) => m.vertex(x, y, z, 0, 0, col, Mode.color + FADES, 0)
    m.quad(v(ax, ay, top - BAND_M, band), v(bx, by, top - BAND_M, band), v(bx, by, top + 0.04, band), v(ax, ay, top + 0.04, band))
    // Seen from above: the coloured band runs on over the roof's edge, with a white rim outside it.
    const inner = (d: number) => [ax - wx * d, ay - wy * d, bx - wx * d, by - wy * d] as const
    const [a1x, a1y, b1x, b1y] = inner(RIM_M)
    const [a2x, a2y, b2x, b2y] = inner(RIM_M + TOP_BAND_M)
    m.quad(v(ax, ay, top + 0.05, EDGE), v(bx, by, top + 0.05, EDGE), v(b1x, b1y, top + 0.05, EDGE), v(a1x, a1y, top + 0.05, EDGE))
    m.quad(v(a1x, a1y, top + 0.05, band), v(b1x, b1y, top + 0.05, band), v(b2x, b2y, top + 0.05, band), v(a2x, a2y, top + 0.05, band))
  }
  for (const p of c.pillars) column(m, p.x, p.y, PILLAR_R, top - BAND_M)

  m.target = "shadow"
  const ox = SHADOW_DIR[0] * top * SHADOW_PER_M
  const oy = SHADOW_DIR[1] * top * SHADOW_PER_M
  const sh = Array.from({ length: n }, (_, i) => m.vertex((ring[i * 2] ?? 0) + ox, (ring[i * 2 + 1] ?? 0) + oy, Z_SHADOW, 0, 0, SHADOW, Mode.color, 0))
  for (let t = 0; t + 2 < tris.length; t += 3) m.tri(sh[tris[t] ?? 0] ?? 0, sh[tris[t + 1] ?? 0] ?? 0, sh[tris[t + 2] ?? 0] ?? 0)
  m.target = "opaque"

  if (c.pylon !== null) {
    // The price sign: a tall post with the sign on top, seen from above, and the sign's face to the street.
    const p = c.pylon
    column(m, p.x, p.y, 0.14, PYLON_Z)
    const layer = prop("fuel-pylon")
    const b = boxes[layer] ?? [0.5, 1]
    spriteQuad(m, { x: p.x, y: p.y, z: PYLON_Z, angle: p.angle, length: 1.1, width: (1.1 * b[1]) / b[0] }, layer, b, WHITE, Mode.sprite)
    m.target = "shadow"
    spriteQuad(m, { x: p.x + SHADOW_DIR[0] * PYLON_Z, y: p.y + SHADOW_DIR[1] * PYLON_Z, z: Z_SHADOW, angle: p.angle, length: 1.1, width: (1.1 * b[1]) / b[0] }, layer, b, SHADOW, Mode.silhouette)
    m.target = "opaque"
  }
  if (c.air !== null) {
    const a = c.air
    const layer = prop("fuel-air")
    const b = boxes[layer] ?? [1, 1]
    spriteQuad(m, { x: a.x, y: a.y, z: 1.3, angle: a.angle, length: 1.5, width: (1.5 * b[1]) / b[0] }, layer, b, WHITE, Mode.sprite)
  }
}
