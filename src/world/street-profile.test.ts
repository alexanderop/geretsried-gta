import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap } from "#/map/types.ts"
import { carOutline } from "#/sim/car.ts"
import { CAR_HP, vitals } from "#/sim/damage.ts"
import { streetProps } from "#/render/scene/street.ts"
import { makeWorld } from "./world.ts"
import { PLACES } from "./places/index.ts"
import { POLE_ONLY_STOPS, SUDETENSTRASSE } from "./places/streets.ts"

const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
const world = makeWorld(map)
const bare = makeWorld(map, PLACES, [])
const layout = world.streets.find((l) => l.profile === SUDETENSTRASSE)
if (layout === undefined) throw new Error("Sudetenstraße's way 157363825 is not on the map")
const L = layout

describe("the Sudetenstraße profile (S-1)", () => {
  it("dresses way 157363825 from station +28 to −72 and leaves the road's width to the class", () => {
    expect(map.roads[L.road]?.name).toBe("Sudetenstraße")
    expect(map.roads[L.road]?.width).toBe(8)
    expect(L.strips.length).toBeGreaterThan(20)
  })

  it("tiles its bands from the centre line to the facade on both sides, with no gaps, no overlaps and no band in a building", () => {
    const wrong: Array<string> = []
    for (const g of SUDETENSTRASSE.ranges) {
      for (let s = Math.min(g.from, g.to) + 0.5; s < Math.max(g.from, g.to); s += 1) {
        for (const side of ["right", "left"] as const) {
          const k = side === "right" ? 1 : -1
          const bands = L.bandsAt(s, side) ?? []
          if (bands.length !== g[side].bands.length) wrong.push(`${s} ${side}: ${bands.length} bands`)
          let n = 0
          for (const [kind, a, b] of bands) {
            if (Math.abs(a - n) > 1e-9) wrong.push(`${s} ${side}: ${kind} starts at ${a}, not ${n}`)
            if (b < a) wrong.push(`${s} ${side}: ${kind} overlaps (${a} > ${b})`)
            n = b
            // Nothing drawn as street stands in a wall: the middle of every band is clear of buildings.
            const [x, y] = L.world(s, ((a + b) / 2) * k)
            if (b - a > 0.2 && bare.isSolid(x, y)) wrong.push(`${s} ${side}: ${kind} in a building`)
          }
          // A band that runs "to the facade" ends at the wall (or at its reach on open ground).
          const [x, y] = L.world(s, (n + 0.15) * k)
          if (g[side].bands.at(-1)?.to === "facade" && !bare.isSolid(x, y) && n < (g[side].reach ?? 12) - 1e-9) wrong.push(`${s} ${side}: ends at ${n}, short of the facade`)
        }
      }
    }
    expect(wrong).toEqual([])
  })

  it("is 12 m kerb to kerb at the start, the OSM fronts 7.2 m NE of the centre line with the pavement up to them", () => {
    const c = L.carriageway(0)
    expect(c).not.toBeNull()
    expect((c?.right ?? 0) + (c?.left ?? 0)).toBeCloseTo(12, 1)
    const ne = L.bandsAt(0, "right")?.at(-1)
    expect(ne?.[0]).toBe("pavement")
    expect(ne?.[2]).toBeGreaterThan(6.9)
    expect(ne?.[2]).toBeLessThan(7.5)
  })

  it("stands the signs where Street View shows them, the zebra's with flashing lights", () => {
    const listed: ReadonlyArray<readonly [string, number, number, number]> = [
      // S1's listed spot is inside the OSM footprint of No. 19: its pole stands 1.3 m off, past the gable.
      ["314", 4017.5, 4660.2, 1.4],
      ["350", 4019.4, 4665.6, 1],
      ["350", 4012.6, 4675.6, 1],
    ]
    for (const [vz, x, y, tolerance] of listed) {
      const sign = L.signs.find((s) => s.vz === vz && Math.hypot(s.x - x, s.y - y) <= tolerance)
      expect(sign, `${vz} near ${x}, ${y}`).toBeDefined()
    }
    for (const s of L.signs) {
      expect(world.isSolid(s.x, s.y)).toBe(false)
      expect(s.flash === true).toBe(s.vz === "350")
    }
    expect(L.signs.find((s) => s.vz === "314")?.plates).toEqual(["Mo-Sa 8-19 h", "1040-32"])
  })

  it("plants at least eight street trees within 30 m of the start, one per crown", () => {
    const near = L.trees.filter((t) => Math.abs(L.local(t.x, t.y)[0]) <= 30)
    expect(near.length).toBeGreaterThanOrEqual(8)
    const stacked = L.trees.flatMap((a, i) => L.trees.slice(i + 1).filter((b) => Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r - 1))
    expect(stacked).toEqual([])
    for (const t of L.trees) expect(bare.isSolid(t.x, t.y)).toBe(false)
  })

  it("parks solid cars in the parking bands, clear of the zebra, the side streets and the player's car", () => {
    expect(L.parked.length).toBeGreaterThan(10)
    const zebra = map.crossings.find((c) => c.node === 370882647)
    expect(zebra).toMatchObject({ x: 4016, y: 4670.6 })
    for (const car of L.parked) {
      expect(world.isSolid(car.x, car.y)).toBe(true)
      expect(bare.isSolid(car.x, car.y)).toBe(false)
      expect(Math.hypot(car.x - (zebra?.x ?? 0), car.y - (zebra?.y ?? 0))).toBeGreaterThan(5)
      const [s, n] = L.local(car.x, car.y)
      const bands = L.bandsAt(s, n > 0 ? "right" : "left") ?? []
      expect(bands.some(([kind, a, b]) => kind === "parking" && Math.abs(n) > a && Math.abs(n) < b + 0.4)).toBe(true)
      // People walk the class width's line (4 m + 1 m from the centre line): a parked car's solid never covers it.
      expect(Math.abs(Math.abs(n) - 5)).toBeGreaterThan(0.85)
    }
    // Across the zebra the carriageway is free to walk.
    for (let n = -7; n <= 5; n += 0.25) {
      const [x, y] = L.world(L.local(4016, 4670.6)[0], n)
      expect(world.isSolid(x, y)).toBe(false)
    }
  })

  it("stops a car at the bollards in front of Rehmaus Apotheke, wherever its nose meets the row", () => {
    expect(L.bollards.length).toBeGreaterThan(12)
    for (const b of L.bollards) expect(world.isSolid(b.x, b.y)).toBe(true)
    const [s0] = L.local(L.bollards[4]?.x ?? 0, L.bollards[4]?.y ?? 0)
    for (let ds = 0; ds < 1.5; ds += 0.1) {
      // A car driving straight at the row from the street, its nose on the bollards' line.
      const [x, y] = L.world(s0 + ds, -7.5 + 2.2)
      const [tx, ty] = L.world(s0 + ds, -10)
      const car = { x, y, angle: Math.atan2(ty - y, tx - x), vx: 0, vy: 0, model: 0, vitals: vitals(CAR_HP) }
      expect(carOutline(car).some(([px, py]) => world.isSolid(px, py))).toBe(true)
    }
  })

  it("lights its own street only: lamps along the shop side within the scope", () => {
    expect(L.lamps.length).toBeGreaterThanOrEqual(8)
    for (const l of L.lamps) {
      const [s, n] = L.local(l.x, l.y)
      expect(s).toBeGreaterThanOrEqual(-170)
      expect(s).toBeLessThanOrEqual(168)
      expect(n).toBeGreaterThan(4)
      expect(world.isSolid(l.x, l.y)).toBe(false)
    }
  })

  it("rounds the kerb into Berliner Weg and paves the corner", () => {
    expect(L.fillets.length).toBe(2)
    expect(L.plazas.length).toBe(1)
  })
})

const stop = (node: number) => map.props.find((p) => p.node === node)

describe("bus stop shelters", () => {
  it("honour OSM shelter=no where it was checked: 3448196000 gets only its pole, 3448196002 keeps its shelter", () => {
    expect(stop(3448196000)?.shelter).toBe(false)
    expect(stop(3448196002)?.shelter).toBeUndefined()
    expect(POLE_ONLY_STOPS.has(3448196000)).toBe(true)
    const props = streetProps(world, [])
    const at = (node: number) => {
      const p = stop(node)
      return props.filter((q) => p !== undefined && Math.hypot(q.x - p.x, q.y - p.y) < 8)
    }
    expect(at(3448196000).map((p) => p.kind)).toEqual(["pole"])
    expect(at(3448196002).map((p) => p.kind)).toEqual(["shelter"])
  })
})
