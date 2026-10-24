# Geretsried Theft Auto (POC)

Top-down GTA 2-style game set in the real town of Geretsried, built from OpenStreetMap data.

```sh
pnpm install
pnpm dev          # http://localhost:5190
```

**Controls:** WASD / arrows walk and drive · Shift sprint · Space handbrake · F get in / out (works on moving traffic too).

## How the map is made

```
Overpass API ──► data/raw.json ──► scripts/import-osm.ts ──► public/geretsried.map.json
```

- `pnpm map:fetch` downloads every road, building, river and land-use way in the bbox (`BBOX` in `scripts/import-osm.ts`).
- `src/map/build.ts` projects lat/lon to meters (origin = north-west corner, y south) and keeps a compact JSON (~1.6 MB).
- `pnpm map` rebuilds from the cached `data/raw.json` without hitting Overpass.

## What is in the town

- **Shops and places**: every named `shop=*` and the important `amenity=*` from OSM (EDEKA, Penny, Aldi, Lidl, Kaufland, Netto, Rossmann, fuel, police, …) as map labels, minimap dots and a HUD hint.
- **Traffic lights**: the 27 real `highway=traffic_signals` nodes, grouped into junctions with a 46 s cycle (`src/sim/signals.ts`). NPC cars stop at red; a test drives 60 s of traffic and fails on any red-light crossing.
- **Pedestrians**: walk footpaths and the sidewalks along streets (`src/sim/pedestrians.ts`), dodge fast cars, fall over when hit; NPC cars brake for them.

`pnpm map:fetch` downloads both `data/raw.json` (ways) and `data/places.json` (shops, lights).

## Sprites

Painted by Codex (`codex-images` skill), then keyed, sliced and made seamless by
`python3 scripts/process-sprites.py <codex-dir> [<newer-dir> ...]` into `public/sprites/`.
Roofs, asphalt and trees were prompted with a real aerial photo of Sudetenstraße as reference
(DOP40 © Bayerische Vermessungsverwaltung, CC BY 4.0); no photo data ships with the game.

The game starts at Sudetenstraße 19 (`START` in `src/sim/game.ts`).

## Layout

| Path | What |
|---|---|
| `src/map/` | Map schema (Effect `Schema`), projection, OSM → map builder, loader |
| `src/world/` | Spatial grid, building collision, "which street am I on", road junction graph |
| `src/sim/` | Car physics, NPC traffic on the road graph, the 60 Hz game step |
| `src/render/` | Canvas 2D: map baked into 128 m chunks (LRU), cars, minimap |
| `src/ui/` | React shell, HUD, keyboard |

## Checks

`pnpm check` — typecheck (TS 7), oxlint, Vitest (projection, builder, car handling, a 20 s drive that must never clip a building, traffic that stays on roads).

## License of the map data

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the Open Database License (ODbL). `public/geretsried.map.json` is a derived database and stays under the ODbL.
