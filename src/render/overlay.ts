/**
 * Screen-space layers drawn with Canvas 2D over the WebGL town: the ring
 * that finds the player, shop and place labels, and the minimap.
 */
import type { GameMap, PoiKind } from "#/map/types.ts"
import { playerPos, type Game } from "#/sim/game.ts"
import { OVERVIEW_M_PER_PX } from "#/map/photo-tiles.ts"
import { project } from "./camera.ts"

const strokeLine = (ctx: CanvasRenderingContext2D, pts: ReadonlyArray<number>) => {
  ctx.beginPath()
  ctx.moveTo(pts[0] ?? 0, pts[1] ?? 0)
  for (let i = 2; i + 1 < pts.length; i += 2) ctx.lineTo(pts[i] ?? 0, pts[i + 1] ?? 0)
  ctx.stroke()
}

/** A ring of fixed screen size around the player, at the car's roof or the walker's head, so you never lose yourself under trees. */
export const drawPlayerMarker = (ctx: CanvasRenderingContext2D, view: Float32Array, game: Game, dpr: number) => {
  const { width, height } = ctx.canvas
  const p = playerPos(game)
  const at = project(view, p.x, p.y, game.player.car === null ? 1.75 : 1.5, width, height)
  if (at === null) return
  const [sx, sy] = at
  const r = (game.player.car === null ? 16 : 26) * dpr
  const pulse = 0.65 + 0.25 * Math.sin(game.time * 5)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = pulse
  ctx.lineWidth = 4 * dpr
  ctx.strokeStyle = "rgba(0,0,0,0.6)"
  ctx.beginPath()
  ctx.arc(sx, sy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 2 * dpr
  ctx.strokeStyle = "#ffd60a"
  ctx.stroke()
  ctx.globalAlpha = 1
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
  church: ["⛪", "#a16207"],
  car_repair: ["🔧", "#7c2d12"],
  shop: ["🛍️", "#6b7280"],
}

/** Labelled on the map; the HUD names the rest when you are near. */
const IMPORTANT: ReadonlySet<PoiKind> = new Set(["supermarket", "drugstore", "fuel", "police", "pharmacy", "post", "civic"])

export const poiIcon = (kind: PoiKind) => POI_STYLE[kind][0]

/** Name tags over shops and places, in screen space; later labels yield to earlier ones. */
export const drawPlaces = (ctx: CanvasRenderingContext2D, map: GameMap, view: Float32Array, dpr: number) => {
  const { width, height } = ctx.canvas
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.font = `bold ${12 * dpr}px ui-sans-serif, system-ui, sans-serif`
  ctx.textBaseline = "middle"
  const taken: Array<readonly [number, number, number, number]> = []
  for (const poi of map.pois) {
    if (!IMPORTANT.has(poi.kind)) continue
    // Labels hang over the roofs, at about eave height.
    const at = project(view, poi.x, poi.y, 6, width, height)
    if (at === null) continue
    const [sx, sy] = at
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

/** A one-time overview of the whole town for the minimap: the aerial photo, streets and important places on top. */
export const bakeMinimap = (map: GameMap, overview: HTMLImageElement, size: number): HTMLCanvasElement => {
  const s = size / Math.max(map.width, map.height)
  const canvas = document.createElement("canvas")
  canvas.width = Math.ceil(map.width * s)
  canvas.height = Math.ceil(map.height * s)
  const ctx = canvas.getContext("2d")
  if (ctx === null) return canvas
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(overview, 0, 0, map.width / OVERVIEW_M_PER_PX, map.height / OVERVIEW_M_PER_PX, 0, 0, canvas.width, canvas.height)
  ctx.setTransform(s, 0, 0, s, 0, 0)
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.strokeStyle = "rgba(245,240,225,0.75)"
  for (const r of map.roads) {
    if (r.kind === "footway" || r.kind === "track" || r.kind === "service") continue
    ctx.lineWidth = Math.max(r.width, 1.2 / s)
    strokeLine(ctx, r.pts)
  }
  for (const poi of map.pois) {
    if (!IMPORTANT.has(poi.kind)) continue
    ctx.fillStyle = POI_STYLE[poi.kind][1]
    ctx.strokeStyle = "#fff"
    ctx.lineWidth = 0.8 / s
    ctx.beginPath()
    ctx.arc(poi.x, poi.y, 2.4 / s, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
  return canvas
}

export const drawMinimap = (ctx: CanvasRenderingContext2D, minimap: HTMLCanvasElement, map: GameMap, game: Game) => {
  const { width, height } = ctx.canvas
  const pad = 16
  // Bottom right, clear of the money and the attribution line.
  const x0 = width - minimap.width - pad
  const y0 = height - minimap.height - pad * 3
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

/** Pixels from the screen edge the off-screen arrow keeps. */
const ARROW_INSET = 56

/**
 * GTA 2's mission arrow: a yellow pointer bobbing over the target when it is
 * on screen, or pinned to the screen edge and turned towards it when not.
 */
export const drawTargetArrow = (ctx: CanvasRenderingContext2D, view: Float32Array, target: { readonly x: number; readonly y: number }, time: number, dpr: number) => {
  const { width, height } = ctx.canvas
  const at = project(view, target.x, target.y, 0, width, height)
  if (at === null) return
  const [tx, ty] = at
  const inset = ARROW_INSET * dpr
  const onScreen = tx > inset && tx < width - inset && ty > inset && ty < height - inset
  const cx = width / 2
  const cy = height / 2
  let x = tx
  let y = ty
  let angle = Math.PI / 2
  if (onScreen) y = ty - (34 + Math.sin(time * 6) * 8) * dpr
  else {
    angle = Math.atan2(ty - cy, tx - cx)
    // Where the line from the centre to the target leaves the inset screen.
    const k = Math.min((width / 2 - inset) / Math.abs(Math.cos(angle) || 1e-6), (height / 2 - inset) / Math.abs(Math.sin(angle) || 1e-6))
    x = cx + Math.cos(angle) * k
    y = cy + Math.sin(angle) * k
  }
  const s = 30 * dpr
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.moveTo(s, 0)
  ctx.lineTo(-s * 0.6, -s * 0.75)
  ctx.lineTo(-s * 0.25, 0)
  ctx.lineTo(-s * 0.6, s * 0.75)
  ctx.closePath()
  ctx.lineWidth = 3 * dpr
  ctx.strokeStyle = "#000"
  ctx.stroke()
  ctx.fillStyle = "#ffd60a"
  ctx.fill()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}
