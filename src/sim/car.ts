/** A car the player can drive. Angle 0 points east; y points south. */
export type Car = {
  x: number
  y: number
  angle: number
  vx: number
  vy: number
  readonly color: string
}

export type Controls = {
  /** -1 brake / reverse … 1 full throttle */
  readonly throttle: number
  /** -1 left … 1 right */
  readonly steer: number
  readonly handbrake: boolean
}

/** How the ground under the car behaves. */
export type Surface = { readonly drag: number; readonly grip: number }

export const ROAD: Surface = { drag: 0.3, grip: 9 }
export const GRASS: Surface = { drag: 1.1, grip: 5 }
export const WATER: Surface = { drag: 3, grip: 2 }

export const CAR_LENGTH = 4.4
export const CAR_WIDTH = 2

const ENGINE = 11
const BRAKE = 18
const REVERSE = 5
const MAX_REVERSE = 8
const ROLLING = 1.5
const WHEELBASE = 2.6
const MAX_STEER = 0.55

/** Forward speed in m/s (negative when reversing). */
export const forwardSpeed = (car: Car) => car.vx * Math.cos(car.angle) + car.vy * Math.sin(car.angle)

/** Arcade top-down handling: engine and drag along the nose, grip kills sideways slide. */
export const stepCar = (car: Car, controls: Controls, surface: Surface, dt: number): Car => {
  const fx = Math.cos(car.angle)
  const fy = Math.sin(car.angle)
  let vF = car.vx * fx + car.vy * fy
  let vR = car.vx * -fy + car.vy * fx

  if (controls.throttle > 0) vF += (vF < 0 ? BRAKE : ENGINE) * controls.throttle * dt
  else if (controls.throttle < 0) {
    if (vF > 0.5) vF += BRAKE * controls.throttle * dt
    else vF = Math.max(-MAX_REVERSE, vF + REVERSE * controls.throttle * dt)
  } else vF -= Math.sign(vF) * Math.min(Math.abs(vF), ROLLING * dt)

  vF -= vF * surface.drag * dt
  if (controls.handbrake) vF -= Math.sign(vF) * Math.min(Math.abs(vF), 6 * dt)
  vR *= Math.exp(-(controls.handbrake ? 1.5 : surface.grip) * dt)

  const steerAngle = (controls.steer * MAX_STEER) / (1 + Math.abs(vF) / 18)
  const yawRate = ((vF * Math.tan(steerAngle)) / WHEELBASE) * (controls.handbrake ? 1.4 : 1)
  const angle = car.angle + yawRate * dt

  const vx = vF * fx - vR * fy
  const vy = vF * fy + vR * fx
  return { ...car, angle, vx, vy, x: car.x + vx * dt, y: car.y + vy * dt }
}

/** Corners and side midpoints, used for building collision. */
export const carOutline = (car: Car): Array<readonly [number, number]> => {
  const fx = Math.cos(car.angle)
  const fy = Math.sin(car.angle)
  const hl = CAR_LENGTH / 2
  const hw = CAR_WIDTH / 2
  const at = (f: number, r: number) => [car.x + fx * f - fy * r, car.y + fy * f + fx * r] as const
  return [at(hl, hw), at(hl, -hw), at(-hl, hw), at(-hl, -hw), at(0, hw), at(0, -hw), at(hl, 0), at(-hl, 0)]
}
