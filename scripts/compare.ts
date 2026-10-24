/**
 * Side-by-side check of the game against reality.
 *   pnpm compare <lat> <lon> [halfMeters=80] [name]
 * Writes compare/<name>-real.jpg (Bavarian DOP40 aerial photo, © Bayerische
 * Vermessungsverwaltung, CC BY 4.0) and compare/<name>-game.png (the same square,
 * rendered by the running dev server at http://localhost:5190 via agent-browser).
 */
import { execFileSync } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const [latArg, lonArg, halfArg = "80", name = "spot"] = process.argv.slice(2)
const lat = Number(latArg)
const lon = Number(lonArg)
const half = Number(halfArg)
if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
  console.error("usage: pnpm compare <lat> <lon> [halfMeters] [name]")
  process.exit(1)
}

const SIZE = 1024
const dLat = half / 111_200
const dLon = half / (111_200 * Math.cos((lat * Math.PI) / 180))
const bbox = [lat - dLat, lon - dLon, lat + dLat, lon + dLon].map((n) => n.toFixed(6)).join(",")
const wms =
  "https://geoservices.bayern.de/od/wms/dop/v1/dop40?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap" +
  `&LAYERS=by_dop40c&STYLES=&CRS=EPSG:4326&BBOX=${bbox}&WIDTH=${SIZE}&HEIGHT=${SIZE}&FORMAT=image/jpeg`

mkdirSync("compare", { recursive: true })
const res = await fetch(wms)
if (!res.ok) throw new Error(`DOP40 answered ${res.status}`)
writeFileSync(`compare/${name}-real.jpg`, Buffer.from(await res.arrayBuffer()))

const browser = (...args: Array<string>) => execFileSync("agent-browser", args, { encoding: "utf8" })
browser("set", "viewport", String(SIZE), String(SIZE))
browser("open", `http://localhost:5190/?compare=${lat},${lon},${half}`)
browser("wait", "[data-ready]")
browser("wait", "500")
// agent-browser runs as a daemon with its own cwd: hand it an absolute path.
browser("screenshot", resolve(`compare/${name}-game.png`))
console.log(`compare/${name}-real.jpg\ncompare/${name}-game.png  (${half * 2} m square, north up)`)
