import type { Box } from "./geometry.ts"

/** Uniform bucket grid: each cell lists the indices of items whose box overlaps it. */
export class Grid {
  private readonly cols: number
  private readonly rows: number
  private readonly cells: Array<Array<number>>

  constructor(
    width: number,
    height: number,
    private readonly cellSize: number,
  ) {
    this.cols = Math.ceil(width / cellSize) + 1
    this.rows = Math.ceil(height / cellSize) + 1
    this.cells = Array.from({ length: this.cols * this.rows }, () => [])
  }

  insert(index: number, box: Box): void {
    this.forCells(box, (cell) => cell.push(index))
  }

  /** Unique indices whose box may overlap `box`. */
  query(box: Box): Array<number> {
    const seen = new Set<number>()
    this.forCells(box, (cell) => {
      for (const i of cell) seen.add(i)
    })
    return [...seen]
  }

  /** Indices in the single cell under (x, y). Cheap; may contain duplicates across calls. */
  at(x: number, y: number): ReadonlyArray<number> {
    const cx = Math.floor(x / this.cellSize)
    const cy = Math.floor(y / this.cellSize)
    if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows) return []
    return this.cells[cy * this.cols + cx] ?? []
  }

  private forCells(box: Box, fn: (cell: Array<number>) => void): void {
    const x0 = Math.max(0, Math.floor(box.minX / this.cellSize))
    const y0 = Math.max(0, Math.floor(box.minY / this.cellSize))
    const x1 = Math.min(this.cols - 1, Math.floor(box.maxX / this.cellSize))
    const y1 = Math.min(this.rows - 1, Math.floor(box.maxY / this.cellSize))
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const cell = this.cells[y * this.cols + x]
        if (cell !== undefined) fn(cell)
      }
    }
  }
}
