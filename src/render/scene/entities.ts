/**
 * The moving things, rebuilt every frame as sprite quads in the same 3D
 * space as the town: cars at roof height and people at head height, so
 * buildings in front of them hide them, plus their shadows on the ground.
 */
import { SHADOW_DIR } from "#/map/photo.ts"
import { CAR_LENGTH } from "#/sim/car.ts"
import type { Game } from "#/sim/game.ts"
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

/** Every moving thing of `game`, drawn into `m`: sprites in its opaque list, shadows in its shadow list. */
export const drawEntities = (m: MeshBuilder, game: Game, boxes: SpriteBoxes): void => {
  for (const c of game.parked) car(m, boxes, c)
  for (const n of game.npcs) car(m, boxes, n)
  for (const w of game.walkers) walker(m, boxes, w)
  for (const l of game.signals.lights) light(m, boxes, l, game.time)
  const { player } = game
  if (player.car !== null) car(m, boxes, player.car)
  // A touch larger than the others, so you find yourself in a crowd.
  else sprite(m, boxes, Sprite.ped, player, PED_Z + 0.05, 1.4, 0.9)
}
