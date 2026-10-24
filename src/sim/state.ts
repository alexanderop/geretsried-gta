/**
 * The shape of a running game, apart from the step that moves it (game.ts),
 * so the combat code can work on it without an import cycle.
 */
import type { Car } from "./car.ts"
import type { Npc } from "./traffic.ts"
import type { Signals } from "./signals.ts"
import type { Walker } from "./pedestrians.ts"
import type { Wanted } from "./wanted.ts"
import type { Score } from "./score.ts"
import type { Jobs } from "./mission.ts"
import type { Respect, Turf } from "./gangs.ts"
import type { Cop } from "./police.ts"
import type { Vitals } from "./damage.ts"
import type { Arsenal } from "./weapons.ts"
import type { Pickup } from "./pickups.ts"
import type { Pump } from "./stations.ts"

export type Input = {
  readonly up: boolean
  readonly down: boolean
  readonly left: boolean
  readonly right: boolean
  /** Space: the handbrake in a car, and a second fire button on foot. */
  readonly handbrake: boolean
  readonly sprint: boolean
  /** true for exactly one step after F was pressed */
  readonly use: boolean
  /** The attack button (Ctrl): held to use the weapon in hand. */
  readonly attack: boolean
  /** -1 / 1 for exactly one step after Q / E (or [ / ]) was pressed: the previous or next weapon. */
  readonly cycle: -1 | 0 | 1
}

export type Point = { readonly x: number; readonly y: number }
export type Spawn = Point & { readonly angle: number }

export type Player = { x: number; y: number; angle: number; car: Car | null; readonly vitals: Vitals; readonly arsenal: Arsenal }

/** Something the HUD announces once: a big banner, the car you got into, money paid. */
export type Message =
  | { readonly kind: "busted" | "wasted" | "gameOver" }
  | { readonly kind: "car"; readonly text: string }
  | { readonly kind: "mission"; readonly text: string }
  | { readonly kind: "cash"; readonly amount: number }
  | { readonly kind: "pickup"; readonly text: string }

/** Someone on foot who leaves the sidewalk to come at you: a police officer with a pistol, or a tough guy with his fists. */
export type Fighter = {
  readonly id: number
  readonly kind: "cop" | "thug"
  x: number
  y: number
  angle: number
  readonly vitals: Vitals
  readonly sprite: number
  /** Walk-cycle phase. */
  stride: number
  /** Took a step this tick (a running pose), or stood (aiming, punching). */
  moving: boolean
  /** Seconds until the next shot or punch. */
  cooldown: number
  /** Seconds left on the ground (knocked down, or how long the body stays). */
  down: number
  dead: boolean
  /** A thug's temper: seconds until he gives up on you. */
  temper: number
}

/** What fired a shot: the player, or the police (whose bullets are meant for the player). */
export type Shooter = "player" | "police"

export type Projectile = {
  readonly kind: "rocket" | "molotov"
  readonly from: Shooter
  x: number
  y: number
  readonly vx: number
  readonly vy: number
  /** Seconds in flight. */
  t: number
  /** Seconds until it lands (molotov) or burns out (rocket). */
  readonly life: number
}

/** A patch of burning petrol where a molotov broke. */
export type FirePatch = { readonly x: number; readonly y: number; readonly r: number; t: number; readonly life: number; readonly from: Shooter }

/** A short-lived picture: muzzle flash, tracer, explosion, flame puff. Not part of the rules; the renderer draws them by age. */
export type Effect = {
  readonly kind: "muzzle" | "tracer" | "blast" | "flame" | "puff"
  readonly x: number
  readonly y: number
  /** The tracer's far end, or where a flame puff drifts to. */
  readonly x2: number
  readonly y2: number
  readonly angle: number
  t: number
  readonly life: number
  readonly size: number
}

/** A scorch mark left on the ground. */
export type Decal = { readonly x: number; readonly y: number; readonly angle: number; readonly size: number }

export type SoundId = "ring" | "pistol" | "smg" | "shotgun" | "rocket" | "explosion" | "flame" | "molotov" | "punch" | "pickup" | "scream" | "copShot"
/** A sound and where it happened, so the UI can make far ones quieter. */
export type Sound = { readonly id: SoundId; readonly x: number; readonly y: number }

export type Game = {
  player: Player
  /** Cars standing around that the player can take, and the burning ones nobody drives. */
  parked: Array<Car>
  /** Burnt-out cars: in the way of nobody, enterable by nobody. */
  wrecks: Array<Car>
  npcs: Array<Npc>
  cops: Array<Cop>
  walkers: Array<Walker>
  fighters: Array<Fighter>
  projectiles: Array<Projectile>
  fires: Array<FirePatch>
  effects: Array<Effect>
  decals: Array<Decal>
  readonly pickups: ReadonlyArray<Pickup>
  /** Petrol pump islands: they blow up. */
  readonly pumps: ReadonlyArray<Pump>
  /** The pillars under petrol station canopies: cars bump into them. */
  readonly pillars: ReadonlyArray<Point>
  nextId: number
  time: number
  lives: number
  readonly score: Score
  readonly wanted: Wanted
  /** The payphones and their jobs. */
  readonly jobs: Jobs
  /** Each gang's respect for you, and where their turf is. */
  readonly respect: Respect
  readonly turf: ReadonlyArray<Turf>
  /** Seconds until the next ring of a phone near you. */
  ringCooldown: number
  /** Seconds an officer has had hold of you (see `arrested` in game.ts). */
  bust: number
  /** Seconds you still count as fighting back after your last shot or punch: nobody arrests you then. */
  fighting: number
  /** Seconds left lying WASTED before you wake up at the doctor's. */
  wasted: number
  /** Announcements since the HUD last took them. */
  readonly messages: Array<Message>
  /** Sounds since the UI last took them. */
  readonly sounds: Array<Sound>
  /** Where every life starts. */
  readonly home: Spawn
  /** Where you wake up after being WASTED: the doctor's nearest home. */
  readonly hospital: Spawn
  readonly signals: Signals
  readonly random: () => number
  /** The traffic light junction the car is in, so running a red counts once. */
  junction: object | null
  /** Seconds until ramming another car counts as a new crash. */
  crashCooldown: number
  /** Seconds until a wall can damage the car again. */
  wallCooldown: number
  /** Seconds until shooting in front of the police counts again, and until the next scream. */
  gunfireCooldown: number
  screamCooldown: number
}
