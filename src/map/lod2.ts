/**
 * The Bavarian LoD2 building model (© Bayerische Vermessungsverwaltung, CC BY 4.0): one CityGML file per 2 km tile in
 * EPSG:25832. Only what the storeys need is read: each bldg:Building's ground outline and height, its roof surfaces
 * (where, how big, how high their lowest edge), measuredHeight and roofType. scripts/lod2-heights.ts downloads the
 * tiles, matches them to the OSM buildings and writes data/lod2-levels.json, which `pnpm map` reads (buildingLevels).
 */
import { polygonArea } from "./build.ts"
import type { Bbox } from "./project.ts"
import { toUtm32 } from "./utm.ts"

export const LOD2_TILE_KM = 2
export const lod2TileUrl = (e: number, n: number) => `https://download1.bayernwolke.de/a/lod2/citygml/${e}_${n}.gml`

const tileKm = (v: number) => Math.floor(v / 1000 / LOD2_TILE_KM) * LOD2_TILE_KM

/** The tiles (south-west corner in km, even numbers) covering the bbox, west to east, then south to north. */
export const lod2Tiles = (bbox: Bbox): Array<readonly [number, number]> => {
  const corners = [
    { lat: bbox.south, lon: bbox.west },
    { lat: bbox.south, lon: bbox.east },
    { lat: bbox.north, lon: bbox.west },
    { lat: bbox.north, lon: bbox.east },
  ].map(toUtm32)
  const [e0, e1] = [tileKm(Math.min(...corners.map((c) => c[0]))), tileKm(Math.max(...corners.map((c) => c[0])))]
  const [n0, n1] = [tileKm(Math.min(...corners.map((c) => c[1]))), tileKm(Math.max(...corners.map((c) => c[1])))]
  const tiles: Array<readonly [number, number]> = []
  for (let n = n0; n <= n1; n += LOD2_TILE_KM) for (let e = e0; e <= e1; e += LOD2_TILE_KM) tiles.push([e, n])
  return tiles
}

/** A roof surface: its middle (x, y), its area seen from above (m²), its lowest point over the ground (m), and 1 if flat. */
export type Lod2Roof = readonly [x: number, y: number, area: number, z: number, flat: number]

/** One LoD2 building. `rings`: its ground polygons' rings (outer and courtyard), flat x, y, open; `roofs` likewise in x, y. */
export type Lod2Building = {
  readonly id: string
  readonly rings: ReadonlyArray<ReadonlyArray<number>>
  /** Ground area, m² (outer rings less courtyards). */
  readonly area: number
  readonly roofs: ReadonlyArray<Lod2Roof>
  /** The main eave over the ground and whether that roof is flat: see mainEave. */
  readonly eave: number
  readonly flat: boolean
  /** The lowest roof point over the ground (often a low annex's eave), meters. */
  readonly lowest: number
  /** Ground to the highest point (the ridge, or a stair tower), meters. */
  readonly height: number
  /** AdV roof type: 1000 flat, 2100 shed, 3100 gable, 3200 hip, … */
  readonly roofType: string
}

const STOREY_M = 3
/** What render/scene draws above a flat roof's top storey (PARAPET_M there): a flat roof's walls end that much lower. */
const PARAPET_M = 0.6
/** A roof surface rising less than this is flat. */
const FLAT_M = 0.3

const posLists = (xml: string) => Array.from(xml.matchAll(/<gml:posList[^>]*>([^<]+)<\/gml:posList>/g), (m) => (m[1] ?? "").trim().split(/\s+/).map(Number))
const surfaces = (xml: string, kind: string) => Array.from(xml.matchAll(new RegExp(`<bldg:${kind}[ >][\\s\\S]*?</bldg:${kind}>`, "g")), (m) => m[0])
const tag = (xml: string, name: string) => new RegExp(`<bldg:${name}[^>]*>([^<]+)<`).exec(xml)?.[1]?.trim()
const zs = (l: ReadonlyArray<number>) => l.filter((_, i) => i % 3 === 2)
const cm = (v: number) => Math.round(v * 100) / 100

/** A closed 3D ring (x y z …, last = first) as an open 2D one. */
const ring2d = (l: ReadonlyArray<number>) => {
  const ring: Array<number> = []
  for (let i = 0; i < l.length - 3; i += 3) ring.push(l[i] ?? 0, l[i + 1] ?? 0)
  return ring
}

/** Area seen from above; shifted to the first point first, so 7-digit UTM coordinates keep their precision. */
const areaOf = (ring: ReadonlyArray<number>) => {
  const [x0, y0] = [ring[0] ?? 0, ring[1] ?? 0]
  return polygonArea(ring.map((v, i) => v - (i % 2 === 0 ? x0 : y0)))
}

const vertexMean = (ring: ReadonlyArray<number>): readonly [number, number] => {
  const n = Math.max(1, ring.length / 2)
  return [ring.reduce((s, v, i) => (i % 2 === 0 ? s + v : s), 0) / n, ring.reduce((s, v, i) => (i % 2 === 1 ? s + v : s), 0) / n]
}

/**
 * The main eave: the roof surfaces' lowest points, each weighted by its area seen from above, their median (ties low),
 * and whether that surface is flat. For a flat roof it is the main roof's height: a stair tower or a low annex in the
 * same building does not move it, as it would measuredHeight or the lowest roof point. A vertical surface weighs 1e-6,
 * so a roof of only such still has one. null without roofs.
 */
export const mainEave = (roofs: ReadonlyArray<Lod2Roof>): { readonly eave: number; readonly flat: boolean } | null => {
  const sorted = roofs.toSorted((a, b) => a[3] - b[3])
  const total = sorted.reduce((s, r) => s + r[2] + 1e-6, 0)
  let acc = 0
  for (const r of sorted) {
    acc += r[2] + 1e-6
    if (acc >= total / 2) return { eave: r[3], flat: r[4] === 1 }
  }
  return null
}

/** Every bldg:Building in a CityGML tile. A building without a ground surface or roof is skipped. */
export const parseCityGml = (xml: string): Array<Lod2Building> => {
  const out: Array<Lod2Building> = []
  for (const m of xml.matchAll(/<bldg:Building gml:id="([^"]+)">([\s\S]*?)<\/bldg:Building>/g)) {
    const body = m[2] ?? ""
    const groundXml = surfaces(body, "GroundSurface")
    const ground = groundXml.flatMap(posLists)
    const roofLists = surfaces(body, "RoofSurface").flatMap(posLists)
    if (ground.length === 0 || roofLists.length === 0) continue
    const groundZ = Math.min(...ground.flatMap(zs))
    const roofs = roofLists.map((l): Lod2Roof => {
      const ring = ring2d(l)
      const [x, y] = vertexMean(ring)
      const z = zs(l)
      return [x, y, Math.round(areaOf(ring) * 10) / 10, cm(Math.min(...z) - groundZ), Math.max(...z) - Math.min(...z) < FLAT_M ? 1 : 0]
    })
    const main = mainEave(roofs) ?? { eave: 0, flat: false }
    const measured = Number(tag(body, "measuredHeight"))
    const area = groundXml.reduce((s, g) => {
      const holes = Array.from(g.matchAll(/<gml:interior>[\s\S]*?<\/gml:interior>/g), (h) => posLists(h[0])).flat()
      return s + posLists(g).reduce((a, l) => a + areaOf(ring2d(l)), 0) - 2 * holes.reduce((a, l) => a + areaOf(ring2d(l)), 0)
    }, 0)
    out.push({
      id: m[1] ?? "",
      rings: ground.map(ring2d),
      area: Math.round(area * 10) / 10,
      roofs,
      eave: main.eave,
      flat: main.flat,
      lowest: Math.min(...roofs.map((r) => r[3])),
      height: Number.isFinite(measured) ? measured : cm(Math.max(...roofLists.flatMap(zs)) - groundZ),
      roofType: tag(body, "roofType") ?? "",
    })
  }
  return out
}

/** The building with its rings and roofs moved by `to` (EPSG:25832 → map meters). */
export const moveLod2 = (b: Lod2Building, to: (x: number, y: number) => readonly [number, number]): Lod2Building => ({
  ...b,
  rings: b.rings.map((r) => {
    const out: Array<number> = []
    for (let i = 0; i < r.length; i += 2) out.push(...to(r[i] ?? 0, r[i + 1] ?? 0))
    return out
  }),
  roofs: b.roofs.map(([x, y, ...rest]) => [...to(x, y), ...rest] as const),
})

/**
 * Storeys whose walls (3 m each; a flat roof's parapet on top) come closest to the main eave: round(eave / 3), the
 * parapet taken off a flat roof first; at least one.
 */
export const lod2Levels = (b: { readonly eave: number; readonly flat: boolean }): number =>
  Math.max(1, Math.round((b.eave - (b.flat ? PARAPET_M : 0)) / STOREY_M))

/** A footprint in map meters: its outer ring and its courtyards (flat x, y, open). */
export type Footprint = { readonly pts: ReadonlyArray<number>; readonly holes?: ReadonlyArray<ReadonlyArray<number>> }

const inRing = (ring: ReadonlyArray<number>, x: number, y: number) => {
  let inside = false
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const xi = ring[i] ?? 0
    const yi = ring[i + 1] ?? 0
    const xj = ring[j] ?? 0
    const yj = ring[j + 1] ?? 0
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Even-odd over all rings: a point in a courtyard is outside. */
const inRings = (rings: ReadonlyArray<ReadonlyArray<number>>, x: number, y: number) => rings.reduce((n, r) => (inRing(r, x, y) ? !n : n), false)

type Box = readonly [number, number, number, number]
const boxOf = (ring: ReadonlyArray<number>): Box => {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity]
  for (let i = 0; i < ring.length; i += 2) {
    x0 = Math.min(x0, ring[i] ?? 0)
    x1 = Math.max(x1, ring[i] ?? 0)
    y0 = Math.min(y0, ring[i + 1] ?? 0)
    y1 = Math.max(y1, ring[i + 1] ?? 0)
  }
  return [x0, y0, x1, y1]
}

/** Area-weighted centroid of a ring (its vertex mean when the area is zero). */
const centroid = (ring: ReadonlyArray<number>): readonly [number, number] => {
  let [a, cx, cy] = [0, 0, 0]
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const cross = (ring[j] ?? 0) * (ring[i + 1] ?? 0) - (ring[i] ?? 0) * (ring[j + 1] ?? 0)
    a += cross
    cx += ((ring[j] ?? 0) + (ring[i] ?? 0)) * cross
    cy += ((ring[j + 1] ?? 0) + (ring[i + 1] ?? 0)) * cross
  }
  if (Math.abs(a) < 1e-9) {
    const n = ring.length / 2
    return [ring.reduce((s, v, i) => (i % 2 === 0 ? s + v : s), 0) / n, ring.reduce((s, v, i) => (i % 2 === 1 ? s + v : s), 0) / n]
  }
  return [cx / (3 * a), cy / (3 * a)]
}

/** Sample spacing for the overlap, meters: a 10 × 10 m house is 400 samples. */
const SAMPLE_M = 0.5
const CELL_M = 50
export const MIN_IOU = 0.5

/** Roofs inside a footprint decide its eave when they cover at least this share of it. */
const OWN_ROOFS = 0.5

/**
 * `index`: the LoD2 building; `eave`/`flat`: the footprint's main eave, from the roof surfaces whose middle lies in it
 * (of any LoD2 building) when they cover OWN_ROOFS of it, else the building's (`roofs` says which).
 */
export type Lod2Match = {
  readonly index: number
  readonly iou: number
  readonly by: "overlap" | "centroid" | "roofs"
  readonly eave: number
  readonly flat: boolean
  readonly roofs: "footprint" | "building"
}

/**
 * Which LoD2 building each footprint is: the one overlapping it best when their intersection over union is at least
 * MIN_IOU, else the one its centroid lies in, else the one with the most roof in it when LoD2 roofs cover OWN_ROOFS of
 * it, else none. Where OSM splits a block LoD2 keeps whole (or the other way round), the footprint's own roofs give its
 * eave. `lod2` is in map meters; rings even-odd, like Footprint.
 */
export const matchLod2 = (footprints: ReadonlyArray<Footprint>, lod2: ReadonlyArray<Lod2Building>): Array<Lod2Match | null> => {
  const boxes = lod2.map((b) => boxOf(b.rings.flat()))
  const grid = new Map<string, Array<number>>()
  boxes.forEach(([x0, y0, x1, y1], i) => {
    for (let gx = Math.floor(x0 / CELL_M); gx <= Math.floor(x1 / CELL_M); gx++)
      for (let gy = Math.floor(y0 / CELL_M); gy <= Math.floor(y1 / CELL_M); gy++) {
        const key = `${gx},${gy}`
        const cell = grid.get(key)
        if (cell === undefined) grid.set(key, [i])
        else cell.push(i)
      }
  })
  return footprints.map((f) => {
    const rings = [f.pts, ...(f.holes ?? [])]
    const [x0, y0, x1, y1] = boxOf(f.pts)
    const near = new Set<number>()
    for (let gx = Math.floor(x0 / CELL_M); gx <= Math.floor(x1 / CELL_M); gx++)
      for (let gy = Math.floor(y0 / CELL_M); gy <= Math.floor(y1 / CELL_M); gy++) for (const i of grid.get(`${gx},${gy}`) ?? []) near.add(i)
    const area = Math.abs(polygonArea(f.pts)) - (f.holes ?? []).reduce((s, h) => s + Math.abs(polygonArea(h)), 0)
    const candidates = [...near].toSorted((a, b) => a - b)
    const own = candidates.flatMap((i) => (lod2[i]?.roofs ?? []).flatMap((r) => (inRings(rings, r[0], r[1]) ? [{ i, r }] : [])))
    const ownArea = own.reduce((s, o) => s + o.r[2], 0)
    const ownEave = ownArea >= OWN_ROOFS * area ? mainEave(own.map((o) => o.r)) : null
    const match = (index: number, iou: number, by: Lod2Match["by"]): Lod2Match => {
      const b = lod2[index]
      return ownEave === null
        ? { index, iou, by, eave: b?.eave ?? 0, flat: b?.flat ?? false, roofs: "building" }
        : { index, iou, by, eave: ownEave.eave, flat: ownEave.flat, roofs: "footprint" }
    }
    let best: { readonly index: number; readonly iou: number } | null = null
    for (const i of candidates) {
      const [bx0, by0, bx1, by1] = boxes[i] ?? [0, 0, 0, 0]
      const [ix0, iy0, ix1, iy1] = [Math.max(x0, bx0), Math.max(y0, by0), Math.min(x1, bx1), Math.min(y1, by1)]
      if (ix0 >= ix1 || iy0 >= iy1) continue
      const other = lod2[i]?.rings ?? []
      let hits = 0
      for (let y = Math.ceil(iy0 / SAMPLE_M) * SAMPLE_M; y < iy1; y += SAMPLE_M)
        for (let x = Math.ceil(ix0 / SAMPLE_M) * SAMPLE_M; x < ix1; x += SAMPLE_M) if (inRings(rings, x, y) && inRings(other, x, y)) hits++
      const overlap = hits * SAMPLE_M * SAMPLE_M
      const iou = overlap / (area + (lod2[i]?.area ?? 0) - overlap)
      if (iou >= MIN_IOU && (best === null || iou > best.iou)) best = { index: i, iou }
    }
    if (best !== null) return match(best.index, best.iou, "overlap")
    const [cx, cy] = centroid(f.pts)
    for (const i of candidates) if (inRings(lod2[i]?.rings ?? [], cx, cy)) return match(i, 0, "centroid")
    // Neither, but LoD2 roofs cover it (one OSM outline over several LoD2 buildings): the one with the most roof in it.
    if (ownEave === null) return null
    const roofIn = new Map<number, number>()
    for (const o of own) roofIn.set(o.i, (roofIn.get(o.i) ?? 0) + o.r[2])
    const [index] = [...roofIn].reduce((a, b) => (b[1] > a[1] ? b : a))
    return match(index, 0, "roofs")
  })
}
