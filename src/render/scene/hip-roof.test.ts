import { describe, expect, it } from "vitest"
import { signedArea } from "./geometry.ts"
import { hipFaces, type HipFace } from "./hip-roof.ts"

const area = (faces: ReadonlyArray<HipFace>) => faces.reduce((s, f) => s + Math.abs(signedArea(f.poly)), 0)
/** The roof's rise over (x, y): the face that covers it, at that point (its plane through its corners). */
const riseAt = (faces: ReadonlyArray<HipFace>, x: number, y: number) => {
  for (const f of faces) {
    const k = f.poly.length / 2
    let inside = true
    for (let i = 0; i < k && inside; i++) {
      const j = (i + 1) % k
      const ex = (f.poly[j * 2] ?? 0) - (f.poly[i * 2] ?? 0)
      const ey = (f.poly[j * 2 + 1] ?? 0) - (f.poly[i * 2 + 1] ?? 0)
      const len = Math.hypot(ex, ey)
      // How far (x, y) lies inside this edge, in meters.
      if (len > 1e-9) inside = ((ex * (y - (f.poly[i * 2 + 1] ?? 0)) - ey * (x - (f.poly[i * 2] ?? 0))) / len) * Math.sign(signedArea(f.poly)) >= -1e-6
    }
    if (!inside) continue
    // The plane rises along -out from its wall: rise = -(out · p) + const, the const from the first corner.
    const c0 = (f.rise[0] ?? 0) + f.out[0] * (f.poly[0] ?? 0) + f.out[1] * (f.poly[1] ?? 0)
    return c0 - f.out[0] * x - f.out[1] * y
  }
  return null
}

describe("a hipped roof", () => {
  // 20 m by 10 m, the long walls along y = 0 and y = 10.
  const box = [0, 0, 20, 0, 20, 10, 0, 10]

  it("covers the footprint, its ridge half the width up, the hips at the ends", () => {
    const faces = hipFaces(box)
    expect(area(faces)).toBeCloseTo(200)
    expect(Math.max(...faces.flatMap((f) => f.rise))).toBeCloseTo(5)
    expect(riseAt(faces, 10, 5)).toBeCloseTo(5)
    expect(riseAt(faces, 10, 2)).toBeCloseTo(2)
    // Over the hip at the end: the end wall's plane, 1 m from it.
    expect(riseAt(faces, 1, 5)).toBeCloseTo(1)
  })

  it("is the same whichever way the outline winds, and faces each plane out over its wall", () => {
    const cw = [0, 0, 0, 10, 20, 10, 20, 0]
    expect(riseAt(hipFaces(cw), 13, 3)).toBeCloseTo(3)
    const south = hipFaces(box).filter((f) => f.out[1] > 0.9)
    expect(south.length).toBeGreaterThan(0)
  })

  it("puts a valley into an L's inner corner and a ridge along each wing, and never steps", () => {
    // Two 10 m wide wings: along y from x 0..10 (y 0..30) and along x from y 20..30 (x 0..40). Inner corner at (10, 20).
    const ell = [0, 0, 10, 0, 10, 20, 40, 20, 40, 30, 0, 30]
    const faces = hipFaces(ell)
    expect(area(faces)).toBeCloseTo(10 * 30 + 30 * 10)
    expect(riseAt(faces, 5, 8)).toBeCloseTo(5)
    expect(riseAt(faces, 25, 25)).toBeCloseTo(5)
    // On the valley from the inner corner towards the corner square's middle: 1.5 m from both wings' inner walls.
    expect(riseAt(faces, 8.5, 21.5)).toBeCloseTo(1.5)
    expect(steps(faces)).toBe(0)
  })

  it("never steps over a U or the Rathaus's L with its slightly bent walls", () => {
    const u = [0, 0, 30, 0, 30, 25, 20, 25, 20, 10, 10, 10, 10, 25, 0, 25]
    const rathaus = [2574.8, 2839.4, 2583, 2826.1, 2611.9, 2844, 2623.1, 2825.9, 2626.3, 2827.9, 2635.5, 2833.6, 2619.5, 2859.5, 2616.1, 2864.9, 2587.9, 2847.5]
    const faces = hipFaces(u)
    expect(area(faces)).toBeCloseTo(30 * 25 - 10 * 15)
    expect(steps(faces)).toBe(0)
    // Its walls 3 and 4 are parallel but 4 cm apart: their planes meet with a step that small.
    const hall = hipFaces(rathaus)
    expect(area(hall)).toBeCloseTo(Math.abs(signedArea(rathaus)), 3)
    expect(steps(hall, 0.05)).toBe(0)
  })
})

/** Corners of faces that do not lie at the rise of every face round them: steps in the roof. */
const steps = (faces: ReadonlyArray<HipFace>, tolerance = 1e-4) => {
  let bad = 0
  for (const f of faces) {
    for (let i = 0; i < f.poly.length / 2; i++) {
      for (const g of faces) {
        const r = riseAt([g], f.poly[i * 2] ?? 0, f.poly[i * 2 + 1] ?? 0)
        if (r !== null && Math.abs(r - (f.rise[i] ?? 0)) > tolerance) bad++
      }
    }
  }
  return bad
}
