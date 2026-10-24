import { describe, expect, it } from "vitest"
import { groundBox, groundScale, heightFor, project, viewMatrix, type View } from "./camera.ts"

const camera = { x: 100, y: 200, height: heightFor(60) }

describe("the perspective camera", () => {
  const view: View = { camera, aspect: 1.6, ortho: null }
  const m = viewMatrix(view)

  it("looks straight down: the point below it is the screen's centre, north up", () => {
    const [cx, cy] = project(m, 100, 200, 0, 1600, 1000) ?? [0, 0]
    expect(cx).toBeCloseTo(800)
    expect(cy).toBeCloseTo(500)
    const [, north] = project(m, 100, 150, 0, 1600, 1000) ?? [0, 0]
    expect(north).toBeLessThan(500)
  })

  it("shows `half` meters of ground from the centre to the top edge", () => {
    expect(project(m, 100, 140, 0, 1600, 1000)?.[1]).toBeCloseTo(0)
    expect(groundBox(view, 0).maxX - 100).toBeCloseTo(60 * 1.6)
    expect(groundScale(view, 1000)).toBeCloseTo(500 / 60)
  })

  it("leans tall things away from the centre, so walls show towards the edges", () => {
    const [foot] = project(m, 150, 200, 0, 1600, 1000) ?? [0, 0]
    const [roof] = project(m, 150, 200, 12, 1600, 1000) ?? [0, 0]
    expect(roof).toBeGreaterThan(foot + 20)
  })
})

describe("the compare camera", () => {
  it("is orthographic: a roof lands on its footprint", () => {
    const m = viewMatrix({ camera: { x: 0, y: 0, height: 100 }, aspect: 1, ortho: 80 })
    expect(project(m, 40, -40, 0, 1000, 1000)).toEqual(project(m, 40, -40, 30, 1000, 1000))
    expect(project(m, 80, 0, 0, 1000, 1000)?.[0]).toBeCloseTo(1000)
  })
})
