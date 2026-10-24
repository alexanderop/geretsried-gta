/**
 * The moving things, rebuilt every frame as sprite quads in the same 3D
 * space as the town: cars at roof height and people at head height, so
 * buildings in front of them hide them, plus their shadows on the ground.
 */
import { SHADOW_DIR } from "#/map/photo.ts"
import { CAR_LENGTH } from "#/sim/car.ts"
import { POLICE_MODEL } from "#/sim/vehicles.ts"
import { SMOKE_HP, type Game } from "#/sim/game.ts"
import type { Car } from "#/sim/car.ts"
import { missionTarget } from "#/sim/mission.ts"
import { lightFor, type Light, type TrafficLight } from "#/sim/signals.ts"
import { CORPSE_FADE_S, type Walker } from "#/sim/pedestrians.ts"
import type { Effect, Fighter, Projectile } from "#/sim/state.ts"
import type { Vitals } from "#/sim/damage.ts"
import { isAvailable, type Pickup } from "#/sim/pickups.ts"
import { isBurning } from "#/sim/damage.ts"
import { bodyAlpha } from "#/sim/combat.ts"
import { Fx, MeshBuilder, Mode, PICKUP_SPRITES, Sprite, spriteQuad, type Rgba, type SpriteBoxes } from "./mesh.ts"

const WHITE: Rgba = [255, 255, 255, 255]
const SHADOW: Rgba = [14, 22, 40, 100]
const SHADOW_Z = 0.1
const CAR_Z = 1.5
const PED_Z = 1.75
const LIGHT_Z = 4

type Placed = { readonly x: number; readonly y: number; readonly angle: number }

const sprite = (m: MeshBuilder, boxes: SpriteBoxes, layer: number, at: Placed, z: number, length: number, shadow: number, color: Rgba = WHITE) => {
  const box = boxes[layer] ?? [1, 1]
  const width = (length * box[1]) / box[0]
  spriteQuad(m, { ...at, z, length, width }, layer, box, color, Mode.sprite)
  m.target = "shadow"
  spriteQuad(m, { x: at.x + SHADOW_DIR[0] * shadow, y: at.y + SHADOW_DIR[1] * shadow, z: SHADOW_Z, angle: at.angle, length, width }, layer, box, SHADOW, Mode.silhouette)
  m.target = "opaque"
}

const car = (m: MeshBuilder, boxes: SpriteBoxes, at: Placed & { readonly model: number }) =>
  sprite(m, boxes, Sprite.car + at.model, at, CAR_Z, CAR_LENGTH * 1.08, 0.7)

/** Someone on the ground: knocked down (they get up) or dead (they fade after a while). No blood, as in GTA 2's cartoon. */
const lying = (m: MeshBuilder, boxes: SpriteBoxes, layer: number, at: Placed, alpha: number, tint: Rgba = WHITE) =>
  sprite(m, boxes, layer, { x: at.x, y: at.y, angle: at.angle + Math.PI / 2 }, 0.3, 1.5, 0.1, [Math.round(tint[0] * 0.8), Math.round(tint[1] * 0.8), Math.round(tint[2] * 0.8), Math.round(255 * alpha)])

/** Flames on someone or something burning. */
const flames = (m: MeshBuilder, boxes: SpriteBoxes, x: number, y: number, z: number, size: number, time: number, seed: number) => {
  const flicker = 1 + Math.sin(time * 23 + seed) * 0.12
  spriteQuad(m, { x, y, z, angle: Math.sin(time * 3 + seed) * 0.2 - Math.PI / 2, length: size * flicker, width: size * 0.8 * flicker }, Sprite.fx + Fx.fire, box(boxes, Sprite.fx + Fx.fire), WHITE, Mode.sprite)
  spriteQuad(m, { x, y, z: z - 0.05, angle: 0, length: size * 2.2, width: size * 2.2 }, Sprite.glow, box(boxes, Sprite.glow), [255, 140, 40, 120], Mode.sprite)
}

const walker = (m: MeshBuilder, boxes: SpriteBoxes, w: Walker, time: number) => {
  if (w.down > 0) lying(m, boxes, Sprite.ped + w.sprite, w, bodyAlpha(w, CORPSE_FADE_S))
  else {
    const bob = 1 + Math.sin(w.stride) * 0.05
    sprite(m, boxes, Sprite.ped + w.sprite, { x: w.x, y: w.y, angle: w.angle + Math.sin(w.stride / 2) * 0.08 }, PED_Z, 1.25 * bob, 0.9)
  }
  if (w.vitals.fire > 0) flames(m, boxes, w.x, w.y, PED_Z + 0.1, 1.3, time, w.id)
}

/** Police on foot in blue, tough guys a little flushed. */
const COP_TINT: Rgba = [130, 160, 255, 255]
const THUG_TINT: Rgba = [255, 200, 185, 255]

const fighter = (m: MeshBuilder, boxes: SpriteBoxes, f: Fighter, time: number) => {
  const tint = f.kind === "cop" ? COP_TINT : THUG_TINT
  if (f.down > 0 || f.dead) lying(m, boxes, Sprite.ped + f.sprite, f, bodyAlpha(f, CORPSE_FADE_S), tint)
  else sprite(m, boxes, Sprite.ped + f.sprite, { x: f.x, y: f.y, angle: f.angle + Math.sin(f.stride / 2) * 0.08 }, PED_Z, 1.3 * (1 + Math.sin(f.stride) * 0.05), 0.9, tint)
  if (f.vitals.fire > 0) flames(m, boxes, f.x, f.y, PED_Z + 0.1, 1.3, time, f.id)
}

const LAMP: Readonly<Record<Light, Rgba>> = { red: [255, 59, 48, 255], yellow: [255, 204, 0, 255], green: [52, 199, 89, 255] }
const OFF: Rgba = [58, 58, 60, 255]
const HOUSING: Rgba = [28, 28, 30, 255]
const LAMPS: ReadonlyArray<Light> = ["red", "yellow", "green"]

/** A signal head on the right-hand curb, facing traffic on the light's road, glowing in its current colour. */
const light = (m: MeshBuilder, boxes: SpriteBoxes, l: TrafficLight, time: number) => {
  const heads = l.junction.size === 1 ? [l.heading, l.heading + Math.PI / 2] : [l.heading]
  for (const heading of heads) {
    for (const side of l.direction === "both" ? [1, -1] : [l.direction === "forward" ? 1 : -1]) {
      const facing = heading + (side === 1 ? 0 : Math.PI)
      const state = lightFor(l.junction, facing, time)
      const off = l.roadWidth / 2 + 0.8
      const x = l.x - Math.sin(facing) * off
      const y = l.y + Math.cos(facing) * off
      const box = (layer: number): readonly [number, number] => boxes[layer] ?? [1, 1]
      spriteQuad(m, { x, y, z: LIGHT_Z - 0.05, angle: facing, length: 4.4, width: 4.4 }, Sprite.glow, box(Sprite.glow), LAMP[state], Mode.sprite)
      // The head is long across the road (its lamps in a row from the kerb) and narrow along it.
      spriteQuad(m, { x, y, z: LIGHT_Z, angle: facing, length: 0.9, width: 2.4 }, Sprite.housing, box(Sprite.housing), HOUSING, Mode.sprite)
      LAMPS.forEach((lamp, i) => {
        const along = -0.75 + i * 0.75
        spriteQuad(
          m,
          { x: x - Math.sin(facing) * along, y: y + Math.cos(facing) * along, z: LIGHT_Z + 0.05, angle: facing, length: 0.6, width: 0.6 },
          Sprite.lamp,
          box(Sprite.lamp),
          lamp === state ? LAMP[lamp] : OFF,
          Mode.sprite,
        )
      })
      m.target = "shadow"
      spriteQuad(m, { x: x + SHADOW_DIR[0] * LIGHT_Z, y: y + SHADOW_DIR[1] * LIGHT_Z, z: SHADOW_Z, angle: facing, length: 0.9, width: 2.4 }, Sprite.housing, box(Sprite.housing), SHADOW, Mode.silhouette)
      m.target = "opaque"
    }
  }
}

const box = (boxes: SpriteBoxes, layer: number): readonly [number, number] => boxes[layer] ?? [1, 1]

const BLUE: Rgba = [40, 110, 255, 255]
const RED: Rgba = [255, 40, 40, 255]

/** A police car's light bar, flashing blue and red, glowing on the road around it. */
const lightBar = (m: MeshBuilder, boxes: SpriteBoxes, c: Car, time: number) => {
  const phase = Math.floor(time * 6) % 2
  for (const side of [-1, 1]) {
    const color = (side === 1) === (phase === 0) ? BLUE : RED
    const x = c.x - Math.sin(c.angle) * side * 0.45
    const y = c.y + Math.cos(c.angle) * side * 0.45
    spriteQuad(m, { x, y, z: CAR_Z + 0.06, angle: c.angle, length: 0.45, width: 0.45 }, Sprite.lamp, box(boxes, Sprite.lamp), color, Mode.sprite)
    spriteQuad(m, { x, y, z: CAR_Z + 0.04, angle: 0, length: 3.5, width: 3.5 }, Sprite.glow, box(boxes, Sprite.glow), [color[0], color[1], color[2], 150], Mode.sprite)
  }
}

const SMOKE: Rgba = [70, 70, 72, 150]

/** Smoke from a badly damaged car: puffs that rise and drift back, thicker the worse it is. */
const smoke = (m: MeshBuilder, boxes: SpriteBoxes, c: Placed & { readonly vitals: Vitals }, time: number) => {
  const puffs = c.vitals.hp <= 0 ? 5 : Math.ceil((1 - c.vitals.hp / SMOKE_HP) * 5)
  for (let i = 0; i < puffs; i++) {
    const age = (time * 0.8 + i / puffs) % 1
    const x = c.x + Math.cos(c.angle) * (CAR_LENGTH * 0.35 - age * 2) + Math.sin(i * 7.1) * 0.4
    const y = c.y + Math.sin(c.angle) * (CAR_LENGTH * 0.35 - age * 2) + Math.cos(i * 5.3) * 0.4
    const size = 1.2 + age * 2.4
    spriteQuad(m, { x, y, z: CAR_Z + 0.2 + age * 2.5, angle: i, length: size, width: size }, Sprite.fx + Fx.smoke, box(boxes, Sprite.fx + Fx.smoke), [255, 255, 255, Math.round(SMOKE[3] * (1 - age))], Mode.sprite)
  }
}

/** A damaged car smokes; a burning one has flames over the bonnet as well. */
const damaged = (m: MeshBuilder, boxes: SpriteBoxes, c: Placed & { readonly vitals: Vitals }, time: number, seed: number) => {
  if (c.vitals.hp >= SMOKE_HP) return
  if (isBurning(c.vitals)) {
    const fx = c.x + Math.cos(c.angle) * CAR_LENGTH * 0.25
    const fy = c.y + Math.sin(c.angle) * CAR_LENGTH * 0.25
    flames(m, boxes, fx, fy, CAR_Z + 0.25, c.vitals.hp <= 0 ? 3.2 : 2.4, time, seed)
  }
  smoke(m, boxes, c, time)
}

const MARKER: Rgba = [255, 214, 10, 255]
const PHONE: Rgba = [255, 200, 0, 255]

/** The mission's glowing ground marker (GTA 2's pulsing arrow target), and the payphone. */
const mission = (m: MeshBuilder, boxes: SpriteBoxes, game: Game) => {
  const job = game.mission
  if (job === null) return
  const target = missionTarget(job)
  const pulse = 7 + Math.sin(game.time * 4) * 1.5
  spriteQuad(m, { x: target.x, y: target.y, z: 0.15, angle: 0, length: pulse, width: pulse }, Sprite.glow, box(boxes, Sprite.glow), MARKER, Mode.sprite)
  spriteQuad(m, { x: job.phone.x, y: job.phone.y, z: 2.2, angle: 0, length: 0.8, width: 0.8 }, Sprite.housing, box(boxes, Sprite.housing), PHONE, Mode.sprite)
}

/** Pickups turn slowly on their glowing pads, like GTA 2's. */
const pickup = (m: MeshBuilder, boxes: SpriteBoxes, p: Pickup, time: number) => {
  if (!isAvailable(p)) return
  const layer = Sprite.pickup + PICKUP_SPRITES.indexOf(p.kind)
  const size = 2.6 + Math.sin(time * 4 + p.x) * 0.15
  spriteQuad(m, { x: p.x, y: p.y, z: 0.3, angle: time * 1.2 + p.y, length: size, width: (size * box(boxes, layer)[1]) / box(boxes, layer)[0] }, layer, box(boxes, layer), WHITE, Mode.sprite)
}

const fx = (m: MeshBuilder, boxes: SpriteBoxes, layer: number, q: Placed & { readonly z: number; readonly length: number; readonly width: number }, alpha: number) =>
  spriteQuad(m, q, Sprite.fx + layer, box(boxes, Sprite.fx + layer), [255, 255, 255, Math.round(255 * Math.max(0, Math.min(1, alpha)))], Mode.sprite)

/** One effect at its age: GTA 2's three-frame explosion (flash, fireball, smoke), flashes, tracers, flames, dust. */
const effect = (m: MeshBuilder, boxes: SpriteBoxes, e: Effect) => {
  const k = e.t / e.life
  if (e.kind === "muzzle") fx(m, boxes, Fx.muzzle, { x: e.x, y: e.y, z: PED_Z + 0.1, angle: e.angle, length: e.size, width: e.size * 0.8 }, 1)
  else if (e.kind === "tracer") {
    const len = Math.hypot(e.x2 - e.x, e.y2 - e.y)
    // The streak's bright head runs to the far end over its short life.
    const head = Math.min(1, 0.35 + k)
    const tail = Math.max(0, head - 0.6)
    const x0 = e.x + (e.x2 - e.x) * tail
    const y0 = e.y + (e.y2 - e.y) * tail
    const x1 = e.x + (e.x2 - e.x) * head
    const y1 = e.y + (e.y2 - e.y) * head
    fx(m, boxes, Fx.tracer, { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: PED_Z, angle: e.angle, length: Math.max(0.5, len * (head - tail)), width: e.size * 2 }, 1 - k * 0.5)
  } else if (e.kind === "blast") {
    const s = e.size
    if (k < 0.3) spriteQuad(m, { x: e.x, y: e.y, z: 0.2, angle: 0, length: s * 1.7, width: s * 1.7 }, Sprite.glow, box(boxes, Sprite.glow), [255, 120, 30, Math.round(160 * (1 - k / 0.3))], Mode.sprite)
    if (k < 0.12) fx(m, boxes, Fx.blastEarly, { x: e.x, y: e.y, z: 2, angle: e.angle, length: s * (0.6 + k * 3), width: s * (0.6 + k * 3) }, 1)
    else if (k < 0.45) fx(m, boxes, Fx.blastBig, { x: e.x, y: e.y, z: 2.2, angle: e.angle, length: s * (0.95 + k * 0.5), width: s * (0.95 + k * 0.5) }, 1)
    else fx(m, boxes, Fx.smoke, { x: e.x, y: e.y, z: 2.6 + k, angle: e.angle, length: s * (1 + k * 0.6), width: s * (1 + k * 0.6) }, (1 - k) / 0.55)
  } else if (e.kind === "flame") {
    const x = e.x + (e.x2 - e.x) * k
    const y = e.y + (e.y2 - e.y) * k
    const s = e.size * (0.5 + k)
    fx(m, boxes, k < 0.5 ? Fx.blastEarly : Fx.fire, { x, y, z: PED_Z + 0.2, angle: e.angle - Math.PI / 2, length: s, width: s }, 1 - k * k)
  } else fx(m, boxes, Fx.smoke, { x: e.x, y: e.y, z: PED_Z + 0.3 + k, angle: e.angle, length: e.size * (1 + k), width: e.size * (1 + k) }, 0.7 * (1 - k))
}

const BOTTLE: Rgba = [60, 160, 70, 255]

const projectile = (m: MeshBuilder, boxes: SpriteBoxes, p: Projectile) => {
  const angle = Math.atan2(p.vy, p.vx)
  if (p.kind === "rocket") {
    fx(m, boxes, Fx.tracer, { x: p.x, y: p.y, z: PED_Z, angle, length: 1.6, width: 0.35 }, 1)
    spriteQuad(m, { x: p.x, y: p.y, z: PED_Z - 0.05, angle: 0, length: 1.6, width: 1.6 }, Sprite.glow, box(boxes, Sprite.glow), [255, 180, 80, 200], Mode.sprite)
    return
  }
  // A molotov arcs: up and down again over its flight.
  const k = p.t / p.life
  const z = PED_Z + 4 * 2.2 * k * (1 - k)
  spriteQuad(m, { x: p.x, y: p.y, z, angle: p.t * 14, length: 0.6, width: 0.3 }, Sprite.housing, box(boxes, Sprite.housing), BOTTLE, Mode.sprite)
  spriteQuad(m, { x: p.x + Math.cos(p.t * 14) * 0.3, y: p.y + Math.sin(p.t * 14) * 0.3, z: z + 0.02, angle: 0, length: 0.7, width: 0.7 }, Sprite.glow, box(boxes, Sprite.glow), [255, 160, 40, 255], Mode.sprite)
}

/** Every moving thing of `game`, drawn into `m`: sprites in its opaque list, shadows in its shadow list. */
export const drawEntities = (m: MeshBuilder, game: Game, boxes: SpriteBoxes): void => {
  const { time } = game
  for (const d of game.decals) fx(m, boxes, Fx.scorch, { x: d.x, y: d.y, z: 0.12, angle: d.angle, length: d.size, width: d.size }, 0.85)
  mission(m, boxes, game)
  for (const p of game.pickups) pickup(m, boxes, p, time)
  for (const c of game.wrecks) sprite(m, boxes, Sprite.fx + Fx.wreck, c, CAR_Z, CAR_LENGTH * 1.08, 0.7)
  for (const c of game.parked) {
    car(m, boxes, c)
    damaged(m, boxes, c, time, c.x)
  }
  for (const cop of game.cops) {
    car(m, boxes, cop.car)
    lightBar(m, boxes, cop.car, time)
    damaged(m, boxes, cop.car, time, cop.id)
  }
  for (const n of game.npcs) {
    car(m, boxes, n)
    damaged(m, boxes, n, time, n.id)
  }
  for (const w of game.walkers) walker(m, boxes, w, time)
  for (const f of game.fighters) fighter(m, boxes, f, time)
  for (const l of game.signals.lights) light(m, boxes, l, time)
  for (const f of game.fires) {
    const fade = Math.min(1, (f.life - f.t) / 1.5)
    flames(m, boxes, f.x, f.y, 0.4, f.r * 1.4 * fade, time, f.x)
  }
  const { player } = game
  if (player.car !== null) {
    car(m, boxes, player.car)
    if (player.car.model === POLICE_MODEL) lightBar(m, boxes, player.car, time)
    damaged(m, boxes, player.car, time, 0)
  } else if (game.wasted > 0) lying(m, boxes, Sprite.ped, player, 1)
  // A touch larger than the others, so you find yourself in a crowd.
  else sprite(m, boxes, Sprite.ped, player, PED_Z + 0.05, 1.4, 0.9)
  if (player.car === null && player.vitals.fire > 0) flames(m, boxes, player.x, player.y, PED_Z + 0.15, 1.4, time, 7)
  for (const p of game.projectiles) projectile(m, boxes, p)
  for (const e of game.effects) effect(m, boxes, e)
}
