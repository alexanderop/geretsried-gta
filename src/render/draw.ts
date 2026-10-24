import type { GameMap } from "#/map/types.ts"
import { CAR_LENGTH, forwardSpeed } from "#/sim/car.ts"
import { silhouette, type Assets } from "./assets.ts"
import { playerPos, type Game } from "#/sim/game.ts"
import { BAKE_PX_PER_M, CHUNK_M, ChunkCache, fillPoly, strokeLine } from "./chunks.ts"
import { AREA_COLORS, GROUND } from "./palette.ts"

export type Camera = { x: number; y: number; zoom: number }

/** Pixels per meter: close when standing, pulls back with speed (GTA 2 style). */
const targetZoom = (game: Game) => {
  if (game.player.car === null) return 11
  return 7 - Math.min(3.8, Math.abs(forwardSpeed(game.player.car)) * 0.12)
}

export const followCamera = (camera: Camera, game: Game): void => {
  const p = playerPos(game)
  const lead = game.player.car === null ? { x: 0, y: 0 } : { x: game.player.car.vx * 0.6, y: game.player.car.vy * 0.6 }
  camera.x += (p.x + lead.x - camera.x) * 0.12
  camera.y += (p.y + lead.y - camera.y) * 0.12
  camera.zoom += (targetZoom(game) - camera.zoom) * 0.04
}

export const drawFrame = (ctx: CanvasRenderingContext2D, chunks: ChunkCache, sprites: Sprites, camera: Camera, game: Game): void => {
  const { width, height } = ctx.canvas
  const z = camera.zoom
  const left = camera.x - width / 2 / z
  const top = camera.y - height / 2 / z
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = GROUND
  ctx.fillRect(0, 0, width, height)
  ctx.imageSmoothingEnabled = true

  const budget = { left: 3 }
  const scale = z / BAKE_PX_PER_M
  for (let cy = Math.floor(top / CHUNK_M); cy * CHUNK_M < top + height / z; cy++) {
    for (let cx = Math.floor(left / CHUNK_M); cx * CHUNK_M < left + width / z; cx++) {
      if (cx < 0 || cy < 0) continue
      const chunk = chunks.get(cx, cy, budget)
      if (chunk === null) continue
      const sx = Math.floor((cx * CHUNK_M - left) * z)
      const sy = Math.floor((cy * CHUNK_M - top) * z)
      ctx.drawImage(chunk, sx, sy, Math.ceil(chunk.width * scale) + 1, Math.ceil(chunk.height * scale) + 1)
    }
  }

  ctx.setTransform(z, 0, 0, z, -left * z, -top * z)
  for (const car of game.parked) drawCar(ctx, sprites, car.x, car.y, car.angle, car.model)
  for (const npc of game.npcs) drawCar(ctx, sprites, npc.x, npc.y, npc.angle, npc.model)
  const { player } = game
  if (player.car !== null) drawCar(ctx, sprites, player.car.x, player.car.y, player.car.angle, player.car.model)
  else drawPedestrian(ctx, sprites, player.x, player.y, player.angle)
}

/** Sprites plus a black silhouette of each for drop shadows. */
export type Sprites = {
  readonly cars: ReadonlyArray<{ readonly img: HTMLImageElement; readonly shadow: HTMLCanvasElement }>
  readonly peds: ReadonlyArray<{ readonly img: HTMLImageElement; readonly shadow: HTMLCanvasElement }>
}

export const makeSprites = (assets: Assets): Sprites => ({
  cars: assets.cars.map((img) => ({ img, shadow: silhouette(img) })),
  peds: assets.peds.map((img) => ({ img, shadow: silhouette(img) })),
})

/** Draw a sprite centred at (x, y), rotated, `length` meters along its nose; width follows the image. */
const drawSprite = (
  ctx: CanvasRenderingContext2D,
  sprite: Sprites["cars"][number] | undefined,
  x: number,
  y: number,
  angle: number,
  length: number,
  shadow: number,
) => {
  if (sprite === undefined) return
  const width = (length * sprite.img.height) / sprite.img.width
  ctx.save()
  ctx.translate(x + shadow, y + shadow)
  ctx.rotate(angle)
  ctx.globalAlpha = 0.4
  ctx.drawImage(sprite.shadow, -length / 2, -width / 2, length, width)
  ctx.restore()
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.drawImage(sprite.img, -length / 2, -width / 2, length, width)
  ctx.restore()
}

const drawCar = (ctx: CanvasRenderingContext2D, sprites: Sprites, x: number, y: number, angle: number, model: number) =>
  drawSprite(ctx, sprites.cars[model], x, y, angle, CAR_LENGTH * 1.08, 0.45)

// Drawn larger than life so you can find yourself, like GTA 2.
const drawPedestrian = (ctx: CanvasRenderingContext2D, sprites: Sprites, x: number, y: number, angle: number) =>
  drawSprite(ctx, sprites.peds[0], x, y, angle, 1.6, 0.3)

/** A one-time overview of the whole town for the minimap. */
export const bakeMinimap = (map: GameMap, size: number): HTMLCanvasElement => {
  const s = size / Math.max(map.width, map.height)
  const canvas = document.createElement("canvas")
  canvas.width = Math.ceil(map.width * s)
  canvas.height = Math.ceil(map.height * s)
  const ctx = canvas.getContext("2d")
  if (ctx === null) return canvas
  ctx.fillStyle = GROUND
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.setTransform(s, 0, 0, s, 0, 0)
  for (const a of map.areas) {
    ctx.fillStyle = AREA_COLORS[a.kind]
    fillPoly(ctx, a.pts)
  }
  ctx.strokeStyle = AREA_COLORS.water
  for (const w of map.waterways) {
    ctx.lineWidth = w.width
    strokeLine(ctx, w.pts)
  }
  ctx.fillStyle = "#6b4a40"
  for (const b of map.buildings) fillPoly(ctx, b.pts)
  ctx.strokeStyle = "#e0dccc"
  for (const r of map.roads) {
    if (r.kind === "footway" || r.kind === "track") continue
    ctx.lineWidth = Math.max(r.width * 1.5, 1.5 / s)
    strokeLine(ctx, r.pts)
  }
  return canvas
}

export const drawMinimap = (ctx: CanvasRenderingContext2D, minimap: HTMLCanvasElement, map: GameMap, game: Game) => {
  const { width } = ctx.canvas
  const pad = 16
  const x0 = width - minimap.width - pad
  const y0 = pad
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 0.9
  ctx.drawImage(minimap, x0, y0)
  ctx.globalAlpha = 1
  ctx.strokeStyle = "rgba(0,0,0,0.7)"
  ctx.lineWidth = 2
  ctx.strokeRect(x0, y0, minimap.width, minimap.height)
  const p = playerPos(game)
  const angle = game.player.car?.angle ?? game.player.angle
  ctx.save()
  ctx.translate(x0 + (p.x / map.width) * minimap.width, y0 + (p.y / map.height) * minimap.height)
  ctx.rotate(angle)
  ctx.fillStyle = "#ff3b30"
  ctx.beginPath()
  ctx.moveTo(6, 0)
  ctx.lineTo(-4, 4)
  ctx.lineTo(-4, -4)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}
