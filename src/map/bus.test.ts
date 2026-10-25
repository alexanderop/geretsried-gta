import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap, type BusRun, type Road } from "./types.ts"
import { buildBusLines, busGraph, chainWays, pickRuns, pieces, placeStops, type OsmElement } from "./bus.ts"
import { makeProjection } from "./project.ts"

/** A straight street of nodes `ids` at the given points, [x0, y0, x1, y1, ...]. */
const road = (nodes: Array<number>, pts: Array<number>, oneway = false): Road => ({ kind: "residential", name: "", width: 6.5, oneway, pts, nodes })

describe("chainWays", () => {
  it("joins a route's ways in member order, turning each to start where the last ended", () => {
    expect(chainWays([[1, 2, 3], [5, 4, 3], [5, 6]])).toEqual([[1, 2, 3, 4, 5, 6]])
  })

  it("turns the first way round when only its start touches the next", () => {
    expect(chainWays([[3, 2, 1], [3, 4]])).toEqual([[1, 2, 3, 4]])
  })

  it("drives round a roundabout from where the route enters to where the next way leaves it", () => {
    // The ring 10 → 11 → 12 → 13 → 10: in at 11, out at 13.
    expect(chainWays([[1, 11], [10, 11, 12, 13, 10], [13, 2]])).toEqual([[1, 11, 12, 13, 2]])
  })

  it("starts a new chain at a gap", () => {
    expect(chainWays([[1, 2], [7, 8]])).toEqual([[1, 2], [7, 8]])
  })
})

describe("pieces", () => {
  // 1-2-3 along y = 0, then 3-4-5 on to the east; a one-way 6 → 7 beside them.
  const roads = [road([1, 2, 3], [0, 50, 100, 50, 200, 50]), road([3, 4, 5], [200, 50, 300, 50, 400, 50]), road([6, 7], [0, 80, 100, 80], true)]
  const graph = busGraph(roads)

  it("bridges a node OSM left out by the shortest way along the streets", () => {
    expect(pieces([1, 2, 3, 5], graph, 1000, 1000)).toEqual([[1, 2, 3, 4, 5]])
  })

  it("cuts the route where it leaves the map", () => {
    expect(pieces([1, 2, 3, 4, 5], graph, 250, 1000)).toEqual([[1, 2, 3]])
  })

  it("does not bridge against a one-way street", () => {
    expect(pieces([7, 6], graph, 1000, 1000)).toEqual([[7, 6]])
    expect(pieces([7, 2], graph, 1000, 1000)).toEqual([])
  })
})

describe("placeStops", () => {
  // Out east along y = 0 and back along y = 10.
  const pts = [0, 0, 100, 0, 100, 10, 0, 10]

  it("puts each stop on the path in order, as a segment and meters into it", () => {
    expect(placeStops(pts, [{ name: "A", x: 30, y: -4 }, { name: "B", x: 60, y: 14 }])).toEqual([
      { name: "A", x: 30, y: -4, at: 0, s: 30 },
      { name: "B", x: 60, y: 14, at: 2, s: 40 },
    ])
  })

  it("halts at a stop again when the path comes back past it, and skips platforms far off", () => {
    const stops = placeStops(pts, [{ name: "A", x: 50, y: 5 }, { name: "far", x: 50, y: 200 }, { name: "A", x: 50, y: 5 }])
    expect(stops.map((s) => [s.name, s.at])).toEqual([["A", 0], ["A", 2]])
  })

  it("takes the first pass by a platform, not a nearer one on the way back, so the stops after it are kept", () => {
    const stops = placeStops(pts, [{ name: "A", x: 20, y: 6 }, { name: "B", x: 90, y: -3 }])
    expect(stops.map((s) => [s.name, s.at])).toEqual([["A", 0], ["B", 0]])
  })
})

/** A candidate run for pickRuns: where it goes, its path, how many stops and how many "=>" its relation has. */
const candidate = (to: string, pts: Array<number>, stops: number, vias: number): BusRun & { vias: number } => ({
  to,
  nodes: [],
  pts,
  stops: Array.from({ length: stops }, (_, i) => ({ name: `S${i}`, x: 0, y: 0, at: 0, s: 0 })),
  vias,
})

describe("pickRuns", () => {
  it("drives the line's plain pattern (not the longer variant with more stops) and the run that comes back", () => {
    const there = candidate("Stein", [0, 0, 1000, 0], 5, 2)
    const variant = candidate("Königsdorf", [0, 0, 1200, 0], 8, 3)
    const back = candidate("Wolfratshausen", [1000, 0, 0, 0], 5, 2)
    expect(pickRuns([variant, back, there]).map((r) => r.to)).toEqual(["Wolfratshausen", "Stein"])
  })
})

describe("buildBusLines", () => {
  const bbox = { south: 47.85, west: 11.45, north: 47.86, east: 11.47 }
  const p = makeProjection(bbox)
  const node = (id: number, x: number, y: number, tags?: Record<string, string>): OsmElement => {
    const { lat, lon } = p.toLatLon(x, y)
    return tags === undefined ? { type: "node", id, lat, lon } : { type: "node", id, lat, lon, tags }
  }
  const roads = [road([1, 2, 3, 4], [100, 500, 400, 500, 700, 500, 1000, 500])]
  const elements: Array<OsmElement> = [
    node(1, 100, 500), node(2, 400, 500), node(3, 700, 500), node(4, 1000, 500),
    node(90, 300, 508, { name: "Geretsried, Sudetenstraße" }), node(91, 800, 508, { name: "Geretsried, Stein" }),
    { type: "way", id: 10, nodes: [1, 2] }, { type: "way", id: 11, nodes: [3, 2] }, { type: "way", id: 12, nodes: [3, 4] },
    {
      type: "relation",
      id: 370,
      tags: { type: "route", route: "bus", ref: "370", name: "Bus 370: Wolfratshausen (S) => Geretsried, Stein", to: "Geretsried, Stein", operator: "Regionalverkehr Oberbayern" },
      members: [
        { type: "node", ref: 90, role: "platform" }, { type: "node", ref: 91, role: "platform" },
        { type: "way", ref: 10, role: "" }, { type: "way", ref: 11, role: "" }, { type: "way", ref: 12, role: "" },
      ],
    },
  ]

  it("turns a route=bus relation into a line on the street graph with its stops in order", () => {
    const [line] = buildBusLines(elements, roads, bbox)
    expect(line?.ref).toBe("370")
    expect(line?.operator).toBe("Regionalverkehr Oberbayern")
    expect(line?.runs[0]?.nodes).toEqual([1, 2, 3, 4])
    expect(line?.runs[0]?.stops.map((s) => [s.name, s.at])).toEqual([["Geretsried, Sudetenstraße", 0], ["Geretsried, Stein", 2]])
  })
})

describe("the bus lines of the Geretsried map", () => {
  const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
  const names = (ref: string) => map.buses.find((l) => l.ref === ref)?.runs.map((r) => r.stops.map((s) => s.name.replace("Geretsried, ", ""))) ?? []

  it("has the RVO's 370 from Wolfratshausen via Fasanenweg and the Feuerwehrschule to Stein, and back", () => {
    const line = map.buses.find((l) => l.ref === "370")
    expect(line?.operator).toBe("Regionalverkehr Oberbayern")
    const [there, back] = names("370")
    for (const stop of ["Fasanenweg", "Sudetenstraße", "Feuerwehrschule", "Stein"]) expect(there).toContain(stop)
    expect(there?.indexOf("Fasanenweg")).toBeLessThan(there?.indexOf("Feuerwehrschule") ?? 0)
    expect(back?.[0]).toBe("Stein")
  })

  it("keeps the 371 a line of its own, ending at the Schulzentrum", () => {
    const line = map.buses.find((l) => l.ref === "371")
    expect(line?.runs.some((r) => r.to === "Geretsried, Schulzentrum")).toBe(true)
    expect(line?.runs.map((r) => r.nodes)).not.toEqual(map.buses.find((l) => l.ref === "370")?.runs.map((r) => r.nodes))
  })

  it("has every line in the box, each run a walk along its streets", () => {
    expect(map.buses.length).toBeGreaterThanOrEqual(12)
    const graph = busGraph(map.roads)
    for (const run of map.buses.flatMap((l) => l.runs)) {
      for (let i = 0; i + 1 < run.nodes.length; i++) expect(graph.joined(run.nodes[i] ?? 0, run.nodes[i + 1] ?? 0)).toBe(true)
    }
  })
})
