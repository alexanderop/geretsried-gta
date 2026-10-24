/**
 * GTA 2's save points and spray shops at real places: a glowing cross by
 * Geretsried's churches ("Jesus Saves": walk in, pay, the game is saved) and a
 * glowing spray can at the car repair shops (drive in, pay, the car gets a
 * new colour and the police lose you). Pure: it says what happened; game.ts
 * takes the money and does it.
 */
import type { World } from "#/world/world.ts"

export type ShopKind = "save" | "spray"

export type Shop = {
  readonly kind: ShopKind
  readonly name: string
  readonly x: number
  readonly y: number
  /** It works again only after you left its pad. */
  armed: boolean
}

export const SAVE_COST = 500
export const SPRAY_COST = 300
/** How close to the pad's middle counts as on it: on foot, and in a car. */
const PAD = { foot: 1.8, car: 3.2 } as const
const LEAVE_M = 8

/** The churches with a save point, and the workshops that respray (Huber's is a paint shop). */
const SAVE_AT = ["Maria Hilf", "Petruskirche"]
const SPRAY_AT = ["Huber GmbH, Karosserie-Lack-Center", "Automobilwerkstatt Wilhelm", "Auto Stapf"]

/** A free spot near (x, y) on a street or path, for a pad or to wake up at. */
export const spotNear = (world: World, x: number, y: number, kinds?: ReadonlySet<string>, hidden: (x: number, y: number) => boolean = () => false): { x: number; y: number } | null => {
  for (let r = 0; r <= 40; r += 3) {
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2
      const px = x + Math.cos(a) * r
      const py = y + Math.sin(a) * r
      const road = world.roadAt(px, py, 3)
      if (!world.isSolid(px, py) && !world.isWater(px, py) && !hidden(px, py) && road !== null && (kinds === undefined || kinds.has(road.road.kind))) return { x: px, y: py }
    }
  }
  return null
}

const DRIVEWAYS: ReadonlySet<string> = new Set(["service", "residential", "living_street", "tertiary", "secondary", "primary"])

/** `hidden` keeps the pads out from under tree crowns, where the camera cannot see them. */
export const planShops = (world: World, hidden: (x: number, y: number) => boolean = () => false): Array<Shop> => {
  const out: Array<Shop> = []
  const add = (kind: ShopKind, names: ReadonlyArray<string>, kinds?: ReadonlySet<string>) => {
    for (const name of names) {
      const poi = world.map.pois.find((p) => p.name === name)
      const at = poi === undefined ? null : (spotNear(world, poi.x, poi.y, kinds, hidden) ?? spotNear(world, poi.x, poi.y, kinds))
      if (poi !== undefined && at !== null) out.push({ kind, name, ...at, armed: true })
    }
  }
  add("save", SAVE_AT)
  // A spray shop's pad must be somewhere a car gets to.
  add("spray", SPRAY_AT, DRIVEWAYS)
  return out
}

export type ShopEvent = { readonly kind: ShopKind; readonly shop: Shop } | { readonly kind: "broke"; readonly shop: Shop }

/** You on a pad: a save on foot, a respray in a car, or "broke" when you cannot pay. */
export const stepShop = (shop: Shop, player: { readonly x: number; readonly y: number }, inCar: boolean, money: number): ShopEvent | null => {
  const d = Math.hypot(player.x - shop.x, player.y - shop.y)
  if (!shop.armed) {
    if (d > LEAVE_M) shop.armed = true
    return null
  }
  const on = shop.kind === "save" ? !inCar && d < PAD.foot : inCar && d < PAD.car
  if (!on) return null
  shop.armed = false
  const cost = shop.kind === "save" ? SAVE_COST : SPRAY_COST
  return money < cost ? { kind: "broke", shop } : { kind: shop.kind, shop }
}
