# Geretsried Theft Auto (POC)

Top-down GTA 2-style game set in the real town of Geretsried, built from OpenStreetMap data.

```sh
pnpm install
pnpm dev          # http://localhost:5190
```

**Controls:** WASD / arrows walk and drive · Shift sprint · Space handbrake (on foot: fire) · F get in / out (works on moving traffic too) ·
Ctrl fire · Q / E (or [ / ]) previous / next weapon · G horn · H help.

## How the map is made

```
Overpass API ──► data/raw.json ──► scripts/import-osm.ts ──► public/geretsried.map.json
```

- `pnpm map:fetch` downloads every road, building, river and land-use way in the bbox (`BBOX` in `scripts/import-osm.ts`).
- `src/map/build.ts` projects lat/lon to meters (origin = north-west corner, y south) and keeps a compact JSON (~1.6 MB).
- `pnpm map` rebuilds from the cached `data/raw.json` without hitting Overpass.

### The picture: WebGL2, GTA 2 style

The town is drawn in 3D with a small in-repo WebGL2 layer (`src/render/gl/`, no dependencies), like GTA 2:

- **Camera** (`src/render/camera.ts`): GTA 2 close, straight down through a narrow 26° lens: about 40 m
  across a 16:10 screen on foot (54 m up), 50 m in a standing car, 90 m at top speed. It trails the
  player and eases its look-ahead (0.55 s of travel) into the driving direction. Houses lean out about
  2.5 m at the screen edge, so walls show without wide-angle stretch. At this zoom a ground meter is
  about 70 device pixels, so ground tiles cover at most 6 m of their 512 px. `?compare=` uses an
  orthographic view of the same square instead.
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
  ridge, with clay tile (pitched) or gravel (flat) detail. The DOP40 medians are hazy (median lightness
  0.56, saturation 0.2 over 14k planes), so `roof-tone.ts` grades them: clay becomes saturated
  terracotta or brown, grey tile anthracite, flat roofs light grey gravel, keeping each plane's hue and
  the lit/shaded difference. Pitched roofs get a dark eave line; flat roofs a parapet with a light
  coping and a few vents and air-conditioning boxes.
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

## Playing it (GTA 2 style)

- **HUD** (`src/ui/Hud.tsx`, DOM over the canvas): money top right, lives, health as five hearts, armour as
  a blue shield, the score multiplier, the weapon slot (icon and rounds) under them, wanted level as up to four cop heads at the top centre, the
  job clock and the street name as you turn into it under them (clear of the car in the middle), the car's name as you get in (`src/sim/vehicles.ts`: VW Golf, BMW
  5er, Taxi, Audi A3, Mercedes G, Polizei, VW Bus, Post-Transporter), BUSTED / WASTED banners, the
  mission text and clock. H toggles the controls help.
- **Money** (`src/sim/score.ts`): a near miss (passing a car at over 50 km/h with centres 3.4–4.6 m
  apart) pays $50, a drift (sliding over a third sideways at speed) $20 every half second. Awards within
  5 s of each other build a multiplier up to ×4.
- **Wanted level** (`src/sim/wanted.ts`): ramming cars, knocking people down, entering a junction on red
  and taking a car in front of the police add heat; each whole point is a cop head and one police car.
  Heat cools only after 8 s out of police sight.
- **Police** (`src/sim/police.ts`): they turn up just out of view, drive the shortest street route to
  you (A* over the street graph, `src/world/route.ts`), go straight at you once close, back out of dead
  ends and bump you. From two cop heads the officers get out near you and come on foot with pistols;
  from three they also shoot from the cars at close range (`tactics` in `src/sim/wanted.ts`). Killing
  an officer is a whole cop head; killing anyone, or shooting where the police can see, adds heat too.
  On foot and not fighting back (no shot or punch for 1.5 s), an officer at your side (or a police car
  stopped against you) for 2 s is **BUSTED**; on foot the officers get out at any level to arrest you, and
  police cars push past you instead of driving over you. Shooting back keeps them at a distance:
  half your money, your guns and a life gone, back at Sudetenstraße 19. Losing the last life starts over.
- **Damage** (`src/sim/damage.ts`): one model for the player, pedestrians, police and cars (hp, armour,
  what hit last, fire). Walls, cars and police cars hurt your car; under 35 hp it smokes, under 25 it
  burns, burns down in about four seconds and explodes into a wreck, with you in it if you stayed.
  At 0 hp you are **WASTED**: a life, your guns, your armour and a quarter of your money gone; you wake
  three seconds later at the doctor's nearest home (GTA 2's hospital; Geretsried has practices).
- **Weapons** (`src/sim/weapons.ts`, data; `src/sim/combat.ts`, what they do): fists, pistol,
  submachine gun, shotgun (seven pellets fanned over 24°, 14 m), molotov (thrown up to 18 m, breaks
  into a pool of fire for 6 s), rocket launcher (a rocket that explodes on the first wall, car or person)
  and flamethrower (a 7.5 m cone that sets people alight and cooks cars). Bullets are rays that walls
  stop (`src/sim/hitscan.ts`); cars take a third of a bullet's damage. Explosions do 160 at the centre
  falling off to nothing at 6.5 m, knock people down and throw them back, and shove cars; a car's own
  explosion is bigger (220, 7.5 m), so the next car in a row catches fire and goes up too, GTA 2's
  chain reactions. Shots and bangs send people near running and screaming; every seventh person is
  tough and comes at you with his fists when you hit him. No gore: people fall over, the dead lie
  there for 20 s and fade.
- **Pickups** (`src/sim/pickups.ts`): 40 spots from the map alone (behind shops, away from the street
  they face; in parks and on pitches; on parking lots), 90 m apart, never under a tree crown, the same
  every game, the nearest one to the start a pistol. Walk over one to take it; it is back after 60 s.
- **The payphone job** (`src/sim/mission.ts`): the yellow phone on the sidewalk at Sudetenstraße 19:
  "Hol Brezn bei Bäckerei Mühlenbäck und bring sie zur Rehmaus Apotheke in 150 s". The pickup is the
  Mühlenbäck branch across town (the one next door would be too easy); the 150 s clock runs from the
  pickup, 2.4 km by road. A yellow arrow points at the target (at the screen edge while it is off
  screen) and a glowing marker lies on the ground there. Reward $1500.
- **Sound** (`src/ui/audio.ts`, WebAudio, no files): an engine hum pitched by speed, a two-tone horn (G),
  a German two-tone siren that swells as police cars close in, and gunshots, explosions, flames,
  breaking bottles, punches and cartoon screams from filtered noise and swept tones, quieter with distance. It starts with the first key press.

## What is in the town

- **Shops and places**: every named `shop=*` and the important `amenity=*` from OSM (EDEKA, Penny, Aldi, Lidl, Kaufland, Netto, Rossmann, fuel, police, …) as map labels, minimap dots and a HUD hint.
- **Traffic lights**: the 27 real `highway=traffic_signals` nodes, grouped into junctions with a 46 s cycle (`src/sim/signals.ts`).
  Every lane a light controls gets a white stop line 2.5 m before it (6 m at a junction, where the
  crossing comes first) and a German signal (`src/render/scene/street.ts`): a pole on the right-hand kerb
  standing up in 3D, a mast arm over the lane and the head hanging from it, lit red, amber or green on its
  face and as a glowing dot seen from above. A zebra lies just past each line, with push-button posts at
  both kerbs, and at the zebra and marked crossings OSM maps. NPC cars stop with their bumper behind the
  line; a test drives 60 s of traffic and fails on any car crossing a line at red. Main roads have street
  lamps every 38 m.
- **Pedestrians**: walk footpaths and the sidewalks along streets (`src/sim/pedestrians.ts`), dodge fast cars, fall over when hit; NPC cars brake for them.

`pnpm map:fetch` downloads both `data/raw.json` (ways) and `data/places.json` (shops, lights).

## Sprites

Painted by Codex (`codex-images` skill), then keyed, sliced and made seamless by
`python3 scripts/process-sprites.py <codex-dir> [<newer-dir> ...]` into `public/sprites/`.
Trees were prompted with a real aerial photo of Sudetenstraße as reference
(DOP40 © Bayerische Vermessungsverwaltung, CC BY 4.0). The GTA 2 style facades, road, sidewalk, lawn and
clay tiles were painted seamless; the script only resizes them to 512 px and turns the roof tiles (and the
flat-roof gravel) into grey detail that the renderer multiplies with the photo's roof colour.

The combat sheets (weapon icons for the HUD, pickups on glowing pads, muzzle flash, tracer, the explosion's
flash and fireball, smoke, fire, a burnt-out wreck and a scorch mark) are not on a grid: the script cuts
each sprite out by its blob of opaque pixels (`save_blobs`).

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
