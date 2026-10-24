import type { World } from "#/world/world.ts"
import type { Poi } from "#/map/types.ts"
import { makeProjection } from "#/map/project.ts"
import { distToSegmentSq } from "#/world/geometry.ts"
import { DRIVABLE } from "#/world/world.ts"
import { CAR_LENGTH, GRASS, ROAD, WATER, carOutline, forwardSpeed, stepCar, type Car, type Surface } from "./car.ts"
import { spawnNpc, stepNpc, type Npc } from "./traffic.ts"
import { lightFor, makeSignals, type Signals } from "./signals.ts"
import { spawnWalker, stepWalker, type Walker } from "./pedestrians.ts"
import { carName, POLICE_MODEL } from "./vehicles.ts"
import { commit, coolDown, noHeat, wantedLevel, type Wanted } from "./wanted.ts"
import { drift, nearMiss, newScore, tickScore, type Score } from "./score.ts"
import { cancelMission, newMission, stepMission, type Mission } from "./mission.ts"
import { isStuck, spawnCop, stepCop, type Cop } from "./police.ts"

export type Input = {
  readonly up: boolean
  readonly down: boolean
  readonly left: boolean
  readonly right: boolean
  readonly handbrake: boolean
  readonly sprint: boolean
  /** true for exactly one step after F was pressed */
  readonly use: boolean
}

export type Player = { x: number; y: number; angle: number; car: Car | null }

/** Something the HUD announces once: a big banner, the car you got into, money paid. */
export type Message =
  | { readonly kind: "busted" | "wrecked" | "gameOver" }
  | { readonly kind: "car"; readonly text: string }
  | { readonly kind: "mission"; readonly text: string }
  | { readonly kind: "cash"; readonly amount: number }

export type Game = {
  player: Player
  /** Cars standing around that the player can take. */
  parked: Array<Car>
  /** Burnt-out cars: in the way of nobody, enterable by nobody. */
  wrecks: Array<Car>
  npcs: Array<Npc>
  cops: Array<Cop>
  walkers: Array<Walker>
  nextId: number
  time: number
  lives: number
  readonly score: Score
  readonly wanted: Wanted
  /** The payphone job, or null on a map without its places. */
  readonly mission: Mission | null
  /** Seconds a police car has stood next to you while you stand still. */
  bust: number
  /** Announcements since the HUD last took them. */
  readonly messages: Array<Message>
  /** Where every life starts. */
  readonly home: { readonly x: number; readonly y: number; readonly angle: number }
  readonly signals: Signals
  readonly random: () => number
  /** The traffic light junction the car is in, so running a red counts once. */
  junction: object | null
  /** Seconds until ramming another car counts as a new crash. */
  crashCooldown: number
}

export const DT = 1 / 60
const WALK = 4
const SPRINT = 7.5
const PLAYER_RADIUS = 0.4
const NPC_COUNT = 70
const NPC_NEAR = 120
const NPC_FAR = 650
const WALKER_COUNT = 120
const WALKER_FAR = 220
const ENTER_RANGE = 4
export const LIVES = 5
/** A police car within this many meters sees you. */
const COP_SIGHT = 45
/** A police car this close while you stand still for BUST_S arrests you. */
const BUST_RANGE = 5.5
const BUST_S = 3
/** A car smokes below this health. */
export const SMOKE_HEALTH = 35

/** Small seeded PRNG (mulberry32) so tests are repeatable. */
export const makeRandom = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** Sudetenstraße 19, Geretsried: where every game starts. */
export const START = { lat: 47.8582, lon: 11.4836 }

/** The courier job: Brezn from the Mühlenbäck branch across town (not the one next door) to the Rehmaus Apotheke. */
const planMission = (world: World, phone: { x: number; y: number }): Mission | null => {
  const { pois } = world.map
  const dist = (p: Poi) => Math.hypot(p.x - phone.x, p.y - phone.y)
  const bakeries = pois.filter((p) => p.name.includes("Mühlenbäck")).toSorted((a, b) => dist(a) - dist(b))
  const pickup = bakeries.find((p) => dist(p) > 300) ?? bakeries[0]
  const dropoff = pois.find((p) => p.name === "Rehmaus Apotheke") ?? pois.filter((p) => p.kind === "pharmacy").toSorted((a, b) => dist(a) - dist(b))[0]
  return pickup === undefined || dropoff === undefined ? null : newMission(phone, pickup, dropoff)
}

/** Spawn on the street segment closest to START, next to a parked car. */
export const newGame = (world: World, seed = 1): Game => {
  const random = makeRandom(seed)
  const [tx, ty] = makeProjection(world.map.bbox).toMeters(START)
  let best = { d: Infinity, ax: tx, ay: ty, bx: tx + 1, by: ty, width: 6 }
  for (const r of world.map.roads) {
    if (!DRIVABLE.has(r.kind)) continue
    for (let i = 0; i + 3 < r.pts.length; i += 2) {
      const ax = r.pts[i] ?? 0
      const ay = r.pts[i + 1] ?? 0
      const bx = r.pts[i + 2] ?? 0
      const by = r.pts[i + 3] ?? 0
      const d = distToSegmentSq(tx, ty, ax, ay, bx, by)
      if (d < best.d) best = { d, ax, ay, bx, by, width: r.width }
    }
  }
  // Park in the middle of that segment, facing along it.
  const ax = (best.ax + best.bx) / 2
  const ay = (best.ay + best.by) / 2
  const { bx, by } = best
  const road = { width: best.width }
  const angle = Math.atan2(by - best.ay, bx - best.ax)
  const nx = -Math.sin(angle)
  const ny = Math.cos(angle)
  // Half on the sidewalk, like people park in Geretsried, so traffic can pass;
  // the other curb or the lane itself if a wall is in the way.
  const spots = [road.width / 2 + 1, -(road.width / 2 + 1), road.width / 4].map(
    (lane): Car => ({ x: ax + nx * lane, y: ay + ny * lane, angle, vx: 0, vy: 0, model: 0, health: 100 }),
  )
  const car = spots.find((c) => !carHitsWall(world, c)) ?? spots[2] ?? { x: ax, y: ay, angle, vx: 0, vy: 0, model: 0, health: 100 }
  const side = Math.sign((car.x - ax) * nx + (car.y - ay) * ny) || 1
  const home = { x: car.x - nx * 2.5 * side, y: car.y - ny * 2.5 * side, angle: angle - Math.PI / 2 }
  // The payphone stands on the same sidewalk, a few steps along the street.
  const phoneAt = { x: home.x - Math.cos(angle) * 7, y: home.y - Math.sin(angle) * 7 }
  const phone = world.isSolid(phoneAt.x, phoneAt.y) ? { x: home.x, y: home.y } : phoneAt
  const game: Game = {
    player: { x: home.x, y: home.y, angle: home.angle, car: null },
    parked: [car],
    wrecks: [],
    npcs: [],
    cops: [],
    walkers: [],
    nextId: 0,
    time: 0,
    lives: LIVES,
    score: newScore(),
    wanted: noHeat(),
    mission: planMission(world, phone),
    bust: 0,
    messages: [],
    home,
    signals: makeSignals(world),
    random,
    junction: null,
    crashCooldown: 0,
  }
  fillTraffic(world, game, 40)
  return game
}

const surfaceAt = (world: World, x: number, y: number): Surface => {
  const road = world.roadAt(x, y, 0.5)
  if (road !== null && road.road.kind !== "footway") return ROAD
  return world.isWater(x, y) ? WATER : GRASS
}

export const carHitsWall = (world: World, car: Car) =>
  carOutline(car).some(([x, y]) => x < 0 || y < 0 || x > world.map.width || y > world.map.height || world.isSolid(x, y))

/** Keep about NPC_COUNT cars around the player; recycle the ones left far behind. */
const fillTraffic = (world: World, game: Game, minR: number) => {
  const { x, y } = playerPos(game)
  game.npcs = game.npcs.filter((n) => Math.hypot(n.x - x, n.y - y) < NPC_FAR + 100)
  game.walkers = game.walkers.filter((w) => Math.hypot(w.x - x, w.y - y) < WALKER_FAR + 50)
  game.wrecks = game.wrecks.filter((w) => Math.hypot(w.x - x, w.y - y) < NPC_FAR)
  for (let attempt = 0; game.walkers.length < WALKER_COUNT && attempt < WALKER_COUNT * 3; attempt++) {
    const walker = spawnWalker(world, game.nextId++, x, y, minR === 0 ? 0 : 60, WALKER_FAR, game.random)
    if (walker !== null) game.walkers.push(walker)
  }
  for (let attempt = 0; game.npcs.length < NPC_COUNT && attempt < NPC_COUNT * 4; attempt++) {
    const npc = spawnNpc(world, game.nextId++, x, y, minR, NPC_FAR, game.random)
    if (npc === null) return
    // Never spawn on top of another car.
    const taken = [...game.parked, ...game.npcs].some((c) => Math.hypot(c.x - npc.x, c.y - npc.y) < 10)
    if (!taken) game.npcs.push(npc)
  }
}

export const playerPos = (game: Game) => game.player.car ?? game.player

/** Is anything within a short cone in front of this NPC? */
const blockedAhead = (game: Game, npc: Npc) => {
  const fx = Math.cos(npc.angle)
  const fy = Math.sin(npc.angle)
  const check = (x: number, y: number) => {
    const dx = x - npc.x
    const dy = y - npc.y
    const ahead = dx * fx + dy * fy
    const side = Math.abs(dx * -fy + dy * fx)
    return ahead > 0.5 && ahead < 9 && side < 2.2
  }
  const p = playerPos(game)
  if (check(p.x, p.y)) return true
  if (game.parked.some((c) => check(c.x, c.y))) return true
  if (game.cops.some((c) => check(c.car.x, c.car.y))) return true
  if (game.walkers.some((w) => check(w.x, w.y))) return true
  return game.npcs.some((o) => o !== npc && check(o.x, o.y))
}

/** Push the car out of a circle round (x, y); returns the speed it hit with, or 0 if it did not touch. */
const pushApart = (car: Car, x: number, y: number, radius: number) => {
  const dx = car.x - x
  const dy = car.y - y
  const d = Math.hypot(dx, dy)
  if (d >= radius || d === 0) return 0
  const speed = Math.hypot(car.vx, car.vy)
  car.x += (dx / d) * (radius - d)
  car.y += (dy / d) * (radius - d)
  car.vx *= -0.3
  car.vy *= -0.3
  return speed
}

/** Damage per m/s of impact speed. */
const DAMAGE = { wall: 1.1, car: 1.4, cop: 1 } as const
const HIT_SPEED = 4

const damage = (car: Car, speed: number, per: number) => {
  if (speed > HIT_SPEED) car.health = Math.max(0, car.health - speed * per)
}

/** Is a police car (chasing, or one on patrol) within `range` meters of (x, y)? */
const policeNear = (game: Game, x: number, y: number, range: number) =>
  game.cops.some((c) => Math.hypot(c.car.x - x, c.car.y - y) < range) || game.npcs.some((n) => n.model === POLICE_MODEL && Math.hypot(n.x - x, n.y - y) < range)

/** One fixed 1/60 s step. Mutates `game`. */
export const step = (world: World, game: Game, input: Input): void => {
  game.time += DT
  game.crashCooldown = Math.max(0, game.crashCooldown - DT)
  const { player } = game

  if (input.use) toggleCar(game)

  if (player.car !== null) driveCar(world, game, player.car, input)
  else walk(world, game, input)

  const threat = player.car
  for (const w of game.walkers) {
    const wasDown = w.down > 0
    stepWalker(world, w, threat, DT, game.random)
    // Knocked over (no gore: they get up again), and the police care.
    if (!wasDown && w.down > 0 && threat !== null) commit(game.wanted, "pedestrian")
  }
  for (const npc of game.npcs) stepNpc(world, game.signals, game.time, npc, blockedAhead(game, npc), DT, game.random)
  police(world, game)
  missionStep(game)
  tickScore(game.score, DT)
  if (Math.round(game.time * 60) % 60 === 0) fillTraffic(world, game, NPC_NEAR * 2)
}

const walk = (world: World, game: Game, input: Input) => {
  const { player } = game
  const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0)
  const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0)
  if (dx === 0 && dy === 0) return
  const len = Math.hypot(dx, dy)
  const speed = (input.sprint ? SPRINT : WALK) * DT
  const nx = player.x + (dx / len) * speed
  const ny = player.y + (dy / len) * speed
  // Move each axis on its own so you slide along walls.
  if (!world.isSolid(nx + Math.sign(dx) * PLAYER_RADIUS, player.y)) player.x = nx
  if (!world.isSolid(player.x, ny + Math.sign(dy) * PLAYER_RADIUS)) player.y = ny
  player.angle = Math.atan2(dy, dx)
}

const driveCar = (world: World, game: Game, car: Car, input: Input) => {
  const { player } = game
  const controls = {
    throttle: (input.up ? 1 : 0) - (input.down ? 1 : 0),
    steer: (input.right ? 1 : 0) - (input.left ? 1 : 0),
    handbrake: input.handbrake,
  }
  const next = stepCar(car, controls, surfaceAt(world, car.x, car.y), DT)
  if (carHitsWall(world, next)) {
    damage(car, Math.hypot(car.vx, car.vy), DAMAGE.wall)
    car.vx *= -0.3
    car.vy *= -0.3
  } else Object.assign(car, next)
  const before = { x: car.x, y: car.y }
  const speed = Math.hypot(car.vx, car.vy)
  for (const npc of game.npcs) {
    const dist = Math.hypot(npc.x - car.x, npc.y - car.y)
    const hit = pushApart(car, npc.x, npc.y, CAR_LENGTH * 0.75)
    if (hit > 0) {
      npc.speed = 0
      damage(car, hit, DAMAGE.car)
      if (hit > HIT_SPEED && game.crashCooldown === 0) {
        commit(game.wanted, "crash")
        game.crashCooldown = 1
      }
    } else pay(game, nearMiss(game.score, npc.id, dist, speed, game.time))
  }
  for (const parked of game.parked) damage(car, pushApart(car, parked.x, parked.y, CAR_LENGTH * 0.75), DAMAGE.car)
  for (const wreck of game.wrecks) pushApart(car, wreck.x, wreck.y, CAR_LENGTH * 0.75)
  for (const cop of game.cops) {
    // A police car ramming you hurts as much as you ramming it.
    const closing = Math.hypot(car.vx - cop.car.vx, car.vy - cop.car.vy)
    if (pushApart(car, cop.car.x, cop.car.y, CAR_LENGTH * 0.8) > 0) damage(car, closing, DAMAGE.cop)
  }
  // A shove from another car must not push you into a wall.
  if (carHitsWall(world, car)) Object.assign(car, before)
  const forward = forwardSpeed(car)
  const slip = speed > 0 ? Math.sqrt(Math.max(0, speed * speed - forward * forward)) / speed : 0
  pay(game, drift(game.score, speed, slip, DT))
  redLight(game, car)
  player.x = car.x
  player.y = car.y
  if (car.health <= 0) wreck(game)
}

const pay = (game: Game, amount: number) => {
  if (amount > 0) game.messages.push({ kind: "cash", amount })
}

/** Entering a junction while its light shows red to you. */
const redLight = (game: Game, car: Car) => {
  const light = game.signals.lights.find((l) => Math.hypot(l.junction.cx - car.x, l.junction.cy - car.y) < 12)
  const junction = light?.junction ?? null
  if (junction !== null && junction !== game.junction && Math.hypot(car.vx, car.vy) > 5 && lightFor(junction, car.angle, game.time) === "red") commit(game.wanted, "redLight")
  game.junction = junction
}

/** Out of a car that is done for: it stays as a wreck. */
const wreck = (game: Game) => {
  const { player } = game
  const car = player.car
  if (car === null) return
  getOut(game)
  game.parked = game.parked.filter((c) => c !== car)
  game.wrecks.push({ ...car, vx: 0, vy: 0, health: 0 })
  game.messages.push({ kind: "wrecked" })
  if (game.mission !== null) cancelMission(game.mission)
}

const getOut = (game: Game) => {
  const { player } = game
  const car = player.car
  if (car === null) return
  const side = car.angle - Math.PI / 2
  player.x = car.x + Math.cos(side) * 2
  player.y = car.y + Math.sin(side) * 2
  player.angle = side
  car.vx = 0
  car.vy = 0
  game.parked.push(car)
  player.car = null
}

/** Wanted level: as many police cars as cop heads, chasing; caught standing still next to one means BUSTED. */
const police = (world: World, game: Game) => {
  const level = wantedLevel(game.wanted)
  const p = playerPos(game)
  const hits = (car: Car) => carHitsWall(world, car)
  if (level === 0) game.cops = game.cops.filter((c) => Math.hypot(c.car.x - p.x, c.car.y - p.y) < COP_SIGHT)
  game.cops = game.cops.filter((c) => !isStuck(c) && Math.hypot(c.car.x - p.x, c.car.y - p.y) < 300)
  if (game.cops.length < level && Math.round(game.time * 60) % 30 === 0) {
    const cop = spawnCop(world, game.nextId++, p.x, p.y, game.random, hits)
    if (cop !== null) game.cops.push(cop)
  }
  const target = game.player.car ?? { x: p.x, y: p.y, vx: 0, vy: 0 }
  for (const cop of game.cops) {
    if (level === 0) {
      // Called off: roll to a stop.
      cop.car.vx *= 0.97
      cop.car.vy *= 0.97
      continue
    }
    stepCop(world, cop, target, DT, hits)
  }
  coolDown(game.wanted, game.cops.some((c) => Math.hypot(c.car.x - p.x, c.car.y - p.y) < COP_SIGHT), DT)
  const still = game.player.car === null || Math.hypot(game.player.car.vx, game.player.car.vy) < 1.5
  const caught = level > 0 && still && game.cops.some((c) => Math.hypot(c.car.x - p.x, c.car.y - p.y) < BUST_RANGE)
  game.bust = caught ? game.bust + DT : 0
  if (game.bust >= BUST_S) busted(game)
}

/** Arrested: half your money and a life gone, back to Sudetenstraße 19 on foot. */
const busted = (game: Game) => {
  const { player, home } = game
  if (player.car !== null) getOut(game)
  game.score.money = Math.floor(game.score.money / 2)
  game.lives--
  game.messages.push({ kind: "busted" })
  if (game.lives <= 0) {
    game.lives = LIVES
    game.score.money = 0
    game.messages.push({ kind: "gameOver" })
  }
  Object.assign(game.wanted, noHeat())
  game.cops = []
  game.bust = 0
  player.x = home.x
  player.y = home.y
  player.angle = home.angle
  if (game.mission !== null) cancelMission(game.mission)
}

const missionStep = (game: Game) => {
  const { mission } = game
  if (mission === null) return
  const event = stepMission(mission, playerPos(game), DT)
  if (event === null) return
  if (event.kind === "start" || event.kind === "picked") game.messages.push({ kind: "mission", text: event.text })
  else if (event.kind === "failed") game.messages.push({ kind: "mission", text: "Zu spät! Die Brezn sind hart." })
  else {
    game.score.money += event.reward
    game.messages.push({ kind: "mission", text: `Geschafft! $${event.reward}` }, { kind: "cash", amount: event.reward })
  }
}

/** F: get out, or take the nearest parked car or NPC (the driver flees, GTA-style). */
const toggleCar = (game: Game) => {
  const { player } = game
  if (player.car !== null) {
    getOut(game)
    return
  }
  const dist = (x: number, y: number) => Math.hypot(x - player.x, y - player.y)
  const parked = game.parked.reduce<Car | null>((best, c) => (dist(c.x, c.y) < (best === null ? ENTER_RANGE : dist(best.x, best.y)) ? c : best), null)
  if (parked !== null) {
    game.parked = game.parked.filter((c) => c !== parked)
    player.car = parked
    game.messages.push({ kind: "car", text: carName(parked.model) })
    return
  }
  const npc = game.npcs.find((n) => dist(n.x, n.y) < ENTER_RANGE)
  if (npc === undefined) return
  // Pulling a driver out in front of the police is car theft.
  if (policeNear(game, npc.x, npc.y, 40)) commit(game.wanted, "theft")
  game.npcs = game.npcs.filter((n) => n !== npc)
  player.car = { x: npc.x, y: npc.y, angle: npc.angle, vx: 0, vy: 0, model: npc.model, health: 100 }
  game.messages.push({ kind: "car", text: carName(npc.model) })
}

/** Speed in km/h for the HUD. */
export const speedKmh = (game: Game) => (game.player.car === null ? 0 : Math.abs(forwardSpeed(game.player.car)) * 3.6)
