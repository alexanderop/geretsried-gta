import type { World } from "#/world/world.ts"
import { makeProjection } from "#/map/project.ts"
import { distToSegmentSq } from "#/world/geometry.ts"
import { DRIVABLE } from "#/world/world.ts"
import { CAR_LENGTH, GRASS, ROAD, WATER, carOutline, forwardSpeed, stepCar, type Car, type Surface } from "./car.ts"
import { spawnNpc, stepNpc, type Npc } from "./traffic.ts"

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

export type Game = {
  player: Player
  /** Cars standing around that the player can take. */
  parked: Array<Car>
  npcs: Array<Npc>
  nextId: number
  time: number
  readonly random: () => number
}

export const DT = 1 / 60
const WALK = 4
const SPRINT = 7.5
const PLAYER_RADIUS = 0.4
const NPC_COUNT = 70
const NPC_NEAR = 120
const NPC_FAR = 650
const ENTER_RANGE = 4

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
    (lane): Car => ({ x: ax + nx * lane, y: ay + ny * lane, angle, vx: 0, vy: 0, model: 0 }),
  )
  const car = spots.find((c) => !carHitsWall(world, c)) ?? spots[2] ?? { x: ax, y: ay, angle, vx: 0, vy: 0, model: 0 }
  const side = Math.sign((car.x - ax) * nx + (car.y - ay) * ny) || 1
  const game: Game = {
    player: { x: car.x - nx * 2.5 * side, y: car.y - ny * 2.5 * side, angle: angle - Math.PI / 2, car: null },
    parked: [car],
    npcs: [],
    nextId: 0,
    time: 0,
    random,
  }
  fillTraffic(world, game, 40)
  return game
}

const surfaceAt = (world: World, x: number, y: number): Surface => {
  const road = world.roadAt(x, y, 0.5)
  if (road !== null && road.road.kind !== "footway") return ROAD
  return world.isWater(x, y) ? WATER : GRASS
}

const carHitsWall = (world: World, car: Car) =>
  carOutline(car).some(([x, y]) => x < 0 || y < 0 || x > world.map.width || y > world.map.height || world.isSolid(x, y))

/** Keep about NPC_COUNT cars around the player; recycle the ones left far behind. */
const fillTraffic = (world: World, game: Game, minR: number) => {
  const { x, y } = playerPos(game)
  game.npcs = game.npcs.filter((n) => Math.hypot(n.x - x, n.y - y) < NPC_FAR + 100)
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
  return game.npcs.some((o) => o !== npc && check(o.x, o.y))
}

const pushApart = (car: Car, x: number, y: number, radius: number) => {
  const dx = car.x - x
  const dy = car.y - y
  const d = Math.hypot(dx, dy)
  if (d >= radius || d === 0) return false
  car.x += (dx / d) * (radius - d)
  car.y += (dy / d) * (radius - d)
  car.vx *= -0.3
  car.vy *= -0.3
  return true
}

/** One fixed 1/60 s step. Mutates `game`. */
export const step = (world: World, game: Game, input: Input): void => {
  game.time += DT
  const { player } = game

  if (input.use) toggleCar(game)

  if (player.car !== null) {
    const controls = {
      throttle: (input.up ? 1 : 0) - (input.down ? 1 : 0),
      steer: (input.right ? 1 : 0) - (input.left ? 1 : 0),
      handbrake: input.handbrake,
    }
    const next = stepCar(player.car, controls, surfaceAt(world, player.car.x, player.car.y), DT)
    if (carHitsWall(world, next)) {
      player.car.vx *= -0.3
      player.car.vy *= -0.3
    } else Object.assign(player.car, next)
    const before = { x: player.car.x, y: player.car.y }
    for (const npc of game.npcs) if (pushApart(player.car, npc.x, npc.y, CAR_LENGTH * 0.75)) npc.speed = 0
    for (const car of game.parked) pushApart(player.car, car.x, car.y, CAR_LENGTH * 0.75)
    // A shove from another car must not push you into a wall.
    if (carHitsWall(world, player.car)) Object.assign(player.car, before)
    player.x = player.car.x
    player.y = player.car.y
  } else {
    const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0)
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy)
      const speed = (input.sprint ? SPRINT : WALK) * DT
      const nx = player.x + (dx / len) * speed
      const ny = player.y + (dy / len) * speed
      // Move each axis on its own so you slide along walls.
      if (!world.isSolid(nx + Math.sign(dx) * PLAYER_RADIUS, player.y)) player.x = nx
      if (!world.isSolid(player.x, ny + Math.sign(dy) * PLAYER_RADIUS)) player.y = ny
      player.angle = Math.atan2(dy, dx)
    }
  }

  for (const npc of game.npcs) stepNpc(world, npc, blockedAhead(game, npc), DT, game.random)
  if (Math.round(game.time * 60) % 60 === 0) fillTraffic(world, game, NPC_NEAR * 2)
}

/** F: get out, or take the nearest parked car or NPC (the driver flees, GTA-style). */
const toggleCar = (game: Game) => {
  const { player } = game
  if (player.car !== null) {
    const car = player.car
    const side = car.angle - Math.PI / 2
    player.x = car.x + Math.cos(side) * 2
    player.y = car.y + Math.sin(side) * 2
    player.angle = side
    game.parked.push(car)
    player.car = null
    return
  }
  const dist = (x: number, y: number) => Math.hypot(x - player.x, y - player.y)
  const parked = game.parked.reduce<Car | null>((best, c) => (dist(c.x, c.y) < (best === null ? ENTER_RANGE : dist(best.x, best.y)) ? c : best), null)
  if (parked !== null) {
    game.parked = game.parked.filter((c) => c !== parked)
    player.car = parked
    return
  }
  const npc = game.npcs.find((n) => dist(n.x, n.y) < ENTER_RANGE)
  if (npc === undefined) return
  game.npcs = game.npcs.filter((n) => n !== npc)
  player.car = { x: npc.x, y: npc.y, angle: npc.angle, vx: 0, vy: 0, model: npc.model }
}

/** Speed in km/h for the HUD. */
export const speedKmh = (game: Game) => (game.player.car === null ? 0 : Math.abs(forwardSpeed(game.player.car)) * 3.6)
