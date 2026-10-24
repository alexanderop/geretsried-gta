import { describe, expect, it } from "vitest"
import { buildMap, polygonArea, type OsmWay } from "./build.ts"
import { makeProjection } from "./project.ts"

const bbox = { south: 47.85, west: 11.45, north: 47.86, east: 11.47 }

const way = (id: number, tags: Record<string, string>, coords: Array<[number, number]>): OsmWay => ({
  id,
  nodes: coords.map((_, i) => id * 100 + i),
  geometry: coords.map(([lat, lon]) => ({ lat, lon })),
  tags,
})

describe("makeProjection", () => {
  it("puts the north-west corner at the origin and measures about 1.1 km per 0.01° latitude", () => {
    const p = makeProjection(bbox)
    expect(p.toMeters({ lat: bbox.north, lon: bbox.west })).toEqual([0, 0])
    expect(p.height).toBeCloseTo(1112, -1)
    // 0.02° of longitude at 47.85° N is about 1.5 km.
    expect(p.width).toBeCloseTo(1494, -1)
  })
})

describe("buildMap", () => {
  const ways = [
    way(1, { highway: "residential", name: "Egerlandstraße" }, [[47.855, 11.455], [47.855, 11.46]]),
    way(2, { building: "yes", "building:levels": "4" }, [[47.856, 11.456], [47.856, 11.457], [47.857, 11.457], [47.856, 11.456]]),
    way(3, { highway: "footway" }, [[47.851, 11.451], [47.852, 11.452]]),
    way(4, { highway: "residential" }, [[48.5, 11.0], [48.6, 11.1]]),
    way(5, { landuse: "forest" }, [[47.851, 11.451], [47.851, 11.46], [47.859, 11.46]]),
    way(6, { natural: "water" }, [[47.852, 11.452], [47.852, 11.453], [47.853, 11.453]]),
  ]
  const map = buildMap(ways, bbox)

  it("keeps roads with name, kind and node ids", () => {
    expect(map.roads.map((r) => [r.name, r.kind])).toEqual([
      ["Egerlandstraße", "residential"],
      ["", "footway"],
    ])
    expect(map.roads[0]?.nodes).toEqual([100, 101])
  })

  it("drops features entirely outside the bbox", () => {
    expect(map.roads).toHaveLength(2)
  })

  it("reads building levels", () => {
    expect(map.buildings[0]?.levels).toBe(4)
  })

  it("sorts areas largest first so ponds paint over forests", () => {
    expect(map.areas.map((a) => a.kind)).toEqual(["forest", "water"])
    expect(polygonArea(map.areas[0]?.pts ?? [])).toBeGreaterThan(polygonArea(map.areas[1]?.pts ?? []))
  })
})
