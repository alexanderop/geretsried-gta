import { describe, expect, it } from "vitest"
import { cancelJob, isRinging, jobTarget, newJobs, nextJob, stepJobs, type Job, type TargetCar } from "./mission.ts"

const phone = { x: 0, y: 0, name: "Telefon" }
const bakery = { name: "Mühlenbäck", x: 500, y: 0 }
const pharmacy = { name: "Rehmaus Apotheke", x: 0, y: 300 }
const garage = { name: "Werkstatt", x: 0, y: -400 }

const brezn: Job = { id: "brezn", phone: 0, brief: "Brezn!", goal: { kind: "deliver", cargo: "Die Brezn", pickup: bakery, dropoff: pharmacy }, time: 100, reward: 1500 }
const steal: Job = { id: "steal", phone: 0, after: "brezn", brief: "Klau ihn!", goal: { kind: "steal", model: 4, at: bakery, dropoff: garage }, time: 100, reward: 2500 }
const wreck: Job = { id: "wreck", phone: 0, after: "steal", brief: "Spreng ihn!", goal: { kind: "destroy", model: 7, at: pharmacy }, time: 60, reward: 3000 }
const onFoot = (x: number, y: number) => ({ player: { x, y }, car: null })

describe("payphone jobs", () => {
  it("deliver: start at the phone on foot, pick up at the bakery, get paid at the pharmacy", () => {
    const jobs = newJobs([phone], [brezn])
    expect(isRinging(jobs, 0)).toBe(true)
    expect(stepJobs(jobs, onFoot(50, 0), 1)).toBeNull()
    // Driving past does not answer it.
    expect(stepJobs(jobs, { player: { x: 1, y: 1 }, car: {} }, 1)).toBeNull()
    expect(stepJobs(jobs, onFoot(1, 1), 1)?.kind).toBe("start")
    expect(isRinging(jobs, 0)).toBe(false)
    expect(jobTarget(jobs, phone)).toBe(bakery)
    // The clock only runs from the pickup.
    stepJobs(jobs, onFoot(250, 0), 500)
    expect(stepJobs(jobs, onFoot(495, 2), 1)?.kind).toBe("picked")
    expect(jobTarget(jobs, phone)).toBe(pharmacy)
    const passed = stepJobs(jobs, onFoot(2, 298), 1)
    expect(passed?.kind === "passed" && passed.reward).toBe(1500)
    expect(jobs.done).toEqual(["brezn"])
    expect(nextJob(jobs, 0)).toBeNull()
  })

  it("chain: the next job rings only once the one before is done", () => {
    const jobs = newJobs([phone], [brezn, steal, wreck])
    expect(nextJob(jobs, 0)?.id).toBe("brezn")
    jobs.done.push("brezn")
    expect(nextJob(jobs, 0)?.id).toBe("steal")
  })

  it("steal: you must sit in that very car and drive it to the garage; wrecking it fails the job", () => {
    const jobs = newJobs([phone], [steal])
    jobs.done.push("brezn")
    stepJobs(jobs, onFoot(0, 0), 0)
    const car: TargetCar & { vitals: { hp: number } } = { x: 500, y: 0, vitals: { hp: 100 } }
    if (jobs.active !== null) jobs.active.target = car
    expect(jobTarget(jobs, phone)).toBe(car)
    expect(stepJobs(jobs, { player: { x: 500, y: 0 }, car: {} }, 1)).toBeNull()
    expect(stepJobs(jobs, { player: { x: 500, y: 0 }, car }, 1)?.kind).toBe("picked")
    expect(jobTarget(jobs, phone)).toBe(garage)
    // At the garage on foot: not yet.
    expect(stepJobs(jobs, onFoot(0, -400), 1)).toBeNull()
    expect(stepJobs(jobs, { player: { x: 0, y: -398 }, car }, 1)?.kind).toBe("passed")

    const again = newJobs([phone], [{ ...steal, after: undefined }])
    stepJobs(again, onFoot(0, 0), 0)
    const burnt = { x: 500, y: 0, vitals: { hp: 0 } }
    if (again.active !== null) again.active.target = burnt
    expect(stepJobs(again, onFoot(10, 0), 1)?.kind).toBe("failed")
  })

  it("destroy: pays once the car burns, fails when the clock runs out first", () => {
    const jobs = newJobs([phone], [{ ...wreck, after: undefined }])
    stepJobs(jobs, onFoot(0, 0), 0)
    const car = { x: 0, y: 300, vitals: { hp: 100 } }
    if (jobs.active !== null) jobs.active.target = car
    expect(stepJobs(jobs, onFoot(0, 100), 30)).toBeNull()
    car.vitals.hp = 0
    expect(stepJobs(jobs, onFoot(0, 100), 1)?.kind).toBe("passed")

    const late = newJobs([phone], [{ ...wreck, after: undefined }])
    stepJobs(late, onFoot(0, 0), 0)
    expect(stepJobs(late, onFoot(0, 100), 61)?.kind).toBe("failed")
  })

  it("rings again after a failed or cancelled job only once you walked away", () => {
    const jobs = newJobs([phone], [brezn])
    stepJobs(jobs, onFoot(0, 0), 0)
    cancelJob(jobs)
    expect(stepJobs(jobs, onFoot(0, 0), 0)).toBeNull()
    stepJobs(jobs, onFoot(100, 0), 0)
    expect(stepJobs(jobs, onFoot(0, 0), 0)?.kind).toBe("start")
  })
})
