import { describe, expect, it } from "vitest"
import { buildMap, buildingLevels, joinRings, poiKind, polygonArea, relationBuildings, type OsmPlace, type OsmRelation, type OsmWay } from "./build.ts"
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

  it("turns meters back into the same lat/lon", () => {
    const p = makeProjection(bbox)
    const back = p.toLatLon(...p.toMeters({ lat: 47.8573, lon: 11.4879 }))
    expect(back.lat).toBeCloseTo(47.8573, 9)
    expect(back.lon).toBeCloseTo(11.4879, 9)
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
  const places: Array<OsmPlace> = [
    { id: 900, lat: 47.855, lon: 11.457, tags: { shop: "supermarket", brand: "EDEKA", name: "EDEKA Mustermann" } },
    { id: 901, lat: 47.855, lon: 11.458, tags: { shop: "vacant", name: "Leer" } },
    { id: 902, lat: 47.855, lon: 11.459, tags: { highway: "traffic_signals", "traffic_signals:direction": "forward" } },
  ]
  const map = buildMap(ways, places, bbox)

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

  it("keeps named places by brand and skips vacant shops", () => {
    expect(map.pois.map((p) => [p.name, p.kind])).toEqual([["EDEKA", "supermarket"]])
  })

  it("keeps traffic lights with their direction", () => {
    expect(map.signals.map((s) => [s.node, s.direction])).toEqual([[902, "forward"]])
  })

  it("reads building levels", () => {
    expect(map.buildings[0]?.levels).toBe(4)
  })

  it("sorts areas largest first so ponds paint over forests", () => {
    expect(map.areas.map((a) => a.kind)).toEqual(["forest", "water"])
    expect(polygonArea(map.areas[0]?.pts ?? [])).toBeGreaterThan(polygonArea(map.areas[1]?.pts ?? []))
  })
})

describe("buildingLevels", () => {
  it("takes OSM's storeys, else what the building type usually has", () => {
    expect(buildingLevels({ building: "garage", "building:levels": "3" })).toBe(3)
    expect(buildingLevels({ building: "garages" })).toBe(1)
    expect(buildingLevels({ building: "apartments" })).toBe(4)
    expect(buildingLevels({ building: "yes" })).toBe(2)
  })
})

describe("poiKind", () => {
  it("keeps every older kind and sorts the newer places into gym, health, kindergarten, care_home, bar, parcel_locker, office", () => {
    expect(poiKind({ amenity: "pub" })).toBe("food")
    expect(poiKind({ amenity: "doctors", healthcare: "doctor" })).toBe("doctor")
    expect(poiKind({ amenity: "pharmacy", healthcare: "pharmacy" })).toBe("pharmacy")
    expect(poiKind({ shop: "hairdresser" })).toBe("shop")
    expect(poiKind({ leisure: "fitness_centre" })).toBe("gym")
    expect(poiKind({ amenity: "dojo" })).toBe("gym")
    expect(poiKind({ leisure: "sports_centre", sport: "fitness" })).toBe("gym")
    // Pools, stadiums and tennis are not gyms but sports venues; school gyms are neither.
    expect(poiKind({ leisure: "sports_centre", sport: "swimming" })).toBe("sport")
    expect(poiKind({ leisure: "sports_centre" })).toBe("sport")
    expect(poiKind({ leisure: "stadium", sport: "multi" })).toBe("sport")
    expect(poiKind({ leisure: "sports_centre", sport: "multi", name: "Turnhalle Gymnasium" })).toBeNull()
    expect(poiKind({ leisure: "sports_centre", building: "sports_hall" })).toBeNull()
    expect(poiKind({ amenity: "college" })).toBe("school")
    expect(poiKind({ amenity: "driving_school" })).toBe("office")
    expect(poiKind({ amenity: "arts_centre" })).toBe("civic")
    expect(poiKind({ amenity: "dentist", healthcare: "dentist" })).toBe("health")
    expect(poiKind({ amenity: "veterinary" })).toBe("health")
    expect(poiKind({ healthcare: "physiotherapist" })).toBe("health")
    expect(poiKind({ amenity: "kindergarten" })).toBe("kindergarten")
    expect(poiKind({ amenity: "childcare" })).toBe("kindergarten")
    expect(poiKind({ amenity: "social_facility" })).toBe("care_home")
    expect(poiKind({ amenity: "nightclub" })).toBe("bar")
    expect(poiKind({ amenity: "parcel_locker" })).toBe("parcel_locker")
    expect(poiKind({ office: "lawyer" })).toBe("office")
    expect(poiKind({ craft: "roofer" })).toBe("office")
    expect(poiKind({ shop: "bakery", craft: "bakery" })).toBe("bakery")
    expect(poiKind({ leisure: "playground" })).toBeNull()
  })
})

describe("buildMap, the newer sources", () => {
  const projection = makeProjection(bbox)
  const places: Array<OsmPlace> = [
    { id: 1, lat: 47.855, lon: 11.457, tags: { amenity: "pub", name: "Fitness Forum" } },
    { id: 2, lat: 47.855, lon: 11.458, tags: { amenity: "restaurant", name: "Zur Post" } },
  ]
  const more: Array<OsmPlace> = [
    // The gym's building way, 15 m from the pub node inside it: one POI, the gym.
    { id: 3, lat: 47.855, lon: 11.4572, tags: { leisure: "fitness_centre", name: "Fitness Forum" } },
    { id: 4, lat: 47.856, lon: 11.457, tags: { amenity: "kindergarten", name: "Kita" } },
    { id: 5, lat: 47.856, lon: 11.458, tags: { leisure: "fitness_centre" } },
  ]
  const map = buildMap([], places, bbox, [], { places: more, extraPois: [{ name: "Yoga", kind: "gym", lat: 47.857, lon: 11.457 }] })

  it("adds them after the older POIs, a twin of an older one only once, with the kind that is not food", () => {
    expect(map.pois.map((p) => [p.name, p.kind])).toEqual([
      ["Fitness Forum", "gym"],
      ["Zur Post", "food"],
      ["Kita", "kindergarten"],
      ["Yoga", "gym"],
    ])
    // The older POI keeps its place.
    const [x, y] = projection.toMeters({ lat: 47.855, lon: 11.457 })
    expect(map.pois[0]?.x).toBeCloseTo(x, 0)
    expect(map.pois[0]?.y).toBeCloseTo(y, 0)
  })
})

describe("buildMap, the next step's places", () => {
  const more: Array<OsmPlace> = [
    { id: 1, lat: 47.855, lon: 11.457, tags: { amenity: "kindergarten", name: "Champini Sport- & Bewegungskita" } },
    { id: 2, lat: 47.856, lon: 11.457, tags: { leisure: "sports_centre", sport: "swimming", name: "Hallenbad" } },
    // The Kita's grounds, 8 m away under the short name: the same place.
    { id: 3, lat: 47.85505, lon: 11.45705, tags: { amenity: "kindergarten", name: "Champini" } },
    { id: 4, lat: 47.857, lon: 11.457, tags: { amenity: "kindergarten", name: "Kita" } },
  ]
  const map = buildMap([], [], bbox, [], {
    places: more,
    extraPois: [{ name: "Yoga", kind: "gym", lat: 47.857, lon: 11.458 }],
    next: { places: [{ id: 5, lat: 47.858, lon: 11.457, tags: { amenity: "driving_school", name: "Fahrschule" } }], extraPois: [{ name: "Café Bar DUO", kind: "bar", lat: 47.858, lon: 11.459 }] },
  })

  it("come after every older POI, the sports venues of the older query with them; twins by name prefix stay one POI with the longer name", () => {
    expect(map.pois.map((p) => [p.name, p.kind])).toEqual([
      ["Champini Sport- & Bewegungskita", "kindergarten"],
      ["Kita", "kindergarten"],
      ["Yoga", "gym"],
      ["Hallenbad", "sport"],
      ["Fahrschule", "office"],
      ["Café Bar DUO", "bar"],
    ])
  })
})

const ring = (coords: Array<[number, number]>) => coords.map(([lat, lon]) => ({ lat, lon }))

const square = (lat: number, lon: number): Array<[number, number]> => [[lat, lon], [lat, lon + 0.001], [lat + 0.001, lon + 0.001], [lat + 0.001, lon], [lat, lon]]

describe("leisure areas", () => {
  const ways = [
    way(1, { leisure: "playground" }, square(47.851, 11.451)),
    way(2, { leisure: "playground", surface: "paved" }, square(47.853, 11.451)),
    // Lanes: a track way without area=yes is a line.
    way(3, { leisure: "track", surface: "asphalt" }, [[47.855, 11.451], [47.855, 11.452]]),
    way(4, { leisure: "track", area: "yes", athletics: "long_jump" }, square(47.857, 11.451)),
    way(5, { leisure: "fitness_station" }, square(47.851, 11.461)),
  ]
  const outer = ring(square(47.851, 11.455))
  const infield = ring([[47.8513, 11.4553], [47.8513, 11.4557], [47.8517, 11.4557], [47.8517, 11.4553], [47.8513, 11.4553]])
  const stadium: OsmRelation = {
    id: 9,
    tags: { type: "multipolygon", leisure: "track", surface: "tartan" },
    members: [
      { type: "way", ref: 20, role: "outer", geometry: outer },
      { type: "way", ref: 21, role: "inner", geometry: infield },
    ],
  }
  const asked: Array<[number, number]> = []
  const map = buildMap([], [], bbox, [], {
    leisureAreas: { ways, relations: [stadium] },
    groundTint: (id, _pts, holes) => {
      asked.push([id, holes.length])
      return "#7f6a50"
    },
  })
  const byKind = (kind: string) => map.areas.filter((a) => a.kind === kind)

  it("become playground, track and pitch areas; a lined track keeps its line and a lane width", () => {
    expect(byKind("playground")).toHaveLength(2)
    expect(byKind("track")).toHaveLength(3)
    expect(byKind("pitch")).toHaveLength(1)
    const lane = byKind("track").find((a) => a.width !== undefined)
    expect(lane?.width).toBe(4)
    expect(lane?.pts).toHaveLength(4)
  })

  it("take their colour from the photo unless the surface is paved; a ring's infield is left out of the sample", () => {
    expect(asked).toEqual([[1, 0], [4, 0], [9, 1]])
    expect(byKind("playground").map((a) => a.tint ?? null).toSorted()).toEqual(["#7f6a50", null])
    expect(byKind("pitch")[0]?.tint).toBeUndefined()
  })
})

describe("building relations", () => {
  const outer = ring([[47.855, 11.455], [47.855, 11.457], [47.856, 11.457], [47.856, 11.455], [47.855, 11.455]])
  const court = ring([[47.8553, 11.4555], [47.8553, 11.4565], [47.8557, 11.4565], [47.8557, 11.4555], [47.8553, 11.4555]])
  const school: OsmRelation = {
    id: 77,
    tags: { type: "multipolygon", building: "school", name: "Schule" },
    members: [
      // The outline split over two ways, as OSM may map it.
      { type: "way", ref: 10, role: "outer", geometry: outer.slice(0, 3) },
      { type: "way", ref: 11, role: "outer", geometry: outer.slice(2).toReversed() },
      { type: "way", ref: 12, role: "inner", geometry: court },
    ],
  }

  it("joins ways into closed rings", () => {
    expect(joinRings([outer.slice(0, 3), outer.slice(2).toReversed()])).toHaveLength(1)
    expect(joinRings([outer.slice(0, 3)])).toHaveLength(0)
  })

  it("become buildings with their courtyards as holes, after the way buildings", () => {
    const house = way(2, { building: "yes" }, [[47.858, 11.46], [47.858, 11.461], [47.859, 11.461], [47.858, 11.46]])
    const map = buildMap([house], [], bbox, [], { buildingRelations: [school] })
    expect(map.buildings.map((b) => b.id)).toEqual([2, 77])
    const b = map.buildings[1]
    expect(b?.holes).toHaveLength(1)
    expect(polygonArea(b?.pts ?? [])).toBeGreaterThan(polygonArea(b?.holes?.[0] ?? []))
  })

  it("are skipped when their outline is a way building already", () => {
    const rels = relationBuildings([school], new Set([10]), bbox)
    expect(rels.map((r) => r.status)).toEqual(["duplicate"])
    expect(buildMap([way(10, { building: "yes" }, outer.map((p) => [p.lat, p.lon]))], [], bbox, [], { buildingRelations: [school] }).buildings.map((b) => b.id)).toEqual([10])
  })
})
