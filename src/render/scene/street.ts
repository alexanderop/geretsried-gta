/**
 * Street furniture as 3D geometry: German traffic signals (a pole on the
 * right-hand kerb, a mast arm reaching over the lane, the head hanging from
 * it facing the traffic), white stop lines and zebra crossings, push-button
 * poles at signalled crossings, and street lamps along the main roads.
 *
 * The poles stand up as real boxes, so the close perspective camera shows
 * their height; the parts seen from above are sprites at their height. The
 * lit lamps change every frame, so entities.ts draws those on the heads
 * placed here (`signalHead`).
 */
import { SHADOW_DIR, SHADOW_PER_M } from "#/map/photo.ts"
import type { Road } from "#/map/types.ts"
import type { World } from "#/world/world.ts"
import type { StopLine, Zebra } from "#/sim/signals.ts"
import { MeshBuilder, Mode, prop, spriteQuad, type Rgba, type SpriteBoxes } from "./mesh.ts"

const WHITE: Rgba = [255, 255, 255, 255]
const PAINT: Rgba = [245, 245, 240, 255]
const SHADOW: Rgba = [14, 22, 40, 100]
const METAL: Rgba = [92, 96, 102, 255]
const METAL_DARK: Rgba = [58, 61, 66, 255]
const Z_PAINT = 0.085
const Z_SHADOW = 0.1

/** The mast arm's height, and where its head hangs: 1.2 m tall, 0.45 m wide. */
export const MAST_Z = 5.6
export const HEAD = { top: 5.45, bottom: 4.25, width: 0.45 } as const
/** Where the lamps sit on the head, from its top (red, amber, green). */
export const LAMP_AT = [0.2, 0.5, 0.8] as const

const POLE_R = 0.11
const LAMP_Z = 7
const LAMP_SPACING_M = 38
const BUTTON_Z = 1.15

export type Placed = { readonly x: number; readonly y: number }

/** The signal for a stop line: its pole on the kerb just past the line, and the head over the middle of the lane. */
export const signalHead = (st: StopLine): { readonly pole: Placed; readonly head: Placed; readonly heading: number } => {
  const fx = Math.cos(st.heading)
  const fy = Math.sin(st.heading)
  // Right of the direction of travel (y points south).
  const rx = -fy
  const ry = fx
  const kerb = st.roadWidth / 2 + 0.7
  const lane = (st.from + st.to) / 2
  return {
    pole: { x: st.x + rx * kerb + fx * 0.4, y: st.y + ry * kerb + fy * 0.4 },
    head: { x: st.x + rx * lane + fx * 0.4, y: st.y + ry * lane + fy * 0.4 },
    heading: st.heading,
  }
}

/** A square post from the ground to `top`, its faces shaded by the sun, and its shadow. */
export const column = (m: MeshBuilder, x: number, y: number, r: number, top: number) => {
  const v = (px: number, py: number, z: number, c: Rgba) => m.vertex(px, py, z, 0, 0, c, Mode.color, 0)
  const side = (ax: number, ay: number, bx: number, by: number, c: Rgba) => m.quad(v(ax, ay, 0, c), v(bx, by, 0, c), v(bx, by, top, c), v(ax, ay, top, c))
  side(x - r, y - r, x + r, y - r, METAL)
  side(x + r, y - r, x + r, y + r, METAL)
  side(x + r, y + r, x - r, y + r, METAL_DARK)
  side(x - r, y + r, x - r, y - r, METAL_DARK)
  m.quad(v(x - r, y - r, top, METAL), v(x + r, y - r, top, METAL), v(x + r, y + r, top, METAL), v(x - r, y + r, top, METAL))
  m.target = "shadow"
  const ox = SHADOW_DIR[0] * top * SHADOW_PER_M
  const oy = SHADOW_DIR[1] * top * SHADOW_PER_M
  const s = (px: number, py: number) => m.vertex(px, py, Z_SHADOW, 0, 0, SHADOW, Mode.color, 0)
  // The post's shadow: a thin band from its foot to where its top falls.
  const nx = -SHADOW_DIR[1] * r
  const ny = SHADOW_DIR[0] * r
  m.quad(s(x + nx, y + ny), s(x + ox + nx, y + oy + ny), s(x + ox - nx, y + oy - ny), s(x - nx, y - ny))
  m.target = "opaque"
}

/**
 * An upright sprite quad, `width` meters wide centred on (x, y), from z0 to
 * z1, facing `facing` (the direction its front looks): the image's top row at z1.
 */
export const uprightQuad = (m: MeshBuilder, x: number, y: number, z0: number, z1: number, facing: number, width: number, layer: number, box: readonly [number, number], color: Rgba, mode: number) => {
  // Seen from the front, the image's left edge is on the viewer's left: to the facing direction's right.
  const lx = -Math.sin(facing) * (width / 2)
  const ly = Math.cos(facing) * (width / 2)
  const v = (px: number, py: number, z: number, u: number, w: number) => m.vertex(px, py, z, u, w, color, mode, layer)
  m.quad(v(x + lx, y + ly, z1, 0, 0), v(x - lx, y - ly, z1, box[0], 0), v(x - lx, y - ly, z0, box[0], box[1]), v(x + lx, y + ly, z0, 0, box[1]))
}

/** A sprite lying flat at height z, and (when `shadow`) its silhouette where the sun throws it. */
const flat = (m: MeshBuilder, boxes: SpriteBoxes, layer: number, q: { x: number; y: number; z: number; angle: number; length: number; width: number }, color: Rgba, shadow: boolean) => {
  const b = boxes[layer] ?? [1, 1]
  spriteQuad(m, q, layer, b, color, Mode.sprite)
  if (!shadow) return
  m.target = "shadow"
  spriteQuad(m, { ...q, x: q.x + SHADOW_DIR[0] * q.z * SHADOW_PER_M, y: q.y + SHADOW_DIR[1] * q.z * SHADOW_PER_M, z: Z_SHADOW }, layer, b, SHADOW, Mode.silhouette)
  m.target = "opaque"
}

/** A white stop line across the lane, and the signal: pole, mast arm over the lane and the head hanging from it. */
export const stopLine = (m: MeshBuilder, boxes: SpriteBoxes, st: StopLine) => {
  const rx = -Math.sin(st.heading)
  const ry = Math.cos(st.heading)
  const mid = (st.from + st.to) / 2
  const line = prop("signal-stopline")
  flat(m, boxes, line, { x: st.x + rx * mid, y: st.y + ry * mid, z: Z_PAINT, angle: st.heading + Math.PI / 2, length: st.to - st.from, width: 0.5 }, PAINT, false)

  const { pole, head } = signalHead(st)
  column(m, pole.x, pole.y, POLE_R, MAST_Z)
  // The mast sprite: the pole's cap at 8 % of its length, the head at its far end.
  const mast = prop("signal-mast")
  const box = boxes[mast] ?? [1, 0.35]
  const reach = Math.hypot(head.x - pole.x, head.y - pole.y)
  const length = (reach + 0.5) / 0.9
  const angle = Math.atan2(head.y - pole.y, head.x - pole.x)
  const centre = length / 2 - length * 0.08
  flat(m, boxes, mast, { x: pole.x + Math.cos(angle) * centre, y: pole.y + Math.sin(angle) * centre, z: MAST_Z, angle, length, width: (length * box[1]) / box[0] }, WHITE, true)
  // The head's face, unlit, turned to the traffic coming at it; the lamps are lit over it per frame.
  const face = prop("signal-head")
  uprightQuad(m, head.x, head.y, HEAD.bottom, HEAD.top, st.heading + Math.PI, HEAD.width, face, boxes[face] ?? [0.5, 1], WHITE, Mode.sprite)
}

/** A zebra: white bars along the road, half a meter wide and apart, across its whole width; push-button posts at both kerbs where it has lights. */
export const zebra = (m: MeshBuilder, boxes: SpriteBoxes, z: Zebra, length: number) => {
  const rx = -Math.sin(z.heading)
  const ry = Math.cos(z.heading)
  const bars = Math.max(2, Math.floor(z.width / 1))
  const bar = prop("signal-stopline")
  for (let i = 0; i < bars; i++) {
    const off = (i - (bars - 1) / 2) * 1
    flat(m, boxes, bar, { x: z.x + rx * off, y: z.y + ry * off, z: Z_PAINT + 0.002, angle: z.heading, length, width: 0.5 }, PAINT, false)
  }
  if (!z.signals) return
  const button = prop("signal-button")
  for (const side of [1, -1]) {
    const reach = z.width / 2 + 0.8
    const x = z.x + rx * reach * side
    const y = z.y + ry * reach * side
    column(m, x, y, 0.07, BUTTON_Z)
    // The button box faces the crossing.
    flat(m, boxes, button, { x, y, z: BUTTON_Z, angle: z.heading + (side === 1 ? Math.PI : 0), length: 0.55, width: 0.62 }, WHITE, true)
  }
}

/** A street lamp: a tall post on the kerb side of the sidewalk, the lamp arm reaching over the road. */
export const streetLamp = (m: MeshBuilder, boxes: SpriteBoxes, l: StreetLamp) => {
  column(m, l.x, l.y, 0.08, LAMP_Z)
  const lamp = prop("signal-lamp")
  const box = boxes[lamp] ?? [1, 0.3]
  const length = 2.4
  // Its post's cap is at 10 % of the sprite's length.
  const centre = length / 2 - length * 0.1
  flat(m, boxes, lamp, { x: l.x + Math.cos(l.angle) * centre, y: l.y + Math.sin(l.angle) * centre, z: LAMP_Z, angle: l.angle, length, width: (length * box[1]) / box[0] }, WHITE, true)
}

/** A lamp post at (x, y) whose arm points `angle`, over the road. */
export type StreetLamp = { readonly x: number; readonly y: number; readonly angle: number }

const MAIN_ROADS: ReadonlySet<string> = new Set(["primary", "secondary"])

/**
 * Lamp posts along the main roads, every LAMP_SPACING_M on alternating
 * sides, clear of junctions, signals and walls. Pure: the same every game.
 */
export const streetLamps = (world: World, avoid: ReadonlyArray<Placed>): Array<StreetLamp> => {
  const out: Array<StreetLamp> = []
  const { map } = world
  const junctionNodes = new Set<number>()
  for (const [node, meet] of world.junctions) if (meet.length > 1) junctionNodes.add(node)
  const near = (x: number, y: number, list: ReadonlyArray<Placed>, r: number) => list.some((p) => Math.hypot(p.x - x, p.y - y) < r)
  const junctionPts: Array<Placed> = []
  map.roads.forEach((r: Road) =>
    r.nodes.forEach((n, i) => {
      if (junctionNodes.has(n)) junctionPts.push({ x: r.pts[i * 2] ?? 0, y: r.pts[i * 2 + 1] ?? 0 })
    }),
  )
  for (const r of map.roads) {
    if (!MAIN_ROADS.has(r.kind)) continue
    let carry = LAMP_SPACING_M / 2
    let side = 1
    for (let k = 0; k + 3 < r.pts.length; k += 2) {
      const ax = r.pts[k] ?? 0
      const ay = r.pts[k + 1] ?? 0
      const bx = r.pts[k + 2] ?? 0
      const by = r.pts[k + 3] ?? 0
      const len = Math.hypot(bx - ax, by - ay)
      if (len < 1e-3) continue
      const dx = (bx - ax) / len
      const dy = (by - ay) / len
      let s = carry
      for (; s < len; s += LAMP_SPACING_M) {
        const off = r.width / 2 + 0.5
        const cx = ax + dx * s
        const cy = ay + dy * s
        const x = cx - dy * off * side
        const y = cy + dx * off * side
        side = -side
        if (world.isSolid(x, y) || world.isWater(x, y) || near(x, y, junctionPts, 14) || near(x, y, avoid, 10)) continue
        // Not on another street that runs close by.
        const on = world.roadAt(x, y, 0)
        if (on !== null && on.road !== r && on.road.kind !== "footway") continue
        out.push({ x, y, angle: Math.atan2(cy - y, cx - x) })
      }
      carry = s - len
    }
  }
  return out
}

/** A bus shelter or a bottle bank where OSM maps one: a sprite seen from above at its roof height, and its shadow. */
export type StreetProp = { readonly kind: "shelter" | "glass"; readonly x: number; readonly y: number; readonly angle: number }

const PROP_SIZE = { shelter: { length: 4.2, z: 2.6 }, glass: { length: 1.9, z: 1.6 } } as const

export const streetProp = (m: MeshBuilder, boxes: SpriteBoxes, p: StreetProp) => {
  const layer = prop(p.kind === "shelter" ? "prop-shelter" : "prop-glass")
  const b = boxes[layer] ?? [1, 0.6]
  const { length, z } = PROP_SIZE[p.kind]
  flat(m, boxes, layer, { x: p.x, y: p.y, z, angle: p.angle, length, width: (length * b[1]) / b[0] }, WHITE, true)
}

const SIDEWALK_M = 2.6

/**
 * Bus shelters at OSM's bus stops, on the back of the sidewalk facing the
 * street (a few meters along, clear of the payphone that may stand there),
 * and bottle banks at the glass recycling points. Pure.
 */
export const streetProps = (world: World, avoid: ReadonlyArray<Placed>): Array<StreetProp> => {
  const out: Array<StreetProp> = []
  for (const p of world.map.props) {
    if (p.kind === "glass") {
      if (!world.isSolid(p.x, p.y)) out.push({ kind: "glass", x: p.x, y: p.y, angle: 0 })
      continue
    }
    const hit = world.roadAt(p.x, p.y, 25)
    if (hit === null || hit.road.kind === "footway" || hit.road.kind === "track") continue
    const { pts } = hit.road
    let best = { d: Infinity, x: p.x, y: p.y, angle: 0 }
    for (let i = 0; i + 3 < pts.length; i += 2) {
      const ax = pts[i] ?? 0
      const ay = pts[i + 1] ?? 0
      const bx = pts[i + 2] ?? 0
      const by = pts[i + 3] ?? 0
      const len2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1
      const t = Math.max(0, Math.min(1, ((p.x - ax) * (bx - ax) + (p.y - ay) * (by - ay)) / len2))
      const x = ax + (bx - ax) * t
      const y = ay + (by - ay) * t
      const d = Math.hypot(x - p.x, y - p.y)
      if (d < best.d) best = { d, x, y, angle: Math.atan2(by - ay, bx - ax) }
    }
    // On the stop's side of the street, at the back of the sidewalk, 3.5 m along from the stop itself.
    const nx = -Math.sin(best.angle)
    const ny = Math.cos(best.angle)
    const side = Math.sign((p.x - best.x) * nx + (p.y - best.y) * ny) || 1
    const off = hit.road.width / 2 + SIDEWALK_M - 0.9
    const x = best.x + nx * off * side + Math.cos(best.angle) * 3.5
    const y = best.y + ny * off * side + Math.sin(best.angle) * 3.5
    if (world.isSolid(x, y) || avoid.some((a) => Math.hypot(a.x - x, a.y - y) < 2.5)) continue
    // Its glass back to the houses, its open side to the street.
    out.push({ kind: "shelter", x, y, angle: best.angle + (side === 1 ? Math.PI : 0) })
  }
  return out
}
