/**
 * Payphone jobs, GTA 2 style: phones round town ring while they have work;
 * walk up to one to take its next job. Three kinds: fetch something and bring
 * it somewhere against the clock, steal a particular car and drive it
 * somewhere, or blow one up. A phone's jobs come one after the other, and a
 * job can wait for one from another phone. Pure: it reads where the player
 * is, what they drive and how the target car is doing.
 */
import type { GangId } from "./gangs.ts"

export type Point = { readonly x: number; readonly y: number }
export type Place = Point & { readonly name: string }

export type Goal =
  | { readonly kind: "deliver"; readonly cargo: string; readonly pickup: Place; readonly dropoff: Place }
  /** Take the car of `model` parked at `at` and drive it to `dropoff`. */
  | { readonly kind: "steal"; readonly model: number; readonly at: Place; readonly dropoff: Place }
  /** Wreck the car of `model` parked at `at`. */
  | { readonly kind: "destroy"; readonly model: number; readonly at: Place }

export type Job = {
  readonly id: string
  /** Index of the phone that gives it. */
  readonly phone: number
  /** What the voice on the phone says. */
  readonly brief: string
  readonly goal: Goal
  /** Seconds on the clock: from the pickup (deliver, steal), or from the call (destroy). */
  readonly time: number
  readonly reward: number
  /** Only once this job is done. */
  readonly after?: string
  /** A gang job: respect from the gang it is for, lost with its rival. */
  readonly gang?: { readonly for: GangId; readonly against: GangId }
}

/** The car a steal or destroy job is about, once the game has parked it. */
export type TargetCar = Point & { readonly vitals: { readonly hp: number } }

export type Active = {
  readonly job: Job
  /** pickup: on the way to the cargo, the car, or the car to wreck; deliver: bringing it in. */
  stage: "pickup" | "deliver"
  timeLeft: number
  target: TargetCar | null
}

export type Jobs = {
  readonly phones: ReadonlyArray<Place>
  readonly jobs: ReadonlyArray<Job>
  readonly done: Array<string>
  active: Active | null
  /** A phone rings again only after you walked away from it. */
  readonly armed: Array<boolean>
}

export type JobEvent =
  | { readonly kind: "start"; readonly job: Job; readonly text: string }
  | { readonly kind: "picked"; readonly text: string }
  | { readonly kind: "passed"; readonly job: Job; readonly reward: number; readonly text: string }
  | { readonly kind: "failed"; readonly job: Job; readonly text: string }

/** What the jobs see of the game this step. */
export type JobView = {
  readonly player: Point
  /** The car the player sits in, or null on foot. */
  readonly car: object | null
}

const PHONE_REACH = 2.5
const STOP_REACH = 9
const WALK_AWAY = 20

export const newJobs = (phones: ReadonlyArray<Place>, jobs: ReadonlyArray<Job>): Jobs => ({ phones, jobs, done: [], active: null, armed: phones.map(() => true) })

/** The next job phone `i` has, or null when it has none left (or none yet). */
export const nextJob = (jobs: Jobs, i: number): Job | null =>
  jobs.jobs.find((j) => j.phone === i && !jobs.done.includes(j.id) && (j.after === undefined || jobs.done.includes(j.after))) ?? null

export const isRinging = (jobs: Jobs, i: number): boolean => jobs.active === null && jobs.armed[i] === true && nextJob(jobs, i) !== null

const near = (a: Point, b: Point, r: number) => Math.hypot(a.x - b.x, a.y - b.y) < r

/** Where the arrow points: the job's next stop, or the nearest ringing phone; null when nothing is left. */
export const jobTarget = (jobs: Jobs, player: Point): Point | null => {
  const { active } = jobs
  if (active !== null) {
    const { goal } = active.job
    if (active.stage === "deliver") return goal.kind === "destroy" ? goal.at : goal.dropoff
    if (goal.kind === "deliver") return goal.pickup
    return active.target ?? goal.at
  }
  let best: Point | null = null
  jobs.phones.forEach((p, i) => {
    if (isRinging(jobs, i) && (best === null || Math.hypot(p.x - player.x, p.y - player.y) < Math.hypot(best.x - player.x, best.y - player.y))) best = p
  })
  return best
}

const finish = (jobs: Jobs, active: Active, passed: boolean): JobEvent => {
  jobs.active = null
  const { job } = active
  if (!passed) return { kind: "failed", job, text: job.goal.kind === "deliver" ? `Zu spät! ${job.goal.cargo} ist hin.` : "Job vermasselt!" }
  jobs.done.push(job.id)
  return { kind: "passed", job, reward: job.reward, text: `Geschafft! $${job.reward}` }
}

export const stepJobs = (jobs: Jobs, view: JobView, dt: number): JobEvent | null => {
  const { player } = view
  const { active } = jobs
  if (active === null) {
    for (let i = 0; i < jobs.phones.length; i++) {
      const phone = jobs.phones[i]
      if (phone === undefined) continue
      if (!jobs.armed[i]) {
        if (!near(player, phone, WALK_AWAY)) jobs.armed[i] = true
        continue
      }
      const job = nextJob(jobs, i)
      // You answer a phone on foot.
      if (job === null || view.car !== null || !near(player, phone, PHONE_REACH)) continue
      jobs.armed[i] = false
      jobs.active = { job, stage: "pickup", timeLeft: job.time, target: null }
      return { kind: "start", job, text: job.brief }
    }
    return null
  }
  const { goal } = active.job
  const clock = active.stage === "deliver" || goal.kind === "destroy"
  if (clock) active.timeLeft -= dt
  if (goal.kind === "deliver") {
    if (active.stage === "pickup") {
      if (!near(player, goal.pickup, STOP_REACH)) return null
      active.stage = "deliver"
      active.timeLeft = active.job.time
      return { kind: "picked", text: `${goal.cargo} an Bord! Ab zu ${goal.dropoff.name}!` }
    }
    if (near(player, goal.dropoff, STOP_REACH)) return finish(jobs, active, true)
    return active.timeLeft > 0 ? null : finish(jobs, active, false)
  }
  const target = active.target
  if (goal.kind === "destroy") {
    if (target !== null && target.vitals.hp <= 0) return finish(jobs, active, true)
    return active.timeLeft > 0 ? null : finish(jobs, active, false)
  }
  // Steal: a wrecked target is a failed job.
  if (target !== null && target.vitals.hp <= 0) return finish(jobs, active, false)
  if (active.stage === "pickup") {
    if (target === null || view.car !== target) return null
    active.stage = "deliver"
    active.timeLeft = active.job.time
    return { kind: "picked", text: `Hast ihn! Jetzt zu ${goal.dropoff.name}!` }
  }
  if (view.car === target && near(player, goal.dropoff, STOP_REACH)) return finish(jobs, active, true)
  return active.timeLeft > 0 ? null : finish(jobs, active, false)
}

/** Abandon the job (busted, wasted): its phone rings again once you come back. */
export const cancelJob = (jobs: Jobs): void => {
  const { active } = jobs
  if (active === null) return
  jobs.active = null
  jobs.armed[active.job.phone] = false
}
