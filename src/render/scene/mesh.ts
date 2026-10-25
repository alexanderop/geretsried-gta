/**
 * Vertex buffers for the WebGL renderer, filled on the CPU without a GPU so
 * tests can build them. One vertex is 28 bytes: position (x, y, z meters,
 * float32), texture coordinates (u, v, float32), a colour that multiplies
 * the texture (rgba8) and how to draw it (mode, texture layer: uint8 each).
 */

export const STRIDE = 28

/** What the fragment shader does with a vertex's texture. */
export const Mode = {
  /** A material texture times the colour. */
  material: 0,
  /** Lawn or paving, by the paved mask from the aerial photo. */
  ground: 1,
  /** The colour times a grey detail texture (roofs coloured from the photo). */
  detail: 2,
  /** A sprite times the colour. */
  sprite: 3,
  /** A sprite's shape in the colour: shadows. */
  silhouette: 4,
  /** Just the colour. */
  color: 5,
  /** A sprite with its hue turned by the colour's red (0..255 a full turn): resprayed cars. */
  hue: 6,
} as const
export type Mode = (typeof Mode)[keyof typeof Mode]
/** Added to a mode: the surface fades to see-through over the player (tree crowns, petrol station canopies). */
export const FADES = 128

export type Rgba = readonly [number, number, number, number]

/** Material texture array layers; `MATERIAL_FILES` lists the file of each. */
export const Material = {
  lawn: 0,
  road: 1,
  sidewalk: 2,
  paving: 3,
  water: 4,
  forest: 5,
  farmland: 6,
  facadeBlock: 7,
  facadeHouse: 8,
  facadeShop: 9,
  facadeIndustrial: 10,
  roofTiles: 11,
  roofGravel: 12,
  canopy: 13,
  floorWood: 14,
  cafeSign: 15,
  facadeUrsula: 16,
  facadeRender: 17,
  rehmausSign: 18,
  sparkasseSign: 19,
  sparkasseWindows: 20,
  facadeRathaus: 21,
  rathausTower: 22,
  rathausDoor: 23,
  rathausQuoins: 24,
  facadePlaster: 25,
  churchRose: 26,
  churchDoor: 27,
  churchWindow: 28,
  churchBelfry: 29,
  muehlenbaeckSign: 30,
  angelNailsSign: 31,
  shopBoardRed: 32,
  bakeryFront: 33,
  shopFront: 34,
  awning: 35,
  gerltzSigns: 36,
  postSign: 37,
  canopyGlass: 38,
  werkstattSign: 39,
  werkstattWindows: 40,
  werkstatt4: 41,
  aldiLogo: 42,
} as const
export type Material = (typeof Material)[keyof typeof Material]

export const MATERIAL_FILES = [
  "lawn",
  "road",
  "sidewalk",
  "pavement",
  "water",
  "forest",
  "farmland",
  "facade-block",
  "facade-house",
  "facade-shop",
  "facade-industrial",
  "roof-tiles",
  "roof-gravel",
  "canopy",
  "floor-wood",
  "cafe-sign",
  "facade-ursula",
  "facade-render",
  "rehmaus-sign",
  "sparkasse-sign",
  "sparkasse-windows",
  "facade-rathaus",
  "rathaus-tower",
  "rathaus-door",
  "rathaus-quoins",
  "facade-plaster",
  "church-rose",
  "church-door",
  "church-window",
  "church-belfry",
  "muehlenbaeck-sign",
  "angel-nails-sign",
  "shop-board-red",
  "bakery-front",
  "shop-front",
  "awning",
  "gerltz-signs",
  "post-sign",
  "canopy-glass",
  "werkstatt-sign",
  "werkstatt-windows",
  "werkstatt-4",
  "aldi-logo",
] as const
export type MaterialName = (typeof MATERIAL_FILES)[number]
/** The material layer of a texture file. */
export const material = (name: MaterialName): number => MATERIAL_FILES.indexOf(name)

/** Two index lists share one vertex buffer: opaque surfaces, then the shadows laid over the ground. */
export type Mesh = {
  readonly vertices: Uint8Array
  readonly indices: Uint32Array
  readonly opaque: number
  readonly shadow: number
}

export class MeshBuilder {
  private bytes = new ArrayBuffer(STRIDE * 4096)
  private f32 = new Float32Array(this.bytes)
  private u8 = new Uint8Array(this.bytes)
  private readonly lists: { opaque: Array<number>; shadow: Array<number> } = { opaque: [], shadow: [] }
  /** Where `tri` puts its triangles. */
  target: "opaque" | "shadow" = "opaque"
  count = 0

  vertex(x: number, y: number, z: number, u: number, v: number, color: Rgba, mode: number, layer: number): number {
    if ((this.count + 1) * STRIDE > this.bytes.byteLength) this.grow()
    const f = (this.count * STRIDE) / 4
    this.f32[f] = x
    this.f32[f + 1] = y
    this.f32[f + 2] = z
    this.f32[f + 3] = u
    this.f32[f + 4] = v
    const b = this.count * STRIDE + 20
    this.u8[b] = color[0]
    this.u8[b + 1] = color[1]
    this.u8[b + 2] = color[2]
    this.u8[b + 3] = color[3]
    this.u8[b + 4] = mode
    this.u8[b + 5] = layer
    return this.count++
  }

  tri(a: number, b: number, c: number): void {
    this.lists[this.target].push(a, b, c)
  }

  quad(a: number, b: number, c: number, d: number): void {
    this.tri(a, b, c)
    this.tri(a, c, d)
  }

  /** Empty it for the next mesh, keeping the memory. */
  reset(): void {
    this.count = 0
    this.lists.opaque.length = 0
    this.lists.shadow.length = 0
    this.target = "opaque"
  }

  finish(): Mesh {
    const { opaque, shadow } = this.lists
    const indices = new Uint32Array(opaque.length + shadow.length)
    indices.set(opaque)
    indices.set(shadow, opaque.length)
    return { vertices: this.u8.slice(0, this.count * STRIDE), indices, opaque: opaque.length, shadow: shadow.length }
  }

  private grow() {
    const next = new ArrayBuffer(this.bytes.byteLength * 2)
    new Uint8Array(next).set(this.u8)
    this.bytes = next
    this.f32 = new Float32Array(next)
    this.u8 = new Uint8Array(next)
  }
}

/** Sprite texture array layers: cars, people, tree crowns, the traffic light's parts, combat effects, pickups. */
export const Sprite = { car: 0, ped: 8, tree: 12, housing: 20, lamp: 21, glow: 22, fx: 23, pickup: 31, prop: 39 } as const

/** Street furniture, petrol station, GTA 2 markers and people in poses, from `Sprite.prop` on, in this order. */
export const PROP_FILES = [
  "signal-mast",
  "signal-pole",
  "signal-head",
  "signal-button",
  "signal-stopline",
  "signal-zebra",
  "signal-bollard",
  "signal-lamp",
  "fuel-island",
  "fuel-pump",
  "fuel-pylon",
  "fuel-air",
  "fuel-barrels",
  "fuel-wash",
  "fuel-kiosk",
  "fuel-drum",
  "prop-phone",
  "prop-phone-quiet",
  "prop-church",
  "prop-spray",
  "prop-star",
  "prop-package",
  "prop-heart",
  "prop-glass",
  "pose-cop-aim",
  "pose-thug-punch",
  "pose-player-pistol",
  "pose-player-smg",
  "pose-player-throw",
  "pose-body-man",
  "pose-body-cop",
  "cafe-cakes",
  "cafe-planter",
  "cafe-umbrella",
  "cafe-table",
  "cafe-espresso",
  "cafe-bistro",
  "cafe-slice",
  "cafe-toilet",
  "bus-rvo",
  "pharmacy-a",
  "sparkasse-flag",
  "yield-sign",
  "solar-panels",
  "bakery-board",
  "post-box",
  "litter-bin",
  "disabled-bay",
] as const
export type PropName = (typeof PROP_FILES)[number]
/** The sprite layer of a prop. */
export const prop = (name: PropName): number => Sprite.prop + PROP_FILES.indexOf(name)

/** People with a run cycle, from `WALK_BASE` on: `WALK_FRAMES` layers each, in this order. The pedestrians first, so `walk-ped-<sprite>` matches `Sprite.ped + sprite`. */
export const WALK_SETS = ["ped-0", "ped-1", "ped-2", "ped-3", "cop", "thug"] as const
export type WalkSet = (typeof WALK_SETS)[number]
export const WALK_FRAMES = 8
export const WALK_BASE = Sprite.prop + PROP_FILES.length
/** Every run-cycle frame is the same canvas, hips at its centre, at this size in meters (process-sprites.py: 240 x 200 px at 100 px per meter). */
export const WALK_M = [2.4, 2] as const
/** One full cycle (two steps) per this much stride: the sim adds 4 per meter, so a cycle is about 1.6 m. */
const STRIDE_CYCLE = Math.PI * 2
/** The run-cycle frame of `set` at walk-cycle phase `stride`. */
export const walkFrame = (set: WalkSet, stride: number): number => {
  const frame = Math.floor((stride / STRIDE_CYCLE) * WALK_FRAMES) % WALK_FRAMES
  return WALK_BASE + WALK_SETS.indexOf(set) * WALK_FRAMES + (frame + WALK_FRAMES) % WALK_FRAMES
}
export const WALK_FILES: ReadonlyArray<string> = WALK_SETS.flatMap((set) => Array.from({ length: WALK_FRAMES }, (_, i) => `walk-${set}-${i}`))
export const SPRITE_LAYERS = WALK_BASE + WALK_FILES.length

/** The effect sprites from `Sprite.fx` on, in `FX_FILES` order. */
export const Fx = { muzzle: 0, tracer: 1, blastEarly: 2, blastBig: 3, smoke: 4, fire: 5, wreck: 6, scorch: 7 } as const
export const FX_FILES: ReadonlyArray<string> = ["fx-muzzle", "fx-tracer", "fx-blast-early", "fx-blast-big", "fx-smoke", "fx-fire", "fx-wreck", "fx-scorch"]
/** The pickup sprites from `Sprite.pickup` on, in this order. */
export const PICKUP_SPRITES = ["pistol", "smg", "shotgun", "molotov", "rocket", "flamer", "health", "armour"] as const

/** How much of its square layer each sprite fills (u, v), and so its aspect. */
export type SpriteBoxes = ReadonlyArray<readonly [number, number]>

/**
 * A flat sprite quad at height z, centred at (x, y), turned by `angle` like a
 * canvas rotate: `length` along the sprite's +u, `width` along +v.
 */
export const spriteQuad = (
  m: MeshBuilder,
  q: { readonly x: number; readonly y: number; readonly z: number; readonly angle: number; readonly length: number; readonly width: number },
  layer: number,
  box: readonly [number, number],
  color: Rgba,
  mode: number,
): void => {
  const c = Math.cos(q.angle)
  const s = Math.sin(q.angle)
  const hl = q.length / 2
  const hw = q.width / 2
  const corner = (lx: number, ly: number, u: number, v: number) => m.vertex(q.x + lx * c - ly * s, q.y + lx * s + ly * c, q.z, u, v, color, mode, layer)
  m.quad(corner(-hl, -hw, 0, 0), corner(hl, -hw, box[0], 0), corner(hl, hw, box[0], box[1]), corner(-hl, hw, 0, box[1]))
}
