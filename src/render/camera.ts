/**
 * The GTA 2 camera: straight down from a height, with a narrow perspective,
 * so roofs come towards you and walls show towards the screen edges. It
 * climbs as the car speeds up and drops when you walk. Map space is x east,
 * y south, z up, in meters; the screen shows north up.
 */
import { forwardSpeed } from "#/sim/car.ts"
import { playerPos, type Game } from "#/sim/game.ts"
import type { Box } from "#/world/geometry.ts"

/** Where the camera is, and the look-ahead it is easing towards the travel direction. */
export type Camera = { x: number; y: number; height: number; leadX: number; leadY: number }

/**
 * Vertical field of view: narrow, from high up, like GTA 2. Walls show
 * clearly towards the screen edges (a house leans out about 2.5 m there on
 * foot) without the near-wide-angle stretch a low camera would give.
 */
const FOV = (26 * Math.PI) / 180
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
const halfFor = (game: Game) => {
  if (game.player.car === null) return ON_FOOT_HALF
  const t = Math.min(1, Math.abs(forwardSpeed(game.player.car)) / FULL_SPEED)
  return CAR_HALF + (MAX_HALF - CAR_HALF) * t * (2 - t)
}

export const heightFor = (half: number) => half * FOCAL

/** Seconds of travel the camera looks ahead, and how far at most (share of the half view). */
const LEAD_S = 0.55
const MAX_LEAD = 0.6

/**
 * GTA 2's camera: it trails the player a little, looks ahead in the
 * direction of travel, and climbs and sinks slowly with speed. The look-ahead
 * eases on its own, so a sharp turn swings the view round smoothly.
 */
export const followCamera = (camera: Camera, game: Game): void => {
  const p = playerPos(game)
  const car = game.player.car
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
  camera.height += (heightFor(halfFor(game)) - camera.height) * 0.03
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
