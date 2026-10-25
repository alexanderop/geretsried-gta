/**
 * The parts of a dressed place (world/places/dressing.ts) as 3D geometry:
 * signs, arcades, balconies, door canopies, cross gables, stairs and ramps on the footprint's walls, signs on its roof,
 * towers with a pyramid roof, a roof deck on posts, sign posts, prop sprites. Drawn with the building they belong to; its walls, storeys
 * and roof colours are scene.ts's.
 */
import { SHADOW_DIR, SHADOW_PER_M } from "#/map/photo.ts"
import { boxOf, type Box } from "#/world/geometry.ts"
import { rectRing, square, toWorld, wallFrame } from "#/world/frame.ts"
import { towerFrame, type Part, type Place, type TowerFace } from "#/world/places/dressing.ts"
import { SHADOW, WHITE, Z_SHADOW, box, boxShadow, face, flat, light, shade, sprite, vertex, worldDir, type Builder } from "./frame-mesh.ts"
import { Material, Mode, material, spriteQuad, type MaterialName, type MeshBuilder, type Rgba, type SpriteBoxes } from "./mesh.ts"

/** How far a sign stands off its wall unless it says, and the glazing in an arcade's openings. */
const SIGN_OUT = 0.04
const GLAZING_OUT = 0.02
/** The band over an arcade's arches, and the segments of each arch. */
const ARCADE_BAND = 0.45
const ARCH_STEPS = 10
/** A balcony's floor slab and the parapet round it, and how thick that parapet is. */
const BALCONY_SLAB = 0.18
const BALCONY_RAIL = 1
const RAIL = 0.06
/** A door canopy's slab, its fascia board's thickness and how far it stands over the slab. */
const CANOPY_SLAB = 0.2
const FASCIA = 0.12
const FASCIA_UP = 0.1
/** The frame a pylon's panels leave round them. */
const PYLON_RIM = 0.06

/** A roof deck's posts (half their side), how far in from the wall's face they stand; a ramp's rail height and bar. */
const POST = 0.07
const POST_IN = 0.15
const RAIL_H = 0.95
const RAIL_BAR = 0.06

/** A cross gable's front just proud of its wall, its roof's overhang past the gable and the eaves, the dark edge under the roof, and the roof tiles' size (as scene.ts's). */
const GABLE_OUT = 0.04
const GABLE_EAVES = 0.35
const GABLE_EDGE = 0.15
const ROOF_TILE = 5
/** Roof tiles in a wall's frame: their rows along n, so they run along a cross gable's eaves. */
const gableTiles = (u: number, n: number) => [n / ROOF_TILE, u / ROOF_TILE] as const

/** A tower's quoins (square, standing proud of its walls), the cornice under its roof, the eaves' overhang. */
const QUOIN = 0.45
const QUOIN_OUT = 0.05
const CORNICE = 0.25
const EAVES = 0.3

/** A sign: the texture over the rectangle u0..u1 by z0..z1 at n (outside: negative), facing -n. */
const panel = (b: Builder, texture: MaterialName, u0: number, u1: number, z0: number, z1: number, n: number) => {
  const c = shade(WHITE, light(...worldDir(b.f, 0, -1)))
  const layer = material(texture)
  // Image rows run down: the texture's top at z1.
  const v = (u: number, z: number, tu: number, tv: number) => vertex(b, u, n, z, c, Mode.material, layer, tu, tv)
  b.m.quad(v(u0, z0, 0, 1), v(u1, z0, 1, 1), v(u1, z1, 1, 0), v(u0, z1, 0, 0))
}

/** Round arches on pillars standing `depth` proud of the wall (n = 0), a band over them, glazing set back in the openings. */
const arcade = (b: Builder, p: Extract<Part, { kind: "arcade" }>) => {
  const { u0, u1, arches, h, depth, pillar, glazing } = p
  const span = u1 - u0
  const pw = Math.min(0.9, Math.max(0.35, (span / arches) * 0.2))
  const ow = (span - (arches + 1) * pw) / arches
  if (arches < 1 || ow < 0.3) return
  // A round arch where the arcade is tall enough, a flatter one where not.
  const rise = Math.min(ow / 2, h * 0.45)
  const spring = h - rise
  const top = h + ARCADE_BAND
  const front = -depth
  const out = worldDir(b.f, 0, -1)
  const litPillar = shade(pillar, light(...out))
  const litGlazing = shade(glazing, light(...out))
  const soffit = shade(pillar, 0.7)
  for (let i = 0; i < arches; i++) {
    const a = u0 + pw + i * (ow + pw)
    const cu = a + ow / 2
    const arc = Array.from({ length: ARCH_STEPS + 1 }, (_, k) => {
      const t = Math.PI - (Math.PI * k) / ARCH_STEPS
      return [cu + (ow / 2) * Math.cos(t), spring + rise * Math.sin(t)] as const
    })
    face(b, a, -GLAZING_OUT, a + ow, -GLAZING_OUT, 0, spring, glazing)
    const centre = vertex(b, cu, -GLAZING_OUT, spring, litGlazing)
    for (let k = 0; k < ARCH_STEPS; k++) {
      const [ua, za] = arc[k] ?? [a, spring]
      const [ub, zb] = arc[k + 1] ?? [a + ow, spring]
      b.m.tri(centre, vertex(b, ua, -GLAZING_OUT, za, litGlazing), vertex(b, ub, -GLAZING_OUT, zb, litGlazing))
      // The spandrel over this piece of the arch, on the front, and the arch's underside back to the glazing.
      b.m.quad(vertex(b, ua, front, za, litPillar), vertex(b, ub, front, zb, litPillar), vertex(b, ub, front, top, litPillar), vertex(b, ua, front, top, litPillar))
      b.m.quad(vertex(b, ua, front, za, soffit), vertex(b, ub, front, zb, soffit), vertex(b, ub, -GLAZING_OUT, zb, soffit), vertex(b, ua, -GLAZING_OUT, za, soffit))
    }
  }
  for (let i = 0; i <= arches; i++) {
    const a = u0 + i * (ow + pw)
    box(b, [a, a + pw, front, 0], 0, spring, pillar)
    face(b, a, front, a + pw, front, spring, top, pillar)
  }
  face(b, u0, 0, u0, front, spring, top, pillar)
  face(b, u1, front, u1, 0, spring, top, pillar)
  flat(b, [u0, u1, front, 0], top, pillar)
}

/** Balconies standing out from the wall (n = 0), one per floor height: a slab and a parapet round its front and ends. */
const balcony = (b: Builder, p: Extract<Part, { kind: "balcony" }>) => {
  const { u0, u1, depth, colour } = p
  for (const z of p.z) {
    box(b, [u0, u1, -depth, 0], z - BALCONY_SLAB, z, p.slab ?? colour)
    const top = z + BALCONY_RAIL
    box(b, [u0, u1, -depth, -depth + RAIL], z, top, colour)
    box(b, [u0, u0 + RAIL, -depth + RAIL, 0], z, top, colour)
    box(b, [u1 - RAIL, u1, -depth + RAIL, 0], z, top, colour)
  }
}

/**
 * A door canopy: a slab standing out from the wall (n = 0) with its top at z (in its texture, if any), and its shadow on
 * the ground; its fascia board round the three outer sides and its posts, if any.
 */
const canopy = (b: Builder, p: Extract<Part, { kind: "canopy" }>) => {
  const { fascia, posts } = p
  if (fascia !== undefined) {
    const z0 = p.z - fascia.h
    box(b, [p.u0, p.u1, -p.depth, -p.depth + FASCIA], z0, p.z + FASCIA_UP, fascia.colour)
    box(b, [p.u0, p.u0 + FASCIA, -p.depth + FASCIA, 0], z0, p.z + FASCIA_UP, fascia.colour)
    box(b, [p.u1 - FASCIA, p.u1, -p.depth + FASCIA, 0], z0, p.z + FASCIA_UP, fascia.colour)
  }
  if (posts !== undefined) {
    const top = p.z - (fascia?.h ?? CANOPY_SLAB)
    const n = -p.depth + FASCIA + POST
    const count = Math.max(1, Math.round((p.u1 - p.u0) / posts.every))
    for (let k = 0; k <= count; k++) {
      const u = p.u0 + FASCIA + POST + ((p.u1 - p.u0 - 2 * (FASCIA + POST)) * k) / count
      box(b, square(u, n, POST), 0, top, posts.colour)
    }
  }
  const rect = [p.u0, p.u1, -p.depth, 0] as const
  if (p.texture === undefined) box(b, rect, p.z - CANOPY_SLAB, p.z, p.colour)
  else {
    const z0 = p.z - CANOPY_SLAB
    face(b, p.u0, 0, p.u0, -p.depth, z0, p.z, p.colour)
    face(b, p.u0, -p.depth, p.u1, -p.depth, z0, p.z, p.colour)
    face(b, p.u1, -p.depth, p.u1, 0, z0, p.z, p.colour)
    face(b, p.u1, 0, p.u0, 0, z0, p.z, p.colour)
    flat(b, rect, p.z, p.colour, Mode.material, material(p.texture), (u, n) => [(u - p.u0) / p.depth, -n / p.depth])
  }
  boxShadow(b, rect, p.z)
}

/**
 * A cross gable on its wall (n = 0): the strip of wall under its eaves and the gable over it facing out, its two side
 * walls running into the building, and its two roof planes from the eaves (overhanging) to the ridge over the middle,
 * each lit by which way it faces and tiled like the building's roof, with a dark edge along the eaves and the gable.
 * Whatever lies under the building's own roof is hidden by it.
 */
const gable = (b: Builder, p: Extract<Part, { kind: "gable" }>) => {
  const { u0, u1, z0, z, depth } = p
  const { wall, roof } = p.colours
  const mid = (u0 + u1) / 2
  const slope = Math.tan((p.pitch * Math.PI) / 180)
  const ridge = z + (mid - u0) * slope
  const front = -GABLE_OUT
  face(b, u0, front, u1, front, z0, z, wall)
  face(b, u0, depth, u0, front, z0, z, wall)
  face(b, u1, front, u1, depth, z0, z, wall)
  const c = shade(p.colours.gable, light(...worldDir(b.f, 0, -1)))
  b.m.tri(vertex(b, u0, front, z, c), vertex(b, u1, front, z, c), vertex(b, mid, front, ridge, c))
  const eave = z - GABLE_EAVES * slope
  const n0 = front - GABLE_EAVES
  for (const [ue, side] of [
    [u0 - GABLE_EAVES, -1],
    [u1 + GABLE_EAVES, 1],
  ] as const) {
    const [ox, oy] = worldDir(b.f, side, 0)
    const lit = shade(roof, 0.7 + 0.3 * Math.max(0, -(ox * SHADOW_DIR[0] + oy * SHADOW_DIR[1])))
    const v = (u: number, n: number, zz: number) => vertex(b, u, n, zz, lit, Mode.detail, Material.roofTiles, ...gableTiles(u, n))
    b.m.quad(v(ue, n0, eave), v(mid, n0, ridge), v(mid, depth, ridge), v(ue, depth, eave))
    const dark = shade(roof, 0.55)
    face(b, ue, side < 0 ? depth : n0, ue, side < 0 ? n0 : depth, eave - GABLE_EDGE, eave, dark, Mode.color)
    b.m.quad(vertex(b, ue, n0, eave - GABLE_EDGE, dark), vertex(b, mid, n0, ridge - GABLE_EDGE, dark), vertex(b, mid, n0, ridge, dark), vertex(b, ue, n0, eave, dark))
  }
}

/**
 * A roof deck on its rectangle (wall frame): the slab's edges, its top in the texture repeated over it (or plain), its
 * shadow; and posts on every wall of the footprint `pts` up from `posts.z0` to the slab's underside.
 */
const deck = (b: Builder, p: Extract<Part, { kind: "deck" }>, pts: ReadonlyArray<number>) => {
  const [u0, u1, n0, n1] = p.rect
  const z0 = p.z - p.thickness
  face(b, u0, n1, u0, n0, z0, p.z, p.colour)
  face(b, u0, n0, u1, n0, z0, p.z, p.colour)
  face(b, u1, n0, u1, n1, z0, p.z, p.colour)
  face(b, u1, n1, u0, n1, z0, p.z, p.colour)
  const [ru, rn] = p.repeat ?? [1, 1]
  if (p.texture === undefined) flat(b, p.rect, p.z, p.colour)
  else flat(b, p.rect, p.z, p.top ?? WHITE, Mode.material, material(p.texture), (u, n) => [((u - u0) / (u1 - u0)) * ru, ((n - n0) / (n1 - n0)) * rn])
  boxShadow(b, p.rect, p.z)
  const posts = p.posts
  if (posts === undefined) return
  for (let e = 0; ; e++) {
    const wall = wallFrame(pts, e)
    if (wall === null) break
    const count = Math.max(1, Math.round(wall.length / posts.every))
    const wb = { ...b, f: wall.frame }
    for (let k = 0; k < count; k++) {
      const u = Math.min(Math.max((wall.length * k) / count, POST_IN), wall.length - POST_IN)
      box(wb, square(u, POST_IN, POST), posts.z0, z0, posts.colour)
    }
  }
}

/** Where each corner of a roof sign's rectangle (u0 n0, u1 n0, u1 n1, u0 n1) sits in its image, for the image's top towards `up`. */
const ROOF_SIGN_UV: Readonly<Record<NonNullable<Extract<Part, { kind: "roofSign" }>["up"]>, ReadonlyArray<readonly [number, number]>>> = {
  n1: [
    [0, 1],
    [1, 1],
    [1, 0],
    [0, 0],
  ],
  n0: [
    [1, 0],
    [0, 0],
    [0, 1],
    [1, 1],
  ],
  u1: [
    [1, 1],
    [1, 0],
    [0, 0],
    [0, 1],
  ],
  u0: [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0],
  ],
}

/** A sign lying on the roof: the material over its rectangle, at z0 along n0 and z1 along n1. */
const roofSign = (b: Builder, p: Extract<Part, { kind: "roofSign" }>) => {
  const layer = material(p.texture)
  const uv = ROOF_SIGN_UV[p.up ?? "n1"]
  const corners = [
    [p.u0, p.n0, p.z0],
    [p.u1, p.n0, p.z0],
    [p.u1, p.n1, p.z1],
    [p.u0, p.n1, p.z1],
  ] as const
  const ids = corners.map(([u, n, z], k) => vertex(b, u, n, z, WHITE, Mode.material, layer, ...(uv[k] ?? [0, 0])))
  b.m.quad(ids[0] ?? 0, ids[1] ?? 0, ids[2] ?? 0, ids[3] ?? 0)
}

/** A sign post: a box turned `angle` at (u, n), its texture on both broad faces, and its shadow. */
const pylon = (b: Builder, p: Extract<Part, { kind: "pylon" }>) => {
  const [ox, oy] = toWorld(b.f, p.u, p.n)
  const [ux, uy] = worldDir(b.f, Math.cos(p.angle), -Math.sin(p.angle))
  const front = { ...b, f: { ox, oy, ux, uy, nx: uy, ny: -ux } }
  const back = { ...b, f: { ox, oy, ux: -ux, uy: -uy, nx: -uy, ny: ux } }
  const rect = [-p.w / 2, p.w / 2, -p.d / 2, p.d / 2] as const
  box(front, rect, 0, p.h, p.colour)
  for (const side of [front, back]) panel(side, p.texture, -p.w / 2 + PYLON_RIM, p.w / 2 - PYLON_RIM, p.z0, p.z1, -p.d / 2 - SIGN_OUT / 2)
  boxShadow(front, rect, p.h)
}

/** A flight of steps standing out from the wall (n = 0), each a box one riser higher than the one in front of it. */
const stairs = (b: Builder, p: Extract<Part, { kind: "stairs" }>) => {
  const tread = p.depth / p.steps
  for (let i = 0; i < p.steps; i++) box(b, [p.u0, p.u1, -p.depth + i * tread, 0], 0, (p.h * (i + 1)) / p.steps, p.colour)
}

/** A ramp along the wall (n = 0): its sloping top, its outer face and high end, and a rail along its outer edge. */
const ramp = (b: Builder, p: Extract<Part, { kind: "ramp" }>) => {
  const { u0, u1, h, colour } = p
  const out = -p.depth
  const z = (u: number) => ((p.low === "u0" ? u - u0 : u1 - u) / (u1 - u0)) * h
  const top = shade(colour, 0.95)
  const v = (u: number, n: number, zz: number, c: Rgba) => vertex(b, u, n, zz, c)
  b.m.quad(v(u0, out, z(u0), top), v(u1, out, z(u1), top), v(u1, 0, z(u1), top), v(u0, 0, z(u0), top))
  const side = shade(colour, light(...worldDir(b.f, 0, -1)))
  b.m.quad(v(u0, out, 0, side), v(u1, out, 0, side), v(u1, out, z(u1), side), v(u0, out, z(u0), side))
  const [hi, hn] = p.low === "u0" ? [u1, 1] : [u0, -1]
  face(b, hi, hn > 0 ? out : 0, hi, hn > 0 ? 0 : out, 0, h, colour)
  const rail = p.rail
  if (rail === undefined) return
  const n = out + RAIL_BAR
  for (const u of [u0 + RAIL_BAR, (u0 + u1) / 2, u1 - RAIL_BAR]) box(b, square(u, n, RAIL_BAR / 2), z(u), z(u) + RAIL_H, rail)
  const r = shade(rail, 0.9)
  b.m.quad(v(u0, n, z(u0) + RAIL_H - RAIL_BAR, r), v(u1, n, z(u1) + RAIL_H - RAIL_BAR, r), v(u1, n, z(u1) + RAIL_H, r), v(u0, n, z(u0) + RAIL_H, r))
}

/** The corners of a tower's side, left to right seen from outside (see TowerFace). */
const sideOf = (r: readonly [number, number, number, number], side: TowerFace["side"]) => {
  const [u0, u1, n0, n1] = r
  const corners = [
    [u0, n0],
    [u1, n0],
    [u1, n1],
    [u0, n1],
  ] as const
  return [corners[side], corners[(side + 1) % 4] ?? corners[0]] as const
}

/** A square tower: walls, quoins, a cornice, a pyramid roof with its finial, lettering on its faces, its shadow. */
const tower = (b: Builder, p: Extract<Part, { kind: "tower" }>) => {
  const [u0, u1, n0, n1] = p.rect
  const { wall, roof, trim, finial } = p.colours
  box(b, p.rect, 0, p.h, wall)
  if (trim !== undefined) {
    for (const [cu, cn, su, sn] of [
      [u0, n0, 1, 1],
      [u1, n0, -1, 1],
      [u1, n1, -1, -1],
      [u0, n1, 1, -1],
    ] as const) {
      const ua = cu - su * QUOIN_OUT
      const ub = cu + su * QUOIN
      const na = cn - sn * QUOIN_OUT
      const nb = cn + sn * QUOIN
      box(b, [Math.min(ua, ub), Math.max(ua, ub), Math.min(na, nb), Math.max(na, nb)], 0, p.h - CORNICE, trim)
    }
  }
  box(b, [u0 - EAVES, u1 + EAVES, n0 - EAVES, n1 + EAVES], p.h - CORNICE, p.h, trim ?? wall)
  for (const f of p.faces ?? []) {
    const [[au, an], [bu, bn]] = sideOf(p.rect, f.side)
    // The face's own frame: u along it from its left end, n into the tower.
    const len = Math.hypot(bu - au, bn - an)
    const du = (bu - au) / len
    const dn = (bn - an) / len
    const [ox, oy] = toWorld(b.f, au, an)
    const [ux, uy] = worldDir(b.f, du, dn)
    panel({ ...b, f: { ox, oy, ux, uy, nx: uy, ny: -ux } }, f.texture, f.u0, f.u1, f.z0, f.z1, -(trim === undefined ? SIGN_OUT : QUOIN_OUT + SIGN_OUT))
  }
  // The pyramid from the eaves to its tip, each side lit by which way it faces.
  const cu = (u0 + u1) / 2
  const cn = (n0 + n1) / 2
  const tipZ = p.h + p.roofH
  const eaves = [
    [u0 - EAVES, n0 - EAVES],
    [u1 + EAVES, n0 - EAVES],
    [u1 + EAVES, n1 + EAVES],
    [u0 - EAVES, n1 + EAVES],
  ] as const
  const outward = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ] as const
  for (let i = 0; i < 4; i++) {
    const [au, an] = eaves[i] ?? eaves[0]
    const [bu, bn] = eaves[(i + 1) % 4] ?? eaves[0]
    const [ou, on] = outward[i] ?? outward[0]
    const c = shade(roof, light(...worldDir(b.f, ou, on)))
    b.m.tri(vertex(b, au, an, p.h, c), vertex(b, bu, bn, p.h, c), vertex(b, cu, cn, tipZ, c))
  }
  if (finial !== undefined) {
    box(b, square(cu, cn, 0.07), tipZ - 0.2, tipZ + 1.4, finial)
    box(b, [cu - 0.4, cu + 0.4, cn - 0.06, cn + 0.06], tipZ + 0.75, tipZ + 0.9, finial)
  }
  boxShadow(b, p.rect, p.h + p.roofH * 0.5)
}

/** A prop sprite lying flat, on its pole, and its shadow on the ground. */
const propSprite = (b: Builder, p: Extract<Part, { kind: "sprite" }>) => {
  if (p.pole !== undefined) {
    box(b, square(p.u, p.n, 0.05), 0, p.z, p.pole)
    boxShadow(b, square(p.u, p.n, 0.05), p.z)
  }
  const s = sprite(b, p.name, p.u, p.n, p.z, p.angle, p.len)
  b.m.target = "shadow"
  const off = p.z * SHADOW_PER_M
  spriteQuad(b.m, { x: s.x + SHADOW_DIR[0] * off, y: s.y + SHADOW_DIR[1] * off, z: Z_SHADOW, angle: s.angle, length: s.length, width: s.width }, s.layer, s.bx, SHADOW, Mode.silhouette)
  b.m.target = "opaque"
}

/** Every part of a place; `pts` is its footprint's outline. */
export const placeParts = (m: MeshBuilder, boxes: SpriteBoxes, place: Place, pts: ReadonlyArray<number>) => {
  for (const part of place.dressing.parts) {
    if (part.kind === "tower") {
      const f = towerFrame(place, pts, part)
      if (f !== null) tower({ m, f, boxes }, part)
    }
    else if (part.kind === "sprite") propSprite({ m, f: place.frame, boxes }, part)
    else if (part.kind === "pylon") pylon({ m, f: place.frame, boxes }, part)
    else {
      const wall = wallFrame(pts, part.edge)
      if (wall === null) continue
      const b = { m, f: wall.frame, boxes }
      if (part.kind === "deck") deck(b, part, pts)
      else if (part.kind === "stairs") stairs(b, part)
      else if (part.kind === "ramp") ramp(b, part)
      else if (part.kind === "wallSign") panel(b, part.texture, part.u0, part.u1, part.z0, part.z1, -(part.out ?? SIGN_OUT))
      else if (part.kind === "balcony") balcony(b, part)
      else if (part.kind === "canopy") canopy(b, part)
      else if (part.kind === "gable") gable(b, part)
      else if (part.kind === "roofSign") roofSign(b, part)
      else arcade(b, part)
    }
  }
}

/** Where a place's parts and their shadows reach on the map; null without parts. */
export const placeBox = (place: Place, pts: ReadonlyArray<number>): Box | null => {
  const rings = place.dressing.parts.flatMap((part): Array<readonly [ReadonlyArray<number>, number]> => {
    if (part.kind === "tower") {
      const f = towerFrame(place, pts, part)
      return f === null ? [] : [[rectRing(f, [part.rect[0] - EAVES, part.rect[1] + EAVES, part.rect[2] - EAVES, part.rect[3] + EAVES]), part.h + part.roofH + 1.4]]
    }
    if (part.kind === "sprite") return [[rectRing(place.frame, square(part.u, part.n, part.len)), part.z]]
    if (part.kind === "pylon") return [[rectRing(place.frame, square(part.u, part.n, Math.max(part.w, part.d))), part.h]]
    const wall = wallFrame(pts, part.edge)
    if (wall === null) return []
    if (part.kind === "balcony") return [[rectRing(wall.frame, [part.u0, part.u1, -part.depth, 0]), Math.max(0, ...part.z) + BALCONY_RAIL]]
    if (part.kind === "canopy") return [[rectRing(wall.frame, [part.u0, part.u1, -part.depth, 0]), part.z]]
    if (part.kind === "deck") return [[rectRing(wall.frame, part.rect), part.z]]
    if (part.kind === "roofSign") return [[rectRing(wall.frame, [part.u0, part.u1, part.n0, part.n1]), Math.max(part.z0, part.z1)]]
    if (part.kind === "stairs" || part.kind === "ramp") return [[rectRing(wall.frame, [part.u0, part.u1, -part.depth, 0]), part.h + (part.kind === "ramp" ? RAIL_H : 0)]]
    if (part.kind === "gable")
      return [[rectRing(wall.frame, [part.u0 - GABLE_EAVES, part.u1 + GABLE_EAVES, -GABLE_OUT - GABLE_EAVES, part.depth]), part.z + ((part.u1 - part.u0) / 2) * Math.tan((part.pitch * Math.PI) / 180)]]
    const out = part.kind === "arcade" ? part.depth : (part.out ?? SIGN_OUT)
    return [[rectRing(wall.frame, [part.u0, part.u1, -out, 0]), part.kind === "arcade" ? part.h + ARCADE_BAND : part.z1]]
  })
  if (rings.length === 0) return null
  const boxes = rings.map(([ring, h]) => boxOf(ring, h * SHADOW_PER_M + 0.5))
  return {
    minX: Math.min(...boxes.map((x) => x.minX)),
    minY: Math.min(...boxes.map((x) => x.minY)),
    maxX: Math.max(...boxes.map((x) => x.maxX)),
    maxY: Math.max(...boxes.map((x) => x.maxY)),
  }
}
