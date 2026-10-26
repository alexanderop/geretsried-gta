/**
 * The GTA 2 camera: straight down from a height, with a wide perspective,
 * so roofs come towards you and walls show towards the screen edges. It
 * climbs as the car speeds up and drops when you walk. Map space is x east,
 * y south, z up, in meters; the screen shows north up.
 */
import { forwardSpeed } from "#/sim/car.ts"
import { playerPos, type Game } from "#/sim/game.ts"
import { boxOf, type Box } from "#/world/geometry.ts"
import type { World } from "#/world/world.ts"
import { wallHeight } from "./scene/scene.ts"

/** Where the camera is, and the look-ahead it is easing towards the travel direction. */
export type Camera = { x: number; y: number; height: number; leadX: number; leadY: number }

/**
 * Vertical field of view: wide and fairly low, like GTA 2, so every block
 * shows tall walls towards the screen edges (a 9 m house leans out about 5 m
 * at the top edge on foot) while the ground the view covers stays the same.
 */
const FOV = (45 * Math.PI) / 180
const FOCAL = 1 / Math.tan(FOV / 2)
const NEAR = 2

/**
 * Meters from the screen's centre to its top edge on the ground. GTA 2 is
 * close: about 40 m across a 16:10 screen on foot, 50 m in a standing car,
 * opening to 90 m at top speed.
 */
const ON_FOOT_HALF = 12.5
const CAR_HALF = 15.6
const MAX_HALF = 28
/** Speed (m/s) at which the view is widest: about the cars' top speed. */
const FULL_SPEED = 34
/** What carries the player: the car they drive, or the bus they ride in (its speed and heading). */
const carrier = (game: Game): { readonly vx: number; readonly vy: number; readonly speed: number } | null => {
  const car = game.player.car
  if (car !== null) return { vx: car.vx, vy: car.vy, speed: Math.abs(forwardSpeed(car)) }
  const bus = game.player.ride?.bus
  return bus === undefined ? null : { vx: Math.cos(bus.angle) * bus.speed, vy: Math.sin(bus.angle) * bus.speed, speed: bus.speed }
}

const halfFor = (game: Game) => {
  const ride = carrier(game)
  if (ride === null) return ON_FOOT_HALF
  const t = Math.min(1, ride.speed / FULL_SPEED)
  return CAR_HALF + (MAX_HALF - CAR_HALF) * t * (2 - t)
}

export const heightFor = (half: number) => half * FOCAL

/** A building tall enough to come near the lens: its footprint's box and its roof's top. */
export type Tower = { readonly box: Box; readonly top: number }

/** Meters the lens stays above the tallest roof near the view, so a high-rise never clips into it or swells over the screen. */
const ROOF_CLEAR = 12

/** The buildings and church towers whose tops would come within `ROOF_CLEAR` of the lens on foot: the camera climbs over them. */
export const towersOf = ({ map, places }: World): ReadonlyArray<Tower> => {
  const tops = map.buildings.map((b) => wallHeight(b.levels) + 1)
  for (const place of places)
    for (const part of place.dressing.parts ?? []) if (part.kind === "tower") tops[place.building] = Math.max(tops[place.building] ?? 0, part.h + part.roofH)
  return map.buildings.flatMap((b, i) => {
    const top = tops[i] ?? 0
    return top + ROOF_CLEAR > heightFor(ON_FOOT_HALF) ? [{ box: boxOf(b.pts), top }] : []
  })
}

/** The highest roof of `towers` within `r` meters (a square) of (x, y), or 0. */
const skyline = (towers: ReadonlyArray<Tower>, x: number, y: number, r: number) => {
  let top = 0
  for (const { box, top: t } of towers) if (box.maxX > x - r && box.minX < x + r && box.maxY > y - r && box.minY < y + r) top = Math.max(top, t)
  return top
}

/** Seconds of travel the camera looks ahead, and how far at most (share of the half view). */
const LEAD_S = 0.55
const MAX_LEAD = 0.6

/**
 * GTA 2's camera: it trails the player a little, looks ahead in the
 * direction of travel, and climbs and sinks slowly with speed. The look-ahead
 * eases on its own, so a sharp turn swings the view round smoothly. Near a
 * high-rise it climbs to stay `ROOF_CLEAR` above its roof.
 */
export const followCamera = (camera: Camera, game: Game, towers: ReadonlyArray<Tower> = []): void => {
  const p = playerPos(game)
  const car = carrier(game)
  const half = camera.height / FOCAL
  let lx = car === null ? 0 : car.vx * LEAD_S
  let ly = car === null ? 0 : car.vy * LEAD_S
  const len = Math.hypot(lx, ly)
  if (len > half * MAX_LEAD) {
    lx *= (half * MAX_LEAD) / len
    ly *= (half * MAX_LEAD) / len
  }
  camera.leadX += (lx - camera.leadX) * 0.05
  camera.leadY += (ly - camera.leadY) * 0.05
  camera.x += (p.x + camera.leadX - camera.x) * 0.15
  camera.y += (p.y + camera.leadY - camera.y) * 0.15
  // Towers as far out as a 2:1 screen shows, plus a margin for their lean.
  const want = heightFor(halfFor(game))
  const height = Math.max(want, skyline(towers, camera.x, camera.y, (want / FOCAL) * 2.5) + ROOF_CLEAR)
  camera.height += (height - camera.height) * 0.03
}

export const startCamera = (game: Game): Camera => ({ x: playerPos(game).x, y: playerPos(game).y, height: heightFor(ON_FOOT_HALF), leadX: 0, leadY: 0 })

/**
 * A view: perspective from the camera, or straight-down orthographic for
 * compare stills (`ortho` = meters from the centre to the top edge), which
 * line up with an aerial photo.
 */
export type View = { readonly camera: Camera; readonly aspect: number; readonly ortho: number | null }

/** Column-major clip-from-map matrix for WebGL. */
export const viewMatrix = ({ camera, aspect, ortho }: View): Float32Array => {
  const { x, y, height: h } = camera
  const far = h + 60
  if (ortho !== null) {
    const sx = 1 / (ortho * aspect)
    const sy = 1 / ortho
    // Depth: z = 0 maps to the back, z = far to the front.
    const sz = 2 / far
    return new Float32Array([sx, 0, 0, 0, 0, -sy, 0, 0, 0, 0, -sz, 0, -sx * x, sy * y, 1, 1])
  }
  const a = (far + NEAR) / (NEAR - far)
  const b = (2 * far * NEAR) / (NEAR - far)
  const fx = FOCAL / aspect
  // view = (x - cx, -(y - cy), z - h); clip.w = h - z.
  return new Float32Array([fx, 0, 0, 0, 0, -FOCAL, 0, 0, 0, 0, a, -1, -fx * x, FOCAL * y, -a * h + b, h])
}

/** Where map point (x, y, z) lands on a screen `width` × `height` px, or null behind the camera. */
export const project = (m: Float32Array, x: number, y: number, z: number, width: number, height: number): readonly [number, number] | null => {
  const cx = (m[0] ?? 0) * x + (m[4] ?? 0) * y + (m[8] ?? 0) * z + (m[12] ?? 0)
  const cy = (m[1] ?? 0) * x + (m[5] ?? 0) * y + (m[9] ?? 0) * z + (m[13] ?? 0)
  const cw = (m[3] ?? 0) * x + (m[7] ?? 0) * y + (m[11] ?? 0) * z + (m[15] ?? 0)
  if (cw <= 0) return null
  return [((cx / cw + 1) / 2) * width, ((1 - cy / cw) / 2) * height]
}

/** The ground the view shows, plus `margin` meters; tall things outside it lean further out, so this is all that can show. */
export const groundBox = ({ camera, aspect, ortho }: View, margin: number): Box => {
  const half = ortho ?? camera.height / FOCAL
  return {
    minX: camera.x - half * aspect - margin,
    maxX: camera.x + half * aspect + margin,
    minY: camera.y - half - margin,
    maxY: camera.y + half + margin,
  }
}

/** Screen px per ground meter at the centre: how close the view is. */
export const groundScale = (view: View, screenHeight: number) => screenHeight / 2 / (view.ortho ?? view.camera.height / FOCAL)

/** Meters from the screen's centre to its corner on the ground: how far out something can be and still show. */
export const groundReach = (view: View) => (view.ortho ?? view.camera.height / FOCAL) * Math.hypot(1, view.aspect)
