import type { GameMap, PoiKind } from "#/map/types.ts"
import { lightFor, type Light, type TrafficLight } from "#/sim/signals.ts"
import type { Walker } from "#/sim/pedestrians.ts"
import { CAR_LENGTH, forwardSpeed } from "#/sim/car.ts"
import { silhouette, type Assets } from "./assets.ts"
import { SHADOW_DIR } from "#/map/photo.ts"
import { playerPos, type Game } from "#/sim/game.ts"
import { BAKE_PX_PER_M, CHUNK_M, ChunkCache, fillPoly, strokeLine } from "./chunks.ts"
import { AREA_COLORS, GROUND, PHOTO_GROUND } from "./palette.ts"
import { PHOTO_TILE_M, photoSource } from "#/map/photo-tiles.ts"
import type { PhotoTiles } from "./photo.ts"

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

/** Options for still frames that are compared against aerial photos. */
export type FrameOptions = { readonly bakeBudget: number; readonly entities: boolean }

/** Meters around the view whose photo tiles load ahead, so driving never waits for one. */
const PREFETCH_M = 160

/**
 * Draws one frame; returns false while part of the ground is still loading.
 * The ground is the aerial photo; chunks without one fall back to the drawn map.
 */
export const drawFrame = (
  ctx: CanvasRenderingContext2D,
  chunks: ChunkCache,
  photos: PhotoTiles,
  sprites: Sprites,
  camera: Camera,
  game: Game,
  options: FrameOptions = { bakeBudget: 3, entities: true },
): boolean => {
  const { width, height } = ctx.canvas
  const z = camera.zoom
  const left = camera.x - width / 2 / z
  const top = camera.y - height / 2 / z
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = PHOTO_GROUND
  ctx.fillRect(0, 0, width, height)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"

  const budget = { left: options.bakeBudget }
  const scale = z / BAKE_PX_PER_M
  // Chunk edges snap to whole pixels shared with the neighbour: no gaps, no overlap.
  const edgeX = (cx: number) => Math.round((cx * CHUNK_M - left) * z)
  const edgeY = (cy: number) => Math.round((cy * CHUNK_M - top) * z)
  let complete = true
  for (let cy = Math.floor(top / CHUNK_M); cy * CHUNK_M < top + height / z; cy++) {
    for (let cx = Math.floor(left / CHUNK_M); cx * CHUNK_M < left + width / z; cx++) {
      if (cx < 0 || cy < 0) continue
      const sx = edgeX(cx)
      const sy = edgeY(cy)
      const src = photoSource(cx * CHUNK_M, cy * CHUNK_M, CHUNK_M)
      const photo = photos.get(src.tx, src.ty)
      if (photo !== null) {
        ctx.drawImage(photo, src.sx, src.sy, src.side, src.side, sx, sy, edgeX(cx + 1) - sx, edgeY(cy + 1) - sy)
        continue
      }
      if (!photos.missing(src.tx, src.ty)) {
        complete = false
        continue
      }
      const chunk = chunks.get(cx, cy, budget)
      if (chunk === null) {
        complete = false
        continue
      }
      ctx.drawImage(chunk, sx, sy, Math.ceil(chunk.width * scale) + 1, Math.ceil(chunk.height * scale) + 1)
    }
  }
  for (let ty = Math.floor((top - PREFETCH_M) / PHOTO_TILE_M); ty * PHOTO_TILE_M < top + height / z + PREFETCH_M; ty++) {
    for (let tx = Math.floor((left - PREFETCH_M) / PHOTO_TILE_M); tx * PHOTO_TILE_M < left + width / z + PREFETCH_M; tx++) photos.want(tx, ty)
  }

  ctx.setTransform(z, 0, 0, z, -left * z, -top * z)
  if (!options.entities) return complete
  for (const car of game.parked) drawCar(ctx, sprites, car.x, car.y, car.angle, car.model)
  for (const npc of game.npcs) drawCar(ctx, sprites, npc.x, npc.y, npc.angle, npc.model)
  for (const w of game.walkers) drawWalker(ctx, sprites, w)
  for (const light of game.signals.lights) drawLight(ctx, light, game.time)
  const { player } = game
  if (player.car !== null) drawCar(ctx, sprites, player.car.x, player.car.y, player.car.angle, player.car.model, true)
  else drawPedestrian(ctx, sprites, player.x, player.y, player.angle)
  return complete
}

type Sprite = { readonly img: HTMLImageElement; readonly shadow: HTMLCanvasElement; readonly halo: HTMLCanvasElement }

/** Sprites plus a black silhouette of each for drop shadows and a light one for the player's outline. */
export type Sprites = { readonly cars: ReadonlyArray<Sprite>; readonly peds: ReadonlyArray<Sprite> }

const toSprite = (img: HTMLImageElement): Sprite => ({ img, shadow: silhouette(img), halo: silhouette(img, "#fff8e0") })

export const makeSprites = (assets: Assets): Sprites => ({ cars: assets.cars.map(toSprite), peds: assets.peds.map(toSprite) })

/** Width of the player's outline in meters: the photo's dark tree canopy hides roads, and you must not lose yourself there. */
const HALO_M = 0.18
const HALO_DIRS = Array.from({ length: 8 }, (_, i) => [Math.cos((i * Math.PI) / 4), Math.sin((i * Math.PI) / 4)] as const)

/** Draw a sprite centred at (x, y), rotated, `length` meters along its nose; width follows the image. */
const drawSprite = (
  ctx: CanvasRenderingContext2D,
  sprite: Sprite | undefined,
  x: number,
  y: number,
  angle: number,
  length: number,
  shadow: number,
  halo = false,
) => {
  if (sprite === undefined) return
  const width = (length * sprite.img.height) / sprite.img.width
  const alpha = ctx.globalAlpha
  ctx.save()
  ctx.translate(x + shadow * SHADOW_DIR[0] * 1.4, y + shadow * SHADOW_DIR[1] * 1.4)
  ctx.rotate(angle)
  // As dark as the shadows in the photo, so sprites sit on it instead of floating.
  ctx.globalAlpha = alpha * 0.55
  ctx.drawImage(sprite.shadow, -length / 2, -width / 2, length, width)
  ctx.restore()
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  if (halo) {
    ctx.globalAlpha = alpha * 0.8
    for (const [dx, dy] of HALO_DIRS) ctx.drawImage(sprite.halo, -length / 2 + dx * HALO_M, -width / 2 + dy * HALO_M, length, width)
  }
  ctx.globalAlpha = alpha
  ctx.drawImage(sprite.img, -length / 2, -width / 2, length, width)
  ctx.restore()
}

const drawCar = (ctx: CanvasRenderingContext2D, sprites: Sprites, x: number, y: number, angle: number, model: number, halo = false) =>
  drawSprite(ctx, sprites.cars[model], x, y, angle, CAR_LENGTH * 1.08, 0.45, halo)

// Drawn larger than life so you can find yourself, like GTA 2.
const drawPedestrian = (ctx: CanvasRenderingContext2D, sprites: Sprites, x: number, y: number, angle: number) =>
  drawSprite(ctx, sprites.peds[0], x, y, angle, 1.8, 0.3, true)

/** Bob while walking; lie flat (rotated, darker) when knocked down. */
const drawWalker = (ctx: CanvasRenderingContext2D, sprites: Sprites, w: Walker) => {
  if (w.down > 0) {
    ctx.globalAlpha = 0.8
    drawSprite(ctx, sprites.peds[w.sprite], w.x, w.y, w.angle + Math.PI / 2, 2.1, 0.1)
    ctx.globalAlpha = 1
    return
  }
  const bob = 1 + Math.sin(w.stride) * 0.05
  drawSprite(ctx, sprites.peds[w.sprite], w.x, w.y, w.angle + Math.sin(w.stride / 2) * 0.08, 2 * bob, 0.3)
}

const LAMP: Readonly<Record<Light, string>> = { red: "#ff3b30", yellow: "#ffcc00", green: "#34c759" }

/** A signal head on the right-hand curb, facing traffic on the light's road; glows in its current colour. */
const drawLight = (ctx: CanvasRenderingContext2D, light: TrafficLight, time: number) => {
  const heads = light.junction.size === 1 ? [light.heading, light.heading + Math.PI / 2] : [light.heading]
  for (const heading of heads) {
    for (const side of light.direction === "both" ? [1, -1] : [light.direction === "forward" ? 1 : -1]) {
      const facing = heading + (side === 1 ? 0 : Math.PI)
      const state = lightFor(light.junction, facing, time)
      // Right-hand curb for traffic driving along `facing`.
      const off = light.roadWidth / 2 + 0.8
      const x = light.x - Math.sin(facing) * off
      const y = light.y + Math.cos(facing) * off
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(facing)
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 2.2)
      glow.addColorStop(0, `${LAMP[state]}aa`)
      glow.addColorStop(1, `${LAMP[state]}00`)
      ctx.fillStyle = glow
      ctx.fillRect(-2.2, -2.2, 4.4, 4.4)
      ctx.fillStyle = "#1c1c1e"
      ctx.fillRect(-0.45, -1.2, 0.9, 2.4)
      const lamps: ReadonlyArray<Light> = ["red", "yellow", "green"]
      lamps.forEach((lamp, i) => {
        ctx.fillStyle = lamp === state ? LAMP[lamp] : "#3a3a3c"
        ctx.beginPath()
        ctx.arc(0, -0.75 + i * 0.75, 0.3, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.restore()
    }
  }
}

const POI_STYLE: Readonly<Record<PoiKind, readonly [string, string]>> = {
  supermarket: ["🛒", "#d62828"],
  drugstore: ["🧴", "#7b2cbf"],
  bakery: ["🥨", "#b5651d"],
  fuel: ["⛽", "#1d4ed8"],
  pharmacy: ["💊", "#15803d"],
  bank: ["🏦", "#334155"],
  food: ["🍽️", "#c2410c"],
  police: ["🚓", "#166534"],
  post: ["✉️", "#ca8a04"],
  school: ["🏫", "#475569"],
  doctor: ["🩺", "#0e7490"],
  civic: ["🏛️", "#475569"],
  shop: ["🛍️", "#6b7280"],
}

/** Always labelled; the rest only when you are close (on foot). */
const IMPORTANT: ReadonlySet<PoiKind> = new Set(["supermarket", "drugstore", "fuel", "police", "pharmacy", "post", "civic"])

export const poiIcon = (kind: PoiKind) => POI_STYLE[kind][0]

/** Name tags over shops and places, in screen space; later labels yield to earlier ones. */
export const drawPlaces = (ctx: CanvasRenderingContext2D, map: GameMap, camera: Camera, dpr: number) => {
  const { width, height } = ctx.canvas
  const z = camera.zoom * dpr
  const close = camera.zoom > 9
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.font = `bold ${12 * dpr}px ui-sans-serif, system-ui, sans-serif`
  ctx.textBaseline = "middle"
  const taken: Array<readonly [number, number, number, number]> = []
  const order = map.pois.toSorted((a, b) => Number(IMPORTANT.has(b.kind)) - Number(IMPORTANT.has(a.kind)))
  for (const poi of order) {
    if (!close && !IMPORTANT.has(poi.kind)) continue
    const sx = (poi.x - camera.x) * z + width / 2
    const sy = (poi.y - camera.y) * z + height / 2
    if (sx < -200 || sy < -50 || sx > width + 200 || sy > height + 50) continue
    const [icon, color] = POI_STYLE[poi.kind]
    const text = `${icon} ${poi.name}`
    const w = ctx.measureText(text).width + 14 * dpr
    const h = 22 * dpr
    const x0 = sx - w / 2
    const y0 = sy - h - 10 * dpr
    if (taken.some(([x, y, tw, th]) => x0 < x + tw && x0 + w > x && y0 < y + th && y0 + h > y)) continue
    taken.push([x0, y0, w, h])
    ctx.fillStyle = "rgba(0,0,0,0.35)"
    ctx.beginPath()
    ctx.roundRect(x0 + 2 * dpr, y0 + 2 * dpr, w, h, 6 * dpr)
    ctx.fill()
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(x0, y0, w, h, 6 * dpr)
    ctx.moveTo(sx - 6 * dpr, y0 + h)
    ctx.lineTo(sx, y0 + h + 8 * dpr)
    ctx.lineTo(sx + 6 * dpr, y0 + h)
    ctx.fill()
    ctx.fillStyle = "#fff"
    ctx.fillText(text, x0 + 7 * dpr, y0 + h / 2 + 1)
  }
}

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
  for (const poi of map.pois) {
    if (!IMPORTANT.has(poi.kind)) continue
    ctx.fillStyle = POI_STYLE[poi.kind][1]
    ctx.beginPath()
    ctx.arc(poi.x, poi.y, 2.2 / s, 0, Math.PI * 2)
    ctx.fill()
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
