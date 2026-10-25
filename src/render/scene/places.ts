/**
 * The parts of a dressed place (world/places/dressing.ts) as 3D geometry:
 * signs, arcades and balconies on the footprint's walls, towers with a pyramid roof,
 * prop sprites. Drawn with the building they belong to; its walls, storeys
 * and roof colours are scene.ts's.
 */
import { SHADOW_DIR, SHADOW_PER_M } from "#/map/photo.ts"
import { boxOf, type Box } from "#/world/geometry.ts"
import { rectRing, square, toWorld, wallFrame } from "#/world/frame.ts"
import { towerFrame, type Part, type Place, type TowerFace } from "#/world/places/dressing.ts"
import { SHADOW, WHITE, Z_SHADOW, box, boxShadow, face, flat, light, shade, sprite, vertex, worldDir, type Builder } from "./frame-mesh.ts"
import { Mode, material, spriteQuad, type MaterialName, type MeshBuilder, type SpriteBoxes } from "./mesh.ts"

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
    else {
      const wall = wallFrame(pts, part.edge)
      if (wall === null) continue
      const b = { m, f: wall.frame, boxes }
      if (part.kind === "wallSign") panel(b, part.texture, part.u0, part.u1, part.z0, part.z1, -(part.out ?? SIGN_OUT))
      else if (part.kind === "balcony") balcony(b, part)
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
    const wall = wallFrame(pts, part.edge)
    if (wall === null) return []
    if (part.kind === "balcony") return [[rectRing(wall.frame, [part.u0, part.u1, -part.depth, 0]), Math.max(0, ...part.z) + BALCONY_RAIL]]
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
