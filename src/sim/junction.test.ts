import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap, type Road, type RoadKind } from "#/map/types.ts"
import { makeWorld } from "#/world/world.ts"
import { CAR_WIDTH } from "./car.ts"
import { vitals } from "./damage.ts"
import { DT, newGame, step, type Input } from "./game.ts"
import { DEADLOCK_S, giveWay, junctionRules } from "./junction.ts"
import { makeRandom } from "./random.ts"
import { makeSignals } from "./signals.ts"
import { stepNpc, type Npc, type Segment } from "./traffic.ts"
import { BUS_MODEL, vehicleLength } from "./vehicles.ts"

/** Node 99 is the junction at (300, 300). */
const JUNCTION = { x: 300, y: 300 }
const road = (kind: RoadKind, pts: ReadonlyArray<number>, nodes: ReadonlyArray<number>): Road => ({ kind, name: kind, width: 8, oneway: false, pts, nodes })
/** A crossroads: an east–west road of `ew` class and a north–south one of `ns` class, 200 m each way. */
const crossroads = (ew: RoadKind, ns: RoadKind) => {
  const map: GameMap = {
    width: 600,
    height: 600,
    bbox: { south: 47.85, west: 11.48, north: 47.86, east: 11.49 },
    roads: [road(ew, [100, 300, 300, 300, 500, 300], [1, 99, 2]), road(ns, [300, 100, 300, 300, 300, 500], [3, 99, 4])],
    buildings: [],
    areas: [],
    waterways: [],
    pois: [],
    signals: [],
    crossings: [],
    props: [],
    districts: [],
    covered: [],
    buses: [],
  }
  const world = makeWorld(map, [], [])
  return { world, signals: makeSignals(world) }
}

/** Driving into the junction from each side, and out of it on each side. */
const IN: Readonly<Record<"west" | "east" | "north" | "south", Segment>> = {
  west: { road: 0, from: 0, dir: 1 },
  east: { road: 0, from: 2, dir: -1 },
  north: { road: 1, from: 0, dir: 1 },
  south: { road: 1, from: 2, dir: -1 },
}
const OUT: Readonly<Record<"west" | "east" | "north" | "south", Segment>> = {
  west: { road: 0, from: 1, dir: -1 },
  east: { road: 0, from: 1, dir: 1 },
  north: { road: 1, from: 1, dir: -1 },
  south: { road: 1, from: 1, dir: 1 },
}

/** A car `toNode` meters before the junction, coming from `from` and leaving toward `to`, at `speed`. */
const car = (id: number, from: keyof typeof IN, to: keyof typeof OUT, toNode: number, speed: number): Npc => ({
  id,
  ...IN[from],
  s: 200 - toNode,
  speed,
  x: 0,
  y: 0,
  angle: 0,
  prev: null,
  route: [OUT[to]],
  model: 0,
  vitals: vitals(100),
  mode: { kind: "driving" },
  give: null,
})

/** Drive the cars by the give-way rules alone (no car sees another in front), recording each step. */
const drive = (town: ReturnType<typeof crossroads>, cars: ReadonlyArray<Npc>, seconds: number, each: (t: number) => void) => {
  const { world, signals } = town
  const random = makeRandom(1)
  for (let t = 0; t < seconds / DT; t++) {
    const holds = giveWay(world, signals, cars, DT)
    for (const npc of cars) {
      const hold = holds.get(npc)
      stepNpc(world, signals, t * DT, npc, null, DT, random, hold?.slowTo, hold?.holdAt)
    }
    each(t * DT)
  }
}

const dist = (a: { readonly x: number; readonly y: number }, b: { readonly x: number; readonly y: number }) => Math.hypot(a.x - b.x, a.y - b.y)
/** Has the car driven through the junction (it is on its way out, past the box)? */
const through = (npc: Npc) => npc.prev !== null && npc.s > 15
const closest = (cars: ReadonlyArray<Npc>) => {
  let best = Infinity
  for (let i = 0; i < cars.length; i++) for (let k = i + 1; k < cars.length; k++) best = Math.min(best, dist(cars[i] ?? JUNCTION, cars[k] ?? JUNCTION))
  return best
}

describe("unsignalled junctions", () => {
  it("are found once per world: the crossroads, with its four arms", () => {
    const { world, signals } = crossroads("tertiary", "residential")
    const rules = junctionRules(world, signals)
    expect([...rules.keys()]).toEqual([99])
    expect(rules.get(99)?.arms.length).toBe(4)
    expect(junctionRules(world, signals)).toBe(rules)
  })

  it("a car on the minor road waits at its give-way line while one on the major road passes, then goes", () => {
    const town = crossroads("tertiary", "residential")
    // Both would be at the junction after about four seconds.
    const major = car(1, "west", "east", 50, 11)
    const minor = car(2, "south", "north", 28, 8)
    let waited = false
    let majorSlowest = Infinity
    let minorOrder = 0
    let near = Infinity
    drive(town, [major, minor], 20, () => {
      waited ||= minor.give?.waiting === true
      if (!through(major)) majorSlowest = Math.min(majorSlowest, major.speed)
      // The minor car stays south of the major road until the major car is over the junction.
      if (major.x < JUNCTION.x + 4) minorOrder = Math.min(minorOrder, minor.y - (JUNCTION.y + 4))
      near = Math.min(near, dist(major, minor))
    })
    expect(waited).toBe(true)
    expect(majorSlowest).toBeGreaterThan(10)
    expect(minorOrder).toBeGreaterThanOrEqual(0)
    expect(near).toBeGreaterThan(5)
    expect(through(minor)).toBe(true)
  })

  it("keeps the major-road car at speed: the minor-road car there first waits, as the major one is under three seconds away", () => {
    const town = crossroads("secondary", "residential")
    const major = car(1, "east", "west", 30, 13)
    const minor = car(2, "north", "south", 10, 4)
    let held = 0
    let waited = false
    let near = Infinity
    drive(town, [major, minor], 12, () => {
      if (major.give?.waiting === true || major.speed < 12) held++
      waited ||= minor.give?.waiting === true
      near = Math.min(near, dist(major, minor))
    })
    expect(held).toBe(0)
    expect(waited).toBe(true)
    expect(near).toBeGreaterThan(5)
    expect(through(major)).toBe(true)
    expect(through(minor)).toBe(true)
  })

  it("holds a bus to the same rule: on the minor road it waits, its nose behind the line", () => {
    const town = crossroads("tertiary", "residential")
    const major = car(1, "west", "east", 50, 11)
    const bus = { ...car(2, "south", "north", 28, 8), model: BUS_MODEL }
    let waited = false
    let nose = Infinity
    drive(town, [major, bus], 20, () => {
      waited ||= bus.give?.waiting === true
      if (major.x < JUNCTION.x + 4) nose = Math.min(nose, bus.y - vehicleLength(BUS_MODEL) / 2 - JUNCTION.y)
    })
    expect(waited).toBe(true)
    // The give-way line lies half the crossed road (8 m) and a meter before the node.
    expect(nose).toBeGreaterThan(4.5)
    expect(through(bus)).toBe(true)
  })

  // y points south and angle 0 is east, so driving north your right is east.
  for (const [right, left] of [
    ["east", "south"],
    ["south", "west"],
    ["west", "north"],
    ["north", "east"],
  ] as const) {
    it(`on equal roads gives way to the right: the car from the ${left} waits for the one from the ${right}`, () => {
      const town = crossroads("residential", "residential")
      const opposite = { east: "west", west: "east", north: "south", south: "north" } as const
      const first = car(1, right, opposite[right], 25, 6)
      const second = car(2, left, opposite[left], 25, 6)
      let waited = { first: false, second: false }
      let firstOut = Infinity
      let secondOut = Infinity
      drive(town, [first, second], 20, (t) => {
        waited = { first: waited.first || first.give?.waiting === true, second: waited.second || second.give?.waiting === true }
        if (through(first)) firstOut = Math.min(firstOut, t)
        if (through(second)) secondOut = Math.min(secondOut, t)
      })
      expect(waited).toEqual({ first: false, second: true })
      expect(firstOut).toBeLessThan(secondOut)
      expect(secondOut).toBeLessThan(20)
    })
  }

  it("a car turning left waits at its line for the oncoming car going straight on", () => {
    const town = crossroads("residential", "residential")
    // Standing at its line, with the oncoming car under three seconds away.
    const turning = car(1, "south", "west", 8, 0)
    const oncoming = car(2, "north", "south", 16, 6)
    let waited = false
    let turningOut = Infinity
    let oncomingOut = Infinity
    let near = Infinity
    drive(town, [turning, oncoming], 20, (t) => {
      waited ||= turning.give?.waiting === true
      near = Math.min(near, dist(turning, oncoming))
      if (through(turning)) turningOut = Math.min(turningOut, t)
      if (through(oncoming)) oncomingOut = Math.min(oncomingOut, t)
    })
    expect(waited).toBe(true)
    expect(oncoming.give?.waiting).not.toBe(true)
    expect(near).toBeGreaterThan(CAR_WIDTH + 1)
    expect(oncomingOut).toBeLessThan(turningOut)
    expect(turningOut).toBeLessThan(20)
  })

  it("four cars on four equal arms do not lock: all get through, one at a time where their ways cross", () => {
    const town = crossroads("residential", "residential")
    const cars = [car(1, "west", "east", 20, 0), car(2, "north", "south", 20, 0), car(3, "east", "west", 20, 0), car(4, "south", "north", 20, 0)]
    let nearest = Infinity
    let allOut = Infinity
    drive(town, cars, 40, (t) => {
      nearest = Math.min(nearest, closest(cars))
      if (allOut === Infinity && cars.every(through)) allOut = t
    })
    // Everyone has someone on the right: they wait DEADLOCK_S, then the lowest id goes.
    expect(allOut).toBeGreaterThan(DEADLOCK_S)
    expect(allOut).toBeLessThan(25)
    expect(nearest).toBeGreaterThan(CAR_WIDTH + 1)
  })
})

describe("Geretsried traffic at junctions without lights", () => {
  const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
  const world = makeWorld(map)
  const idle: Input = { up: false, down: false, left: false, right: false, handbrake: false, sprint: false, use: false, attack: false, cycle: 0 }

  type Body = { readonly x: number; readonly y: number; readonly angle: number; readonly model: number }
  const corners = (c: Body) => {
    const l = vehicleLength(c.model) / 2
    const w = (c.model === BUS_MODEL ? 2.5 : CAR_WIDTH) / 2
    const cos = Math.cos(c.angle)
    const sin = Math.sin(c.angle)
    return [l, w, l, -w, -l, -w, -l, w].flatMap((v, i, all) => (i % 2 === 1 ? [] : [c.x + cos * v - sin * (all[i + 1] ?? 0), c.y + sin * v + cos * (all[i + 1] ?? 0)]))
  }
  /** Do two vehicles' outlines overlap (separating axis test on the two rectangles)? */
  const overlap = (a: Body, b: Body) => {
    const pa = corners(a)
    const pb = corners(b)
    for (const poly of [pa, pb]) {
      for (let i = 0; i < 8; i += 2) {
        const nx = (poly[i + 1] ?? 0) - (poly[(i + 3) % 8] ?? 0)
        const ny = (poly[(i + 2) % 8] ?? 0) - (poly[i] ?? 0)
        const span = (p: ReadonlyArray<number>) => {
          let lo = Infinity
          let hi = -Infinity
          for (let k = 0; k < 8; k += 2) {
            const d = (p[k] ?? 0) * nx + (p[k + 1] ?? 0) * ny
            lo = Math.min(lo, d)
            hi = Math.max(hi, d)
          }
          return [lo, hi] as const
        }
        const [alo, ahi] = span(pa)
        const [blo, bhi] = span(pb)
        if (ahi < blo || bhi < alo) return false
      }
    }
    return true
  }

  it("no two NPC cars overlap in a junction box during a minute in town", () => {
    let pairs = 0
    // Seeds that had cars driving through each other there before traffic gave way (9 pairs among them).
    for (const seed of [2, 3, 6]) {
      const game = newGame(world, seed)
      const boxes = [...junctionRules(world, game.signals).values()]
      const seen = new Set<string>()
      for (let t = 0; t < 60 / DT; t++) {
        step(world, game, idle)
        const inBox = game.npcs.filter((n) => n.mode.kind === "driving" && boxes.some((b) => Math.abs(b.x - n.x) < b.box && Math.abs(b.y - n.y) < b.box && dist(b, n) < b.box))
        for (let i = 0; i < inBox.length; i++) {
          for (let k = i + 1; k < inBox.length; k++) {
            const a = inBox[i]
            const b = inBox[k]
            if (a !== undefined && b !== undefined && dist(a, b) < 14 && overlap(a, b)) seen.add(`${a.id}:${b.id}`)
          }
        }
      }
      pairs += seen.size
    }
    expect(pairs).toBe(0)
  }, 30_000)
})
