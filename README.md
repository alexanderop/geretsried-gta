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

### The ground is the aerial photo

`pnpm photo` (`scripts/photo-tiles.ts`) cuts the Bavarian DOP40 orthophoto into 528 tiles of 256 m at its
native 0.4 m per pixel (`public/photo/<tx>_<ty>.webp`, grid math in `src/map/photo-tiles.ts`, about 30 MB).
It asks the WMS for each tile in EPSG:4326, which is linear in lat/lon just like the map projection
(`src/map/project.ts`), so the photo lines up with the OSM geometry to the pixel. Each tile carries a
one-pixel border from its neighbours, so smooth upscaling has no seams. Every tile gets the same light
look (`scripts/photo-style.ts`: unsharp mask, haze cut, gentle S-curve, a little more saturation), so
colours cannot jump between tiles. Downloads are cached in `data/dop40/tiles/`, one request at a time.

The renderer (`src/render/photo.ts`) loads tiles lazily around the view, decodes them off the main thread
and keeps 48 in an LRU. Cars, pedestrians, traffic lights, shop labels and the player are sprites on top.
The photo already shows parked cars, trees, roofs and shadows, so none of those are drawn.

- **Roads under trees**: `pnpm map` walks every paved road and marks stretches of 15 m or more whose
  centre and quarter lines are all tree canopy in the photo (building shadows excluded); the renderer
  draws those in as a soft, translucent asphalt band (`covered` in the map JSON, `src/render/covered.ts`).
- **Minimap**: `pnpm photo` also box-filters all tiles into `public/photo/overview.webp` (8 m/px, ~150 KB);
  streets and important places are drawn on top.
- **Camera**: 7.5 px/m on foot (the photo magnified 3× at most), 7 → 4.5 px/m in a car as it speeds up,
  looking 0.8 s ahead. A yellow ring and a light outline keep the player findable on the photo.

### What else comes from the aerial photo

The drawn map (`src/render/chunks.ts`) is only the fallback for a tile that fails to load; its textures,
`trees.bin` and `ground.png` are downloaded only then (`LazyChunks`). It, the
collision data and the minimap still come from OSM plus `pnpm map`, which also reads the DOP40 orthophoto
(`scripts/dop40.ts`: 42 WMS tiles at 1 m/px, cached in `data/dop40/`) inside the OSM geometry
(`src/map/photo.ts`):

- **Roofs**: one median colour per roof plane, stored per building as `roof.colors`, plus `roof.pitched`.
  Every eave owns the part of the roof nearest to it (`src/map/roof.ts`), so long blocks split along
  the ridge, each wing of an L or T gets its own ridge, and short wing ends stay gables. Flat roofs
  keep one colour. The photo leans, so a plane's footprint also catches part of its neighbour: the
  roof's pixels are split into a lit and a shaded tone, and a plane holding clearly more of one tone
  than the roof as a whole gets that tone. Leaves are left out; a plane mostly under a tree takes the
  roof's colour. The renderer paints the planes in those colours and adds tile detail from a texture.
- **Missing sheds and garages**: compact, nearly rectangular patches of roof tile (12–600 m²) away from
  streets, pitches and mapped buildings become one-storey buildings. White flat roofs are not added:
  at 1 m they cannot be told from vans, trailers and bright paving.
- **Shadows**: their direction and length (`SHADOW_DIR`, `SHADOW_PER_M`) were measured in the photo,
  so buildings, trees and cars cast them the way the photo shows (towards the north-east).
- **Trees**: green-and-dark (or green-and-rough) pixels outside forests, fields and building shadows,
  covered with round crowns, biggest first → `public/trees.bin` (~150k crowns, 5 bytes each). Each
  crown gets one of three tones so they vary.
- **Paved ground**: grey pixels (yards, driveways, parking) plus OSM parking lots, cleaned into hard
  shapes (closing fills cars, opening drops specks; green islands in paving under 12 m² are paved
  over, larger ones squared into straight planting strips), as the alpha of `public/ground.png` (2 m/px). The
  renderer gives the mask a hard edge and fills it with smooth light paving.
- Parked cars are not solid: the ones in the photo cannot be told apart at 1 m per pixel, and an
  invisible obstacle is worse than driving through a picture of a car.

Lawn, pavement, asphalt and tree sprites are re-toned at load to the median colours measured in the photo;
paving and asphalt also lose most of their painted speckle.

## What is in the town

- **Shops and places**: every named `shop=*` and the important `amenity=*` from OSM (EDEKA, Penny, Aldi, Lidl, Kaufland, Netto, Rossmann, fuel, police, …) as map labels, minimap dots and a HUD hint.
- **Traffic lights**: the 27 real `highway=traffic_signals` nodes, grouped into junctions with a 46 s cycle (`src/sim/signals.ts`). NPC cars stop at red; a test drives 60 s of traffic and fails on any red-light crossing.
- **Pedestrians**: walk footpaths and the sidewalks along streets (`src/sim/pedestrians.ts`), dodge fast cars, fall over when hit; NPC cars brake for them.

`pnpm map:fetch` downloads both `data/raw.json` (ways) and `data/places.json` (shops, lights).

## Sprites

Painted by Codex (`codex-images` skill), then keyed, sliced and made seamless by
`python3 scripts/process-sprites.py <codex-dir> [<newer-dir> ...]` into `public/sprites/`.
Roofs, asphalt and trees were prompted with a real aerial photo of Sudetenstraße as reference
(DOP40 © Bayerische Vermessungsverwaltung, CC BY 4.0).

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

`pnpm check` — typecheck (TS 7), oxlint, Vitest (projection, builder, photo reading on synthetic images, car handling, a 20 s drive that must never clip a building, traffic that stays on roads).

## License of the map data

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the Open Database License (ODbL). `public/geretsried.map.json` is a derived database and stays under the ODbL.

The ground tiles in `public/photo/` are the DOP40 orthophoto, © [Bayerische Vermessungsverwaltung](https://geodaten.bayern.de/opengeodata/)
(www.geodaten.bayern.de), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), **modified**: cut into tiles,
sharpened, contrast and saturation raised, re-encoded as WebP. Roof colours, tree crowns (`public/trees.bin`)
and the paved-ground mask (`public/ground.png`) are derived from the same photo.
