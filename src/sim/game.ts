import type { World } from "#/world/world.ts"
import { makeProjection } from "#/map/project.ts"
import { distToSegmentSq } from "#/world/geometry.ts"
import { DRIVABLE } from "#/world/world.ts"
import { CAR_LENGTH, CAR_WIDTH, GRASS, PAINTS, ROAD, WATER, carOutline, forwardSpeed, stepCar, type Car, type Surface } from "./car.ts"
import { roadAhead, spawnBus, spawnNpc, stepNpc, type Leader, type Npc } from "./traffic.ts"
import { atTerminus, direction, nextStop, planTransit } from "./transit.ts"
import { lightFor, makeSignals } from "./signals.ts"
import { companion, inCar, spawnWalker, stepWalker } from "./pedestrians.ts"
import { stepArrivals, stepGuest } from "./guests.ts"
import { BUS_LENGTH, BUS_MODEL, carName, POLICE_MODEL, vehicleLength } from "./vehicles.ts"
import { commit, coolDown, noHeat, tactics, wantedLevel } from "./wanted.ts"
import { KILL, awardAt, drift, nearMiss, newScore, tickScore } from "./score.ts"
import { cancelJob, isRinging, stepJobs, type Job } from "./mission.ts"
import { planJobs } from "./town-jobs.ts"
import { CAKES, CAKE_COST, COST, SAVE_COST, planShops, spotNear, stepShop } from "./shops.ts"
import { toSave } from "./save.ts"
import { gangJobDone, isHostile, newRespect, turfAt, turfs } from "./gangs.ts"
import { isStuck, spawnCop, stepCop } from "./police.ts"
import { CAR_HP, MAX_ARMOUR, PERSON_HP, hurt, isBurning, isDead, vitals, type DamageSource } from "./damage.ts"
import { WEAPONS, cycle, disarm, give, newArsenal, pull, tickArsenal } from "./weapons.ts"
import { PACKAGE_REWARD, collect, placePackages, placePickups, stepPickups, type Hidden, type PickupKind } from "./pickups.ts"
import { enrage, fire, leaveCar, stepCombat } from "./combat.ts"
import { makeRandom } from "./random.ts"
import { clearKerb, fillKerbs, kerbCars } from "./parking.ts"
import { giveWay } from "./junction.ts"
import { parkArrived, startManoeuvres, stepPullIn, stepPullOut } from "./manoeuvre.ts"
import { hurtPump, nearestOnIsland, planStations, pumpsOf } from "./stations.ts"
import type { Game, Input, Spawn } from "./state.ts"

export type { Game, Input, Message, Player } from "./state.ts"
export { makeRandom }

export const DT = 1 / 60
const WALK = 4
const SPRINT = 7.5
const PLAYER_RADIUS = 0.4
/** Most traffic cars and people at once, anywhere: the cap for performance. */
const NPC_COUNT = 70
/** Every GANG_EVERY-th pedestrian is in the gang whose turf they walk. */
const GANG_EVERY = 4
/** A gang that hates you sends the members this close at you. */
const GANG_SIGHT = 16
const NPC_FAR = 650
const WALKER_COUNT = 120
/**
 * GTA 2 keeps people and cars only round the camera, so every screen has a crowd and traffic: about CROWD.walkers
 * people (on a shop street; a share of that in the Wohngebiete) and CROWD.cars cars round the player at the walking
 * view, more as the car camera opens up. New ones appear in a ring just out of sight (`from` to `to` views from the
 * player, a view being `game.view`, the screen's centre to its corner), those beyond `gone` views go. People are slow,
 * so theirs is a tighter ring than the cars'; at 16:10 the cars' is 1.25 to 2 half-widths out, gone past 2.5.
 */
const CROWD = { walkers: 40, cars: 26 } as const
const RING = { walkers: { from: 1.05, to: 1.4, gone: 1.7 }, cars: { from: 1.05, to: 1.7, gone: 2.1 } } as const
/** The walking view's reach on a 16:10 screen: 12.5 m to the top edge, 20 m to the side. */
export const FOOT_VIEW = Math.hypot(12.5, 20)
/** A shop street: a POI this close. Off them (the Wohngebiete) only RESIDENTIAL of the crowd walks. */
const SHOP_M = 50
const RESIDENTIAL = 0.6
/** People walk in twos to fours this often, like GTA 2's groups on the pavement. */
const GROUP_CHANCE = 0.45
const ENTER_RANGE = 4
export const LIVES = 5
/** A police car within this many meters sees you. */
const COP_SIGHT = 45
/** GTA 2's arrest: on foot, not fighting back, with an officer at your side (or a stopped police car against you) for BUST_S. */
const BUST_RANGE = 3.6
const BUST_HAND = 1.7
const BUST_S = 2
/** Seconds after your last shot or punch in which you count as fighting back, so nobody arrests you. */
const FIGHTING_S = 1.5
/** A car smokes below this many hp. */
export const SMOKE_HP = 35
/** Seconds you lie WASTED before waking up at the doctor's. */
const WASTED_S = 3
/** Police officers on foot per cop head, at most. */
const FOOT_COPS_PER_LEVEL = 2
/** A police car this close to you, nearly stopped, lets its officer out (from two heads). */
const EXIT_RANGE = 22
/** A police car this close shoots from the window (from three heads). */
const CAR_SHOT_RANGE = 16

/** Sudetenstraße 19, Geretsried: where every game starts. */
export const START = { lat: 47.8582, lon: 11.4836 }

/** GTA 2 wakes you at the hospital; Geretsried has doctors' practices, so the one nearest home. */
const findHospital = (world: World, home: Spawn): Spawn => {
  const doctors = world.map.pois.filter((p) => p.kind === "doctor").toSorted((a, b) => Math.hypot(a.x - home.x, a.y - home.y) - Math.hypot(b.x - home.x, b.y - home.y))
  for (const d of doctors) {
    const spot = spotNear(world, d.x, d.y)
    if (spot !== null) return { ...spot, angle: Math.PI / 2 }
  }
  return home
}

/** Spawn on the street segment closest to START, next to a parked car. `hidden` says where pickups would be out of sight (under trees). */
export const newGame = (world: World, seed = 1, hidden?: Hidden): Game => {
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
    (lane): Car => ({ x: ax + nx * lane, y: ay + ny * lane, angle, vx: 0, vy: 0, model: 0, vitals: vitals(CAR_HP) }),
  )
  const car = spots.find((c) => !carHitsWall(world, c)) ?? spots[2] ?? { x: ax, y: ay, angle, vx: 0, vy: 0, model: 0, vitals: vitals(CAR_HP) }
  const side = Math.sign((car.x - ax) * nx + (car.y - ay) * ny) || 1
  const home = { x: car.x - nx * 2.5 * side, y: car.y - ny * 2.5 * side, angle: angle - Math.PI / 2 }
  // The payphone stands on the sidewalk by the parked car, a few steps along the street.
  const curb = road.width / 2 + 1.8
  const phoneAt = { x: ax + nx * curb * side - Math.cos(angle) * 7, y: ay + ny * curb * side - Math.sin(angle) * 7 }
  const phone = world.isSolid(phoneAt.x, phoneAt.y) ? { x: home.x, y: home.y } : phoneAt
  const stations = planStations(world)
  const pickups = placePickups(world, home, hidden)
  const game: Game = {
    player: { x: home.x, y: home.y, angle: home.angle, car: null, ride: null, vitals: vitals(PERSON_HP), arsenal: newArsenal(), stride: 0, moving: false },
    parked: [car],
    kerb: new Map(),
    wrecks: [],
    npcs: [],
    cops: [],
    walkers: [],
    fighters: [],
    projectiles: [],
    fires: [],
    effects: [],
    decals: [],
    pickups,
    packages: placePackages(world, pickups, hidden),
    pumps: pumpsOf(stations),
    pillars: stations.flatMap((st) => st.pillars),
    nextId: 0,
    time: 0,
    lives: LIVES,
    score: newScore(),
    wanted: noHeat(),
    jobs: planJobs(world, phone),
    respect: newRespect(),
    turf: turfs(world.map.districts),
    ringCooldown: 0,
    shops: planShops(world, hidden),
    bust: 0,
    fighting: 0,
    wasted: 0,
    messages: [],
    sounds: [],
    home,
    hospital: findHospital(world, home),
    signals: makeSignals(world),
    transit: planTransit(world),
    random,
    kerbRandom: makeRandom(seed ^ 0x6b65_7262),
    junction: null,
    crashCooldown: 0,
    wallCooldown: 0,
    gunfireCooldown: 0,
    screamCooldown: 0,
    guestCooldown: 2,
    view: FOOT_VIEW,
  }
  // The first buses are spread round each line's loop, a little out of step between lines (before the traffic, which tops lines up).
  game.transit.forEach((line, li) => {
    for (let k = 0; k < line.buses; k++) game.npcs.push(spawnBus(world, game.nextId++, line, k / line.buses + li * 0.137))
  })
  fillTraffic(world, game)
  return game
}

const surfaceAt = (world: World, x: number, y: number): Surface => {
  const road = world.roadAt(x, y, 0.5)
  if (road !== null && road.road.kind !== "footway") return ROAD
  return world.isWater(x, y) ? WATER : GRASS
}

export const carHitsWall = (world: World, car: Car) =>
  carOutline(car).some(([x, y]) => x < 0 || y < 0 || x > world.map.width || y > world.map.height || world.isSolid(x, y))

/** Once a second: the cars along the kerbs round the player, the buses, and what is left far behind (wrecks, parked cars). */
const fillTraffic = (world: World, game: Game) => {
  const { x, y } = playerPos(game)
  topUpBuses(world, game, x, y)
  game.wrecks = game.wrecks.filter((w) => Math.hypot(w.x - x, w.y - y) < NPC_FAR)
  // The active job's car stays wherever it is: you are on your way to it.
  const target = game.jobs.active?.target
  game.parked = game.parked.filter((c) => c === target || Math.hypot(c.x - x, c.y - y) < NPC_FAR)
  // Cars along the kerbs, like the moving traffic: none pop up in view after the start.
  fillKerbs(world, game, x, y, 60)
  fillCrowd(world, game)
}

/** Is (x, y) on a shop street: a POI within SHOP_M? */
const onShopStreet = (world: World, x: number, y: number) => world.map.pois.some((p) => Math.abs(p.x - x) < SHOP_M && Math.abs(p.y - y) < SHOP_M && Math.hypot(p.x - x, p.y - y) < SHOP_M)

/** How many people and moving cars to keep round the player now: CROWD at the walking view, growing with the view, fewer off the shop streets. */
export const crowdTarget = (world: World, game: Game): { readonly walkers: number; readonly cars: number } => {
  const { x, y } = playerPos(game)
  const scale = game.view / FOOT_VIEW
  const share = onShopStreet(world, x, y) ? 1 : RESIDENTIAL
  return { walkers: Math.min(WALKER_COUNT, Math.round(CROWD.walkers * scale * share)), cars: Math.min(NPC_COUNT, Math.round(CROWD.cars * scale)) }
}

/**
 * GTA 2's crowd: people and traffic beyond their RING go, and so do those out of sight and on their way out; new
 * ones come in from the ring just out of sight, heading in, until the targets are met. So what is round the player
 * is mostly coming into view. With nobody near (the start, a teleport) the whole circle round the player is filled
 * at once, in view too. People on shop streets are always taken, elsewhere only RESIDENTIAL of them; some walk in
 * groups. Cafe guests, the dead and buses are left alone: they keep their own counts.
 */
export const fillCrowd = (world: World, game: Game): void => {
  const { x, y } = playerPos(game)
  const within = (o: { readonly x: number; readonly y: number }, r: number) => Math.hypot(o.x - x, o.y - y) < r * game.view
  const leaving = (o: { readonly x: number; readonly y: number; readonly angle: number }) => !within(o, 1) && Math.cos(o.angle) * (o.x - x) + Math.sin(o.angle) * (o.y - y) > 0
  // A car parking or pulling out finishes that first: it goes only from far off, as before the crowd.
  const keep = (n: Npc) => (n.mode.kind === "driving" ? within(n, RING.cars.gone) && !leaving(n) : Math.hypot(n.x - x, n.y - y) < NPC_FAR + 100)
  game.npcs = game.npcs.filter((n) => n.bus !== undefined || keep(n))
  game.walkers = game.walkers.filter((w) => w.visit !== undefined || (within(w, RING.walkers.gone) && (w.dead || w.down > 0 || !leaving(w))))
  const crowd = () => game.walkers.filter((w) => w.visit === undefined && !w.dead).length
  const cars = () => game.npcs.filter((n) => n.bus === undefined).length
  const fresh = crowd() === 0 && cars() === 0
  // Fresh: the whole circle at once, in view too, with more tries.
  const band = (ring: { readonly from: number; readonly to: number; readonly gone: number }): readonly [number, number] => (fresh ? [0, ring.gone * game.view] : [ring.from * game.view, ring.to * game.view])
  const tries = fresh ? 8 : 1
  const want = crowdTarget(world, game)
  const [wMin, wMax] = band(RING.walkers)
  for (let attempt = 0; crowd() < want.walkers && attempt < 24 * tries; attempt++) {
    const walker = spawnWalker(world, game.nextId++, x, y, wMin, wMax, game.random, !fresh)
    if (walker === null) continue
    const d = Math.hypot(walker.x - x, walker.y - y)
    if (d < wMin || d > wMax) continue
    if (!onShopStreet(world, walker.x, walker.y) && game.random() > RESIDENTIAL) continue
    const group = [walker]
    if (game.random() < GROUP_CHANCE) {
      const size = 1 + Math.floor(game.random() * 3)
      for (let k = 1; k <= size; k++) {
        const mate = companion(world, walker, game.nextId++, k, game.random)
        if (mate !== null) group.push(mate)
      }
    }
    for (const w of group) {
      // Nobody starts inside a parked car: they walk round them.
      if (game.parked.some((c) => inCar(c, w.x, w.y)) || world.streets.some((st) => st.parked.some((c) => inCar(c, w.x, w.y)))) continue
      // Every few people on a gang's turf wear its colours.
      const gang = w.id % GANG_EVERY === 0 ? turfAt(game.turf, w.x, w.y) : null
      if (gang !== null) w.gang = gang
      game.walkers.push(w)
    }
  }
  const [cMin, cMax] = band(RING.cars)
  const kerb = kerbCars(world, game)
  for (let attempt = 0; cars() < want.cars && attempt < 16 * tries; attempt++) {
    const npc = spawnNpc(world, game.nextId++, x, y, cMin, cMax, game.random, !fresh)
    if (npc === null) return
    const d = Math.hypot(npc.x - x, npc.y - y)
    if (d < cMin || d > cMax) continue
    // Never spawn on top of another car; one at the kerb is only in the way if it stands in the lane.
    const close = (c: { readonly x: number; readonly y: number }) => Math.hypot(c.x - npc.x, c.y - npc.y) < 10
    const inLane = (c: Car) => Math.abs(-(c.x - npc.x) * Math.sin(npc.angle) + (c.y - npc.y) * Math.cos(npc.angle)) < PATH_HALF.car
    // Nor right at the player, which a fresh fill could.
    const taken = Math.hypot(npc.x - x, npc.y - y) < 12 || game.npcs.some(close) || game.cops.some((c) => close(c.car)) || game.parked.some((c) => close(c) && (!kerb.has(c) || inLane(c)))
    if (!taken) game.npcs.push(npc)
  }
}

/** A line that lost a bus (burnt out) gets a new one at the point of its loop farthest from everyone: out of the player's sight, clear of the others. */
const topUpBuses = (world: World, game: Game, x: number, y: number) => {
  game.transit.forEach((line, li) => {
    const have = game.npcs.filter((n) => n.bus?.line === line)
    if (have.length >= line.buses) return
    for (let k = 0; k < line.buses; k++) {
      const bus = spawnBus(world, game.nextId, line, (k + 0.5) / line.buses + li * 0.137)
      if (Math.hypot(bus.x - x, bus.y - y) < 200 || have.some((o) => Math.hypot(o.x - bus.x, o.y - bus.y) < 120)) continue
      game.nextId++
      game.npcs.push(bus)
      return
    }
  })
}

export const playerPos = (game: Game) => game.player.car ?? game.player

/** How far beside a car's path something is in its way: a car, a car coming the other way (in its own lane), a person on the sidewalk next to it. */
const PATH_HALF = { car: 2.2, oncoming: 1.4, person: 1.8 } as const
const PERSON_LENGTH = 1

/** How far along `path` (from `roadAhead`, centre to centre) (x, y) is, and the path's direction there; null when it is not on it. */
const onPath = (path: ReadonlyArray<number>, x: number, y: number, width: number) => {
  for (let i = 0; i + 5 < path.length; i += 3) {
    const ax = path[i] ?? 0
    const ay = path[i + 1] ?? 0
    const len = (path[i + 5] ?? 0) - (path[i + 2] ?? 0)
    if (len <= 1e-6) continue
    const ex = ((path[i + 3] ?? 0) - ax) / len
    const ey = ((path[i + 4] ?? 0) - ay) / len
    const along = (x - ax) * ex + (y - ay) * ey
    if (along < 0 || along > len || Math.abs((x - ax) * -ey + (y - ay) * ex) >= width) continue
    const d = (path[i + 2] ?? 0) + along
    return d > 0.5 ? { d, ex, ey } : null
  }
  return null
}

/**
 * The nearest thing on the road in front of this NPC, along the path it will drive (`paths`, bends and the next
 * segments included): the bumper-to-bumper gap and its speed along the road, or null if the way is clear. People
 * and parked cars stand still. Two cars on each other's path (crossing at a junction) do not both wait: the one
 * with the higher id goes first.
 */
const leaderAhead = (game: Game, npc: Npc, paths: ReadonlyMap<Npc, ReadonlyArray<number>>): Leader | null => {
  const path = paths.get(npc) ?? []
  // A bus looks from its nose, and sees a bus's tail, not its middle.
  const half = vehicleLength(npc.model) / 2
  const reach = (path[path.length - 1] ?? 0) + 10
  let best: Leader | null = null
  const check = (x: number, y: number, length: number, width: number, vx = 0, vy = 0) => {
    if (Math.abs(x - npc.x) > reach || Math.abs(y - npc.y) > reach) return
    const hit = onPath(path, x, y, width)
    if (hit === null) return
    const gap = hit.d - half - length / 2
    if (best === null || gap < best.gap) best = { gap, speed: Math.max(0, vx * hit.ex + vy * hit.ey) }
  }
  const car = (o: Npc) => {
    if (o === npc || Math.abs(o.x - npc.x) > reach || Math.abs(o.y - npc.y) > reach) return
    const fx = Math.cos(o.angle)
    const fy = Math.sin(o.angle)
    const along = fx * Math.cos(npc.angle) + fy * Math.sin(npc.angle)
    if (along < 0.5 && o.id < npc.id && onPath(paths.get(o) ?? [], npc.x, npc.y, PATH_HALF.car) !== null) return
    check(o.x, o.y, vehicleLength(o.model), along < -0.5 ? PATH_HALF.oncoming : PATH_HALF.car, fx * o.speed, fy * o.speed)
  }
  const p = playerPos(game)
  // Out of everyone's reach (a bus across town) only other traffic can be in the way.
  if (Math.abs(npc.x - p.x) > NPC_FAR + 50 || Math.abs(npc.y - p.y) > NPC_FAR + 50) {
    for (const o of game.npcs) car(o)
    return best
  }
  // A passenger is inside the bus, which the cars see already.
  if (game.player.ride === null) {
    const c = game.player.car
    if (c === null) check(p.x, p.y, PERSON_LENGTH, PATH_HALF.person)
    else check(c.x, c.y, vehicleLength(c.model), PATH_HALF.car, c.vx, c.vy)
  }
  for (const c of game.parked) check(c.x, c.y, vehicleLength(c.model), PATH_HALF.car)
  for (const c of game.cops) check(c.car.x, c.car.y, vehicleLength(c.car.model), PATH_HALF.car, c.car.vx, c.car.vy)
  for (const w of game.walkers) check(w.x, w.y, PERSON_LENGTH, PATH_HALF.person)
  for (const f of game.fighters) check(f.x, f.y, PERSON_LENGTH, PATH_HALF.person)
  for (const o of game.npcs) car(o)
  return best
}

/** Driving on its lane: also a car braking for the slot it parks in, not one curving in or out. */
const onLane = (npc: Npc) => npc.mode.kind === "driving" || (npc.mode.kind === "pullingIn" && npc.mode.path === null)

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

/** A bus is a row of three circles along its length, so a car can pass beside it and still not drive through it. */
const pushBus = (car: Car, bus: Npc) => {
  let hit = 0
  for (const off of [-BUS_LENGTH / 2.8, 0, BUS_LENGTH / 2.8]) hit = Math.max(hit, pushApart(car, bus.x + Math.cos(bus.angle) * off, bus.y + Math.sin(bus.angle) * off, 3.4))
  return hit
}

/** A parked car is a row of three circles too, so you can drive past one at the kerb without scraping it. */
const pushParked = (car: Car, parked: Car) => {
  if (Math.abs(parked.x - car.x) > 6 || Math.abs(parked.y - car.y) > 6) return 0
  let hit = 0
  for (const off of [-CAR_LENGTH / 3.4, 0, CAR_LENGTH / 3.4]) hit = Math.max(hit, pushApart(car, parked.x + Math.cos(parked.angle) * off, parked.y + Math.sin(parked.angle) * off, CAR_WIDTH))
  return hit
}

/** Damage per m/s of impact speed. */
const DAMAGE = { wall: 1.1, car: 1.4, cop: 1 } as const
const HIT_SPEED = 4
/** How close a car's centre gets to a canopy pillar or a pump island's spine, and the speed (m/s) that sets a pump off when it rams one. */
const PILLAR_REACH = 1.5
const PUMP_REACH = 1.9
const RAM_PUMP = 7

const crash = (car: Car, speed: number, per: number, source: DamageSource) => {
  if (speed > HIT_SPEED) hurt(car.vitals, speed * per, source)
}

/** Is a police car (chasing, or one on patrol) within `range` meters of (x, y)? */
const policeNear = (game: Game, x: number, y: number, range: number) =>
  game.cops.some((c) => Math.hypot(c.car.x - x, c.car.y - y) < range) || game.npcs.some((n) => n.model === POLICE_MODEL && Math.hypot(n.x - x, n.y - y) < range)

/** One fixed 1/60 s step. Mutates `game`. */
export const step = (world: World, game: Game, input: Input): void => {
  game.time += DT
  game.crashCooldown = Math.max(0, game.crashCooldown - DT)
  game.wallCooldown = Math.max(0, game.wallCooldown - DT)
  game.fighting = Math.max(0, game.fighting - DT)
  const { player } = game
  tickArsenal(player.arsenal, DT)

  if (game.wasted > 0) {
    game.wasted -= DT
    if (game.wasted <= 0) wakeUp(game)
  } else {
    if (input.use) toggleCar(world, game)
    if (input.cycle !== 0) cycle(player.arsenal, input.cycle)
    if (player.ride !== null) rideBus(world, game)
    else if (player.car !== null) driveCar(world, game, player.car, input)
    else {
      walk(world, game, input)
      // Space is the handbrake in a car and a second trigger on foot.
      if (input.attack || input.handbrake) attack(world, game)
      pickUp(game)
    }
  }

  const threat = player.car
  for (const w of game.walkers) {
    const wasDown = w.down > 0
    const wasDead = w.dead
    // Cafe guests follow their visit until something knocks them down.
    if (w.visit !== undefined && !w.dead && w.down <= 0) stepGuest(world, w, game.walkers, DT, game.random)
    else stepWalker(world, w, threat, DT, game.random, game.parked)
    // Knocked over by the car (no gore: they get up again, or just lie there), and the police care.
    if (!wasDown && w.down > 0 && threat !== null && w.vitals.lastHit === "car") commit(game.wanted, "pedestrian")
    // Burnt to death: the player lit the fire.
    else if (!wasDead && w.dead && w.vitals.lastHit === "fire") commit(game.wanted, "kill")
    // Run over or burnt: either is the player's kill, paid on the spot.
    if (!wasDead && w.dead && (w.vitals.lastHit === "fire" || (threat !== null && w.vitals.lastHit === "car"))) awardAt(game.score, game.messages, KILL, w.x, w.y)
  }
  game.walkers = game.walkers.filter((w) => !w.dead || w.down > 0)
  stepArrivals(world, game, playerPos(game), DT)
  // Everyone's road ahead as it is at the start of the step, so two cars can tell whether they see each other. A car
  // off its lane (into a slot, out of one) has none: it is only in others' way.
  const paths = new Map(game.npcs.map((n) => [n, onLane(n) ? roadAhead(world, n) : [n.x, n.y, 0]]))
  // Right of way at the junctions without lights: who waits at the give-way line, who slows down for it.
  const holds = giveWay(world, game.signals, game.npcs, DT)
  for (const npc of game.npcs) {
    const mode = npc.mode
    switch (mode.kind) {
      case "driving": {
        const hold = holds.get(npc)
        stepNpc(world, game.signals, game.time, npc, leaderAhead(game, npc, paths), DT, game.random, hold?.slowTo, hold?.holdAt)
        break
      }
      case "pullingIn":
        stepPullIn(world, game, npc, mode, mode.path === null ? leaderAhead(game, npc, paths) : null, DT)
        break
      case "pullingOut":
        stepPullOut(world, game, npc, mode, DT)
        break
    }
  }
  parkArrived(world, game)
  startManoeuvres(world, game)
  // A passenger moves with the bus, this frame, so the camera and the HUD do not trail it.
  const ride = player.ride?.bus
  if (ride !== undefined) Object.assign(player, { x: ride.x, y: ride.y, angle: ride.angle })
  police(world, game)
  stepCombat(world, game, wantedLevel(game.wanted), DT, () => {
    // Still inside when it blows: the explosion finds you where the car was.
    game.player.car = null
  })
  stepPickups(game.pickups, DT)
  if (game.wasted <= 0 && isDead(player.vitals)) wasted(game)
  jobsStep(world, game)
  shopsStep(game)
  if (Math.round(game.time * 60) % 30 === 0) gangsStep(game)
  tickScore(game.score, DT)
  if (Math.round(game.time * 60) % 60 === 0) fillTraffic(world, game)
  else if (Math.round(game.time * 60) % 15 === 0) fillCrowd(world, game)
}

/** Ctrl (or Space on foot): the weapon in hand, if it has reloaded. */
const attack = (world: World, game: Game) => {
  const { player } = game
  game.fighting = FIGHTING_S
  const weapon = pull(player.arsenal)
  if (weapon !== null) fire(world, game, "player", weapon, player.x, player.y, player.angle)
}

const wants = (game: Game) => (kind: PickupKind) => {
  const { arsenal, vitals: v } = game.player
  if (kind === "health") return v.hp < PERSON_HP
  if (kind === "armour") return v.armour < MAX_ARMOUR
  return arsenal.ammo[kind] < WEAPONS[kind].max
}

/** Walk over a pickup to take it, or onto a hidden package to find it. */
const pickUp = (game: Game) => {
  const { player } = game
  const found = game.packages.find((p) => !p.found && Math.hypot(p.x - player.x, p.y - player.y) < 1.6)
  if (found !== undefined) {
    found.found = true
    game.score.money += PACKAGE_REWARD
    const n = game.packages.filter((p) => p.found).length
    game.messages.push({ kind: "mission", text: `Geheimpaket gefunden! ${n} von ${game.packages.length}` }, { kind: "cash", amount: PACKAGE_REWARD, at: { kind: "player", times: 1 } })
    game.sounds.push({ id: "pickup", x: player.x, y: player.y })
  }
  const got = collect(game.pickups, player.x, player.y, wants(game))
  if (got === null) return
  if (got.kind === "health") {
    player.vitals.hp = PERSON_HP
    player.vitals.fire = 0
  } else if (got.kind === "armour") player.vitals.armour = MAX_ARMOUR
  else give(player.arsenal, got.kind)
  const name = got.kind === "health" ? "Erste Hilfe" : got.kind === "armour" ? "Schutzweste" : WEAPONS[got.kind].name
  game.messages.push({ kind: "pickup", text: name })
  game.sounds.push({ id: "pickup", x: player.x, y: player.y })
}

/** WASTED: a life, every gun, the armour and a quarter of your money gone; you wake at the doctor's a few seconds later. */
const wasted = (game: Game) => {
  const { player } = game
  if (player.car !== null) getOut(game)
  player.ride = null
  game.messages.push({ kind: "wasted" })
  game.score.money -= Math.floor(game.score.money / 4)
  disarm(player.arsenal)
  player.vitals.armour = 0
  player.vitals.fire = 0
  game.wasted = WASTED_S
  callOff(game)
}

const wakeUp = (game: Game) => {
  const { player, hospital } = game
  game.wasted = 0
  player.vitals.hp = PERSON_HP
  player.x = hospital.x
  player.y = hospital.y
  player.angle = hospital.angle
  loseLife(game)
}

const loseLife = (game: Game) => {
  game.lives--
  if (game.lives > 0) return
  game.lives = LIVES
  game.score.money = 0
  game.messages.push({ kind: "gameOver" })
}

/** The police forget you: no heat, no cars, no officers on foot (the dead stay down a while). */
const callOff = (game: Game) => {
  Object.assign(game.wanted, noHeat())
  game.cops = []
  game.fighters = game.fighters.filter((f) => f.kind !== "cop" || f.dead)
  game.bust = 0
  cancelJob(game.jobs)
}

const walk = (world: World, game: Game, input: Input) => {
  const { player } = game
  const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0)
  const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0)
  player.moving = dx !== 0 || dy !== 0
  if (!player.moving) return
  const len = Math.hypot(dx, dy)
  // On fire: you run.
  const speed = (input.sprint || player.vitals.fire > 0 ? SPRINT : WALK) * DT
  const nx = player.x + (dx / len) * speed
  const ny = player.y + (dy / len) * speed
  // Move each axis on its own so you slide along walls.
  if (!world.isSolid(nx + Math.sign(dx) * PLAYER_RADIUS, player.y)) player.x = nx
  if (!world.isSolid(player.x, ny + Math.sign(dy) * PLAYER_RADIUS)) player.y = ny
  player.angle = Math.atan2(dy, dx)
  player.stride += speed * 4
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
    // Scraping along a wall hurts once per knock, not every step.
    if (game.wallCooldown === 0) {
      crash(car, Math.hypot(car.vx, car.vy), DAMAGE.wall, "wall")
      game.wallCooldown = 0.3
    }
    car.vx *= -0.3
    car.vy *= -0.3
  } else Object.assign(car, next)
  const before = { x: car.x, y: car.y }
  const speed = Math.hypot(car.vx, car.vy)
  for (const npc of game.npcs) {
    const dist = Math.hypot(npc.x - car.x, npc.y - car.y)
    const hit = npc.bus === undefined ? pushApart(car, npc.x, npc.y, CAR_LENGTH * 0.75) : pushBus(car, npc)
    if (hit > 0) {
      npc.speed = 0
      crash(car, hit, DAMAGE.car, "car")
      if (hit > HIT_SPEED && game.crashCooldown === 0) {
        commit(game.wanted, "crash")
        game.crashCooldown = 1
      }
    } else pay(game, nearMiss(game.score, npc.id, dist, speed, game.time))
  }
  for (const parked of game.parked) crash(car, pushParked(car, parked), DAMAGE.car, "car")
  for (const wreck of game.wrecks) pushApart(car, wreck.x, wreck.y, CAR_LENGTH * 0.75)
  // Petrol station pillars and pump islands: ramming an island hard sets it off.
  for (const p of game.pillars) if (Math.abs(p.x - car.x) < 4 && Math.abs(p.y - car.y) < 4) crash(car, pushApart(car, p.x, p.y, PILLAR_REACH), DAMAGE.wall, "wall")
  for (const pump of game.pumps) {
    if (pump.dead || Math.abs(pump.x - car.x) > 6 || Math.abs(pump.y - car.y) > 6) continue
    const at = nearestOnIsland(pump, car.x, car.y)
    const hit = pushApart(car, at.x, at.y, PUMP_REACH)
    crash(car, hit, DAMAGE.wall, "wall")
    if (hit > RAM_PUMP) hurtPump(pump, hit * 9, 0.3)
  }
  for (const cop of game.cops) {
    // A police car ramming you hurts as much as you ramming it.
    const closing = Math.hypot(car.vx - cop.car.vx, car.vy - cop.car.vy)
    if (pushApart(car, cop.car.x, cop.car.y, CAR_LENGTH * 0.8) > 0) crash(car, closing, DAMAGE.cop, "police")
  }
  // A shove from another car must not push you into a wall.
  if (carHitsWall(world, car)) Object.assign(car, before)
  const forward = forwardSpeed(car)
  const slip = speed > 0 ? Math.sqrt(Math.max(0, speed * speed - forward * forward)) / speed : 0
  pay(game, drift(game.score, speed, slip, DT))
  redLight(game, car)
  player.x = car.x
  player.y = car.y
}

/** A near miss or drift paid: its number shows over the player's car. */
const pay = (game: Game, amount: number) => {
  if (amount > 0) game.messages.push({ kind: "cash", amount, at: { kind: "player", times: game.score.times } })
}

/** Entering a junction while its light shows red to you. */
const redLight = (game: Game, car: Car) => {
  const light = game.signals.lights.find((l) => Math.hypot(l.junction.cx - car.x, l.junction.cy - car.y) < 12)
  const junction = light?.junction ?? null
  if (junction !== null && junction !== game.junction && Math.hypot(car.vx, car.vy) > 5 && lightFor(junction, car.angle, game.time) === "red") commit(game.wanted, "redLight")
  game.junction = junction
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

/**
 * Wanted level: as many police cars as cop heads, chasing. From two heads
 * their officers get out near you and come on foot with pistols; from three
 * they shoot from the cars too. Caught standing still next to one: BUSTED.
 */
const police = (world: World, game: Game) => {
  const level = wantedLevel(game.wanted)
  const { onFoot, shootFromCar } = tactics(level)
  const p = playerPos(game)
  const hits = (car: Car) => carHitsWall(world, car)
  const dist = (x: number, y: number) => Math.hypot(x - p.x, y - p.y)
  if (level === 0) game.cops = game.cops.filter((c) => dist(c.car.x, c.car.y) < COP_SIGHT)
  game.cops = game.cops.filter((c) => !isStuck(c) && dist(c.car.x, c.car.y) < 300)
  const onFootCops = () => game.fighters.filter((f) => f.kind === "cop" && !f.dead).length
  if (game.wasted <= 0 && game.cops.length < level && onFootCops() < level * FOOT_COPS_PER_LEVEL && Math.round(game.time * 60) % 30 === 0) {
    const cop = spawnCop(world, game.nextId++, p.x, p.y, game.random, hits)
    if (cop !== null) game.cops.push(cop)
  }
  const target = game.player.car ?? { x: p.x, y: p.y, vx: 0, vy: 0 }
  for (const cop of game.cops) {
    if (level === 0 || game.wasted > 0) {
      // Called off: roll to a stop.
      cop.car.vx *= 0.97
      cop.car.vy *= 0.97
      continue
    }
    stepCop(world, cop, target, DT, hits)
    const d = dist(cop.car.x, cop.car.y)
    // On foot you are arrested by hand: the officers get out at any level. From two heads they also leave the car to chase a driver.
    const leaves = game.player.car === null || onFoot
    if (leaves && d < EXIT_RANGE && Math.hypot(cop.car.vx, cop.car.vy) < 6 && onFootCops() < Math.max(1, level * FOOT_COPS_PER_LEVEL)) {
      // Out of the car, which stays where it stopped.
      game.cops = game.cops.filter((c) => c !== cop)
      cop.car.vx = 0
      cop.car.vy = 0
      game.parked.push(cop.car)
      leaveCar(game, cop.car)
      continue
    }
    cop.gun -= DT
    if (shootFromCar && d < CAR_SHOT_RANGE && cop.gun <= 0) {
      const aim = Math.atan2(p.y - cop.car.y, p.x - cop.car.x)
      fire(world, game, "police", "pistol", cop.car.x, cop.car.y, aim + (game.random() - 0.5) * 0.5)
      cop.gun = 1.3 + game.random() * 0.8
    }
  }
  const seen = game.cops.some((c) => dist(c.car.x, c.car.y) < COP_SIGHT) || game.fighters.some((f) => f.kind === "cop" && !f.dead && dist(f.x, f.y) < COP_SIGHT)
  coolDown(game.wanted, seen, DT)
  shoveAside(world, game)
  game.bust = arrested(game, level) ? game.bust + DT : 0
  if (game.bust >= BUST_S) busted(game)
}

/**
 * Is the player being arrested this step? Only on foot, only while not
 * fighting back, and only with an officer on foot right beside them (or a
 * police car stopped against them), GTA 2 style.
 */
export const arrested = (game: Game, level: number): boolean => {
  const { player } = game
  if (level === 0 || game.wasted > 0 || player.car !== null || player.ride !== null || game.fighting > 0) return false
  const near = (x: number, y: number, r: number) => Math.hypot(x - player.x, y - player.y) < r
  const byHand = game.fighters.some((f) => f.kind === "cop" && !f.dead && f.down <= 0 && near(f.x, f.y, BUST_HAND))
  const byCar = [...game.cops.map((c) => c.car), ...game.parked.filter((c) => c.model === POLICE_MODEL)].some((c) => Math.hypot(c.vx, c.vy) < 1 && near(c.x, c.y, BUST_RANGE))
  return byHand || byCar
}

/** Police cars do not drive over someone on foot: they push past. */
const shoveAside = (world: World, game: Game) => {
  const { player } = game
  if (player.car !== null || game.wasted > 0) return
  for (const c of game.cops) {
    const dx = player.x - c.car.x
    const dy = player.y - c.car.y
    const d = Math.hypot(dx, dy)
    if (d >= 2.3 || d === 0) continue
    const nx = player.x + (dx / d) * (2.3 - d)
    const ny = player.y + (dy / d) * (2.3 - d)
    if (!world.isSolid(nx, ny)) Object.assign(player, { x: nx, y: ny })
  }
}

/** Arrested: half your money, every gun and a life gone, back to Sudetenstraße 19 on foot. */
const busted = (game: Game) => {
  const { player, home } = game
  if (player.car !== null) getOut(game)
  player.ride = null
  game.score.money = Math.floor(game.score.money / 2)
  disarm(player.arsenal)
  game.messages.push({ kind: "busted" })
  loseLife(game)
  callOff(game)
  player.x = home.x
  player.y = home.y
  player.angle = home.angle
}

/** Payphones ring near you; the job in progress moves on; a steal or destroy job parks its car when you take it. */
const jobsStep = (world: World, game: Game) => {
  const { jobs } = game
  const p = playerPos(game)
  game.ringCooldown -= DT
  if (game.ringCooldown <= 0) {
    const ringing = jobs.phones.find((ph, i) => isRinging(jobs, i) && Math.hypot(ph.x - p.x, ph.y - p.y) < RING_HEARD_M)
    if (ringing !== undefined) game.sounds.push({ id: "ring", x: ringing.x, y: ringing.y })
    game.ringCooldown = RING_EVERY_S
  }
  const event = stepJobs(jobs, { player: p, car: game.player.car }, DT)
  if (event === null) return
  game.messages.push({ kind: "mission", text: event.text })
  if (event.kind === "start") {
    const car = jobCar(world, game, event.job)
    if (car !== null && jobs.active !== null) jobs.active.target = car
  } else if (event.kind === "passed") {
    game.score.money += event.reward
    game.messages.push({ kind: "cash", amount: event.reward, at: { kind: "player", times: 1 } })
    const g = event.job.gang
    if (g !== undefined) gangJobDone(game.respect, g.for, g.against)
  }
}

/** A gang with low respect for you attacks: its members near you on its turf come at you. */
const gangsStep = (game: Game) => {
  if (game.wasted > 0) return
  const p = playerPos(game)
  for (const w of game.walkers) {
    if (w.gang === undefined || w.dead || w.down > 0 || !isHostile(game.respect, w.gang)) continue
    if (Math.hypot(w.x - p.x, w.y - p.y) < GANG_SIGHT) enrage(game, w)
  }
}

/** What the HUD says when you cannot pay. */
const BROKE: Readonly<Record<"save" | "spray" | "cake", string>> = { save: "Speichern kostet", spray: "Neu lackieren kostet", cake: "Ein Stück Kuchen kostet" }

/** Save points, spray shops and the cake counter: pay, then save the game, respray the car and lose the police, or eat cake and heal. */
const shopsStep = (game: Game) => {
  if (game.wasted > 0) return
  const { player } = game
  for (const shop of game.shops) {
    const event = stepShop(shop, playerPos(game), player.car !== null, game.score.money)
    if (event === null) continue
    if (event.kind === "broke") {
      game.messages.push({ kind: "mission", text: `${BROKE[event.shop.kind]} $${COST[event.shop.kind]}.` })
      continue
    }
    if (event.kind === "cake") {
      game.score.money -= CAKE_COST
      player.vitals.hp = PERSON_HP
      const cake = CAKES[Math.floor(game.time) % CAKES.length] ?? CAKES[0]
      game.messages.push({ kind: "pickup", text: `${cake} bei ${shop.name}: volle Gesundheit!` }, { kind: "cash", amount: -CAKE_COST, at: null })
      game.sounds.push({ id: "pickup", x: shop.x, y: shop.y })
      continue
    }
    if (event.kind === "save") {
      game.score.money -= SAVE_COST
      game.messages.push({ kind: "saved", data: toSave(game) }, { kind: "cash", amount: -SAVE_COST, at: null })
      continue
    }
    const car = player.car
    if (car === null) continue
    game.score.money -= COST.spray
    car.paint = ((car.paint ?? 0) % (PAINTS - 1)) + 1
    // A new colour: nobody is looking for this car any more.
    Object.assign(game.wanted, noHeat())
    game.bust = 0
    game.messages.push({ kind: "mission", text: `Frisch lackiert bei ${shop.name}! Die Polizei sucht ein anderes Auto.` }, { kind: "cash", amount: -COST.spray, at: null })
  }
}

/** Meters within which you hear a ringing phone, and seconds between rings. */
const RING_HEARD_M = 70
const RING_EVERY_S = 1.4

/** The car a steal or destroy job is about, parked at the kerb by its place. */
const jobCar = (world: World, game: Game, job: Job): Car | null => {
  const { goal } = job
  if (goal.kind === "deliver") return null
  const at = world.roadAt(goal.at.x, goal.at.y, 80)
  const pts = at?.road.pts ?? []
  // The street's nearest vertex pair gives the heading; the car stands at the right-hand kerb.
  let best = { d: Infinity, x: goal.at.x, y: goal.at.y, angle: 0 }
  for (let i = 0; i + 3 < pts.length; i += 2) {
    const ax = pts[i] ?? 0
    const ay = pts[i + 1] ?? 0
    const bx = pts[i + 2] ?? 0
    const by = pts[i + 3] ?? 0
    const len2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1
    const t = Math.max(0, Math.min(1, ((goal.at.x - ax) * (bx - ax) + (goal.at.y - ay) * (by - ay)) / len2))
    const x = ax + (bx - ax) * t
    const y = ay + (by - ay) * t
    const d = Math.hypot(x - goal.at.x, y - goal.at.y)
    if (d < best.d) best = { d, x, y, angle: Math.atan2(by - ay, bx - ax) }
  }
  const half = (at?.road.width ?? 6) / 2
  for (const lane of [half + 1, half - 1, 0, -(half - 1)]) {
    const car: Car = { x: best.x - Math.sin(best.angle) * lane, y: best.y + Math.cos(best.angle) * lane, angle: best.angle, vx: 0, vy: 0, model: goal.model, vitals: vitals(CAR_HP) }
    if (carHitsWall(world, car)) continue
    // It takes the place of whoever had parked there.
    clearKerb(world, game, car.x, car.y, CAR_LENGTH + 1)
    game.parked.push(car)
    return car
  }
  return null
}

/** F: get out, or take the nearest parked car or NPC (the driver flees, GTA-style). */
const toggleCar = (world: World, game: Game) => {
  const { player } = game
  if (player.ride !== null) {
    leaveBus(world, game)
    return
  }
  if (player.car !== null) {
    getOut(game)
    return
  }
  const bus = busNear(game)
  if (bus !== null) {
    boardBus(game, bus)
    return
  }
  const dist = (x: number, y: number) => Math.hypot(x - player.x, y - player.y)
  const parked = game.parked.filter((c) => c.model !== BUS_MODEL).reduce<Car | null>((best, c) => (dist(c.x, c.y) < (best === null ? ENTER_RANGE : dist(best.x, best.y)) ? c : best), null)
  if (parked !== null) {
    game.parked = game.parked.filter((c) => c !== parked)
    player.car = parked
    game.messages.push({ kind: "car", text: carName(parked.model) })
    return
  }
  const npc = game.npcs.find((n) => n.bus === undefined && dist(n.x, n.y) < ENTER_RANGE)
  if (npc === undefined) return
  // Pulling a driver out in front of the police is car theft.
  if (policeNear(game, npc.x, npc.y, 40)) commit(game.wanted, "theft")
  game.npcs = game.npcs.filter((n) => n !== npc)
  player.car = { x: npc.x, y: npc.y, angle: npc.angle, vx: 0, vy: 0, model: npc.model, vitals: npc.vitals }
  game.messages.push({ kind: "car", text: carName(npc.model) })
}

/** Meters from the middle line of a bus to where you can still step in. */
const BOARD_REACH = 3.2

/** The bus beside you (any speed), if one is within reach of its body. */
export const busNear = (game: Game): Npc | null => {
  const { player } = game
  if (player.car !== null || player.ride !== null || game.wasted > 0) return null
  let best: Npc | null = null
  let bestD = BOARD_REACH
  for (const n of game.npcs) {
    if (n.bus === undefined) continue
    // Along the bus, clamped to its length: the distance from you to its body.
    const along = Math.max(-BUS_LENGTH / 2, Math.min(BUS_LENGTH / 2, (player.x - n.x) * Math.cos(n.angle) + (player.y - n.y) * Math.sin(n.angle)))
    const d = Math.hypot(player.x - (n.x + Math.cos(n.angle) * along), player.y - (n.y + Math.sin(n.angle) * along))
    if (d < bestD) {
      best = n
      bestD = d
    }
  }
  return best
}

/** A bus that stands (at a stop, or at a red light) takes you; a moving one does not. */
const BOARD_SPEED = 0.8

const boardBus = (game: Game, bus: Npc) => {
  const trip = bus.bus
  if (trip === undefined) return
  if (bus.speed > BOARD_SPEED) {
    game.messages.push({ kind: "mission", text: `Linie ${trip.line.ref} fährt noch: einsteigen, wenn der Bus hält.` })
    return
  }
  game.player.ride = { bus, getOff: false, boarded: { run: trip.run, halt: trip.halt } }
  game.player.moving = false
  game.messages.push({ kind: "mission", text: `Linie ${trip.line.ref} Richtung ${direction(trip)}. F: beim nächsten Halt aussteigen.` })
}

/** F on the bus: out at once when it stands, otherwise at the next stop (F again takes that back). */
const leaveBus = (world: World, game: Game) => {
  const ride = game.player.ride
  if (ride === null) return
  if (ride.bus.speed <= BOARD_SPEED) return alight(world, game)
  ride.getOff = !ride.getOff
  const next = ride.bus.bus === undefined ? "" : nextStop(ride.bus.bus)
  game.messages.push({ kind: "mission", text: ride.getOff ? `Ausstieg: ${next}` : "Du fährst weiter mit." })
}

/** Step out of the bus on its door side (the right), or the other if a wall is there. */
const alight = (world: World, game: Game) => {
  const { player } = game
  const bus = player.ride?.bus
  player.ride = null
  if (bus === undefined) return
  for (const off of [2.6, -2.6, 4]) {
    const a = bus.angle + Math.PI / 2
    const x = bus.x + Math.cos(a) * off
    const y = bus.y + Math.sin(a) * off
    if (world.isSolid(x, y)) continue
    Object.assign(player, { x, y, angle: a })
    return
  }
  Object.assign(player, { x: bus.x, y: bus.y })
}

/**
 * Riding: you go where the bus goes. You get out where you asked to (its next stop), at the end of the
 * line, and when the bus is wrecked (it burns, you step out on the spot).
 */
const rideBus = (world: World, game: Game) => {
  const { player } = game
  const ride = player.ride
  if (ride === null) return
  const bus = ride.bus
  const trip = bus.bus
  player.moving = false
  Object.assign(player, { x: bus.x, y: bus.y, angle: bus.angle })
  if (!game.npcs.includes(bus) || isBurning(bus.vitals)) return alight(world, game)
  if (trip === undefined || trip.dwell <= 0) return
  const boardedHere = trip.run === ride.boarded.run && trip.halt === ride.boarded.halt
  if (ride.getOff || (atTerminus(trip) && !boardedHere)) alight(world, game)
}

/** Speed in km/h for the HUD. */
export const speedKmh = (game: Game) => (game.player.car === null ? 0 : Math.abs(forwardSpeed(game.player.car)) * 3.6)
