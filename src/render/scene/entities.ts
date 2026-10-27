/**
 * The moving things, rebuilt every frame as sprite quads in the same 3D
 * space as the town: cars at roof height and people at head height, so
 * buildings in front of them hide them, plus their shadows on the ground.
 */
import { SHADOW_DIR } from "#/map/photo.ts"
import { CAR_LENGTH, PAINTS } from "#/sim/car.ts"
import { BUS_LENGTH, BUS_MODEL, POLICE_MODEL, vehicleLength } from "#/sim/vehicles.ts"
import { SMOKE_HP, type Game } from "#/sim/game.ts"
import type { Car } from "#/sim/car.ts"
import { isRinging, jobTarget } from "#/sim/mission.ts"
import { lightFor, type Light, type StopLine } from "#/sim/signals.ts"
import { FLASH, HEAD, LAMP_AT, MAST_Z, signalHead, uprightQuad } from "./street.ts"
import { STREETS } from "#/world/places/streets.ts"
import { CORPSE_FADE_S, type Walker } from "#/sim/pedestrians.ts"
import type { Effect, Fighter, Projectile } from "#/sim/state.ts"
import type { Vitals } from "#/sim/damage.ts"
import { isAvailable, type Pickup } from "#/sim/pickups.ts"
import { ISLAND_M, PUMP_HP, type Pump } from "#/sim/stations.ts"
import type { Shop } from "#/sim/shops.ts"
import { GANGS, type GangId } from "#/sim/gangs.ts"
import { isBurning } from "#/sim/damage.ts"
import { bodyAlpha } from "#/sim/combat.ts"
import { Fx, MeshBuilder, Mode, PICKUP_SPRITES, Sprite, WALK_M, prop, spriteQuad, walkFrame, type PropName, type Rgba, type SpriteBoxes, type WalkSet } from "./mesh.ts"
import type { WeaponId } from "#/sim/weapons.ts"
import { SKID_S } from "#/sim/skids.ts"

const WHITE: Rgba = [255, 255, 255, 255]
const SHADOW: Rgba = [14, 22, 40, 100]
const SHADOW_Z = 0.1
const CAR_Z = 1.5
const PUMP_Z = 1.2
const BLAST_Z = 5.6
const PED_Z = 1.75
/** Signals further than this from the player are off screen even at top speed. */
const VIEW_M = 140

type Placed = { readonly x: number; readonly y: number; readonly angle: number }

const sprite = (m: MeshBuilder, boxes: SpriteBoxes, layer: number, at: Placed, z: number, length: number, shadow: number, color: Rgba = WHITE, mode: Mode = Mode.sprite) => {
  const box = boxes[layer] ?? [1, 1]
  const width = (length * box[1]) / box[0]
  spriteQuad(m, { ...at, z, length, width }, layer, box, color, mode)
  m.target = "shadow"
  spriteQuad(m, { x: at.x + SHADOW_DIR[0] * shadow, y: at.y + SHADOW_DIR[1] * shadow, z: SHADOW_Z, angle: at.angle, length, width }, layer, box, SHADOW, Mode.silhouette)
  m.target = "opaque"
}

/** The bus's roof height, and the white and glass bands of its sides (seen leaning out towards the screen's edges, like house walls). */
const BUS_Z = 3.15
const BUS_BANDS: ReadonlyArray<readonly [number, number, Rgba]> = [
  [0.45, 1.05, [226, 226, 230, 255]],
  [1.05, 2.45, [38, 52, 74, 255]],
  [2.45, BUS_Z, [226, 226, 230, 255]],
]
const BUS_WIDTH = 2.5

/** A regional bus: the roof sprite at roof height over four sides, the red-and-white livery's side bands, and its shadow. */
const bus = (m: MeshBuilder, boxes: SpriteBoxes, at: Placed) => {
  const c = Math.cos(at.angle)
  const s = Math.sin(at.angle)
  const hl = BUS_LENGTH / 2
  const hw = BUS_WIDTH / 2
  const v = (f: number, r: number, z: number, color: Rgba) => m.vertex(at.x + c * f - s * r, at.y + s * f + c * r, z, 0, 0, color, Mode.color, 0)
  const wall = (f0: number, r0: number, f1: number, r1: number, shade: number) => {
    for (const [z0, z1, [r, g, b, a]] of BUS_BANDS) {
      const color: Rgba = [Math.round(r * shade), Math.round(g * shade), Math.round(b * shade), a]
      m.quad(v(f0, r0, z0, color), v(f1, r1, z0, color), v(f1, r1, z1, color), v(f0, r0, z1, color))
    }
  }
  wall(-hl, -hw, hl, -hw, 0.85)
  wall(-hl, hw, hl, hw, 1)
  wall(hl, -hw, hl, hw, 0.9)
  wall(-hl, -hw, -hl, hw, 0.8)
  sprite(m, boxes, prop("bus-rvo"), at, BUS_Z, BUS_LENGTH, BUS_Z * 0.45)
}

/** A car; one from the spray shop has its paint's hue turned a step round the wheel. */
const car = (m: MeshBuilder, boxes: SpriteBoxes, at: Placed & { readonly model: number; readonly paint?: number }) => {
  if (at.model === BUS_MODEL) return bus(m, boxes, at)
  const paint = at.paint ?? 0
  if (paint === 0) sprite(m, boxes, Sprite.car + at.model, at, CAR_Z, CAR_LENGTH * 1.08, 0.7)
  else sprite(m, boxes, Sprite.car + at.model, at, CAR_Z, CAR_LENGTH * 1.08, 0.7, [Math.round((paint / PAINTS) * 255), 0, 0, 255], Mode.hue)
}

/** Someone on the ground: knocked down (they get up) or dead (they fade after a while). No blood, as in GTA 2's cartoon. */
const lying = (m: MeshBuilder, boxes: SpriteBoxes, layer: number, at: Placed, alpha: number, tint: Rgba = WHITE) =>
  sprite(m, boxes, layer, { x: at.x, y: at.y, angle: at.angle + Math.PI / 2 }, 0.3, 1.5, 0.1, [Math.round(tint[0] * 0.8), Math.round(tint[1] * 0.8), Math.round(tint[2] * 0.8), Math.round(255 * alpha)])

/** A knocked-out body painted lying on its back, head to feet along its length (a grown-up is 1.8 m). */
const body = (m: MeshBuilder, boxes: SpriteBoxes, layer: number, at: Placed, alpha: number) =>
  sprite(m, boxes, layer, { x: at.x, y: at.y, angle: at.angle + 2.2 }, 0.25, 1.8, 0.05, [235, 235, 235, Math.round(255 * alpha)])

/** Shoulder to shoulder, as wide as the plain pedestrians (1.25 m sprites, 124 of 128 px wide). */
const PERSON_W = 1.2

/** A person in a pose sprite (arms reaching forward), scaled by the body's width so poses match the pedestrians. */
const posed = (m: MeshBuilder, boxes: SpriteBoxes, layer: number, at: Placed, z: number, width: number, color: Rgba = WHITE) => {
  const b = box(boxes, layer)
  sprite(m, boxes, layer, at, z, (width * b[0]) / b[1], 0.9, color)
}

/** Someone on the move: the run-cycle frame for their stride, `scale` times as big as a passer-by. */
const running = (m: MeshBuilder, boxes: SpriteBoxes, set: WalkSet, at: Placed, stride: number, z: number, scale: number, color: Rgba = WHITE) =>
  sprite(m, boxes, walkFrame(set, stride), at, z, WALK_M[0] * scale, 0.9, color)

const PED_SETS: ReadonlyArray<WalkSet> = ["ped-0", "ped-1", "ped-2", "ped-3"]
const pedSet = (index: number): WalkSet => PED_SETS[index] ?? "ped-0"

/** Flames on someone or something burning. */
const flames = (m: MeshBuilder, boxes: SpriteBoxes, x: number, y: number, z: number, size: number, time: number, seed: number) => {
  const flicker = 1 + Math.sin(time * 23 + seed) * 0.12
  spriteQuad(m, { x, y, z, angle: Math.sin(time * 3 + seed) * 0.2 - Math.PI / 2, length: size * flicker, width: size * 0.8 * flicker }, Sprite.fx + Fx.fire, box(boxes, Sprite.fx + Fx.fire), WHITE, Mode.sprite)
  spriteQuad(m, { x, y, z: z - 0.05, angle: 0, length: size * 2.2, width: size * 2.2 }, Sprite.glow, box(boxes, Sprite.glow), [255, 140, 40, 120], Mode.sprite)
}

/** A gang member's mark: a ring of their colour on the ground round their feet, so the crowd reads from above. */
const gangRing = (m: MeshBuilder, boxes: SpriteBoxes, x: number, y: number, g: GangId) => {
  const [r, gg, b] = GANGS[g].color
  spriteQuad(m, { x, y, z: 0.13, angle: 0, length: 2.2, width: 2.2 }, Sprite.glow, box(boxes, Sprite.glow), [r, gg, b, 230], Mode.sprite)
}

/** A cafe guest's slice of cake: in their hands on the way to a chair, on the table while they eat. */
const plate = (m: MeshBuilder, boxes: SpriteBoxes, w: Walker) => {
  const p = w.visit?.plate
  if (p == null || w.down > 0 || w.dead) return
  const layer = prop("cafe-slice")
  spriteQuad(m, { x: p.x, y: p.y, z: p.z, angle: w.angle, length: 0.34, width: 0.34 }, layer, box(boxes, layer), WHITE, Mode.sprite)
}

/** Shirt shades for the passers-by (sim SHADES of them): the same few sprites, tinted so the crowd is not all twins. */
const SHADE_TINTS: ReadonlyArray<Rgba> = [WHITE, [236, 226, 214, 255], [214, 226, 242, 255], [242, 222, 222, 255], [222, 238, 218, 255], [228, 222, 242, 255]]
/** Kids are drawn smaller than grown-ups. */
const KID_SCALE = 0.78

const walker = (m: MeshBuilder, boxes: SpriteBoxes, w: Walker, time: number) => {
  plate(m, boxes, w)
  if (w.gang !== undefined && w.down <= 0) gangRing(m, boxes, w.x, w.y, w.gang)
  const tint = w.gang === undefined ? (SHADE_TINTS[w.shade] ?? WHITE) : gangTint(w.gang)
  const scale = w.kind === "kid" ? KID_SCALE : 1
  if (w.down > 0) body(m, boxes, prop("pose-body-man"), w, bodyAlpha(w, CORPSE_FADE_S))
  // Standing (at a window, a bus stop, chatting): the still sprite, not a frozen step.
  else if (w.stop !== null || (w.speed < 0.15 && w.panic <= 0)) sprite(m, boxes, Sprite.ped + w.sprite, w, PED_Z, 1.25 * scale, 0.9, tint)
  else running(m, boxes, pedSet(w.sprite), w, w.stride, PED_Z, scale, tint)
  if (w.vitals.fire > 0) flames(m, boxes, w.x, w.y, PED_Z + 0.1, 1.3, time, w.id)
}

/** Police on foot aim their pistols standing and run with them drawn; tough guys swing their fists. */
const fighter = (m: MeshBuilder, boxes: SpriteBoxes, f: Fighter, time: number) => {
  if (f.down > 0 || f.dead) body(m, boxes, prop(f.kind === "cop" ? "pose-body-cop" : "pose-body-man"), f, bodyAlpha(f, CORPSE_FADE_S))
  else if (f.gang !== undefined) {
    // Gang members keep their jackets in the gang's colours, a touch bigger than the passers-by.
    gangRing(m, boxes, f.x, f.y, f.gang)
    if (f.moving) running(m, boxes, pedSet(f.sprite), f, f.stride, PED_Z, 1.08, gangTint(f.gang))
    else sprite(m, boxes, Sprite.ped + f.sprite, f, PED_Z, 1.35, 0.9, gangTint(f.gang))
  } else if (f.moving) running(m, boxes, f.kind, f, f.stride, PED_Z, 1)
  else posed(m, boxes, prop(f.kind === "thug" ? "pose-thug-punch" : "pose-cop-aim"), f, PED_Z, PERSON_W)
  if (f.vitals.fire > 0) flames(m, boxes, f.x, f.y, PED_Z + 0.1, 1.3, time, f.id)
}

/** A gang's colours over a pedestrian sprite: strong enough to read from above, light enough to keep the face. */
const gangTint = (g: GangId): Rgba => {
  const [r, gg, b] = GANGS[g].color
  return [Math.round(90 + r * 0.65), Math.round(90 + gg * 0.65), Math.round(90 + b * 0.65), 255]
}

/** The player's pose for the weapon in hand: fists are the plain walking sprite. */
const PLAYER_POSE: Readonly<Record<WeaponId, number | null>> = {
  fists: null,
  pistol: prop("pose-player-pistol"),
  shotgun: prop("pose-player-pistol"),
  smg: prop("pose-player-smg"),
  flamer: prop("pose-player-smg"),
  rocket: prop("pose-player-smg"),
  molotov: prop("pose-player-throw"),
}

const LAMP: Readonly<Record<Light, Rgba>> = { red: [255, 48, 36, 255], yellow: [255, 190, 0, 255], green: [40, 230, 110, 255] }
const LAMPS: ReadonlyArray<Light> = ["red", "yellow", "green"]

/**
 * The lit lamp of a signal: on the head's face (seen as the walls are, leaning
 * out towards the screen edges), and as a glowing dot on top of the head,
 * which is what the camera sees from straight above.
 */
const signal = (m: MeshBuilder, boxes: SpriteBoxes, st: StopLine, time: number) => {
  const state = lightFor(st.light.junction, st.heading, time)
  const { head } = signalHead(st)
  const color = LAMP[state]
  const lit = LAMPS.indexOf(state)
  const k = LAMP_AT[lit] ?? 0.5
  const z = HEAD.top - (HEAD.top - HEAD.bottom) * k
  // Just in front of the face, towards the traffic.
  const fx = head.x - Math.cos(st.heading) * 0.03
  const fy = head.y - Math.sin(st.heading) * 0.03
  uprightQuad(m, fx, fy, z - 0.15, z + 0.15, st.heading + Math.PI, 0.3, Sprite.lamp, box(boxes, Sprite.lamp), color, Mode.sprite)
  uprightQuad(m, fx - Math.cos(st.heading) * 0.02, fy - Math.sin(st.heading) * 0.02, z - 0.5, z + 0.5, st.heading + Math.PI, 1, Sprite.glow, box(boxes, Sprite.glow), [color[0], color[1], color[2], 200], Mode.sprite)
  spriteQuad(m, { x: head.x, y: head.y, z: MAST_Z + 0.08, angle: 0, length: 0.32, width: 0.32 }, Sprite.lamp, box(boxes, Sprite.lamp), color, Mode.sprite)
  spriteQuad(m, { x: head.x, y: head.y, z: MAST_Z + 0.06, angle: 0, length: 2.2, width: 2.2 }, Sprite.glow, box(boxes, Sprite.glow), [color[0], color[1], color[2], 170], Mode.sprite)
}

const box = (boxes: SpriteBoxes, layer: number): readonly [number, number] => boxes[layer] ?? [1, 1]

/** The zebras' amber flashing lights (street profiles' signs with `flash`): on for half of every second. */
const FLASHERS = STREETS.flatMap((p) => (p.signs ?? []).filter((sg) => sg.flash === true))
const AMBER: Rgba = [255, 168, 20, 255]
export const flashOn = (time: number) => time % 1 < 0.5

const flashers = (m: MeshBuilder, boxes: SpriteBoxes, time: number, px: number, py: number) => {
  if (!flashOn(time)) return
  for (const f of FLASHERS) {
    if (Math.abs(f.x - px) > VIEW_M || Math.abs(f.y - py) > VIEW_M) continue
    const x = f.x
    const y = f.y - FLASH.up
    spriteQuad(m, { x, y, z: FLASH.z + 0.02, angle: 0, length: FLASH.size * 0.55, width: FLASH.size * 0.55 }, Sprite.lamp, box(boxes, Sprite.lamp), AMBER, Mode.sprite)
    spriteQuad(m, { x, y, z: FLASH.z + 0.01, angle: 0, length: 1.6, width: 1.6 }, Sprite.glow, box(boxes, Sprite.glow), [AMBER[0], AMBER[1], AMBER[2], 190], Mode.sprite)
  }
}

/** A car pulling in to the kerb blinks on its right, one pulling out on its left: front and back corner, 1.5 times a second. */
const indicator = (m: MeshBuilder, boxes: SpriteBoxes, c: Placed, side: 1 | -1, time: number) => {
  if ((time * 1.5) % 1 >= 0.5) return
  for (const end of [-1, 1]) {
    const along = end * (CAR_LENGTH / 2 - 0.35)
    const x = c.x + Math.cos(c.angle) * along - Math.sin(c.angle) * side * 0.8
    const y = c.y + Math.sin(c.angle) * along + Math.cos(c.angle) * side * 0.8
    spriteQuad(m, { x, y, z: CAR_Z + 0.06, angle: c.angle, length: 0.4, width: 0.4 }, Sprite.lamp, box(boxes, Sprite.lamp), AMBER, Mode.sprite)
    spriteQuad(m, { x, y, z: CAR_Z + 0.04, angle: 0, length: 1.4, width: 1.4 }, Sprite.glow, box(boxes, Sprite.glow), [AMBER[0], AMBER[1], AMBER[2], 150], Mode.sprite)
  }
}

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

const CAR_MARK: Rgba = [255, 60, 40, 255]

/** The payphones (ringing ones shake, with their rings), and the job's glowing marker: on the ground at a place, under the car it is about. */
const mission = (m: MeshBuilder, boxes: SpriteBoxes, game: Game) => {
  const { jobs, time, player } = game
  jobs.phones.forEach((phone, i) => {
    if (Math.abs(phone.x - player.x) > VIEW_M || Math.abs(phone.y - player.y) > VIEW_M) return
    const ringing = isRinging(jobs, i)
    const layer = prop(ringing ? "prop-phone" : "prop-phone-quiet")
    const b = box(boxes, layer)
    // The booth, drawn 1.6 m deep like GTA 2's chunky props; it shakes while it rings.
    const k = ringing ? 1 + Math.sin(time * 18) * 0.04 : 1
    sprite(m, boxes, layer, { x: phone.x, y: phone.y, angle: 0 }, 2.4, (1.6 * k * b[0]) / b[1], 1.6)
  })
  const active = jobs.active
  if (active === null) return
  const target = jobTarget(jobs, player)
  if (target === null) return
  const pulse = 7 + Math.sin(time * 4) * 1.5
  const onCar = active.target !== null && target === active.target
  spriteQuad(m, { x: target.x, y: target.y, z: 0.15, angle: 0, length: onCar ? pulse * 0.9 : pulse, width: onCar ? pulse * 0.9 : pulse }, Sprite.glow, box(boxes, Sprite.glow), onCar ? CAR_MARK : MARKER, Mode.sprite)
}

/** How each shop's pad looks: its sign, how big, and its glow. The cake counter's is a small pink heart in front of the display. */
const PADS: Readonly<Record<Shop["kind"], { readonly sign: PropName; readonly size: number; readonly glow: Rgba }>> = {
  save: { sign: "prop-church", size: 2.4, glow: [255, 210, 60, 150] },
  spray: { sign: "prop-spray", size: 4.2, glow: [60, 170, 255, 150] },
  cake: { sign: "prop-heart", size: 0.8, glow: [255, 120, 180, 170] },
}

/** A save point's glowing cross, a spray shop's spray can or the cake counter's heart, on a pad that pulses on the ground. */
const shopPad = (m: MeshBuilder, boxes: SpriteBoxes, sh: Shop, time: number) => {
  const look = PADS[sh.kind]
  const layer = prop(look.sign)
  const size = look.size * (1 + Math.sin(time * 3) * 0.04)
  // Indoors the pad lies on the cafe's floor (0.12 up).
  spriteQuad(m, { x: sh.x, y: sh.y, z: 0.14, angle: 0, length: size * 2.2, width: size * 2.2 }, Sprite.glow, box(boxes, Sprite.glow), look.glow, Mode.sprite)
  spriteQuad(m, { x: sh.x, y: sh.y, z: 0.16, angle: 0, length: size, width: size }, layer, box(boxes, layer), WHITE, Mode.sprite)
}

/** A pump island (two pumps on a kerbed island), at pump height; one about to blow is on fire. */
const pump = (m: MeshBuilder, boxes: SpriteBoxes, p: Pump, time: number) => {
  if (p.dead) return
  const layer = prop("fuel-island")
  const b = box(boxes, layer)
  // The sprite's long side is its height in the image: turn it to lie along the island.
  sprite(m, boxes, layer, { x: p.x, y: p.y, angle: p.angle + Math.PI / 2 }, PUMP_Z, (ISLAND_M * b[0]) / b[1], 0.8)
  if (p.fuse !== null) flames(m, boxes, p.x, p.y, PUMP_Z + 0.3, 2.6, time, p.x)
  else if (p.hp < PUMP_HP * 0.5) smoke(m, boxes, { x: p.x, y: p.y, angle: p.angle, vitals: { hp: SMOKE_HP * (p.hp / PUMP_HP), armour: 0, fire: 0, lastHit: null } }, time)
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
    // A fireball rises over a petrol station canopy (5 m), as GTA 2 draws its explosions on top.
    if (k < 0.12) fx(m, boxes, Fx.blastEarly, { x: e.x, y: e.y, z: BLAST_Z, angle: e.angle, length: s * (0.6 + k * 3), width: s * (0.6 + k * 3) }, 1)
    else if (k < 0.45) fx(m, boxes, Fx.blastBig, { x: e.x, y: e.y, z: BLAST_Z + 0.1, angle: e.angle, length: s * (0.95 + k * 0.5), width: s * (0.95 + k * 0.5) }, 1)
    else fx(m, boxes, Fx.smoke, { x: e.x, y: e.y, z: BLAST_Z + 0.4 + k, angle: e.angle, length: s * (1 + k * 0.6), width: s * (1 + k * 0.6) }, (1 - k) / 0.55)
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

const SKID_HALF = 0.15

/** The tyre marks, blended over the ground (and over the shadows on it), before the cars, fading out over SKID_S. */
const skidMarks = (m: MeshBuilder, game: Game) => {
  for (const s of game.skids.marks) {
    if (Math.abs(s.ax - game.player.x) > VIEW_M || Math.abs(s.ay - game.player.y) > VIEW_M) continue
    const color: Rgba = [6, 6, 8, Math.round(200 * Math.max(0, 1 - (game.time - s.t) / SKID_S))]
    const len = Math.hypot(s.bx - s.ax, s.by - s.ay) || 1
    const nx = (-(s.by - s.ay) / len) * SKID_HALF
    const ny = ((s.bx - s.ax) / len) * SKID_HALF
    const v = (x: number, y: number) => m.vertex(x, y, 0.1, 0, 0, color, Mode.color, 0)
    m.quad(v(s.ax + nx, s.ay + ny), v(s.bx + nx, s.by + ny), v(s.bx - nx, s.by - ny), v(s.ax - nx, s.ay - ny))
  }
}

/** Every moving thing of `game`, drawn into `m`: sprites in its opaque list, shadows in its shadow list. */
export const drawEntities = (m: MeshBuilder, game: Game, boxes: SpriteBoxes): void => {
  const { time, player } = game
  skidMarks(m, game)
  for (const d of game.decals) fx(m, boxes, Fx.scorch, { x: d.x, y: d.y, z: 0.12, angle: d.angle, length: d.size, width: d.size }, 0.85)
  mission(m, boxes, game)
  for (const p of game.pickups) pickup(m, boxes, p, time)
  for (const p of game.pumps) pump(m, boxes, p, time)
  for (const p of game.packages) {
    if (p.found || Math.abs(p.x - player.x) > VIEW_M || Math.abs(p.y - player.y) > VIEW_M) continue
    const layer = prop("prop-package")
    sprite(m, boxes, layer, { x: p.x, y: p.y, angle: time * 0.8 }, 0.5 + Math.sin(time * 3 + p.x) * 0.1, 1.1, 0.3)
  }
  for (const sh of game.shops) if (Math.abs(sh.x - player.x) < VIEW_M && Math.abs(sh.y - player.y) < VIEW_M) shopPad(m, boxes, sh, time)
  for (const c of game.wrecks) sprite(m, boxes, Sprite.fx + Fx.wreck, c, CAR_Z, vehicleLength(c.model) * 1.08, 0.7)
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
    // The buses drive the whole town; draw the ones in view.
    if (Math.abs(n.x - player.x) > VIEW_M || Math.abs(n.y - player.y) > VIEW_M) continue
    car(m, boxes, n)
    if (n.mode.kind !== "driving") indicator(m, boxes, n, n.mode.kind === "pullingIn" ? 1 : -1, time)
    damaged(m, boxes, n, time, n.id)
  }
  for (const w of game.walkers) walker(m, boxes, w, time)
  for (const f of game.fighters) fighter(m, boxes, f, time)
  for (const st of game.signals.stops) if (Math.abs(st.x - player.x) < VIEW_M && Math.abs(st.y - player.y) < VIEW_M) signal(m, boxes, st, time)
  flashers(m, boxes, time, player.x, player.y)
  for (const f of game.fires) {
    const fade = Math.min(1, (f.life - f.t) / 1.5)
    flames(m, boxes, f.x, f.y, 0.4, f.r * 1.4 * fade, time, f.x)
  }
  if (player.car !== null) {
    car(m, boxes, player.car)
    if (player.car.model === POLICE_MODEL) lightBar(m, boxes, player.car, time)
    damaged(m, boxes, player.car, time, 0)
  } else if (game.wasted > 0) lying(m, boxes, Sprite.ped, player, 1)
  else if (player.ride === null) {
    // A touch larger than the others, so you find yourself in a crowd.
    const pose = PLAYER_POSE[player.arsenal.current]
    if (pose === null && player.moving) running(m, boxes, "ped-0", player, player.stride, PED_Z + 0.05, 1.12)
    else if (pose === null) sprite(m, boxes, Sprite.ped, player, PED_Z + 0.05, 1.4, 0.9)
    else posed(m, boxes, pose, player, PED_Z + 0.05, PERSON_W * 1.12)
  }
  if (player.car === null && player.vitals.fire > 0) flames(m, boxes, player.x, player.y, PED_Z + 0.15, 1.4, time, 7)
  for (const p of game.projectiles) projectile(m, boxes, p)
  for (const e of game.effects) effect(m, boxes, e)
}
