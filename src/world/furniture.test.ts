import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap } from "#/map/types.ts"
import { furnitureProp, recyclingHolds } from "#/map/build.ts"
import { distToSegmentSq } from "./geometry.ts"
import { placeFurniture, SNAP_M } from "./furniture.ts"
import { makeWorld } from "./world.ts"
import { Scene } from "#/render/scene/scene.ts"

const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
const world = makeWorld(map)
/** As the game places them: clear of the bus shelters, signal poles and lamps too. */
const placed = new Scene(world, { xs: new Uint16Array(0), ys: new Uint16Array(0), rs: new Uint8Array(0) }, []).furniture
const KINDS = ["bench", "bin", "recycling", "bike_rack"] as const
const count = (kind: string, list: ReadonlyArray<{ readonly kind: string }>) => list.filter((p) => p.kind === kind).length

/** The footprint's corners, edge middles and centre. */
const samples = (f: (typeof placed)[number]) => {
  const ux = Math.cos(f.facing + Math.PI / 2)
  const uy = Math.sin(f.facing + Math.PI / 2)
  const out: Array<readonly [number, number]> = []
  for (const a of [-1, 0, 1]) for (const d of [-1, 0, 1]) out.push([f.x + (ux * f.along * a - uy * f.depth * d) / 2, f.y + (uy * f.along * a + ux * f.depth * d) / 2])
  return out
}

const CARRIAGEWAY: ReadonlySet<string> = new Set(["primary", "secondary", "tertiary", "residential", "living_street", "service", "track"])
const onCarriageway = (x: number, y: number) =>
  map.roads.some((r) => {
    if (!CARRIAGEWAY.has(r.kind)) return false
    for (let k = 0; k + 3 < r.pts.length; k += 2) if (distToSegmentSq(x, y, r.pts[k] ?? 0, r.pts[k + 1] ?? 0, r.pts[k + 2] ?? 0, r.pts[k + 3] ?? 0) < (r.width / 2) ** 2) return true
    return false
  })

describe("street furniture (V-11)", () => {
  it("imports OSM's benches, litter bins, recycling points and bike racks as props", () => {
    const osm = Object.fromEntries(KINDS.map((k) => [k, count(k, map.props)]))
    console.log("props from OSM:", osm)
    expect(osm).toEqual({ bench: 166, bin: 80, recycling: 61, bike_rack: 28 })
  })

  it("reads a recycling point's containers from its recycling:* tags, glass as three bottle banks", () => {
    expect(recyclingHolds({ "recycling:glass_bottles": "yes" })).toEqual(["glass", "glass", "glass"])
    expect(recyclingHolds({})).toEqual(["glass", "paper", "cans"])
    expect(recyclingHolds({ "recycling:clothes": "yes", "recycling:shoes": "yes" })).toEqual(["clothes"])
    expect(recyclingHolds({ "recycling:green_waste": "yes" })).toEqual(["green"])
    expect(furnitureProp({ amenity: "recycling", recycling_type: "centre", building: "yes" }, 0, 0)).toBeNull()
    expect(furnitureProp({ amenity: "bicycle_parking", covered: "yes", capacity: "20" }, 1, 2)).toEqual({ kind: "bike_rack", x: 1, y: 2, covered: true, capacity: 20 })
  })

  it("stands nearly every piece on the ground, none in a building, in water or on a carriageway", () => {
    const got = Object.fromEntries(KINDS.map((k) => [k, count(k, placed)]))
    console.log("placed:", got)
    for (const k of KINDS) expect(count(k, placed)).toBeGreaterThanOrEqual(Math.floor(count(k, map.props) * 0.9))
    const wrong = placed.flatMap((f) => samples(f).flatMap(([x, y]) => (world.isSolid(x, y) || world.isWater(x, y) || onCarriageway(x, y) ? [`${f.kind} at ${x.toFixed(1)}, ${y.toFixed(1)}`] : [])))
    expect(wrong).toEqual([])
  })

  it("snaps to a path's edge and faces it: most pieces within SNAP_M of their OSM spot", () => {
    const moved = placed.map((f) => Math.min(...map.props.filter((p) => p.kind === f.kind).map((p) => Math.hypot(p.x - f.x, p.y - f.y))))
    const sorted = moved.toSorted((a, b) => a - b)
    console.log(`moved: median ${sorted[sorted.length >> 1]?.toFixed(1)} m, max ${sorted.at(-1)?.toFixed(1)} m`)
    expect(sorted.at(-1) ?? 0).toBeLessThanOrEqual(SNAP_M + 6)
  })

  it("is the same every game", () => {
    expect(placeFurniture(world)).toEqual(placeFurniture(world))
  })
})
