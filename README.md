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

### The picture: WebGL2, GTA 2 style

The town is drawn in 3D with a small in-repo WebGL2 layer (`src/render/gl/`, no dependencies), like GTA 2:

- **Camera** (`src/render/camera.ts`): straight down with a 64° perspective, 96 m up on foot, climbing to
  160 m as the car speeds up, looking 0.8 s ahead. Roofs come towards you, so walls show towards the
  screen edges. `?compare=` uses an orthographic view of the same square instead.
- **Chunks** (`src/render/scene/scene.ts`): every 128 m chunk is built once into a static vertex buffer
  (about 1 ms, 60 KB) as it comes near the view: lawn and paving (the photo's paved mask, given a one
  pixel hard edge in the shader), land use and water, streets as polygons from the OSM centre lines
  (sidewalk slabs, kerb, asphalt, dashed centre and solid edge lines on main roads, cut out at
  junctions), buildings extruded from their footprints (storeys × 3 m), tree crowns at the photo's
  positions, and shadows. Ground layers lie a few centimetres apart, so the depth test layers them.
- **Facades** (`src/render/scene/facade.ts`): a shop front where a shop is inside or at the wall,
  corrugated metal for halls over 800 m² of up to two storeys, an apartment block from three storeys, a
  Bavarian house otherwise. Texture coordinates are in meters, so windows keep their size; walls facing
  the sun are lit.
- **Roofs**: the footprint at eave height in the two plane colours the photo measured, split along the
  ridge, with clay tile (pitched) or gravel (flat) detail and a crisp edge line.
- **Passes**: opaque (alpha-to-coverage for tree crowns), shadows (each pixel darkened once through the
  stencil), then cars, people and traffic lights as sprites at their height, so buildings hide them.
  Shop labels, the player ring, the minimap and the HUD are 2D on top.

Storeys come from OSM where it has them; otherwise from the building type (`buildingLevels` in
`src/map/build.ts`: garages one, apartments four, the rest two).

The photo tiles (`pnpm photo`, `scripts/photo-tiles.ts`, `public/photo/`) are no longer drawn; only their
overview is, as the minimap.

### What else comes from the aerial photo

The map, the collision data and the minimap come from OSM plus `pnpm map`, which also reads the DOP40 orthophoto
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

Tree crowns over the asphalt of a street are left out, so roads stay readable.

## What is in the town

- **Shops and places**: every named `shop=*` and the important `amenity=*` from OSM (EDEKA, Penny, Aldi, Lidl, Kaufland, Netto, Rossmann, fuel, police, …) as map labels, minimap dots and a HUD hint.
- **Traffic lights**: the 27 real `highway=traffic_signals` nodes, grouped into junctions with a 46 s cycle (`src/sim/signals.ts`). NPC cars stop at red; a test drives 60 s of traffic and fails on any red-light crossing.
- **Pedestrians**: walk footpaths and the sidewalks along streets (`src/sim/pedestrians.ts`), dodge fast cars, fall over when hit; NPC cars brake for them.

`pnpm map:fetch` downloads both `data/raw.json` (ways) and `data/places.json` (shops, lights).

## Sprites

Painted by Codex (`codex-images` skill), then keyed, sliced and made seamless by
`python3 scripts/process-sprites.py <codex-dir> [<newer-dir> ...]` into `public/sprites/`.
Trees were prompted with a real aerial photo of Sudetenstraße as reference
(DOP40 © Bayerische Vermessungsverwaltung, CC BY 4.0). The GTA 2 style facades, road, sidewalk, lawn and
clay tiles were painted seamless; the script only resizes them to 512 px and turns the roof tiles (and the
flat-roof gravel) into grey detail that the renderer multiplies with the photo's roof colour.

The game starts at Sudetenstraße 19 (`START` in `src/sim/game.ts`).

## Layout

| Path | What |
|---|---|
| `src/map/` | Map schema (Effect `Schema`), projection, OSM → map builder, loader |
| `src/world/` | Spatial grid, building collision, "which street am I on", road junction graph |
| `src/sim/` | Car physics, NPC traffic on the road graph, the 60 Hz game step |
| `src/render/` | WebGL2 renderer (`gl/`), 3D chunk and sprite geometry (`scene/`, pure), camera, 2D overlay and minimap |
| `src/ui/` | React shell, HUD, keyboard |

## Checks

`pnpm check` — typecheck (TS 7), oxlint, Vitest (projection, builder, photo reading on synthetic images, triangulation, road and marking geometry, facade choice, the camera, car handling, a 20 s drive that must never clip a building, traffic that stays on roads).

## License of the map data

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the Open Database License (ODbL). `public/geretsried.map.json` is a derived database and stays under the ODbL.

The ground tiles in `public/photo/` are the DOP40 orthophoto, © [Bayerische Vermessungsverwaltung](https://geodaten.bayern.de/opengeodata/)
(www.geodaten.bayern.de), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), **modified**: cut into tiles,
sharpened, contrast and saturation raised, re-encoded as WebP. Roof colours, tree crowns (`public/trees.bin`)
and the paved-ground mask (`public/ground.png`) are derived from the same photo.
