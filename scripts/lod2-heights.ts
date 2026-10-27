/**
 * Storeys for the OSM buildings from the Bavarian LoD2 building model (© Bayerische Vermessungsverwaltung,
 * CC BY 4.0, www.geodaten.bayern.de):
 *   node scripts/lod2-heights.ts   then `pnpm map`
 * Downloads the CityGML tiles covering the map once (data/lod2/, gitignored, ~20 tiles, ~600 MB), matches each LoD2
 * building to the OSM building ways and relations in data/raw.json / data/buildings-rel.json (see matchLod2) and writes
 * data/lod2-levels.json: { ways: { id: storeys }, relations: { id: storeys } }, storeys ≈ main eave / 3 m (mainEave,
 * lod2Levels; a flat roof's eave is its height). Every match with its numbers goes to data/lod2/matches.json.
 */
import { Console, Effect, FileSystem, Schema } from "effect"
import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { relationBuildings } from "../src/map/build.ts"
import { lod2Levels, lod2Tiles, lod2TileUrl, matchLod2, moveLod2, parseCityGml, type Footprint, type Lod2Building } from "../src/map/lod2.ts"
import { makeProjection, type LatLon } from "../src/map/project.ts"
import { fromUtm32 } from "../src/map/utm.ts"
import { BBOX } from "./bbox.ts"

const DIR = "data/lod2"
const OUT = "data/lod2-levels.json"
const MATCHES = `${DIR}/matches.json`
const RAW = "data/raw.json"
const BUILDINGS_REL = "data/buildings-rel.json"

class Lod2Error extends Schema.TaggedError<Lod2Error>()("Lod2Error", { url: Schema.String, status: Schema.Number }) {}

const Point = Schema.Struct({ lat: Schema.Number, lon: Schema.Number })
const Ways = Schema.Struct({
  elements: Schema.Array(Schema.Struct({ type: Schema.String, id: Schema.Number, geometry: Schema.optionalKey(Schema.Array(Point)), tags: Schema.optionalKey(Schema.Record(Schema.String, Schema.String)) })),
})
const Relations = Schema.Struct({
  elements: Schema.Array(
    Schema.Struct({
      id: Schema.Number,
      tags: Schema.Record(Schema.String, Schema.String),
      members: Schema.Array(Schema.Struct({ type: Schema.String, ref: Schema.Number, role: Schema.String, geometry: Schema.optionalKey(Schema.Array(Point)) })),
    }),
  ),
})

const round = (v: number) => Math.round(v * 10) / 10
const inside = (p: LatLon) => p.lat >= BBOX.south && p.lat <= BBOX.north && p.lon >= BBOX.west && p.lon <= BBOX.east
/** One building per line, by id, so a re-run's diff shows what changed. */
const lines = (r: Record<string, number>) =>
  Object.entries(r)
    .toSorted(([a], [b]) => Number(a) - Number(b))
    .map(([id, n]) => `    "${id}": ${n}`)
    .join(",\n")

/** The tile's CityGML, downloaded once. */
const tile = (e: number, n: number) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = `${DIR}/${e}_${n}.gml`
    if (!(yield* fs.exists(path))) {
      const url = lod2TileUrl(e, n)
      yield* Console.log(`Downloading ${url}…`)
      const res = yield* Effect.tryPromise(() => fetch(url, { headers: { "User-Agent": "geretsried-gta-poc" } }))
      if (!res.ok) return yield* new Lod2Error({ url, status: res.status })
      const bytes = new Uint8Array(yield* Effect.tryPromise(() => res.arrayBuffer()))
      yield* fs.writeFile(`${path}.part`, bytes)
      yield* fs.rename(`${path}.part`, path)
    }
    return yield* fs.readFileString(path)
  })

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  yield* fs.makeDirectory(DIR, { recursive: true })
  const projection = makeProjection(BBOX)
  const toMap = (e: number, n: number) => {
    const [x, y] = projection.toMeters(fromUtm32(e, n))
    return [round(x), round(y)] as const
  }

  const tiles = lod2Tiles(BBOX)
  yield* Console.log(`LoD2: ${tiles.length} tiles (cached in ${DIR})`)
  const seen = new Set<string>()
  const lod2: Array<Lod2Building & { readonly tile: string }> = []
  for (const [e, n] of tiles) {
    const parsed = parseCityGml(yield* tile(e, n))
    let added = 0
    for (const b of parsed) {
      if (seen.has(b.id)) continue
      seen.add(b.id)
      lod2.push({ ...moveLod2(b, toMap), tile: `${e}_${n}` })
      added++
    }
    yield* Console.log(`  ${e}_${n}: ${added} buildings`)
  }

  const raw = yield* Schema.decodeUnknownEffect(Schema.fromJsonString(Ways))(yield* fs.readFileString(RAW))
  const ways = raw.elements.flatMap((w) =>
    w.type === "way" && w.tags?.building !== undefined && w.geometry !== undefined && w.geometry.length >= 3 && w.geometry.some(inside)
      ? [{ id: w.id, pts: w.geometry.flatMap((p) => projection.toMeters(p).map(round)) }]
      : [],
  )
  const relations = (yield* Schema.decodeUnknownEffect(Schema.fromJsonString(Relations))(yield* fs.readFileString(BUILDINGS_REL))).elements
  const rels = relationBuildings(relations, new Set(ways.map((w) => w.id)), BBOX).flatMap((r) => (r.status === "new" ? r.buildings : []))

  type Owner = { readonly kind: "ways" | "relations"; readonly id: number; readonly footprint: Footprint }
  const owners: Array<Owner> = [
    ...ways.map((w): Owner => ({ kind: "ways", id: w.id, footprint: { pts: w.pts } })),
    ...rels.map((b): Owner => ({ kind: "relations", id: b.id, footprint: b.holes === undefined ? { pts: b.pts } : { pts: b.pts, holes: b.holes } })),
  ]
  const matches = matchLod2(
    owners.map((o) => o.footprint),
    lod2,
  )
  const out = { ways: {} as Record<string, number>, relations: {} as Record<string, number> }
  const report: Array<Record<string, unknown>> = []
  const by = { overlap: 0, centroid: 0, roofs: 0, none: 0 }
  const histogram = new Map<number, number>()
  owners.forEach((o, i) => {
    const m = matches[i]
    if (m === null || m === undefined) {
      by.none++
      return
    }
    by[m.by]++
    const b = lod2[m.index]
    if (b === undefined) return
    const levels = lod2Levels(m)
    // A relation has one entry for all its outer rings: the first (largest in OSM order) decides.
    if (out[o.kind][o.id] === undefined) out[o.kind][o.id] = levels
    histogram.set(levels, (histogram.get(levels) ?? 0) + 1)
    report.push({ [o.kind === "ways" ? "way" : "relation"]: o.id, lod2: b.id, tile: b.tile, by: m.by, iou: Math.round(m.iou * 100) / 100, roofs: m.roofs, eave: m.eave, flat: m.flat, lowest: b.lowest, height: b.height, roofType: b.roofType, levels })
  })
  yield* fs.writeFileString(OUT, `{\n  "ways": {\n${lines(out.ways)}\n  },\n  "relations": {\n${lines(out.relations)}\n  }\n}\n`)
  yield* fs.writeFileString(MATCHES, JSON.stringify(report))
  yield* Console.log(
    `${lod2.length} LoD2 buildings; ${owners.length} OSM buildings: ${by.overlap} matched by overlap, ${by.centroid} by centroid, ${by.roofs} by roofs, ${by.none} not matched`,
  )
  yield* Console.log(`storeys: ${[...histogram].toSorted(([a], [b]) => a - b).map(([l, n]) => `${l} → ${n}`).join(", ")}`)
  yield* Console.log(`${OUT}: ${Object.keys(out.ways).length} ways, ${Object.keys(out.relations).length} relations`)
})

program.pipe(Effect.provide(NodeServices.layer), NodeRuntime.runMain)
