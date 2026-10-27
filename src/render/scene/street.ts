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
import type { Container, Road } from "#/map/types.ts"
import type { World } from "#/world/world.ts"
import { CONTAINER_GAP, CONTAINER_M, RACK_M, RACK_ROOF_M, type Furniture } from "#/world/furniture.ts"
import type { StopLine, Zebra } from "#/sim/signals.ts"
import type { StreetSign } from "#/world/street-profile.ts"
import { POLE_ONLY_STOPS } from "#/world/places/streets.ts"
import { MeshBuilder, Mode, prop, spriteQuad, type PropName, type Rgba, type SpriteBoxes } from "./mesh.ts"

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

/**
 * A bus shelter at an OSM bus stop (with the stop's green H pole at the kerb, `pole`). `angle` runs along the
 * street; the shelter's open front faces the street on its right (+90°). Benches, bins, recycling points and bike
 * racks are world/furniture.ts's (streetFurniture draws them).
 */
export type StreetProp =
  | { readonly kind: "shelter"; readonly x: number; readonly y: number; readonly angle: number; readonly pole: Placed }
  /** A stop without a shelter (OSM shelter=no, checked: POLE_ONLY_STOPS): only its H pole at the kerb. */
  | { readonly kind: "pole"; readonly x: number; readonly y: number; readonly angle: number }

/** The Geretsried shelter (Sudetenstraße, in front of St. Ursula): 6 m by 1.7 m under a flat roof at 2.55 m. */
export const SHELTER = { length: 6, depth: 1.7, z: 2.55, slab: 0.16 } as const
const ANTHRACITE: Rgba = [50, 53, 58, 255]
const ANTHRACITE_DARK: Rgba = [34, 36, 40, 255]
const ROOF_EDGE: Rgba = [196, 200, 204, 255]
const GLASS: Rgba = [150, 178, 190, 255]
const AD_LIGHT: Rgba = [246, 244, 230, 255]
const POSTER: Rgba = [214, 60, 70, 255]
const BENCH: Rgba = [140, 96, 58, 255]
const BIN: Rgba = [236, 118, 24, 255]
const STOP_GREEN: Rgba = [18, 128, 74, 255]
const STOP_YELLOW: Rgba = [250, 210, 30, 255]
const TIMETABLE: Rgba = [26, 72, 160, 255]

const shade = ([r, g, b, a]: Rgba, k: number): Rgba => [Math.round(r * k), Math.round(g * k), Math.round(b * k), a]

/**
 * A box `2 hl` long (along `angle`) and `2 hw` deep round (x, y), from z0 to z1: its top in `top`, its sides in
 * `side` lit by which way they face (the sun is opposite the shadows), and optionally its shadow on the ground.
 */
const box = (m: MeshBuilder, x: number, y: number, angle: number, hl: number, hw: number, z0: number, z1: number, top: Rgba, side: Rgba, shadow = false) => {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const corner = (f: number, r: number) => [x + c * f - s * r, y + s * f + c * r] as const
  const ring = [corner(-hl, -hw), corner(hl, -hw), corner(hl, hw), corner(-hl, hw)]
  const v = (p: readonly [number, number], z: number, col: Rgba) => m.vertex(p[0], p[1], z, 0, 0, col, Mode.color, 0)
  for (let i = 0; i < 4; i++) {
    const a = ring[i] ?? [0, 0]
    const b = ring[(i + 1) % 4] ?? [0, 0]
    // Faces turned away from the sun (towards the shadows) are darker.
    const nx = b[1] - a[1]
    const ny = a[0] - b[0]
    const lit = 0.78 + 0.22 * -Math.sign(nx * SHADOW_DIR[0] + ny * SHADOW_DIR[1])
    const col = shade(side, lit)
    m.quad(v(a, z0, col), v(b, z0, col), v(b, z1, col), v(a, z1, col))
  }
  m.quad(v(ring[0] ?? [0, 0], z1, top), v(ring[1] ?? [0, 0], z1, top), v(ring[2] ?? [0, 0], z1, top), v(ring[3] ?? [0, 0], z1, top))
  if (!shadow) return
  m.target = "shadow"
  const ox = SHADOW_DIR[0] * z1 * SHADOW_PER_M
  const oy = SHADOW_DIR[1] * z1 * SHADOW_PER_M
  const sv = (p: readonly [number, number]) => m.vertex(p[0] + ox, p[1] + oy, Z_SHADOW, 0, 0, SHADOW, Mode.color, 0)
  m.quad(sv(ring[0] ?? [0, 0]), sv(ring[1] ?? [0, 0]), sv(ring[2] ?? [0, 0]), sv(ring[3] ?? [0, 0]))
  m.target = "opaque"
}

/**
 * The shelter as geometry, for a camera looking straight down: the long anthracite roof with a thin light edge
 * dominates; under it thin dark posts, glass at the back and both ends, the back-lit ad panel closing one end,
 * a bench, the orange bin on its post beside it; and the green H pole with its blue timetable at the kerb.
 */
const shelter = (m: MeshBuilder, p: Extract<StreetProp, { kind: "shelter" }>) => {
  const { length, depth, z, slab } = SHELTER
  const c = Math.cos(p.angle)
  const s = Math.sin(p.angle)
  /** A point `f` meters along the shelter and `r` towards the street. */
  const at = (f: number, r: number) => [p.x + c * f - s * r, p.y + s * f + c * r] as const
  const hl = length / 2
  const hw = depth / 2
  // Posts at the four corners, a little in from the roof's edge.
  for (const [f, r] of [[-hl + 0.25, -hw + 0.15], [hl - 0.25, -hw + 0.15], [-hl + 0.25, hw - 0.2], [hl - 0.25, hw - 0.2]] as const) {
    const [px, py] = at(f, r)
    box(m, px, py, p.angle, 0.05, 0.05, 0, z, ANTHRACITE_DARK, ANTHRACITE_DARK)
  }
  // Glass: the back wall and the end opposite the ad panel, thin panes in a dark frame.
  const [bx, by] = at(0, -hw + 0.15)
  box(m, bx, by, p.angle, hl - 0.3, 0.025, 0.12, z - 0.05, ANTHRACITE, GLASS)
  const [ex, ey] = at(hl - 0.25, 0)
  box(m, ex, ey, p.angle, 0.025, hw - 0.35, 0.12, z - 0.05, ANTHRACITE, GLASS)
  // The ad panel: a deep, lit box closing the other end, a poster on both faces.
  const [ax, ay] = at(-hl + 0.3, -0.05)
  box(m, ax, ay, p.angle, 0.12, hw - 0.3, 0.05, z - 0.05, ANTHRACITE, AD_LIGHT)
  box(m, ax, ay, p.angle, 0.125, hw - 0.5, 0.4, z - 0.4, AD_LIGHT, POSTER)
  // The bench along the glass.
  const [nx, ny] = at(0.4, -hw + 0.45)
  box(m, nx, ny, p.angle, 1.4, 0.2, 0.42, 0.48, BENCH, BENCH)
  // The roof: a dark slab, a light edge all round it on top, the dark top inside.
  const [rx, ry] = at(0, 0)
  box(m, rx, ry, p.angle, hl, hw, z, z + slab, ROOF_EDGE, ANTHRACITE, true)
  box(m, rx, ry, p.angle, hl - 0.09, hw - 0.09, z + slab, z + slab + 0.01, ANTHRACITE, ANTHRACITE)
  // The orange bin on its post, beside the glass end.
  const [lx, ly] = at(hl + 0.55, -hw + 0.35)
  box(m, lx, ly, p.angle, 0.04, 0.04, 0, 0.6, ANTHRACITE_DARK, ANTHRACITE_DARK)
  box(m, lx, ly, p.angle, 0.2, 0.17, 0.55, 1.0, shade(BIN, 0.55), BIN, true)
  stopPole(m, p.pole.x, p.pole.y, p.angle)
}

/** The stop's pole: a green H sign at the top, turned across the street, and the blue timetable under it. */
const stopPole = (m: MeshBuilder, x: number, y: number, angle: number) => {
  column(m, x, y, 0.045, 2.75)
  const across = angle + Math.PI / 2
  box(m, x, y, across, 0.25, 0.03, 2.2, 2.7, STOP_GREEN, STOP_GREEN, true)
  // The H on both faces: two uprights and the bar, a hair off the plate.
  const c = Math.cos(across)
  const s = Math.sin(across)
  const v = (f: number, r: number, z: number) => m.vertex(x + c * f - s * r, y + s * f + c * r, z, 0, 0, STOP_YELLOW, Mode.color, 0)
  for (const r of [-0.032, 0.032]) {
    for (const [f0, f1, z0, z1] of [[-0.15, -0.09, 2.27, 2.63], [0.09, 0.15, 2.27, 2.63], [-0.09, 0.09, 2.42, 2.48]] as const) m.quad(v(f0, r, z0), v(f1, r, z0), v(f1, r, z1), v(f0, r, z1))
  }
  // The timetable case on the pole, facing along the sidewalk.
  box(m, x + Math.cos(angle) * 0.06, y + Math.sin(angle) * 0.06, across, 0.2, 0.025, 1.15, 1.75, TIMETABLE, TIMETABLE)
}

export const streetProp = (m: MeshBuilder, p: StreetProp) => {
  if (p.kind === "shelter") return shelter(m, p)
  return stopPole(m, p.x, p.y, p.angle)
}

/**
 * Each container of a recycling point: its sprite, how high its top is, and how it is coloured. Paper and cans are
 * the bottle bank turned blue and yellow (Mode.hue: the colour's red is the turn, 0..255 a full turn); the three
 * bottle banks of a glass point a little apart in tone, so the row does not read as one sprite three times.
 */
const CONTAINER_LOOK: Readonly<Record<Container, readonly [PropName, number, Rgba, number]>> = {
  glass: ["prop-glass", 1.6, WHITE, Mode.sprite],
  paper: ["prop-glass", 1.6, [210, 0, 0, 255], Mode.hue],
  cans: ["prop-glass", 1.6, [66, 0, 0, 255], Mode.hue],
  clothes: ["clothes-container", 1.9, WHITE, Mode.sprite],
  green: ["bin-1100", 1.3, WHITE, Mode.sprite],
}
const GLASS_TONES: ReadonlyArray<Rgba> = [WHITE, [226, 232, 226, 255], [236, 226, 214, 255]]
/** A covered bike rack's roof (the grey of the perforated-metal bike and bin sheds, reference 41) and its height. */
const RACK_ROOF: Rgba = [67, 70, 72, 255]
const RACK_ROOF_Z = 2.2

/** A sprite lying flat at height z (any mode), and its shadow. */
const flatMode = (m: MeshBuilder, boxes: SpriteBoxes, layer: number, q: { x: number; y: number; z: number; angle: number; length: number; width: number }, color: Rgba, mode: number) => {
  spriteQuad(m, q, layer, boxes[layer] ?? [1, 1], color, mode)
  m.target = "shadow"
  spriteQuad(m, { ...q, x: q.x + SHADOW_DIR[0] * q.z * SHADOW_PER_M, y: q.y + SHADOW_DIR[1] * q.z * SHADOW_PER_M, z: Z_SHADOW }, layer, boxes[layer] ?? [1, 1], SHADOW, Mode.silhouette)
  m.target = "opaque"
}

/**
 * A bench, a litter bin on its post, a recycling point's row of containers or a row of bike racks (under a flat grey
 * roof when covered), standing where world/furniture.ts put it, its front to the path. A sprite's front is its
 * image's bottom edge (+v), so the image's +u runs at `facing − 90°`; the racks' bikes point away from the path.
 */
export const streetFurniture = (m: MeshBuilder, boxes: SpriteBoxes, f: Furniture) => {
  const along = f.facing - Math.PI / 2
  const ax = Math.cos(along)
  const ay = Math.sin(along)
  const sized = (name: PropName, length: number) => {
    const layer = prop(name)
    const b = boxes[layer] ?? [1, 1]
    return { layer, length, width: (length * b[1]) / b[0] }
  }
  if (f.kind === "bench") {
    const s = sized("spielplatz-bench", f.along)
    flatMode(m, boxes, s.layer, { x: f.x, y: f.y, z: 0.8, angle: along, length: s.length, width: s.width }, WHITE, Mode.sprite)
    return
  }
  if (f.kind === "bin") {
    column(m, f.x, f.y, 0.03, 0.85)
    const s = sized("spielplatz-bin", f.along)
    flatMode(m, boxes, s.layer, { x: f.x, y: f.y, z: 0.9, angle: along, length: s.length, width: s.width }, WHITE, Mode.sprite)
    return
  }
  if (f.kind === "recycling") {
    let u = -f.along / 2
    let glass = 0
    for (const c of f.holds) {
      const [name, z, colour, mode] = CONTAINER_LOOK[c]
      const s = sized(name, CONTAINER_M[c][0])
      const mid = u + s.length / 2
      // Each container's back in line, its front to the path.
      const back = (f.depth - CONTAINER_M[c][1]) / 2
      const x = f.x + ax * mid - Math.cos(f.facing) * back
      const y = f.y + ay * mid - Math.sin(f.facing) * back
      const tone = c === "glass" ? (GLASS_TONES[glass++ % GLASS_TONES.length] ?? WHITE) : colour
      flatMode(m, boxes, s.layer, { x, y, z, angle: along, length: s.length, width: Math.min(s.width, CONTAINER_M[c][1]) }, tone, mode)
      u += s.length + CONTAINER_GAP
    }
    return
  }
  // Bike racks: side by side along the path, each sprite's +u (the bikes' fronts) away from it.
  const roof = f.covered ? RACK_ROOF_M : 0
  const away = f.facing + Math.PI
  const s = sized("bike-rack", RACK_M[1])
  for (let i = 0; i < f.racks; i++) {
    const mid = -f.along / 2 + roof + RACK_M[0] * (i + 0.5)
    flatMode(m, boxes, s.layer, { x: f.x + ax * mid, y: f.y + ay * mid, z: 0.5, angle: away, length: s.length, width: s.width }, WHITE, Mode.sprite)
  }
  if (!f.covered) return
  const hl = f.along / 2
  const hd = f.depth / 2
  for (const [a, d] of [[-hl + 0.1, -hd + 0.1], [hl - 0.1, -hd + 0.1], [-hl + 0.1, hd - 0.1], [hl - 0.1, hd - 0.1]] as const) {
    const fx = Math.cos(f.facing)
    const fy = Math.sin(f.facing)
    box(m, f.x + ax * a + fx * d, f.y + ay * a + fy * d, along, 0.04, 0.04, 0, RACK_ROOF_Z, ANTHRACITE_DARK, ANTHRACITE_DARK)
  }
  box(m, f.x, f.y, along, hl, hd, RACK_ROOF_Z, RACK_ROOF_Z + 0.08, RACK_ROOF, RACK_ROOF, true)
}

const SIDEWALK_M = 2.6

/**
 * Bus shelters at OSM's bus stops, on the back of the sidewalk facing the
 * street (a few meters along, clear of the payphone that may stand there). Pure.
 */
export const streetProps = (world: World, avoid: ReadonlyArray<Placed>): Array<StreetProp> => {
  const out: Array<StreetProp> = []
  for (const p of world.map.props) {
    if (p.kind !== "bus_stop") continue
    // The nearest street (a sidewalk mapped as its own footway is often nearer).
    let best = { d: 25, x: p.x, y: p.y, angle: 0, width: 0 }
    for (const r of world.map.roads) {
      if (r.kind === "footway" || r.kind === "track") continue
      const { pts } = r
      for (let i = 0; i + 3 < pts.length; i += 2) {
        const ax = pts[i] ?? 0
        const ay = pts[i + 1] ?? 0
        const bx = pts[i + 2] ?? 0
        const by = pts[i + 3] ?? 0
        if (Math.min(ax, bx) > p.x + best.d || Math.max(ax, bx) < p.x - best.d || Math.min(ay, by) > p.y + best.d || Math.max(ay, by) < p.y - best.d) continue
        const len2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1
        const t = Math.max(0, Math.min(1, ((p.x - ax) * (bx - ax) + (p.y - ay) * (by - ay)) / len2))
        const x = ax + (bx - ax) * t
        const y = ay + (by - ay) * t
        const d = Math.hypot(x - p.x, y - p.y)
        if (d < best.d) best = { d, x, y, angle: Math.atan2(by - ay, bx - ax), width: r.width }
      }
    }
    if (best.width === 0) continue
    // On the stop's side of the street: the shelter at the back of the sidewalk, its back half on the verge,
    // a few meters on from the stop, whose H pole stands at the kerb where the bus's front door halts.
    const nx = -Math.sin(best.angle)
    const ny = Math.cos(best.angle)
    const side = Math.sign((p.x - best.x) * nx + (p.y - best.y) * ny) || 1
    // Its glass back to the houses, its open side (+90°) to the street.
    const angle = best.angle + (side === 1 ? Math.PI : 0)
    const kerb = best.width / 2
    if (p.shelter === false && p.node !== undefined && POLE_ONLY_STOPS.has(p.node)) {
      out.push({ kind: "pole", x: best.x + nx * (kerb + 0.45) * side, y: best.y + ny * (kerb + 0.45) * side, angle })
      continue
    }
    const fx = Math.cos(best.angle)
    const fy = Math.sin(best.angle)
    const fits = (x: number, y: number) =>
      [-1, 1].every((f) => [-1, 1].every((r) => !world.isSolid(x + Math.cos(angle) * f * (SHELTER.length / 2) - Math.sin(angle) * r * (SHELTER.depth / 2), y + Math.sin(angle) * f * (SHELTER.length / 2) + Math.cos(angle) * r * (SHELTER.depth / 2))))
    const spot = [SIDEWALK_M - 0.3, SIDEWALK_M - 0.9]
      .map((back) => ({ x: best.x + nx * (kerb + back) * side + fx * 4, y: best.y + ny * (kerb + back) * side + fy * 4 }))
      .find((q) => fits(q.x, q.y) && !avoid.some((a) => Math.hypot(a.x - q.x, a.y - q.y) < 3.5))
    if (spot === undefined) continue
    const pole = { x: best.x + nx * (kerb + 0.45) * side, y: best.y + ny * (kerb + 0.45) * side }
    out.push({ kind: "shelter", x: spot.x, y: spot.y, angle, pole })
  }
  return out
}

/** The sprite of each traffic sign (StVO number) and Zusatzzeichen a StreetSign can show. */
export const SIGN_SPRITES: Readonly<Record<string, PropName>> = {
  "314": "vz314-parken-links",
  "350": "vz350",
  "224": "vz224",
  "Mo-Sa 8-19 h": "zz-mo-sa-8-19",
  "1040-32": "vz1040-32-2std",
}
/** A sign's size: square signs 0.6 m with their bottom edge at 2.2 m, plates 0.6 x 0.33 m under them, the pole 7 cm thick. */
export const SIGN = { size: 0.6, bottom: 2.2, plate: 0.33, pole: 0.035 } as const
/** Where a zebra's flashing light sits over its sign: on top of the pole, the lamp facing the screen. */
export const FLASH = { z: 3.15, size: 0.3, up: 0.42 } as const

/**
 * A traffic sign as the top-down camera reads it: the grey pole up to the sign's top, the sign and its plates as
 * sprites lying flat at their heights, upright on the screen (image top to the north), each plate drawn a little
 * further down the screen than the one above, and the zebra's flashing light on top (lit per frame in entities.ts).
 */
export const streetSign = (m: MeshBuilder, boxes: SpriteBoxes, sg: StreetSign) => {
  const top = SIGN.bottom + SIGN.size + (sg.flash === true ? 0.25 : 0)
  column(m, sg.x, sg.y, SIGN.pole, top)
  const face = prop(SIGN_SPRITES[sg.vz] ?? "vz350")
  flat(m, boxes, face, { x: sg.x, y: sg.y, z: SIGN.bottom + SIGN.size, angle: 0, length: SIGN.size, width: SIGN.size }, WHITE, true)
  let y = sg.y + SIGN.size / 2
  let z = SIGN.bottom
  for (const plate of sg.plates ?? []) {
    const layer = prop(SIGN_SPRITES[plate] ?? "zz-mo-sa-8-19")
    const b = boxes[layer] ?? [1, 0.55]
    const h = (SIGN.size * b[1]) / b[0]
    flat(m, boxes, layer, { x: sg.x, y: y + h / 2 + 0.02, z, angle: 0, length: SIGN.size, width: h }, WHITE, true)
    y += h + 0.02
    z -= SIGN.plate
  }
  if (sg.flash === true) {
    const lamp = prop("flash-amber")
    const b = boxes[lamp] ?? [0.8, 1]
    flat(m, boxes, lamp, { x: sg.x, y: sg.y - FLASH.up, z: FLASH.z, angle: 0, length: (FLASH.size * b[0]) / b[1], width: FLASH.size }, WHITE, true)
  }
}

const BOLLARD_RED: Rgba = [204, 34, 30, 255]
const BOLLARD_WHITE: Rgba = [238, 236, 230, 255]

/** A red and white bollard, 0.9 m high, `side` meters square, and its shadow. */
export const bollard = (m: MeshBuilder, x: number, y: number, side: number) => {
  const h = side / 2
  const bands: ReadonlyArray<readonly [number, number, Rgba]> = [
    [0, 0.3, BOLLARD_RED],
    [0.3, 0.6, BOLLARD_WHITE],
    [0.6, 0.9, BOLLARD_RED],
  ]
  for (const [z0, z1, c] of bands) box(m, x, y, 0, h, h, z0, z1, c, c, z1 === 0.9)
}
