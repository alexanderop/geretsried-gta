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
import type { Walker } from "#/sim/pedestrians.ts"
import { MeshBuilder, Mode, Sprite, spriteQuad, type Rgba, type SpriteBoxes } from "./mesh.ts"

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

const walker = (m: MeshBuilder, boxes: SpriteBoxes, w: Walker) => {
  if (w.down > 0) {
    sprite(m, boxes, Sprite.ped + w.sprite, { x: w.x, y: w.y, angle: w.angle + Math.PI / 2 }, 0.3, 1.5, 0.1, [200, 200, 200, 255])
    return
  }
  const bob = 1 + Math.sin(w.stride) * 0.05
  sprite(m, boxes, Sprite.ped + w.sprite, { x: w.x, y: w.y, angle: w.angle + Math.sin(w.stride / 2) * 0.08 }, PED_Z, 1.25 * bob, 0.9)
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
const smoke = (m: MeshBuilder, boxes: SpriteBoxes, c: Car, time: number) => {
  const puffs = c.vitals.hp <= 0 ? 4 : Math.ceil((1 - c.vitals.hp / SMOKE_HP) * 5)
  for (let i = 0; i < puffs; i++) {
    const age = (time * 0.8 + i / puffs) % 1
    const x = c.x + Math.cos(c.angle) * (CAR_LENGTH * 0.35 - age * 2) + Math.sin(i * 7.1) * 0.4
    const y = c.y + Math.sin(c.angle) * (CAR_LENGTH * 0.35 - age * 2) + Math.cos(i * 5.3) * 0.4
    const size = 1.2 + age * 2.4
    spriteQuad(m, { x, y, z: CAR_Z + 0.2 + age * 2.5, angle: i, length: size, width: size }, Sprite.glow, box(boxes, Sprite.glow), [SMOKE[0], SMOKE[1], SMOKE[2], Math.round(SMOKE[3] * (1 - age))], Mode.sprite)
  }
}

const WRECK: Rgba = [60, 56, 52, 255]
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

/** Every moving thing of `game`, drawn into `m`: sprites in its opaque list, shadows in its shadow list. */
export const drawEntities = (m: MeshBuilder, game: Game, boxes: SpriteBoxes): void => {
  mission(m, boxes, game)
  for (const c of game.wrecks) sprite(m, boxes, Sprite.car + c.model, c, CAR_Z, CAR_LENGTH * 1.08, 0.7, WRECK)
  for (const c of game.parked) car(m, boxes, c)
  for (const cop of game.cops) {
    car(m, boxes, cop.car)
    lightBar(m, boxes, cop.car, game.time)
  }
  for (const n of game.npcs) car(m, boxes, n)
  for (const w of game.walkers) walker(m, boxes, w)
  for (const l of game.signals.lights) light(m, boxes, l, game.time)
  const { player } = game
  if (player.car !== null) {
    car(m, boxes, player.car)
    if (player.car.model === POLICE_MODEL) lightBar(m, boxes, player.car, game.time)
    if (player.car.vitals.hp < SMOKE_HP) smoke(m, boxes, player.car, game.time)
  }
  // A touch larger than the others, so you find yourself in a crowd.
  else sprite(m, boxes, Sprite.ped, player, PED_Z + 0.05, 1.4, 0.9)
}
