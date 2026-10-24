import type { Covered } from "#/map/types.ts"
import { boxOf, type Box } from "#/world/geometry.ts"
import { Grid } from "#/world/grid.ts"

/** Asphalt as the photo shows it in shade, so a drawn-in stretch blends into the visible road it joins. */
const ASPHALT = "rgb(92,94,92)"
/** Soft edge: nested strokes, widest first, each adding a little opacity towards the middle. */
const LAYERS: ReadonlyArray<readonly [number, number]> = [
  [1.6, 0.2],
  [0.6, 0.2],
  [-0.6, 0.25],
]

/**
 * Roads the aerial photo hides under tree crowns (found at import, see
 * `findCoveredRoads`), drawn over the photo as a translucent band with soft
 * edges so the driver sees where the road goes.
 */
export class CoveredRoads {
  private readonly grid: Grid

  constructor(
    private readonly covered: ReadonlyArray<Covered>,
    width: number,
    height: number,
  ) {
    this.grid = new Grid(width, height, 128)
    covered.forEach((c, i) => this.grid.insert(i, boxOf(c.pts, c.width)))
  }

  /** Draw the stretches in `view`; `ctx` must already have the map transform. */
  draw(ctx: CanvasRenderingContext2D, view: Box) {
    const ids = this.grid.query(view)
    if (ids.length === 0) return
    ctx.save()
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = ASPHALT
    // One path per width and layer: where stretches meet, a single stroke does not stack its alpha.
    const byWidth = new Map<number, Array<number>>()
    for (const i of ids) {
      const width = this.covered[i]?.width ?? 0
      byWidth.set(width, [...(byWidth.get(width) ?? []), i])
    }
    for (const [extra, alpha] of LAYERS) {
      ctx.globalAlpha = alpha
      for (const [width, group] of byWidth) {
        ctx.lineWidth = Math.max(1, width + extra)
        ctx.beginPath()
        for (const i of group) {
          const pts = this.covered[i]?.pts ?? []
          ctx.moveTo(pts[0] ?? 0, pts[1] ?? 0)
          for (let k = 2; k + 1 < pts.length; k += 2) ctx.lineTo(pts[k] ?? 0, pts[k + 1] ?? 0)
        }
        ctx.stroke()
      }
    }
    ctx.restore()
  }
}
