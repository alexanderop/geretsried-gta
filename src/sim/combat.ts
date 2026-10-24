/**
 * GTA 2 combat on top of the damage model: firing the weapon in hand
 * (punches, bullets along a ray that walls stop, thrown molotovs, rockets, a
 * cone of flame), explosions with radius damage and knockback, cars that
 * burn down and blow up (setting off the ones beside them), and people on
 * foot who come at you: police officers with pistols and tough guys with
 * their fists.
 */
import type { World } from "#/world/world.ts"
import type { Effect, Fighter, Game, Point, Shooter, SoundId } from "./state.ts"
import { CAR_LENGTH, CAR_WIDTH, type Car } from "./car.ts"
import type { Npc } from "./traffic.ts"
import { spawnWalker, kill, knockDown, scare, CORPSE_S, type Walker } from "./pedestrians.ts"
import { burnCar, burnPerson, hurt, ignite, isBurning, isDead, vitals, PERSON_HP, type DamageSource } from "./damage.ts"
import { WEAPONS, bulletAngles, type WeaponId } from "./weapons.ts"
import { blast, inBox, inCone, rayBox, rayCircle, rayWall, type Box } from "./hitscan.ts"
import { commit, tactics } from "./wanted.ts"
import { POLICE_MODEL } from "./vehicles.ts"

/** Anything with a body a shot can hit. */
type Target =
  | { readonly kind: "walker"; readonly w: Walker }
  | { readonly kind: "fighter"; readonly f: Fighter }
  | { readonly kind: "player" }
  | { readonly kind: "car"; readonly car: Car | Npc }

const PERSON_R = 0.5
/** Share of a bullet's damage a car takes: GTA 2 cars soak up a magazine before they burn. */
const CAR_BULLET = 0.35
/** Share of the police's bullets that lands on you: a pistol shot hurts, a volley does not kill outright. */
const POLICE_BULLET = 0.3
const ROCKET_SPEED = 32
const MOLOTOV_SPEED = 14
const BLAST_R = 6.5
const BLAST_MAX = 160
/** A car's petrol tank goes up bigger than a rocket: the next car in a row catches fire, which is what makes GTA 2's chains. */
const CAR_BLAST_R = 7.5
const CAR_BLAST_MAX = 220
/** Meters per second a blast throws someone or something at its centre. */
const KNOCKBACK = 9
const FIRE_PATCH_R = 2.8
const FIRE_PATCH_S = 6
/** A car in a burning patch loses this many hp per second. */
const PATCH_CAR_HP_S = 25
/** How far gunfire carries: people within this run, police within it notice. */
const ALARM_M = 32
const COP_SIGHT = 45
const MAX_EFFECTS = 320
const MAX_DECALS = 60
const MAX_WRECKS = 30
const FOOT_COP_SPEED = 5.2
const THUG_SPEED = 5
/** A police officer on foot opens fire inside this range, with this much wobble. */
const COP_RANGE = 18
const COP_AIM = 0.2
/** The longest the player stays on fire. */
const PLAYER_FIRE_S = 1.8

const carBox = (c: { readonly x: number; readonly y: number; readonly angle: number }): Box => ({ x: c.x, y: c.y, angle: c.angle, hl: CAR_LENGTH / 2, hw: CAR_WIDTH / 2 })

export const effect = (game: Game, e: Omit<Effect, "t">): void => {
  if (game.effects.length >= MAX_EFFECTS) game.effects.shift()
  game.effects.push({ ...e, t: 0 })
}

const sound = (game: Game, id: SoundId, at: Point) => {
  game.sounds.push({ id, x: at.x, y: at.y })
}

/** Is the police watching (x, y): a chasing car, an officer on foot, or a patrol car going by? */
const policeSee = (game: Game, x: number, y: number) =>
  game.cops.some((c) => Math.hypot(c.car.x - x, c.car.y - y) < COP_SIGHT) ||
  game.fighters.some((f) => f.kind === "cop" && !f.dead && Math.hypot(f.x - x, f.y - y) < COP_SIGHT) ||
  game.npcs.some((n) => n.model === POLICE_MODEL && Math.hypot(n.x - x, n.y - y) < COP_SIGHT)

/** A noise at (x, y): people near run screaming; the player's gunfire in front of the police adds heat. */
const alarm = (game: Game, x: number, y: number, from: Shooter, range = ALARM_M) => {
  let scared = false
  for (const w of game.walkers) {
    if (w.dead || Math.hypot(w.x - x, w.y - y) > range) continue
    if (w.panic <= 0) scared = true
    scare(w, x, y)
  }
  if (scared && game.screamCooldown <= 0) {
    sound(game, "scream", { x, y })
    game.screamCooldown = 1.5 + game.random()
  }
  if (from === "player" && game.gunfireCooldown <= 0 && policeSee(game, x, y)) {
    commit(game.wanted, "gunfire")
    game.gunfireCooldown = 1
  }
}

/** Who a shot can hit, and the cars in its way. The police aim at the player, so their bullets pass the other officers. */
const people = (game: Game, from: Shooter): Array<Target> => {
  const out: Array<Target> = []
  for (const w of game.walkers) if (!w.dead) out.push({ kind: "walker", w })
  if (from === "player") for (const f of game.fighters) if (!f.dead) out.push({ kind: "fighter", f })
  if (from === "police" && game.player.car === null && game.wasted <= 0) out.push({ kind: "player" })
  return out
}

const cars = (game: Game, from: Shooter): Array<Car | Npc> => {
  // Officers do not shoot up the police cars they got out of.
  const out: Array<Car | Npc> = [...game.npcs, ...(from === "police" ? game.parked.filter((c) => c.model !== POLICE_MODEL) : game.parked)]
  if (from === "player") for (const c of game.cops) out.push(c.car)
  else if (game.player.car !== null) out.push(game.player.car)
  return out
}

const posOf = (game: Game, t: Target): Point => (t.kind === "walker" ? t.w : t.kind === "fighter" ? t.f : t.kind === "player" ? game.player : t.car)

/** The first thing along a ray (walls stop it), and how far along it is. */
const cast = (world: World, game: Game, from: Shooter, ox: number, oy: number, angle: number, range: number): { readonly t: number; readonly target: Target | null } => {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  let best = rayWall(world.isSolid, ox, oy, dx, dy, range)
  let target: Target | null = null
  for (const p of people(game, from)) {
    const at = posOf(game, p)
    const t = rayCircle(ox, oy, dx, dy, at.x, at.y, PERSON_R)
    if (t !== null && t < best) {
      best = t
      target = p
    }
  }
  for (const car of cars(game, from)) {
    const t = rayBox(ox, oy, dx, dy, carBox(car))
    if (t !== null && t < best) {
      best = t
      target = { kind: "car", car }
    }
  }
  return { t: best, target }
}

/** A tough guy you hit gets up off the sidewalk and comes for you. */
const enrage = (game: Game, w: Walker) => {
  game.walkers = game.walkers.filter((o) => o !== w)
  game.fighters.push({ id: w.id, kind: "thug", x: w.x, y: w.y, angle: w.angle, vitals: w.vitals, sprite: w.sprite, stride: 0, cooldown: 0.6, down: w.down, dead: false, temper: 14 })
}

const killFighter = (game: Game, f: Fighter, from: Shooter) => {
  if (f.dead) return
  f.dead = true
  f.down = CORPSE_S
  f.vitals.fire = 0
  if (from === "player") commit(game.wanted, f.kind === "cop" ? "copKill" : "kill")
}

/** `amount` of `source` damage to whatever was hit; `down` seconds off their feet for people who survive it. */
const damage = (game: Game, target: Target, amount: number, source: DamageSource, from: Shooter, down: number) => {
  if (target.kind === "car") {
    hurt(target.car.vitals, source === "bullet" ? amount * CAR_BULLET : amount, source)
    return
  }
  if (target.kind === "player") {
    hurt(game.player.vitals, from === "police" ? amount * POLICE_BULLET : amount, source)
    return
  }
  if (target.kind === "fighter") {
    const { f } = target
    hurt(f.vitals, amount, source)
    if (isDead(f.vitals)) killFighter(game, f, from)
    else if (down > 0) f.down = Math.max(f.down, down)
    // A hit officer is not put off; a tough guy gets angrier.
    if (f.kind === "thug") f.temper = 14
    return
  }
  const { w } = target
  hurt(w.vitals, amount, source)
  if (isDead(w.vitals)) {
    kill(w)
    if (from === "player") commit(game.wanted, "kill")
    return
  }
  if (down > 0) knockDown(w, down)
  if (w.tough && from === "player" && source !== "explosion") enrage(game, w)
}

/** Fire `weapon` from (x, y) towards `angle`: what happens depends on the weapon's kind. */
export const fire = (world: World, game: Game, from: Shooter, weapon: WeaponId, x: number, y: number, angle: number): void => {
  const spec = WEAPONS[weapon]
  const mx = x + Math.cos(angle) * 0.8
  const my = y + Math.sin(angle) * 0.8
  if (spec.kind === "melee") {
    punch(game, from, x, y, angle, spec.damage)
    return
  }
  if (spec.kind === "bullet") {
    effect(game, { kind: "muzzle", x: mx, y: my, x2: mx, y2: my, angle, life: 0.06, size: weapon === "shotgun" ? 1.6 : 1.1 })
    for (const a of bulletAngles(angle, spec, game.random)) {
      const hit = cast(world, game, from, mx, my, a, spec.range)
      const ex = mx + Math.cos(a) * hit.t
      const ey = my + Math.sin(a) * hit.t
      effect(game, { kind: "tracer", x: mx, y: my, x2: ex, y2: ey, angle: a, life: 0.07, size: 0.18 })
      if (hit.target === null) {
        // A wall or the end of the range: a puff of dust.
        if (hit.t < spec.range - 0.5) effect(game, { kind: "puff", x: ex, y: ey, x2: ex, y2: ey, angle: a, life: 0.35, size: 0.7 })
        continue
      }
      damage(game, hit.target, spec.damage, "bullet", from, 1.4)
    }
    sound(game, from === "police" ? "copShot" : weapon === "smg" ? "smg" : weapon === "shotgun" ? "shotgun" : "pistol", { x, y })
    alarm(game, x, y, from)
    return
  }
  if (spec.kind === "thrown") {
    // It flies to its range or breaks on the first wall.
    const reach = Math.max(1.5, rayWall(world.isSolid, x, y, Math.cos(angle), Math.sin(angle), spec.range) - 0.4)
    const life = reach / MOLOTOV_SPEED
    game.projectiles.push({ kind: "molotov", from, x: mx, y: my, vx: Math.cos(angle) * MOLOTOV_SPEED, vy: Math.sin(angle) * MOLOTOV_SPEED, t: 0, life })
    return
  }
  if (spec.kind === "rocket") {
    game.projectiles.push({ kind: "rocket", from, x: mx, y: my, vx: Math.cos(angle) * ROCKET_SPEED, vy: Math.sin(angle) * ROCKET_SPEED, t: 0, life: spec.range / ROCKET_SPEED })
    effect(game, { kind: "muzzle", x: mx, y: my, x2: mx, y2: my, angle, life: 0.1, size: 1.8 })
    sound(game, "rocket", { x, y })
    alarm(game, x, y, from)
    return
  }
  flame(world, game, from, x, y, angle, spec.range, spec.spread / 2, spec.damage)
}

/** The flamer: everything in a short cone in front (walls cut it short) burns. */
const flame = (world: World, game: Game, from: Shooter, x: number, y: number, angle: number, range: number, half: number, amount: number) => {
  const reach = rayWall(world.isSolid, x, y, Math.cos(angle), Math.sin(angle), range)
  for (const p of people(game, from)) {
    const at = posOf(game, p)
    if (!inCone(x, y, angle, reach, half, at.x, at.y)) continue
    damage(game, p, amount, "fire", from, 0)
    if (p.kind === "walker") ignite(p.w.vitals)
    else if (p.kind === "fighter") ignite(p.f.vitals)
    else ignite(game.player.vitals)
  }
  for (const car of cars(game, from)) if (inCone(x, y, angle, reach + CAR_LENGTH / 2, half, car.x, car.y)) hurt(car.vitals, amount, "fire")
  for (let i = 0; i < 2; i++) {
    const a = angle + (game.random() - 0.5) * half * 2
    const d = reach * (0.55 + game.random() * 0.45)
    effect(game, { kind: "flame", x: x + Math.cos(angle) * 0.9, y: y + Math.sin(angle) * 0.9, x2: x + Math.cos(a) * d, y2: y + Math.sin(a) * d, angle: a, life: 0.35, size: 1.6 })
  }
  if (Math.round(game.time * 60) % 6 === 0) {
    sound(game, "flame", { x, y })
    alarm(game, x, y, from, 20)
  }
}

/** A punch: the nearest person in reach in front of you goes down. */
const punch = (game: Game, from: Shooter, x: number, y: number, angle: number, amount: number) => {
  const range = WEAPONS.fists.range
  let best: Target | null = null
  let bestD = Infinity
  for (const p of people(game, from)) {
    const at = posOf(game, p)
    const d = Math.hypot(at.x - x, at.y - y)
    if (d < bestD && inCone(x, y, angle, range, 0.9, at.x, at.y)) {
      best = p
      bestD = d
    }
  }
  if (best === null) return
  damage(game, best, amount, "fist", from, 2.5)
  sound(game, "punch", { x, y })
}

/** A wall-sliding step on foot, like the player's own. */
const stepFoot = (world: World, p: { x: number; y: number }, angle: number, speed: number, dt: number) => {
  const dx = Math.cos(angle) * speed * dt
  const dy = Math.sin(angle) * speed * dt
  if (!world.isSolid(p.x + dx + Math.sign(dx) * 0.4, p.y)) p.x += dx
  if (!world.isSolid(p.x, p.y + dy + Math.sign(dy) * 0.4)) p.y += dy
}

/** Push a person by `speed` m/s for an instant, away from (x, y), as far as the walls allow. */
const throwBack = (world: World, p: { x: number; y: number }, x: number, y: number, speed: number) => {
  const a = Math.atan2(p.y - y, p.x - x)
  for (let i = 0; i < 6; i++) stepFoot(world, p, a, speed, 0.05)
}

/** An explosion: blast damage falling off with distance, people thrown and knocked down, cars shoved and set alight, a scorch mark. */
export const explode = (world: World, game: Game, x: number, y: number, from: Shooter, radius = BLAST_R, max = BLAST_MAX): void => {
  effect(game, { kind: "blast", x, y, x2: x, y2: y, angle: game.random() * Math.PI * 2, life: 1.1, size: radius * 1.2 })
  if (game.decals.length >= MAX_DECALS) game.decals.shift()
  game.decals.push({ x, y, angle: game.random() * Math.PI * 2, size: radius * 0.9 })
  sound(game, "explosion", { x, y })
  alarm(game, x, y, from, 50)
  const hit = (p: Point) => blast(Math.hypot(p.x - x, p.y - y), radius, max)
  for (const w of game.walkers) {
    if (w.dead) continue
    const amount = hit(w)
    if (amount > 0) damage(game, { kind: "walker", w }, amount, "explosion", from, 3)
  }
  for (const f of game.fighters) {
    if (f.dead) continue
    const amount = hit(f)
    if (amount <= 0) continue
    damage(game, { kind: "fighter", f }, amount, "explosion", from, 2.5)
    throwBack(world, f, x, y, KNOCKBACK * (amount / max))
  }
  const { player } = game
  if (player.car === null && game.wasted <= 0) {
    const amount = hit(player)
    if (amount > 0) {
      hurt(player.vitals, amount, "explosion")
      throwBack(world, player, x, y, KNOCKBACK * (amount / max))
    }
  }
  const shove = (car: Car) => {
    const d = Math.hypot(car.x - x, car.y - y) || 1
    const k = (KNOCKBACK * hit(car)) / max
    car.vx += ((car.x - x) / d) * k
    car.vy += ((car.y - y) / d) * k
  }
  for (const n of game.npcs) hurt(n.vitals, hit(n), "explosion")
  for (const car of [...game.parked, ...game.cops.map((c) => c.car), ...(player.car === null ? [] : [player.car])]) {
    const amount = hit(car)
    if (amount <= 0) continue
    hurt(car.vitals, amount, "explosion")
    shove(car)
  }
}

/** Rockets fly until they hit something; molotovs arc to where they were thrown and break into a pool of fire. */
const stepProjectiles = (world: World, game: Game, dt: number) => {
  const flying = game.projectiles
  game.projectiles = []
  for (const p of flying) {
    p.t += dt
    const nx = p.x + p.vx * dt
    const ny = p.y + p.vy * dt
    if (p.kind === "molotov") {
      p.x = nx
      p.y = ny
      if (p.t < p.life) game.projectiles.push(p)
      else {
        game.fires.push({ x: p.x, y: p.y, r: FIRE_PATCH_R, t: 0, life: FIRE_PATCH_S, from: p.from })
        sound(game, "molotov", p)
        alarm(game, p.x, p.y, p.from)
      }
      continue
    }
    const hitsBody = people(game, p.from).some((t) => {
      const at = posOf(game, t)
      return Math.hypot(at.x - nx, at.y - ny) < PERSON_R + 0.2
    })
    const hitsCar = cars(game, p.from).some((c) => inBox(nx, ny, carBox(c)))
    if (world.isSolid(nx, ny)) explode(world, game, p.x, p.y, p.from)
    else if (hitsBody || hitsCar || p.t >= p.life) explode(world, game, nx, ny, p.from)
    else {
      p.x = nx
      p.y = ny
      game.projectiles.push(p)
      if (Math.round(p.t * 60) % 2 === 0) effect(game, { kind: "puff", x: nx, y: ny, x2: nx, y2: ny, angle: 0, life: 0.5, size: 0.8 })
    }
  }
}

/** Burning pools from molotovs: they set people alight and cook cars. */
const stepFires = (game: Game, dt: number) => {
  for (const f of game.fires) {
    f.t += dt
    const inside = (p: Point, extra = 0) => Math.hypot(p.x - f.x, p.y - f.y) < f.r + extra
    for (const t of people(game, f.from)) {
      const at = posOf(game, t)
      if (!inside(at)) continue
      if (t.kind === "walker") ignite(t.w.vitals)
      else if (t.kind === "fighter") ignite(t.f.vitals)
      else ignite(game.player.vitals)
    }
    // A molotov at your own feet burns you too.
    if (f.from === "player" && game.player.car === null && inside(game.player)) ignite(game.player.vitals)
    for (const car of cars(game, f.from)) if (inside(car, 1)) hurt(car.vitals, PATCH_CAR_HP_S * dt, "fire")
    if (Math.round(f.t * 60) % 4 === 0) {
      const a = game.random() * Math.PI * 2
      const r = game.random() * f.r
      effect(game, { kind: "flame", x: f.x + Math.cos(a) * r, y: f.y + Math.sin(a) * r, x2: f.x + Math.cos(a) * r, y2: f.y + Math.sin(a) * r, angle: 0, life: 0.6, size: 1.4 })
    }
  }
  game.fires = game.fires.filter((f) => f.t < f.life)
}

/** Burning traffic stops and its driver runs; a burning police car's officer gets out and fights on foot. */
const abandonBurning = (world: World, game: Game) => {
  for (const n of game.npcs.filter((o) => isBurning(o.vitals))) {
    game.npcs = game.npcs.filter((o) => o !== n)
    game.parked.push({ x: n.x, y: n.y, angle: n.angle, vx: 0, vy: 0, model: n.model, vitals: n.vitals })
    const driver = spawnWalker(world, game.nextId++, n.x, n.y, 0, 8, game.random)
    if (driver !== null) {
      scare(driver, n.x, n.y)
      game.walkers.push(driver)
    }
  }
  for (const cop of game.cops.filter((c) => isBurning(c.car.vitals))) {
    game.cops = game.cops.filter((c) => c !== cop)
    game.parked.push(cop.car)
    leaveCar(game, cop.car)
  }
}

/** An officer gets out of a police car, on its side away from the driver's door. */
export const leaveCar = (game: Game, car: Car): void => {
  const side = car.angle + Math.PI / 2
  const id = game.nextId++
  game.fighters.push({
    id,
    kind: "cop",
    x: car.x + Math.cos(side) * 1.8,
    y: car.y + Math.sin(side) * 1.8,
    angle: car.angle,
    vitals: vitals(PERSON_HP),
    sprite: 1 + (id % 3),
    stride: 0,
    cooldown: 0.8,
    down: 0,
    dead: false,
    temper: 0,
  })
}

/** Cars standing around roll off what shoved them. */
const slideParked = (world: World, game: Game, dt: number) => {
  for (const car of game.parked) {
    if (car.vx === 0 && car.vy === 0) continue
    const nx = car.x + car.vx * dt
    const ny = car.y + car.vy * dt
    if (world.isSolid(nx, ny)) {
      car.vx = 0
      car.vy = 0
      continue
    }
    car.x = nx
    car.y = ny
    car.vx *= 0.9
    car.vy *= 0.9
    if (Math.hypot(car.vx, car.vy) < 0.1) {
      car.vx = 0
      car.vy = 0
    }
  }
}

/** Cars on fire burn down and blow up into wrecks; the player's own car too, with the player in it if they stayed. */
const burnDown = (world: World, game: Game, dt: number, onPlayerCar: () => void) => {
  const bang: Array<Car> = []
  for (const car of game.parked) if (burnCar(car.vitals, dt)) bang.push(car)
  const own = game.player.car
  if (own !== null && burnCar(own.vitals, dt)) {
    onPlayerCar()
    bang.push(own)
  }
  for (const car of bang) {
    game.parked = game.parked.filter((c) => c !== car)
    if (game.wrecks.length >= MAX_WRECKS) game.wrecks.shift()
    game.wrecks.push({ ...car, vx: 0, vy: 0 })
    // Whoever lit it, a chain of burning cars is the player's doing as far as the police are concerned.
    explode(world, game, car.x, car.y, "player", CAR_BLAST_R, CAR_BLAST_MAX)
  }
}

/** Burning people on foot, and the player's own fire. */
const burnPeople = (game: Game, dt: number) => {
  for (const f of game.fighters) {
    if (f.dead || f.vitals.fire <= 0) continue
    burnPerson(f.vitals, dt)
    if (isDead(f.vitals)) killFighter(game, f, "player")
  }
  // You burn shorter than the people you set alight: a scorch to run from, not a death sentence.
  const own = game.player.vitals
  own.fire = Math.min(own.fire, PLAYER_FIRE_S)
  if (game.wasted <= 0) burnPerson(own, dt)
}

/** Police on foot chase and shoot; tough guys chase and punch until they cool off. Bodies stay a while, then go. */
const stepFighters = (world: World, game: Game, level: number, dt: number) => {
  const { player } = game
  const target = player.car ?? player
  const alive = game.wasted <= 0
  for (const f of game.fighters) {
    if (f.dead) {
      f.down -= dt
      continue
    }
    if (f.down > 0) {
      f.down -= dt
      continue
    }
    f.cooldown -= dt
    const d = Math.hypot(target.x - f.x, target.y - f.y)
    const aim = Math.atan2(target.y - f.y, target.x - f.x)
    if (f.vitals.fire > 0) {
      // On fire: running about, no thought of you.
      f.angle += (game.random() - 0.5) * 0.6
      stepFoot(world, f, f.angle, THUG_SPEED, dt)
      f.stride += dt * 20
      continue
    }
    const chase = f.kind === "cop" ? level > 0 && alive : f.temper > 0 && d < 30 && alive
    if (f.kind === "thug") f.temper -= dt
    if (!chase) continue
    f.angle = aim
    if (f.kind === "cop") {
      const sees = d < COP_RANGE && rayWall(world.isSolid, f.x, f.y, Math.cos(aim), Math.sin(aim), d) >= d - 0.5
      if (tactics(level).onFoot && sees) {
        if (f.cooldown <= 0) {
          fire(world, game, "police", "pistol", f.x, f.y, aim + (game.random() - 0.5) * COP_AIM * 2)
          f.cooldown = 1.1 + game.random() * 0.7
        }
        if (d < 8) continue
      }
      if (d > 1.2) {
        stepFoot(world, f, aim, FOOT_COP_SPEED, dt)
        f.stride += FOOT_COP_SPEED * dt * 4
      }
      continue
    }
    if (d > 1.1) {
      stepFoot(world, f, aim, THUG_SPEED, dt)
      f.stride += THUG_SPEED * dt * 4
    } else if (f.cooldown <= 0 && player.car === null) {
      hurt(player.vitals, 9, "fist")
      sound(game, "punch", f)
      f.cooldown = 0.75
    }
  }
  game.fighters = game.fighters.filter((f) => (f.dead ? f.down > 0 : Math.hypot(f.x - target.x, f.y - target.y) < 90))
}

/** The player's car running people over: walkers are handled by stepWalker; these are the ones off the sidewalk. */
const runOver = (game: Game) => {
  const car = game.player.car
  if (car === null) return
  const speed = Math.hypot(car.vx, car.vy)
  if (speed < 3) return
  for (const f of game.fighters) {
    if (f.dead || f.down > 0 || Math.hypot(f.x - car.x, f.y - car.y) > 1.8) continue
    damage(game, { kind: "fighter", f }, speed * 5, "car", "player", 3)
  }
}

/** One step of everything combat: shots in flight, fires, burning cars and people, people on foot, effects. */
export const stepCombat = (world: World, game: Game, level: number, dt: number, onPlayerCarExplodes: () => void): void => {
  game.gunfireCooldown = Math.max(0, game.gunfireCooldown - dt)
  game.screamCooldown = Math.max(0, game.screamCooldown - dt)
  stepProjectiles(world, game, dt)
  stepFires(game, dt)
  abandonBurning(world, game)
  slideParked(world, game, dt)
  burnDown(world, game, dt, onPlayerCarExplodes)
  burnPeople(game, dt)
  stepFighters(world, game, level, dt)
  runOver(game)
  for (const e of game.effects) e.t += dt
  game.effects = game.effects.filter((e) => e.t < e.life)
}

/** Has this person a body to draw: alive, or a body not yet faded? */
export const bodyAlpha = (p: { readonly dead: boolean; readonly down: number }, fade: number) => (p.dead ? Math.max(0, Math.min(1, p.down / fade)) : 1)
