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

export const POI_STYLE: Readonly<Record<PoiKind, readonly [string, string]>> = {
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
  gym: ["🏋️", "#be123c"],
  health: ["⚕️", "#0f766e"],
  kindergarten: ["🧸", "#db2777"],
  care_home: ["🧓", "#9a3412"],
  bar: ["🍸", "#6d28d9"],
  parcel_locker: ["📦", "#a16207"],
  office: ["💼", "#57534e"],
  sport: ["🏟️", "#0369a1"],
}

/** Labelled on the map; the HUD names the rest when you are near. */
const IMPORTANT: ReadonlySet<PoiKind> = new Set(["supermarket", "drugstore", "fuel", "police", "pharmacy", "post", "civic", "sport"])

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

/** A one-time overview of the whole town for the minimap, at the aerial photo's own resolution: the photo, streets and important places on top. */
export const bakeMinimap = (map: GameMap, overview: HTMLImageElement): HTMLCanvasElement => {
  const s = 1 / OVERVIEW_M_PER_PX
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
    ctx.arc(poi.x, poi.y, 1.6 / s, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
  return canvas
}

/** Metres the minimap shows edge to edge, on foot; it zooms out with speed so the road ahead stays in view. */
const RADAR_M = 600
const RADAR_MAX_M = 1000
/** Screen size of the minimap in CSS pixels. */
const RADAR_PX = 180
/** On a phone it is smaller and moves to the top left corner: the thumb controls take the bottom. */
export const TOUCH_RADAR_PX = 112

/** Where the radar goes: the desktop's bottom right, or a phone's top left inside the safe area (CSS pixels). */
export type RadarPlace = { readonly corner: "bottom-right" } | { readonly corner: "top-left"; readonly left: number; readonly top: number }

/** GTA's pointer: an arrowhead of size `a` facing +x, yellow with a black edge. */
const arrowHead = (ctx: CanvasRenderingContext2D, a: number, fill: string, edge: number) => {
  ctx.beginPath()
  ctx.moveTo(a, 0)
  ctx.lineTo(-a * 0.7, a * 0.75)
  ctx.lineTo(-a * 0.3, 0)
  ctx.lineTo(-a * 0.7, -a * 0.75)
  ctx.closePath()
  ctx.lineWidth = edge
  ctx.strokeStyle = "#000"
  ctx.stroke()
  ctx.fillStyle = fill
  ctx.fill()
}

/**
 * A radar that follows the player: the town scrolls under a yellow arrow
 * fixed in the middle, the job target sits on it or is pinned to its edge,
 * and the part of town you are in is named on top.
 */
export const drawMinimap = (
  ctx: CanvasRenderingContext2D,
  minimap: HTMLCanvasElement,
  map: GameMap,
  game: Game,
  target: { readonly x: number; readonly y: number } | null,
  district: string,
  kmh: number,
  dpr: number,
  place: RadarPlace = { corner: "bottom-right" },
) => {
  const { width, height } = ctx.canvas
  const size = (place.corner === "top-left" ? TOUCH_RADAR_PX : RADAR_PX) * dpr
  const pad = (place.corner === "top-left" ? 10 : 16) * dpr
  // Bottom right, clear of the money and the attribution line; or top left on a touch screen.
  const x0 = place.corner === "top-left" ? place.left * dpr + pad : width - size - pad
  const y0 = place.corner === "top-left" ? place.top * dpr + pad : height - size - pad * 3
  const cx = x0 + size / 2
  const cy = y0 + size / 2
  const p = playerPos(game)
  const metres = Math.min(RADAR_MAX_M, RADAR_M + kmh * 5)
  const s = minimap.width / map.width
  const half = (metres / 2) * s
  const zoom = size / metres
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.save()
  ctx.beginPath()
  ctx.rect(x0, y0, size, size)
  ctx.clip()
  ctx.fillStyle = "#1c2b1c"
  ctx.fillRect(x0, y0, size, size)
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(minimap, p.x * s - half, p.y * s - half, half * 2, half * 2, x0, y0, size, size)

  if (target !== null) {
    const dx = (target.x - p.x) * zoom
    const dy = (target.y - p.y) * zoom
    const edge = size / 2 - 9 * dpr
    const k = Math.max(Math.abs(dx), Math.abs(dy)) / edge
    ctx.save()
    if (k <= 1) {
      ctx.translate(cx + dx, cy + dy)
      ctx.beginPath()
      ctx.arc(0, 0, (5 + Math.sin(game.time * 6)) * dpr, 0, Math.PI * 2)
      ctx.lineWidth = 2 * dpr
      ctx.strokeStyle = "#000"
      ctx.stroke()
      ctx.fillStyle = "#ffd60a"
      ctx.fill()
    } else {
      ctx.translate(cx + dx / k, cy + dy / k)
      ctx.rotate(Math.atan2(dy, dx))
      arrowHead(ctx, 7 * dpr, "#ffd60a", 2 * dpr)
    }
    ctx.restore()
  }

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(game.player.car?.angle ?? game.player.angle)
  arrowHead(ctx, 10 * dpr, "#ffd60a", 3 * dpr)
  ctx.restore()

  if (district !== "") {
    ctx.font = `900 ${12 * dpr}px "Arial Black", "Arial Bold", Impact, sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.lineJoin = "round"
    ctx.lineWidth = 3 * dpr
    ctx.strokeStyle = "#000"
    const label = district.toUpperCase()
    ctx.strokeText(label, cx, y0 + 5 * dpr)
    ctx.fillStyle = "#fff"
    ctx.fillText(label, cx, y0 + 5 * dpr)
    ctx.textAlign = "start"
  }
  ctx.restore()
  ctx.lineWidth = 2 * dpr
  ctx.strokeStyle = "rgba(0,0,0,0.8)"
  ctx.strokeRect(x0, y0, size, size)
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
