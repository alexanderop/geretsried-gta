/**
 * Builds public/geretsried.map.json from OpenStreetMap.
 *   pnpm map        reuse data/raw.json
 *   pnpm map:fetch  download a fresh copy from Overpass first
 * Data © OpenStreetMap contributors, ODbL.
 */
import { Console, Effect, FileSystem, Schema } from "effect"
import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { buildMap } from "../src/map/build.ts"
import type { Bbox } from "../src/map/project.ts"

const RAW = "data/raw.json"
const OUT = "public/geretsried.map.json"
const OVERPASS = "https://overpass-api.de/api/interpreter"

/** Geretsried town, Gelting and the Isar on the west edge. */
const BBOX: Bbox = { south: 47.845, west: 11.43, north: 47.9, east: 11.505 }

const QUERY = `[out:json][timeout:120];
(
  way["highway"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["building"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["waterway"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["natural"~"water|wood"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["landuse"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["leisure"~"park|pitch"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["amenity"="parking"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
);
out geom;`

const OverpassResponse = Schema.Struct({
  elements: Schema.Array(
    Schema.Struct({
      type: Schema.String,
      id: Schema.Number,
      nodes: Schema.Array(Schema.Number),
      geometry: Schema.Array(Schema.Struct({ lat: Schema.Number, lon: Schema.Number })),
      tags: Schema.Record(Schema.String, Schema.String),
    }),
  ),
})

class OverpassError extends Schema.TaggedError<OverpassError>()("OverpassError", {
  status: Schema.Number,
}) {}

const download = Effect.gen(function* () {
  yield* Console.log("Downloading Geretsried from Overpass…")
  const res = yield* Effect.tryPromise(() =>
    fetch(OVERPASS, {
      method: "POST",
      headers: { "User-Agent": "geretsried-gta-poc" },
      body: new URLSearchParams({ data: QUERY }),
    }),
  )
  if (!res.ok) return yield* new OverpassError({ status: res.status })
  return yield* Effect.tryPromise(() => res.text())
})

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const fetchFresh = process.argv.includes("--fetch") || !(yield* fs.exists(RAW))
  if (fetchFresh) {
    yield* fs.makeDirectory("data", { recursive: true })
    yield* fs.writeFileString(RAW, yield* download)
  }
  const raw = yield* Schema.decodeUnknownEffect(Schema.fromJsonString(OverpassResponse))(yield* fs.readFileString(RAW))
  const ways = raw.elements.filter((e) => e.type === "way")
  const map = buildMap(ways, BBOX)
  yield* fs.writeFileString(OUT, JSON.stringify(map))
  const size = (yield* fs.stat(OUT)).size
  yield* Console.log(
    `${OUT}: ${Math.round(map.width)}×${Math.round(map.height)} m, ${map.roads.length} roads, ` +
      `${map.buildings.length} buildings, ${map.areas.length} areas, ${map.waterways.length} waterways, ` +
      `${(Number(size) / 1e6).toFixed(1)} MB`,
  )
})

program.pipe(Effect.provide(NodeServices.layer), NodeRuntime.runMain)
