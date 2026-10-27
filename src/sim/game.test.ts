import { readFileSync } from "node:fs"
import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GameMap } from "#/map/types.ts"
import { makeWorld } from "#/world/world.ts"
import { CAR_LENGTH, CAR_WIDTH, carOutline, type Car } from "./car.ts"
import { DT, newGame, step, type Game, type Input } from "./game.ts"
import { CAR_HP, vitals } from "./damage.ts"
import { rayWall } from "./hitscan.ts"
import { give, type Gun } from "./weapons.ts"
import { stepWalker, type Walker } from "./pedestrians.ts"
import { polygonArea } from "#/map/build.ts"
import { centroid, pointInPolygon } from "#/world/geometry.ts"
import { bridgeHoles, openRing, signedArea, triangulate } from "#/render/scene/geometry.ts"

const map = Schema.decodeUnknownSync(GameMap)(JSON.parse(readFileSync("public/geretsried.map.json", "utf8")))
const world = makeWorld(map)
const idle: Input = { up: false, down: false, left: false, right: false, handbrake: false, sprint: false, use: false, attack: false, cycle: 0 }
const must = <T,>(value: T | null | undefined): T => {
  if (value == null) throw new Error("expected a value")
  return value
}
/** Is (x, y) on a car's sprite, parked at (c.x, c.y) facing c.angle? */
const inCar = (c: { readonly x: number; readonly y: number; readonly angle: number }, x: number, y: number) => {
  const along = (x - c.x) * Math.cos(c.angle) + (y - c.y) * Math.sin(c.angle)
  const across = -(x - c.x) * Math.sin(c.angle) + (y - c.y) * Math.cos(c.angle)
  return Math.abs(along) < CAR_LENGTH / 2 && Math.abs(across) < CAR_WIDTH / 2
}
const run = (game: ReturnType<typeof newGame>, input: Input, seconds: number) => {
  for (let t = 0; t < seconds / DT; t++) step(world, game, input)
}

describe("Geretsried map", () => {
  it("has the town's streets and buildings", () => {
    expect(map.buildings.length).toBeGreaterThan(4000)
    expect(map.roads.some((r) => r.name === "Egerlandstraße")).toBe(true)
  })
})

describe("the Karl-Lederer-Grundschule (OSM relation 2014408, a ring round a courtyard)", () => {
  const school = must(map.buildings.find((b) => b.id === 2014408))
  const poi = must(map.pois.find((p) => p.name === "Karl-Lederer-Grundschule Geretsried"))

  it("is one building with the courtyard as a hole, and its POI stands in the courtyard on open ground", () => {
    expect(school.holes).toHaveLength(1)
    const court = must(school.holes?.[0])
    expect(pointInPolygon(poi.x, poi.y, court)).toBe(true)
    expect(world.isSolid(poi.x, poi.y)).toBe(false)
  })

  it("is solid in its wings", () => {
    // Four fifths of the way from the courtyard's middle to an outline corner is inside the ring block.
    const [cx, cy] = centroid(openRing(must(school.holes?.[0])))
    const ring = openRing(school.pts)
    const inWing = ring.flatMap((x, i) => (i % 2 === 0 ? [[cx + (x - cx) * 0.8, cy + ((ring[i + 1] ?? 0) - cy) * 0.8] as const] : []))
    expect(inWing.filter(([x, y]) => world.isSolid(x, y)).length).toBeGreaterThan(inWing.length / 2)
  })

  it("gets a roof over the wings only", () => {
    const roof = bridgeHoles(openRing(school.pts), (school.holes ?? []).map(openRing))
    const tris = triangulate(roof, true)
    let area = 0
    for (let t = 0; t + 2 < tris.length; t += 3) area += Math.abs(signedArea([tris[t], tris[t + 1], tris[t + 2]].flatMap((i) => [roof[(i ?? 0) * 2] ?? 0, roof[(i ?? 0) * 2 + 1] ?? 0])))
    expect(area).toBeCloseTo(polygonArea(school.pts) - polygonArea(school.holes?.[0] ?? []), 0)
  })
})

describe("the hospital", () => {
  it("is Dr. Schmucker's practice, the doctor nearest the start (a dentist or vet is no hospital)", () => {
    const { hospital } = newGame(world, 1)
    const nearest = map.pois.filter((p) => p.kind === "doctor").toSorted((a, b) => Math.hypot(a.x - hospital.x, a.y - hospital.y) - Math.hypot(b.x - hospital.x, b.y - hospital.y))[0]
    expect(nearest?.name).toBe("Dr. Schmucker")
  })
})

describe("a new game", () => {
  it("starts on foot on Sudetenstraße, outside any building, next to a free car", () => {
    const game = newGame(world, 7)
    const { player } = game
    expect(world.isSolid(player.x, player.y)).toBe(false)
    expect(world.roadAt(player.x, player.y, 15)?.road.name).toBe("Sudetenstraße")
    expect(carOutline(must(game.parked[0])).some(([x, y]) => world.isSolid(x, y))).toBe(false)
  })

  it("lets the player take the car with F and drive off", () => {
    const game = newGame(world, 7)
    step(world, game, { ...idle, use: true })
    expect(game.player.car).not.toBeNull()
    const start = { x: game.player.x, y: game.player.y }
    run(game, { ...idle, up: true }, 3)
    expect(Math.hypot(game.player.x - start.x, game.player.y - start.y)).toBeGreaterThan(20)
  })

  it("never drives through a building, whatever you hold", () => {
    const game = newGame(world, 3)
    step(world, game, { ...idle, use: true })
    // Every step while you are in it: circling through the crowd can bring the police, who may wreck it before the end.
    let driven = 0
    for (let t = 0; t < 20 / DT; t++) {
      step(world, game, { ...idle, up: true, right: true })
      const car = game.player.car
      if (car === null) continue
      driven++
      expect(carOutline(car).some(([x, y]) => world.isSolid(x, y))).toBe(false)
    }
    expect(driven).toBeGreaterThan(5 / DT)
  })

  it("fills the streets with moving traffic that stays on drivable roads", () => {
    const game = newGame(world, 11)
    const before = new Map(game.npcs.map((n) => [n.id, { x: n.x, y: n.y }]))
    run(game, idle, 10)
    expect(game.npcs.length).toBeGreaterThan(40)
    const moved = game.npcs.filter((n) => {
      const b = before.get(n.id)
      return b !== undefined && Math.hypot(n.x - b.x, n.y - b.y) > 30
    })
    expect(moved.length).toBeGreaterThan(20)
    for (const n of game.npcs) expect(world.roadAt(n.x, n.y, 3)).not.toBeNull()
  })
})

/**
 * How far from a way's centre line someone may be: on the network (standing in a group, up to half a meter beside its
 * line), or on a shop errand (errands.ts) between it and a shop's wall.
 */
const walkReach = (w: Walker) => (w.errand !== undefined ? 15 : w.stop !== null ? 4.5 : 4)

describe("pedestrians", () => {
  it("walk the sidewalks and footpaths, never inside buildings", () => {
    const game = newGame(world, 21)
    const start = new Map(game.walkers.map((w) => [w.id, { x: w.x, y: w.y }]))
    // Some stand a while (a window, a bus stop, a chat: errands.ts); the rest walk on.
    const stood = new Set<number>()
    for (let t = 0; t < 15 / DT; t++) {
      step(world, game, idle)
      for (const w of game.walkers) if (w.stop !== null || w.errand !== undefined) stood.add(w.id)
    }
    expect(game.walkers.length).toBeGreaterThan(25)
    const walking = game.walkers.filter((w) => start.has(w.id) && !stood.has(w.id))
    const moved = walking.filter((w) => {
      const s = start.get(w.id)
      return s !== undefined && Math.hypot(w.x - s.x, w.y - s.y) > 8
    })
    // Of those still round the player: the ones that walked out of sight were let go (fillCrowd).
    expect(moved.length).toBeGreaterThan(walking.length * 0.7)
    const inside = game.walkers.filter((w) => world.isSolid(w.x, w.y))
    expect(inside.length).toBeLessThan(game.walkers.length * 0.05)
    expect(game.walkers.filter((w) => world.roadAt(w.x, w.y, walkReach(w)) === null)).toEqual([])
  })

  it("walk past parked cars, at the kerb and on Sudetenstraße, not through them", () => {
    const game = newGame(world, 21)
    const profileCars = world.streets.flatMap((s) => s.parked)
    let ticks = 0
    let inside = 0
    for (let t = 0; t < 20 / DT; t++) {
      step(world, game, idle)
      for (const w of game.walkers) {
        if (w.dead || w.down > 0 || w.visit !== undefined) continue
        ticks++
        if ([...game.parked, ...profileCars].some((c) => inCar(c, w.x, w.y))) inside++
      }
    }
    expect(game.parked.length).toBeGreaterThan(30)
    // Before walkers kept clear of them, about 3 in 100 walker-ticks were inside a parked car.
    expect(inside).toBeLessThan(ticks * 0.0005)
  })

  it("jump out of the way of a speeding car, or get knocked down", () => {
    const game = newGame(world, 21)
    const w = must(game.walkers[0])
    const at = (d: number) => ({ x: w.x - d * Math.cos(w.angle), y: w.y - d * Math.sin(w.angle), vx: 15 * Math.cos(w.angle), vy: 15 * Math.sin(w.angle) })
    stepWalker(world, w, at(10), DT, game.random)
    expect(w.panic).toBeGreaterThan(0)
    stepWalker(world, w, { ...at(0), x: w.x, y: w.y }, DT, game.random)
    expect(w.down).toBeGreaterThan(0)
  })
})

describe("police", () => {
  it("chase a wanted player, and arrest one who stands still next to them", () => {
    const game = newGame(world, 5)
    game.wanted.heat = 1.5
    let chased = false
    for (let t = 0; t < 40 / DT && game.lives === 5; t++) {
      step(world, game, idle)
      chased ||= game.cops.length > 0
    }
    expect(chased).toBe(true)
    expect(game.messages.some((m) => m.kind === "busted")).toBe(true)
    expect(game.lives).toBe(4)
    expect(game.wanted.heat).toBe(0)
    expect(Math.hypot(game.player.x - game.home.x, game.player.y - game.home.y)).toBeLessThan(1)
  })
})

const withCop = (seed: number) => {
  const game = newGame(world, seed)
  game.npcs = []
  game.wanted.heat = 1.5
  const { player } = game
  game.fighters.push({ id: 999, kind: "cop", x: player.x + 1, y: player.y, angle: Math.PI, vitals: vitals(100), sprite: 1, stride: 0, moving: false, cooldown: 99, down: 0, dead: false, temper: 0 })
  return game
}

describe("busted", () => {
  it("never happens while you fight back, even with an officer at your side", () => {
    const game = withCop(9)
    // Punching the air away from the officer: fighting back, but nobody gets hurt.
    game.player.angle = Math.PI
    for (let t = 0; t < 4 / DT; t++) {
      game.player.angle = Math.PI
      step(world, game, { ...idle, attack: true })
    }
    expect(game.messages.some((m) => m.kind === "busted")).toBe(false)
  })

  it("happens two seconds after you stop fighting with an officer beside you", () => {
    const game = withCop(9)
    run(game, idle, 4)
    expect(game.messages.some((m) => m.kind === "busted")).toBe(true)
  })

  it("never happens in a car, however close the police", () => {
    const game = withCop(9)
    step(world, game, { ...idle, use: true })
    expect(game.player.car).not.toBeNull()
    run(game, idle, 4)
    expect(game.messages.some((m) => m.kind === "busted")).toBe(false)
  })
})

describe("car damage", () => {
  it("sets a battered car alight; it blows up, and whoever stays in is WASTED and wakes at the doctor's", () => {
    const game = newGame(world, 3)
    step(world, game, { ...idle, use: true })
    give(game.player.arsenal, "pistol")
    const car = must(game.player.car)
    car.vitals.hp = 5
    run(game, idle, 2)
    expect(game.player.car).toBeNull()
    expect(game.wrecks).toHaveLength(1)
    expect(game.decals.length).toBeGreaterThan(0)
    expect(game.messages.some((m) => m.kind === "wasted")).toBe(true)
    run(game, idle, 4)
    expect(game.lives).toBe(4)
    expect(game.player.vitals.hp).toBe(100)
    expect(game.player.arsenal.current).toBe("fists")
    expect(Math.hypot(game.player.x - game.hospital.x, game.player.y - game.hospital.y)).toBeLessThan(1)
    expect(Math.hypot(game.hospital.x - game.home.x, game.hospital.y - game.home.y)).toBeGreaterThan(10)
  })
})

/** Put the player `d` meters from (x, y), facing it, on a line no wall crosses. */
const faceFrom = (game: Game, x: number, y: number, d: number) => {
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2
    const px = x + Math.cos(a) * d
    const py = y + Math.sin(a) * d
    const angle = Math.atan2(y - py, x - px)
    if (world.isSolid(px, py) || rayWall(world.isSolid, px, py, Math.cos(angle), Math.sin(angle), d) < d) continue
    Object.assign(game.player, { x: px, y: py, angle })
    return true
  }
  return false
}

const armed = (seed: number, weapon: Gun) => {
  const game = newGame(world, seed)
  give(game.player.arsenal, weapon)
  game.player.arsenal.current = weapon
  game.player.arsenal.ammo[weapon] = 999
  return game
}

/** Fire for `seconds` without moving: Ctrl held, nothing else. */
const shoot = (game: Game, seconds: number) => run(game, { ...idle, attack: true }, seconds)

describe("guns", () => {
  it("kill a pedestrian with a few pistol shots and send the people round running", () => {
    const game = armed(21, "pistol")
    // Someone walking alone, so nobody in their group takes the bullets.
    const alone = (o: Walker) => !game.walkers.some((other) => other !== o && Math.hypot(other.x - o.x, other.y - o.y) < 8)
    const w = must(game.walkers.find((o) => alone(o) && faceFrom(game, o.x, o.y, 6)))
    shoot(game, 1.5)
    expect(w.dead || !game.walkers.includes(w)).toBe(true)
    expect(game.walkers.some((o) => o !== w && o.panic > 0)).toBe(true)
    expect(game.sounds.some((s) => s.id === "pistol")).toBe(true)
  })

  it("burn a car down with the submachine gun until it explodes into a wreck", () => {
    const game = armed(4, "smg")
    const car = must(game.parked[0])
    expect(faceFrom(game, car.x, car.y, 7)).toBe(true)
    // Nobody walking through the line of fire.
    game.walkers = game.walkers.filter((w) => Math.hypot(w.x - car.x, w.y - car.y) > 15)
    shoot(game, 2)
    expect(car.vitals.hp).toBeLessThan(25)
    run(game, idle, 6)
    expect(game.wrecks).toHaveLength(1)
    expect(game.parked.includes(car)).toBe(false)
  })

  it("set off a chain: a rocket into one car of a row blows up all of them", () => {
    const game = armed(4, "rocket")
    const first = must(game.parked[0])
    const row = [1, 2].map((i): Car => ({ ...first, x: first.x + Math.cos(first.angle) * 4.8 * i, y: first.y + Math.sin(first.angle) * 4.8 * i, vitals: vitals(CAR_HP) }))
    game.parked.push(...row)
    game.npcs = []
    expect(faceFrom(game, first.x, first.y, 12)).toBe(true)
    run(game, { ...idle, attack: true }, 0.05)
    run(game, idle, 10)
    expect(game.wrecks.length).toBeGreaterThanOrEqual(3)
  })
})

describe("petrol pumps", () => {
  it("blow up when shot, set off the island next to them and the car parked by it", () => {
    const game = armed(4, "smg")
    game.npcs = []
    const station = must([...new Set(game.pumps.map((p) => `${Math.round(p.x / 60)},${Math.round(p.y / 60)}`))].map((k) => game.pumps.filter((p) => `${Math.round(p.x / 60)},${Math.round(p.y / 60)}` === k)).find((g) => g.length >= 2))
    const [first, second] = station
    const target = must(first)
    const next = must(second)
    const car = { ...must(game.parked[0]), x: target.x + 3, y: target.y + 0.5, vitals: vitals(CAR_HP) }
    game.parked.push(car)
    expect(faceFrom(game, target.x, target.y, 9)).toBe(true)
    shoot(game, 3)
    run(game, idle, 3)
    expect(target.dead).toBe(true)
    expect(next.dead || next.fuse !== null || Math.hypot(next.x - target.x, next.y - target.y) > 7.5).toBe(true)
    expect(car.vitals.hp).toBeLessThan(CAR_HP)
    expect(game.decals.length).toBeGreaterThan(0)
  })

  it("go up when a car rams one hard", () => {
    const game = newGame(world, 4)
    step(world, game, { ...idle, use: true })
    const car = must(game.player.car)
    const pump = must(game.pumps[0])
    // Coming in across the island at 15 m/s.
    const across = pump.angle + Math.PI / 2
    Object.assign(car, { x: pump.x - Math.cos(across) * 2.5, y: pump.y - Math.sin(across) * 2.5, angle: across, vx: Math.cos(across) * 15, vy: Math.sin(across) * 15 })
    run(game, idle, 1.5)
    expect(pump.dead).toBe(true)
  })
})

describe("pickups", () => {
  it("give you the weapon, and come back a minute later", () => {
    const game = newGame(world, 2)
    const p = must(game.pickups.find((o) => o.kind === "shotgun"))
    Object.assign(game.player, { x: p.x, y: p.y })
    step(world, game, idle)
    expect(game.player.arsenal.ammo.shotgun).toBeGreaterThan(0)
    expect(game.player.arsenal.current).toBe("shotgun")
    expect(p.respawn).toBeGreaterThan(0)
    expect(game.messages.some((m) => m.kind === "pickup")).toBe(true)
  })

  it("cycle with Q and E over what you carry", () => {
    const game = newGame(world, 2)
    give(game.player.arsenal, "pistol")
    give(game.player.arsenal, "molotov")
    step(world, game, { ...idle, cycle: 1 })
    expect(game.player.arsenal.current).toBe("molotov")
    step(world, game, { ...idle, cycle: 1 })
    expect(game.player.arsenal.current).toBe("fists")
  })
})

describe("police escalation", () => {
  it("at three cop heads gets officers out of their cars, shooting", () => {
    const game = newGame(world, 5)
    game.wanted.heat = 3.5
    let onFoot = false
    let shot = false
    for (let t = 0; t < 40 / DT && !(onFoot && shot); t++) {
      step(world, game, idle)
      onFoot ||= game.fighters.some((f) => f.kind === "cop")
      shot ||= game.sounds.splice(0).some((s) => s.id === "copShot")
    }
    expect(onFoot).toBe(true)
    expect(shot).toBe(true)
  })
})

describe("the payphone jobs", () => {
  it("start with the courier job at the phone by Sudetenstraße 19: Mühlenbäck across town to the Rehmaus Apotheke", () => {
    const game = newGame(world, 1)
    const { jobs } = game
    const home = must(jobs.phones[0])
    expect(Math.hypot(home.x - game.home.x, home.y - game.home.y)).toBeLessThan(10)
    const first = must(jobs.jobs[0])
    expect(first.goal.kind).toBe("deliver")
    if (first.goal.kind !== "deliver") return
    expect(first.goal.pickup.name).toContain("Mühlenbäck")
    expect(Math.hypot(first.goal.pickup.x - home.x, first.goal.pickup.y - home.y)).toBeGreaterThan(300)
    expect(first.goal.dropoff.name).toBe("Rehmaus Apotheke")
  })

  it("have phones round town and jobs of all three kinds, gang jobs among them", () => {
    const { jobs } = newGame(world, 1)
    expect(jobs.phones.length).toBeGreaterThanOrEqual(4)
    expect(new Set(jobs.jobs.map((j) => j.goal.kind))).toEqual(new Set(["deliver", "steal", "destroy"]))
    expect(jobs.jobs.filter((j) => j.gang !== undefined).length).toBeGreaterThanOrEqual(3)
    for (const ph of jobs.phones) expect(world.isSolid(ph.x, ph.y)).toBe(false)
  })

  it("park the Mercedes G at the Rathaus when you take the job, and pay when you drive it to the garage", () => {
    const game = newGame(world, 1)
    game.jobs.done.push("brezn")
    const phone = must(game.jobs.phones[0])
    Object.assign(game.player, { x: phone.x, y: phone.y })
    step(world, game, idle)
    const target = must(game.jobs.active?.target)
    expect(game.parked.includes(target as Car)).toBe(true)
    Object.assign(game.player, { x: target.x + 1, y: target.y })
    step(world, game, { ...idle, use: true })
    expect(game.player.car).toBe(target)
    step(world, game, idle)
    expect(game.jobs.active?.stage).toBe("deliver")
    const goal = must(game.jobs.active).job.goal
    if (goal.kind !== "steal") throw new Error("expected the steal job")
    Object.assign(must(game.player.car), { x: goal.dropoff.x, y: goal.dropoff.y })
    const money = game.score.money
    step(world, game, idle)
    expect(game.score.money).toBe(money + 2500)
    expect(game.jobs.done).toContain("mercedes")
  })

  it("keep a far-off job car parked while you are on your way to it", () => {
    const game = newGame(world, 1)
    const job = must(game.jobs.jobs.find((j) => j.id === "gartenberg-1"))
    for (const j of game.jobs.jobs) if (j.phone === job.phone && j !== job) game.jobs.done.push(j.id)
    const phone = must(game.jobs.phones[job.phone])
    Object.assign(game.player, { x: phone.x, y: phone.y })
    step(world, game, idle)
    expect(game.jobs.active?.job.id).toBe("gartenberg-1")
    const target = must(game.jobs.active?.target)
    expect(Math.hypot(target.x - phone.x, target.y - phone.y)).toBeGreaterThan(1000)
    // Traffic is recycled once a second, around the player still at the phone.
    run(game, idle, 2)
    expect(game.parked.includes(target as Car)).toBe(true)
  })
})

describe("save points and spray shops", () => {
  it("stand at a real church and a real paint shop", () => {
    const game = newGame(world, 1)
    expect(game.shops.find((s) => s.kind === "save")?.name).toBe("Maria Hilf")
    expect(game.shops.some((s) => s.kind === "spray" && s.name.includes("Lack"))).toBe(true)
  })

  it("save the game at the church for $500 and tell the HUD", () => {
    const game = newGame(world, 1)
    game.score.money = 2000
    const church = must(game.shops.find((s) => s.kind === "save"))
    Object.assign(game.player, { x: church.x, y: church.y })
    step(world, game, idle)
    expect(game.score.money).toBe(1500)
    const saved = game.messages.find((m) => m.kind === "saved")
    expect(saved?.kind === "saved" && saved.data.money).toBe(1500)
  })

  it("respray the car, clear the wanted level and lose the police", () => {
    const game = newGame(world, 1)
    game.score.money = 1000
    game.wanted.heat = 2.5
    step(world, game, { ...idle, use: true })
    const car = must(game.player.car)
    const shop = must(game.shops.find((s) => s.kind === "spray"))
    Object.assign(car, { x: shop.x, y: shop.y, vx: 0, vy: 0 })
    step(world, game, idle)
    expect(game.wanted.heat).toBe(0)
    expect(car.paint).toBe(1)
    expect(game.score.money).toBe(700)
    run(game, idle, 3)
    expect(game.cops.every((c) => Math.hypot(c.car.vx, c.car.vy) < 3)).toBe(true)
  })
})

describe("gangs", () => {
  it("walk their turf in their colours, and come at you when they hate you", () => {
    const game = newGame(world, 6)
    run(game, idle, 1)
    const member = must(game.walkers.find((w) => w.gang !== undefined))
    const gang = must(member.gang)
    game.respect[gang] = -60
    Object.assign(game.player, { x: member.x + 5, y: member.y })
    run(game, idle, 1)
    expect(game.fighters.some((f) => f.gang === gang)).toBe(true)
  })

  it("pay respect for a gang job: up with them, down with their rival", () => {
    const game = newGame(world, 6)
    const job = must(game.jobs.jobs.find((j) => j.gang?.for === "gelting"))
    const phone = must(game.jobs.phones[job.phone])
    Object.assign(game.player, { x: phone.x, y: phone.y })
    step(world, game, idle)
    expect(game.jobs.active?.job.id).toBe(job.id)
    if (job.goal.kind !== "deliver") throw new Error("expected a delivery")
    Object.assign(game.player, { x: job.goal.pickup.x, y: job.goal.pickup.y })
    step(world, game, idle)
    Object.assign(game.player, { x: job.goal.dropoff.x, y: job.goal.dropoff.y })
    step(world, game, idle)
    expect(game.respect.gelting).toBeGreaterThan(0)
    expect(game.respect.gartenberg).toBeLessThan(0)
  })
})

describe("hidden packages", () => {
  it("lie round town, far apart, and pay $1000 once each", () => {
    const game = newGame(world, 2)
    expect(game.packages.length).toBeGreaterThanOrEqual(8)
    const p = must(game.packages[0])
    Object.assign(game.player, { x: p.x, y: p.y })
    step(world, game, idle)
    expect(p.found).toBe(true)
    expect(game.score.money).toBe(1000)
    step(world, game, idle)
    expect(game.score.money).toBe(1000)
  })
})
