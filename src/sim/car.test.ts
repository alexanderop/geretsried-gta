import { describe, expect, it } from "vitest"
import { GRASS, ROAD, forwardSpeed, stepCar, type Car, type Controls } from "./car.ts"

const parked: Car = { x: 0, y: 0, angle: 0, vx: 0, vy: 0, color: "red" }
const drive = (car: Car, controls: Controls, seconds: number, surface = ROAD) => {
  let c = car
  for (let t = 0; t < seconds * 60; t++) c = stepCar(c, controls, surface, 1 / 60)
  return c
}
const sideways = (c: Car) => Math.abs(c.vx * -Math.sin(c.angle) + c.vy * Math.cos(c.angle))
const gas: Controls = { throttle: 1, steer: 0, handbrake: false }

describe("stepCar", () => {
  it("reaches city speeds in a few seconds and tops out near 130 km/h", () => {
    expect(forwardSpeed(drive(parked, gas, 3)) * 3.6).toBeGreaterThan(70)
    const top = forwardSpeed(drive(parked, gas, 40)) * 3.6
    expect(top).toBeGreaterThan(120)
    expect(top).toBeLessThan(140)
  })

  it("is much slower on grass", () => {
    expect(forwardSpeed(drive(parked, gas, 20, GRASS)) * 3.6).toBeLessThan(40)
  })

  it("turns right (clockwise, toward +y) when steering right", () => {
    const car = drive(drive(parked, gas, 2), { throttle: 1, steer: 1, handbrake: false }, 1)
    expect(car.angle).toBeGreaterThan(0.3)
  })

  it("reverses when braking from standstill", () => {
    expect(forwardSpeed(drive(parked, { throttle: -1, steer: 0, handbrake: false }, 2))).toBeLessThan(-3)
  })

  it("slides sideways longer with the handbrake", () => {
    const fast = drive(parked, gas, 4)
    const turn = (handbrake: boolean) => drive(fast, { throttle: 0, steer: 1, handbrake }, 0.5)
    expect(sideways(turn(true))).toBeGreaterThan(sideways(turn(false)))
  })
})
