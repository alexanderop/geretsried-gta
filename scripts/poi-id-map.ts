/**
 * Maps POI ids (#n = index + 1 in map.pois, as docs/BACKLOG.md cites them) across an import:
 *   git show HEAD:public/geretsried.map.json > /tmp/old.map.json
 *   node scripts/poi-id-map.ts /tmp/old.map.json public/geretsried.map.json > docs/poi-id-map.csv
 * An old POI is the new one with its name within 1 m (else, with its name within 50 m: a twin the import merged,
 * see addPoi in src/map/build.ts; else a POI within 50 m whose name starts with its name or the other way round,
 * which another old POI may hold too: "Champini" merged into "Champini Sport- & Bewegungskita Geretsried" in I-2).
 * Rows: every old POI, then the new ones (old_id empty). Exits 1 if an old POI is lost.
 */
import { readFileSync } from "node:fs"

type Poi = { readonly name: string; readonly kind: string; readonly x: number; readonly y: number }

const [oldPath, newPath] = process.argv.slice(2)
if (oldPath === undefined || newPath === undefined) throw new Error("usage: node scripts/poi-id-map.ts <old map.json> <new map.json>")
const pois = (path: string): ReadonlyArray<Poi> => (JSON.parse(readFileSync(path, "utf8")) as { pois: ReadonlyArray<Poi> }).pois
const before = pois(oldPath)
const after = pois(newPath)

const csv = (v: string) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v)
const rows = ["old_id,new_id,name,kind_old,kind_new"]
const taken = new Set<number>()
let lost = 0
before.forEach((p, i) => {
  const near = (reach: number) => after.findIndex((q, j) => !taken.has(j) && q.name === p.name && Math.hypot(q.x - p.x, q.y - p.y) <= reach)
  const twin = () => after.findIndex((q) => (q.name.startsWith(p.name) || p.name.startsWith(q.name)) && Math.hypot(q.x - p.x, q.y - p.y) <= 50)
  const j = near(1) >= 0 ? near(1) : near(50) >= 0 ? near(50) : twin()
  const q = after[j]
  if (q === undefined) {
    lost++
    rows.push([String(i + 1), "", csv(p.name), p.kind, ""].join(","))
    return
  }
  taken.add(j)
  rows.push([String(i + 1), String(j + 1), csv(p.name), p.kind, q.kind].join(","))
})
after.forEach((q, j) => {
  if (!taken.has(j)) rows.push(["", String(j + 1), csv(q.name), "", q.kind].join(","))
})
console.log(rows.join("\n"))
if (lost > 0) {
  console.error(`${lost} old POI(s) lost`)
  process.exitCode = 1
}
