/**
 * Geretsried's payphones and the jobs they give, from real places: the phone
 * at Sudetenstraße 19 by the start, one at the bus stop by the Rathaus, and
 * one for each gang on its turf. Places are looked up by name in the map, so a
 * job whose place OSM lacks is left out.
 */
import type { World } from "#/world/world.ts"
import type { Poi } from "#/map/types.ts"
import { GANGS, turfs, type GangId } from "./gangs.ts"
import { newJobs, type Goal, type Job, type Jobs, type Place } from "./mission.ts"

const MERCEDES_G = 4
const BMW = 1
const POST_VAN = 7
const VW_BUS = 6
const TAXI = 2

type Draft = Omit<Job, "phone" | "goal"> & { readonly phone: string; readonly goal: Goal | null }

/** The courier's pickup: the Mühlenbäck branch across town, not the one next door. */
const across = (pois: ReadonlyArray<Poi>, from: { x: number; y: number }, name: string) => {
  const d = (p: Poi) => Math.hypot(p.x - from.x, p.y - from.y)
  const all = pois.filter((p) => p.name.includes(name)).toSorted((a, b) => d(a) - d(b))
  return all.find((p) => d(p) > 300) ?? all[0]
}

const deliver = (cargo: string, pickup: Place | undefined, dropoff: Place | undefined): Goal | null =>
  pickup === undefined || dropoff === undefined ? null : { kind: "deliver", cargo, pickup, dropoff }
const steal = (model: number, at: Place | undefined, dropoff: Place | undefined): Goal | null =>
  at === undefined || dropoff === undefined ? null : { kind: "steal", model, at, dropoff }
const destroy = (model: number, at: Place | undefined): Goal | null => (at === undefined ? null : { kind: "destroy", model, at })
const gang = (g: GangId) => ({ for: g, against: GANGS[g].rival })

export const planJobs = (world: World, home: { x: number; y: number }): Jobs => {
  const { pois, props, districts } = world.map
  const named = (name: string): Place | undefined => pois.find((p) => p.name === name)
  /** A phone on the sidewalk at the bus stop nearest a place: GTA 2's phones stand at the kerb. */
  const phoneBy = (at: { x: number; y: number }, name: string): Place => {
    const stops = props.filter((p) => p.kind === "bus_stop" && !world.isSolid(p.x, p.y))
    const best = stops.reduce<{ x: number; y: number } | null>((b, s) => (b === null || Math.hypot(s.x - at.x, s.y - at.y) < Math.hypot(b.x - at.x, b.y - at.y) ? s : b), null)
    return best === null || Math.hypot(best.x - at.x, best.y - at.y) > 400 ? { ...at, name } : { x: best.x, y: best.y, name }
  }
  const phones: Array<Place> = [{ ...home, name: "Sudetenstraße" }]
  const phoneIds = new Map<string, number>([["home", 0]])
  const addPhone = (id: string, p: Place) => {
    phoneIds.set(id, phones.length)
    phones.push(p)
  }
  const rathaus = named("Rathaus Geretsried")
  if (rathaus !== undefined) addPhone("rathaus", phoneBy(rathaus, "Rathaus"))
  const turf = turfs(districts)
  for (const t of turf) addPhone(t.gang, phoneBy(t, GANGS[t.gang].district))

  const bakery = across(pois, home, "Mühlenbäck")
  const apotheke = named("Rehmaus Apotheke")

  const drafts: Array<Draft> = [
    {
      id: "brezn",
      phone: "home",
      brief: `Hol Brezn bei ${bakery?.name ?? "der Bäckerei"} und bring sie zur ${apotheke?.name ?? "Apotheke"}!`,
      goal: deliver("Die Brezn", bakery, apotheke),
      time: 150,
      reward: 1500,
    },
    {
      id: "mercedes",
      phone: "home",
      after: "brezn",
      brief: "Vorm Rathaus steht ein Mercedes G. Klau ihn und bring ihn zur Werkstatt Wilhelm!",
      goal: steal(MERCEDES_G, rathaus, named("Automobilwerkstatt Wilhelm")),
      time: 200,
      reward: 2500,
    },
    {
      id: "post",
      phone: "home",
      after: "mercedes",
      brief: "Der Post-Transporter an der Filiale 571 hat Beweise geladen. Spreng ihn, schnell!",
      goal: destroy(POST_VAN, named("Deutsche Post Filiale 571")),
      time: 90,
      reward: 3000,
    },
    {
      id: "weisswurst",
      phone: "rathaus",
      brief: "Der Bürgermeister will Weißwürste von der Metzgerei Länger, im Gasthof Geiger. Vor zwölfe!",
      goal: deliver("Die Weißwürste", named("Metzgerei Länger"), named('Gasthof Geiger')),
      time: 170,
      reward: 2000,
    },
    {
      id: "kaufland",
      phone: "rathaus",
      after: "weisswurst",
      brief: "Ein BMW parkt am Kaufland, der Wagen vom Stadtrat. Mach ihn kaputt!",
      goal: destroy(BMW, named("Kaufland")),
      time: 120,
      reward: 3500,
    },
    {
      id: "gartenberg-1",
      phone: "gartenberg",
      brief: "Krachlederne hier. Die Steinböcke haben einen VW Bus am Aldi in Stein. Fackel ihn ab!",
      goal: destroy(VW_BUS, pois.find((p) => p.name === "Aldi Süd" && p.y > 5000)),
      time: 150,
      reward: 2000,
      gang: gang("gartenberg"),
    },
    {
      id: "stein-1",
      phone: "stein",
      brief: "Steinböcke hier. Hol das Taxi am Rathaus und bring es uns zur Polizeiinspektion. Frech, oder?",
      goal: steal(TAXI, rathaus, named("Polizeiinspektion Geretsried")),
      time: 240,
      reward: 2500,
      gang: gang("stein"),
    },
    {
      id: "gelting-1",
      phone: "gelting",
      brief: "Bauernmafia. Bring Weißbier vom Orterer Getränkemarkt zur Biometzgerei Pichler!",
      goal: deliver("Das Weißbier", pois.find((p) => p.name === "Orterer Getränkemarkt" && p.y < 3000), named("Biometzgerei Pichler Großhandel")),
      time: 150,
      reward: 2000,
      gang: gang("gelting"),
    },
  ]
  const jobs = drafts.flatMap((d): Array<Job> => {
    const phone = phoneIds.get(d.phone)
    return d.goal === null || phone === undefined ? [] : [{ ...d, phone, goal: d.goal }]
  })
  return newJobs(phones, jobs)
}
