# Geretsried Theft Auto — Places Backlog

Repo: https://github.com/alexanderop/geretsried-gta · Gold standard: **Cafe Waldmann** (commit `c5af0a7`).
Engine reference: [`ENGINE-NOTES.md`](ENGINE-NOTES.md) · All POIs with lat/lon + Maps/Street View links: [`pois.csv`](pois.csv) · Per-place research: `places/<slug>.md` · Photos/screens: `reference/<slug>/` (local only, never committed).

## Format

Each place becomes one **ready-to-paste Claude Code prompt** once researched. Template:

```
### <POI name> (#id, kind) — Size: S | M | L
**Goal:** one paragraph: what the player sees/does there, GTA2 tone, why it matters.
**Reference:** places/<slug>.md (address, lat/lon, Street View links, photos in reference/<slug>/),
  OSM footprint yes/no, street the frame hangs on (exact OSM name), Waldmann files to copy from.
**Spec:** rects in the street frame (u along street, n from kerb, meters), heights (m), colours (RGBA 0–255),
  materials/sprites needed (new Codex textures listed by name), interactive pad / NPCs if any.
**Acceptance criteria:**
- [ ] Looks like the reference from the play camera (screenshot compared to Street View / aerial)
- [ ] Solid where it should be; player/NPC paths not blocked; no z-fighting
- [ ] Tests (layout invariants like src/world/cafe.test.ts) pass; `pnpm test` + typecheck green
- [ ] README "What is in the town" updated
**Size:** S = exterior dressing on the OSM footprint (sign, awning, props) · M = bespoke exterior + 1 interaction · L = walk-in interior with NPCs (Waldmann-level)
```

Status values: `todo` (nothing yet) · `ref-done (partial)` (prompt written, some parts marked needs reference) · `ref-done` (places/<slug>.md + reference photos complete, prompt written) · `implemented` (merged in the game).

## Done (don't touch)

| # | Name | Kind | x, y (m) | lat, lon | m from start | Status | Note |
|---|---|---|---|---|---|---|---|
| 56 | Cafe Waldmann | food | 3888.6, 4547.7 | 47.859102, 11.482135 | 148 | implemented |  |

## Queue

### #0 — Add `reference/` to .gitignore — Size: S — status: implemented
**Goal:** keep scouting photos (Street View screenshots etc.) out of git. `.gitignore` at `c5af0a7` does **not** contain `reference/`.
**Acceptance criteria:** `reference/` line in `.gitignore`; `git status` clean after adding files under `reference/`.
**Done:** the unanchored `reference/` line ignores a `reference/` directory at any depth, so both `reference/<slug>/` (root, as the prompts use) and `docs/reference/<slug>/` stay local.

### Batch 1: exterior only (decision)
Batch 1 is **exterior-only** (Size S/M). There are no walk-in interiors, no roof fade, and no new `ShopKind`.
- That way none of the five places needs the hard-wired Waldmann single-instance (`World.cafe`, `Chunk.cafe`, `roofAt`, `guests.ts`).
- **Before the first walk-in interior** (any Size L), item **#0c generic Place registry** must land first.
- To avoid five more one-offs, item **#0b** adds a small shared exterior "place dressing" registry. Every batch-1 item plugs into it.

**Before pasting:** copy `places/<slug>.md` to `docs/places/<slug>.md` in the repo, and the photos to `reference/<slug>/` (gitignored by #0). The prompts below use those repo-relative paths.

### #0b: Place dressing registry (exterior only) — Size: M — status: implemented
```
Goal: Add a small generic "place dressing" layer, so bespoke exteriors (wall-sign strips, arcades,
towers, per-building level/colour overrides, prop sprites) can be declared per place as data, instead of
another hard-wired one-off like Cafe Waldmann. Exterior only: no interiors, no roof fade, no new ShopKind.
Reference: ENGINE-NOTES-style facts are in the code: src/world/cafe.ts (street frame u/n, Rect),
src/render/scene/cafe.ts (flat/face/box/sprite/glassWall primitives), src/map/build.ts (buildingLevels),
src/render/scene/facade.ts. docs/places/*.md describe the first 5 users.
Spec:
- A registry (e.g. src/world/places/index.ts) of PlaceDressing entries keyed by exact POI name + street name:
  { poi, street, osmBuildingId, levels?, wallColour?, roof?: {colour?, pitched?}, parts: Part[] }.
  Each Part is in the street frame (u along street, n from kerb, meters).
- Part kinds needed by batch 1: wallSign(texture, u0,u1, z0,z1, onEdge), tower(rect, h, roofH, colours),
  arcade(edge, arches, depth, pillarColour), sprite(name,u,n,z,angle,len).
- Per-building overrides (levels, wall tint) apply to the OSM footprint by way id. The footprint stays the solid.
- Cafe Waldmann stays exactly as it is (do not migrate it in this task).
Acceptance criteria:
- [ ] With an empty registry the town renders pixel-identical to before (screenshot at the start + at Waldmann).
- [ ] One test entry (e.g. levels override on one building) visibly changes only that building.
- [ ] Unit tests for frame→world conversion of parts; pnpm test + typecheck green.
Size: M
```

**#0b as built (read this before B1-1…B1-5):**
- **Where:** `src/world/places/dressing.ts` (types, `dressMap`, `resolvePlaces`), one file per place
  (`st-ursula.ts` is the first) listed in `src/world/places/index.ts` (`PLACES`). Parts are drawn by
  `src/render/scene/places.ts` with the building they belong to. Frames live in `src/world/frame.ts`
  (`streetFrame`, `wallFrame`, `toWorld`…; `world/cafe.ts` re-exports them), the shared mesh primitives
  (`flat`/`face`/`box`/`sprite`/`boxShadow`) in `src/render/scene/frame-mesh.ts`. Cafe Waldmann is not
  migrated and renders byte-identical.
- **A place is pure data:** a new `src/world/places/<slug>.ts` exporting a `PlaceDressing`, plus one line in
  `index.ts`. Fields: `poi` (exact POI name; with several POIs of that name the one nearest the footprint,
  e.g. the two "Sparkasse"; a building without a POI anchors on its footprint's middle), `street` (exact OSM
  name, the frame hangs on its nearest segment), `osmBuildingId`, optional `levels`, `facade`, `wallColour`,
  `bands`, `roof: { colour?, pitched? }`, and `parts`.
- **Overrides:** `levels` is applied when the map loads (`makeWorld` runs `dressMap`) and baked by `pnpm map`,
  so no map rebuild is needed. `wallColour` multiplies the facade texture on every wall (no random tint).
  `bands: [{ z0, z1, colour, plain? }]` are horizontal wall bands in **absolute meters** (walls end at
  `levels × 3`, plus 0.6 m parapet on a flat roof); textured = facade × colour (Sparkasse's grey base, white
  middle, grey top), `plain` = flat colour (St. Ursula's fascia; a plain band over the whole height gives a
  window-less render wall, e.g. Maria Hilf). `roof.colour` paints both planes (the second 20 % darker); the
  roof stays the engine's flat-at-eaves roof, so a hip roof shape is not modelled. `facade` picks a texture
  from the `Facade` union (facade.ts); a new one is a material (below) plus entries in `FACADE_W` /
  `FACADE_LAYER` in scene.ts.
- **Parts and their coordinates.** Free-standing parts use the **street frame** (u along the street, n from
  its centre line towards the place, standing in the street facing the place u runs to your right):
  `tower { rect, h, roofH, colours: { wall, roof, trim?, finial? }, faces?: [{ texture, side, u0, u1, z0, z1 }] }`
  (side 0 faces the street, 1 the u1 end, 2 away, 3 the u0 end; u along a face from its left end seen from
  outside) and `sprite { name, u, n, z, angle, len, pole? }` (a `PROP_FILES` sprite lying flat, optional pole).
  **Wall parts deviate from the spec's "street frame":** a street-frame u cannot place anything on a wall
  perpendicular to the street (Sparkasse's corner face), so `wallSign { texture, edge, u0, u1, z0, z1, out? }`
  and `arcade { edge, u0, u1, arches, h, depth, pillar, glazing }` sit on footprint wall `edge` (wall i runs
  from point i to i + 1 of the building's `pts`), u in meters from that wall's left end as you face it from
  outside, z from the ground. `out` hangs a sign further off the wall (e.g. on an arcade's band).
- **Textures:** wall signs and tower faces are **material** layers (512 px, `MATERIAL_FILES` + `Material` in
  mesh.ts, file `public/sprites/<name>.webp`), not 256 px sprites, so lettering stays readable. Store them
  **square, the sign stretched to fill it**; transparent pixels let the wall show (alpha-to-coverage), so
  loose letters work. Keep a few transparent pixels at the edges: materials wrap (REPEAT) and bleed.
- **Never solid:** the footprint is the only solid. Towers must stay inside it and wall parts on real walls:
  `src/world/places/places.test.ts` checks every registry entry against the real map. An arcade's `depth`
  sticks out of the footprint and can be walked through, so keep it ≤ 0.6 m.
- **What the camera shows:** walls only lean into view away from the player (a 9 m wall shows about 60 px
  tall when it stands 5 m from the player, about 140 px at 10 m). A 0.5 m arcade reads as a white band with pillar fronts; check signs from a spot
  where the wall is near the edge and crop the screenshot. Roofs, towers and sprites read best from above.
- **Verifying in the browser:** `__gta.world.places` lists the resolved places with their frames; move the
  player with `Object.assign(__gta.game.player, { x, y })` (on foot); `?compare=lat,lon,half` renders a
  fixed straight-down view without people or cars, for pixel diffs.
- **St. Ursula moved into the registry** (levels 4, `facade: "ursula"`, the fascia as a plain band); the
  one-off `ST_URSULA` in facade.ts and `KNOWN_LEVELS` in build.ts are gone. Every chunk mesh of the town is
  byte-identical to before (hashed in a throwaway test).
- **Footprint walls of batch 1** (edge: length, the way it faces, its ends in the place's street frame (u, n)):
  - Rehmaus 120402845 (Sudetenstraße, u→304°): **8**: 19.1 m, faces 31° (−16.7,15.4 → 2.3,16.4); **9**: 19.1 m,
    faces 31° (2.3,16.4 → 21.4,17.5): the arcade front. 0: 18.6 m faces 303°; 1: 50.0 m faces 209° (back);
    3: 14.6 m faces 124°; 5, 6: 5.9 / 6.0 m faces 33°; 7: 2.8 m faces 305°.
  - Sparkasse 128271967 (Händelstraße, u→38°): **4**: 38.1 m, faces 111° (−0.3,7.2 → 36.1,18.5): the Händelstraße
    face; **3**: 11.9 m, faces 201° (−3.8,18.6 → −0.3,7.2): the S corner face. 0–2: 11.8 / 20.1 / 6.2 m faces 291°;
    5: 11.9 m faces 21°.
  - Rathaus 92735882 (Karl-Lederer-Platz, u→37°): 5: 30.4 m and 6: 6.4 m face 122° (ESE, the plaza side the
    places doc suspects; ends −8.9,15.6 → −2.5,16.2 → 27.8,19.1); 7: 33.1 m, 8: 15.4 m face 212°; 0: 15.6 m,
    2: 21.3 m face 302°; 1: 34.0 m, 3: 3.8 m, 4: 10.8 m face 32°.
  - Maria Hilf 127604845 (Johann-Sebastian-Bach-Straße, u→118°): 6: 21.3 m faces 180° (−8.1,4.8 → 10.7,14.8),
    the wall nearest the street; 7: 21.0 m faces 274°; 8: 14.5 m faces 321°; 0: 13.0 m faces 3°; 1: 9.4 m faces 45°;
    2: 15.4 m faces 105°; 3: 5.3 m faces 33°; 4: 10.6 m faces 127°; 5: 6.1 m faces 213°.

### #0c: Generic Place registry for walk-in interiors — Size: L — status: todo (only before the first Size-L place)
Generalise `World.cafe` / `Chunk.cafe` / `roofAt` / `ShopKind "cake"` / `guests.ts` into N places. Not needed for batch 1.

### B1-1 · Rehmaus Apotheke (#168, pharmacy) — Size: S — status: implemented
```
Goal: Make the Rehmaus Apotheke at Sudetenstraße 14 recognisable as the real pharmacy. It is the drop-off
of the first courier job (Brezn from Mühlenbäck), 50 m from the start, so it is one of the first buildings
the player looks for. Exterior only.
Reference: docs/places/rehmaus-apotheke.md;
  reference/rehmaus-apotheke/05-web-official-storefront.jpg (CURRENT sign),
  01-street-front.png (Street View Sep 2023, arcade + block, still the old "ARKADEN" sign: do NOT copy that text),
  02/03-street-*.png, 04-satellite.png (roof only).
Spec (via the #0b registry):
- Street frame: "Sudetenstraße"; POI name exactly "Rehmaus Apotheke" (town-jobs.ts + game.test.ts depend on it; do not rename).
- Keep OSM footprint way 120402845 (51.5 × 19.8 m); levels 3 (photos), pitched red-brown roof as the engine already does.
- Wall tint light grey-blue ≈ #a9b3c4 (SV sample #8a95a9 in shade).
- Ground-floor arcade along the street-facing NE edge: round arches on square white pillars (#e8ded2), recessed
  dark glazing frames (#6e6c68). Count/depth of arches: use what 01/05 show (≈4 for the pharmacy); if unclear, keep to that.
- Wall-sign strip above the arches: "REHMAUS APOTHEKE", red serif capitals #e7544a on the render (new painted texture).
- Red pharmacy "A" sprite: free-standing sign by the car park (seen in 01). The green logo is NOT on the facade: don't use it.
Acceptance criteria (top-down play camera):
- [x] From the car park/Sudetenstraße, the 3-storey block reads grey-blue with a white arcade band on the street side, like 01.
- [x] "REHMAUS APOTHEKE" in red serif caps is legible above the arcade when the building is near a screen edge; no "ARKADEN" anywhere.
- [x] Red "A" sign visible from above at the car park, matching 01.
- [x] Courier job still completes at the pharmacy; car drop-off reachable; pnpm test + typecheck green.
Size: S
```

**B1-1 as built** (`src/world/places/rehmaus-apotheke.ts`) and gotchas for B1-2…B1-5:
- **Levels 3, `facade: "render"`, `wallColour` [180, 190, 208]:** a new generic facade, `facade-render.webp`
  (`scripts/facade-render.py`): the block texture with its plaster made neutral off-white (240), so
  `wallColour` *is* the render colour (≈ #a9b3c4 here). With the default facades a cool colour cannot work:
  `wallColour` only multiplies, and block/house plaster is yellow (median #dabe98), the shop facade dark
  (#868478). Any place whose render is not yellow-beige (Sparkasse white, Rathaus) should use `"render"`.
- **Arcade on walls 8 + 9, 6 arches each, h 2.7, depth 0.5.** Walls 8 and 9 are collinear (both 19.07 m);
  run the arcades to the shared vertex (wall 8 to u 19.05, wall 9 from u 0.02), or a gap and two end faces
  show at the joint. From the play camera the arcade reads as a cream band with pillar teeth; the glazing
  in the arches is hardly ever seen.
- **Which arches are the pharmacy's:** the POI (the frame's u = 0) sits behind the right end of wall 8, so
  the sign is on wall 8 over its right four arches (u 7.4–17.4); the left two are the other shop's. Wall 9
  belongs to the units towards the W neighbour.
- **Sign lettering:** Codex spelled "REHMAUS APOTHEKE" right first time when the prompt spelled it letter by
  letter, on #FF00FF, 4:1. `process-sprites.py` (`rehmaus-sign`) keys it, crops to the letters and stretches
  them to 504 × 504 inside a 512 transparent square. Letters 1 m tall (z 3.2–4.2, just above the arcade's
  band at h + 0.45) are the smallest that read: the front leans in only about 8 px per meter of height
  even near the screen corner, so 1 m of letters is about 8–10 screen px tall. They read **upside down**
  on screen (the wall faces the camera from the bottom of the screen); rotate the crop to check spelling.
  They overlap the bottom of the first-floor windows (3.95 m up) a little; transparent pixels let them show.
- **Best spot to check a NE-facing front:** stand in Sudetenstraße (street frame n ≈ 2) about 3 m along
  +u before the sign's middle: the front then sits in the bottom-left corner, where walls lean in most.
  The bottom-left "H – Hilfe" / "M – Ton an" chips cover that corner; hide their parents with
  `style.visibility = "hidden"` for the shot. The job's green drop-off label floats over the pharmacy.
- **Pharmacy "A":** new prop sprite `pharmacy-a` (Codex, top-down, the German Apotheken-A with goblet and
  snake on a white panel), at z 2.6 on a grey pole, `angle` 2.54 = minus the frame's angle (−2.54 rad), so it
  reads upright on screen. Sprite `angle` is relative to the street frame: to make a flat sign upright,
  pass `−atan2(frame.uy, frame.ux)` from `__gta.world.places`. Kerb trees (from the aerial photo) stand
  at street u −5…0; a sprite under a crown is hidden, so it sits at u 2.5, n 9 on the green.
- **The ground in front is lawn, not a car park:** the paving comes from the aerial photo mask; between the
  sidewalk and the arcade there is grass with a few paved patches. The drop-off (STOP_REACH 9 m round the
  POI, which is 17.7 m from the street's centre line) means standing or parking on that green.

### B1-2 · Sparkasse, Händelstraße (#20, bank) — Size: S — status: implemented
```
Goal: Make the Sparkasse branch at the corner of Händelstraße / Johann-Sebastian-Bach-Straße read as a real
Sparkasse: grey bank ground floor with big red "Sparkasse" lettering under a white apartment block. Exterior only.
Reference: docs/places/sparkasse-stein.md; reference/sparkasse-stein/01-street-front.png (Händelstraße face),
  02-street-side.png (corner face, flag, yield sign), 03-street-other.png, 04-satellite.png (solar roof).
  All Street View Jul 2022.
Spec (via #0b):
- Street frame "Händelstraße", POI "Sparkasse" (#20 at 3550.6, 4719.7).
- Keep OSM footprint way 128271967 (38.1 × 11.8 m, long side on Händelstraße); levels 4 (grey base + 2 white + grey top).
- Ground storey grey #c0bcb5; storeys 2–3 white #fbfcfd; top storey grey ≈#75757b; pitched brown roof (engine DOP colours).
- Wall-sign strips "Sparkasse" (red #f67465, Sparkasse lettering) on the Händelstraße face and the S corner face.
- Tall narrow ground-floor windows with a red band #ff544a each; grey balconies (#526471) at the N end.
- Sprites: red flagpole + yield sign at the S corner. Solar panels on the roof only if a roof texture variant is cheap.
- Single-storey podium extent is "needs reference" in the doc: don't add a podium beyond the OSM outline.
Acceptance criteria:
- [x] Next to the building, the grey base vs white upper floors split is obvious, like 01/03.
- [x] Red "Sparkasse" visible on both street faces; red flag at the corner seen from above.
- [x] Building height clearly 4 storeys vs neighbours; no collision changes; pnpm test + typecheck green.
Size: S
```

**B1-2 as built** (`src/world/places/sparkasse-stein.ts`) and gotchas for B1-3…B1-5:
- **Levels 4, `facade: "render"`, `wallColour` white, two textured bands:** the base z 0–3 [204, 200, 193] and the
  top storey z 9–12 [124, 124, 131]. The render's plaster is 240, so a band colour is the target hex ÷ 0.94
  (#c0bcb5 → 204, 200, 193). The DOP roof colours stay.
- **Bank windows as opaque wall signs:** `sparkasse-windows` (material, Codex, 2:1: grey render, two tall windows
  with a red band and a white S, a lamp between, a plinth; stored square) in 6 m × 3 m strips, four on wall 4
  (u 0.3–24.3 from the S corner) and two on wall 3. Being opaque, a strip hides the band's block windows behind
  it; the N end of wall 4 and the back walls keep the grey band with the render's windows. Repeating a strip as
  several wall signs is the cheap way to get a ground floor that differs from the facade on some walls only.
- **Lettering:** `sparkasse-sign` (material, Codex, 4:1 on #FF00FF, the S logo plus "Sparkasse" spelled letter by
  letter, right first time; keyed and squared like `rehmaus-sign`), at `out` 0.1 over the strips (0.04), so the
  two layers don't fight. 1.3 m tall was a red smear; **1.7 m** (z 1.9–3.6, 6.8 m wide, reaching 0.6 m into the
  white storey) reads on wall 4 when it leans in at the left screen edge (stand at 3566.5, 4716.5, on the east
  sidewalk of Händelstraße). Wall 3 faces SSW, so it only shows at the top screen edge, where screens are
  shortest and walls lean least: there it is red lettering on the grey base, not readable letters.
- **New generic part `balcony { edge, u0, u1, z: [floor heights], depth, colour, slab? }`** (dressing.ts,
  places.ts): per floor a slab and a solid 1 m parapet round its front and ends. Overhead, so it may stick out
  further than an arcade; places.test.ts keeps the lowest floor at z ≥ 2.5. No ground shadow (the building's
  covers most of it). Here u 30.5–36.5 on wall 4 at z 3, 6, 9, depth 1.3, parapet #526471, slab #75757b:
  from above a grey stack standing out of the white front. Count and width per floor are a guess (no photo).
- **Sprites:** `sparkasse-flag` at u −4, n 8.5, z 7 on a 7 m pole (the part puts its pole under the sprite's
  middle, not at the flag's hoist; from above it doesn't show), `yield-sign` at u −8, n 4.9, z 2.1 on the
  corner of the sidewalk where Händelstraße ends at Johann-Sebastian-Bach-Straße, both turned by
  −frameAngle (0.907) to read upright. **Solar panels** without a roof texture variant: a `solar-panels`
  sprite lying on the roof at z 12.08 (the roof is flat at the eaves, 12 m), 11 m along the ridge on the
  street-side plane, where the DOP40 photo shows a dark strip (tile `3-4`, pixels 541–566, 681–722).
- **Sprite angle sign:** `angle` turns the other way from (u, n). n is u turned *clockwise* on the map (y
  points south), so a direction at +a from u towards n needs `angle: −a`. The ridge here runs at +0.302 rad,
  so the panels have −0.302; with +0.302 they lay across the roof.
- **Two "Sparkasse" POIs:** the other one (2748.9, 2748.5) is 2 km away, outside `POI_REACH_M` (80 m), so the
  registry picks #20; places.test.ts pins it (frame foot within 12 m of #20, 4 storeys).
- **process-sprites.py rewrites every output whose Codex source is in the directories you pass** (the
  scratchpad `img/` still held `rehmaus-sign`, and the re-encode came out byte-different): pass only the new
  images' directories, or `git checkout` the sprites you did not mean to touch.
- **Needs a photo:** the DOP40 shows the S ~20 m of the footprint under an orange roof with that dark strip and
  leaning less than the lighter N part, so the S half may be lower (the single-storey podium, or a lower wing).
  Not modelled: the whole footprint is 4 storeys, as the prompt says.

### B1-3 · Rathaus Geretsried (#174, civic) — Size: M — status: implemented
```
Goal: Turn the Rathaus at Karl-Lederer-Platz 1 into the town's landmark: cream two-storey wings with ochre
quoins, striped shutters, red-brown hip roof and the square clock tower with "RATHAUS" under the clock.
It is the hub of the Mercedes G and Taxi jobs (payphone at the bus stop). Exterior only.
Reference: docs/places/rathaus.md; reference/rathaus/05..09-web-commons-*.jpg (tower + front; 09 = clock/lettering close-up),
  01–03-street-*.png (user photosphere Fokko B., May 2021: wing, shutters, bay window, arched door, brick plaza),
  04-satellite.png (roof).
Spec (via #0b):
- Street frame "Karl-Lederer-Platz", POI "Rathaus Geretsried" (exact; town-jobs.ts uses it).
- Keep OSM footprint way 92735882 (L/T shape, ~36.8 × 48.6 m bbox); 2 storeys + pitched hip roof, tiles #935434.
- Walls cream #e9decd; ochre #dbb267 corner pilasters/quoins + window surrounds; shutters striped teal/white (avg #bfc0b1).
- Tower: square prism with ochre quoins, clock face + "RATHAUS" dark lettering #615239 (painted texture),
  dark shingle pyramid roof #5a5041 with finial. The tower's edge/position is "needs reference" in the doc:
  verify against the aerial (04) and Commons 05/08 before placing; the likely position is mid-facade on the plaza (ESE) side.
- Plaza in front: red-brick pavers with grey cobble edging (ground material), only where the photosphere shows it.
Acceptance criteria:
- [x] From above, the brown hip roof plus a distinctly darker pyramid tower roof is recognisable as the Commons photos.
- [x] Driving past, the cream/ochre walls with striped shutters and the tower's clock + "RATHAUS" read like 09.
- [x] Payphone + Mercedes G + Taxi job pickups still work and are reachable; pnpm test + typecheck green.
Size: M
```

**B1-3 as built** (`src/world/places/rathaus.ts`) and gotchas for B1-4…:
- **Levels 2, `facade: "rathaus"`, `wallColour` white:** a new facade texture, `facade-rathaus` (Codex, `facade-house` as
  the layout reference: two bays by two storeys, cream render, ochre window surrounds with segmental hoods, teal and
  white diagonal striped shutters). Without a facade the engine made the Rathaus corrugated metal (over 800 m², two
  storeys → `industrial`). The painted render is the cream, so `wallColour` is white, not a tint.
- **New generic roof option `roof.hip` (degrees)**, `src/render/scene/hip-roof.ts`: a real hipped roof over any
  footprint, a plane rising from every wall (straight-skeleton style: hips at outer corners, a valley at the inner
  one, a ridge per wing), cut into convex pieces along every line where two walls are equally far, so each piece is
  one flat plane; each plane is lit by the way it faces (×0.7…1), the building's shadow is cast from half the ridge,
  and the chunk box grows by the rise. A wall owns a point when it is the nearest wall whose wedge holds it: at an
  outer corner the points nearer to it than the neighbour, at an inner corner the points *farther* (that bisector is
  the valley). Tests: `hip-roof.test.ts` (box, both windings, L valley, U and the real Rathaus outline with no step;
  its walls 3 and 4 are parallel but 4 cm apart, a 4 cm step) and `places.test.ts` (ridge height, no other chunk).
  **Every other building is unchanged:** all 2112 chunk meshes of the real map hashed with the previous registry,
  at HEAD and with this change: identical; with the Rathaus added, only chunk 988 (its own) differs. Here 42°:
  ridges about 7 m over the 6 m eaves, about 323 roof pieces.
- **New tower option `edge`:** `rect` in that wall's frame (u from its left end, n into the building) instead of the
  street frame (`towerFrame` in dressing.ts; places.test checks it inside the footprint the same way). The street
  frame here runs about 5.5° off wall 5, so a street-frame tower would stand askew to the front.
- **Tower:** on wall 5, `rect` [9.5, 14.5, 0.35, 5.35] (centred on the plaza front: walls 6 + 5 are 36.8 m from the
  S corner, and wall 6 is the first 6.4 m), h 16 (3 m over the ridges), pyramid 4.5 m #5a5041, ochre quoins, a
  finial. Its face 0 carries `rathaus-tower` (Codex: ornamental clock over "RATHAUS", opaque, 4:5 stored square) at
  z 10.4–15.3. The tower stands *inside* wall 5 (the footprint is the solid), so the building's wall hides its lower
  front: the door and quoins at its foot are wall signs on wall 5 instead (`rathaus-door` keyed like
  `rehmaus-sign`, u 10.7–13.3, z 0–3.25; two `rathaus-quoins` strips at u 9.5–10.1 and 13.9–14.5).
- **Pilasters:** `rathaus-quoins` (the Codex quoin sheet keyed and cut to the short blocks' width, so the same strip
  works on both walls of a corner), 0.6 m × 6 m wall signs at both walls of each outer corner (points 0, 1, 3, 5,
  7). Wall i's u = 0 is point i + 1 (the left end seen from outside), so the corner at point i is at u = its length.
- **What the camera shows:** from Karl-Lederer-Platz (stand about (2638, 2849)) the tower's plaza face leans into
  the left of the screen with the clock and "RATHAUS" readable (sideways); from above the hip roof's planes and the
  dark pyramid read. The south wing faces SSW and only shows at the top screen edge.
- **Where the tower stands is still a guess:** the DOP40 shows no clear tower square; a light notch at wall 5's S
  part and a dark spot at the inner corner are the only hints. The doc's "mid-facade on the plaza side" was kept.
- **Not built:** the red-brick plaza (the aerial shows light paving in front of wall 5 and the photosphere that shows
  the brick was not on disk), the bay window on the gable block, the 3-storey gable block (the whole outline is 2
  storeys). The 3.8 m annex at the N end (way 1236633759) keeps the engine's look.

### B1-4 · Maria Hilf (#232, church) — Size: S — status: ref-done (partial; tower/entrance side needs reference)
```
Goal: Make the save-point church Maria Hilf (Johann-Sebastian-Bach-Straße) look like a white modern church:
steep gable front with a big round rose window, flat dark canopy over the door, square white tower with a dark
pyramid roof and cross. Exterior only. The save pad must keep working.
Reference: docs/places/maria-hilf.md; reference/maria-hilf/05-web-parish-front-autumn.jpg (key, low-res),
  06/07-web-parish-*-winter.jpg, 01/02-street-*.png (Street View Jul 2022: tower + side wall from the street),
  03-street-other.png, 04-satellite.png (roof).
Spec (via #0b):
- Street frame "Johann-Sebastian-Bach-Straße", POI "Maria Hilf" (exact; shops.ts SAVE_AT uses it).
- Keep OSM footprint way 127604845 (32.8 × 32.4 m). Walls near-white render (~#e6e6e4; SV shade #b7b8b9).
- Large nave window: dark frame #242627 with pane grid, on the street side (01).
- DO NOT GUESS: the gable/rose-window edge and the tower corner are "needs reference". If they can't be
  confirmed from 04 + 01 + 05 together, ship only the wall tint + the street-side window, and leave
  tower/rose window/canopy as a TODO comment pointing at docs/places/maria-hilf.md.
- Real-world note: closed since Nov 2024 behind a construction fence (roof failure). Don't add a fence unless asked.
Acceptance criteria:
- [ ] From the street, a white church with the dark-framed big window, matching 01.
- [ ] If the tower is placed: white square tower with a dark pyramid cap, at the corner matching 01/05.
- [ ] Save pad "Maria Hilf" still reachable on foot and triggers; pnpm test + typecheck green.
Size: S
```

### B1-5 · PENNY Am Stern (#66, supermarket) — Size: S — status: ref-done (location corrected in batch 3; build inside B3-0)
```
Goal: Make Stein's PENNY readable: a free-standing red canopy "PENNY. Am Stern" on posts, trolleys under it, in
front of a glass shop front at the NE end of the white balcony block's NW facade (way 822461881), facing the
Am Stern car park. Plus the "PENNY." board on the block's Sudetenstraße end wall. Exterior only.
Reference: docs/places/penny-sudetenstrasse.md; reference/da-daniele/02-street-side.png (key: canopy on posts,
  trolleys), reference/penny-sudetenstrasse/05-street-entrance.png (the whole NW facade: Penny NE end,
  da Daniele, Ahorn), 06-street-carpark.png, 01-street-front.png (board on the Sudetenstraße end; Aug 2022),
  04-satellite.png (roofs).
Spec (via #0b, built as part of B3-0):
- POI stays #66 "PENNY" (OSM node 2971507476, Sudetenstr. 43, 4288.8, 4804.3). The dressing goes on way
  822461881, the node's own building. NOT on 293545707 (that is the Rossmann block; batch 2 was wrong and
  penny.de's geo is wrong).
- Canopy: red board (sunlit #e7595e; shade #871b21) "PENNY." white + yellow dot, small "Am Stern", on posts
  in front of the NE end of the NW facade ((4292.8, 4792.7) → (4298.3, 4784.2) area); glass strip behind;
  trolley sprites under it. Door position: needs reference.
- Board "PENNY." on the SW (Sudetenstraße) end wall above the Ahorn corner (01).
- Red pylon at the car-park entrance: see B3-0 (panels PENNY / ROSSMANN / Ahorn Apotheke / Schlüsseldienst GEYER).
Acceptance criteria:
- [ ] From the car park, the red canopy with trolleys at the NE end of the Penny block matches da-daniele/02 + 05.
- [ ] Driving past on Sudetenstraße, the PENNY board and the pylon match 01/02.
- [ ] Car park stays drivable; Post Filiale 571 job (van on Sudetenstraße across the road) unaffected;
      pnpm test + typecheck green.
Size: S
```

### Batch 2: exterior only (decision)
Same rules as batch 1: **exterior only** (Size S/M) via **#0b**; #0c is still required before any interior.
Batch 2 needs three things #0b's batch-1 part list doesn't cover. Add them to #0b (or a follow-up S item) first:
- `facade` override per building (`industrial` / `shop` / `house`): Wilhelm and Polizei get "house" today.
- `canopy(edge, u0, u1, depth, z, posts?)`: thin flat on brackets/posts (Post glass canopy, Aldi porch, Polizei entrance).
- roof override `{pitched, colour}` per building (already in the #0b schema): Aldi (OSM says flat), Polizei (solar panels).
Every prompt below must keep the job/spray/save hooks working (names are matched exactly in code).

### B2-1 · Mühlenbäck, Sudetenstraße 19 (#48, bakery) — Size: S — status: ref-done
```
Goal: The bakery right next to the start: a cream 3-storey block on Sudetenstraße whose ground floor reads
Angel Nails · Mühlenbäck (white sign, red round logo, cream awning) · red-sign shop · red-awning shop. It is the
first thing the player sees, so it should feel like a real Stein street front. Exterior only.
Reference: docs/places/muehlenbaeck-sudetenstrasse.md; reference/muehlenbaeck-sudetenstrasse/01-street-front.png
  (key, shop row; ignore the Maps place card), 02/03-street-*.png (pavement, neighbours), 04-satellite.png
  (red-brown roof). Street View Aug 2022.
Spec (via #0b):
- Street frame "Sudetenstraße", POI "Mühlenbäck" (#48 at 4005.5, 4651.6). OSM footprint way 127604891
  (37.8 × 18.7 m), shop front = SW long edge facing the street.
- Levels override 2 → 3 (photo: ground floor + 2 window rows). Wall tint cream #edeadf; grey fascia band #d4d4d9.
- Wall-sign strips NW → SE: pink "Angel Nails" (#ed779b); white "Mühlenbäck" + red round logo; small red sign
  (no text: name unreadable); then the red awning #e06f6d. Cream awning #fdf8ee as a thin flat over the bakery window.
- Do not invent names for the two SE shops (needs reference). Pavement stays open; no parking bay.
Acceptance criteria:
- [ ] At the start, the shop row matches 01 left to right; the Mühlenbäck sign + awning are readable.
- [ ] Building is visibly 3 storeys; nothing blocks the start, the payphone or the pavement.
- [ ] game.test.ts still finds "Mühlenbäck"; brezn courier job unchanged (pickup is #46, not this one);
      pnpm test + typecheck green.
Size: S
```

### B2-2 · Deutsche Post Filiale 571, Sudetenstraße 34 (#150, post) — Size: S — status: ref-done (partial)
```
Goal: The newsagent that hosts Post Filiale 571, where the player blows up the Post van: a white block with a
continuous glass canopy and a dense sign band (Geretsrieder Merkur, LOTTO Bayern, GerLTZ, SZ/AZ), and a yellow
Post letter box at the kerb. Exterior only.
Reference: docs/places/post-filiale-571.md; reference/post-filiale-571/01-street-front.png (key: sign band,
  door 36/34), 02-street-side.png (yellow letter box + bin, passage), 03-street-other.png (canopy along the
  block), 04-satellite.png. Street View Aug 2022.
Spec (via #0b):
- Street frame "Sudetenstraße", POI "Deutsche Post Filiale 571" (exact; town-jobs.ts uses it). OSM footprint
  way 119921780 (L-shape), shop front on the NE (Sudetenstraße) edge. Keep levels 4 (photos: ≥3, not confirmed).
- Wall tint light grey #afb2b8, pilaster #94928b. Glass canopy (#727a7a, translucent) at ~3 m over the shop row.
- Sign band left → right: navy Merkur #0c3169 · LOTTO yellow #ad8e29 · white GerLTZ strip · SZ green #0f665a
  over AZ red #b5232b.
- Sprite: yellow Deutsche Post letter box + brown bin at the kerb (02). A Post/DHL wall sign is NOT seen:
  ask before adding one.
Acceptance criteria:
- [ ] From the street, canopy + sign band + yellow letter box match 01/02.
- [ ] "post" job: the van still spawns on Sudetenstraße in front of the shop and can be destroyed; the canopy and
      letter box don't block the kerb lane; pnpm test + typecheck green.
Size: S
```

### B2-3 · Automobilwerkstatt Wilhelm, Wallensteinstraße 4 (#103, car_repair) — Size: S — status: ref-done (partial)
```
Goal: The spray shop and Mercedes-G drop-off: a long, low, dark slate-grey workshop hall with a frosted window
strip and a navy "AUTO MOBIL robert wilhelm" sign (orange PW logo, EINGANG arrow), next to an open car park.
It should read as industrial, not as a house. Exterior only.
Reference: docs/places/werkstatt-wilhelm.md; reference/werkstatt-wilhelm/01-street-front.png (key: sign end),
  02-street-side.png (window strip, big "4"), 03-street-other.png (car park), 04-satellite.png (light-brown
  pitched roof). Street View Sep 2023.
Spec (via #0b):
- POI "Automobilwerkstatt Wilhelm" (exact; shops.ts SPRAY_AT + town-jobs.ts use it). OSM footprint way 128266487
  (59.7 × 12.8 m, axis NE–SW). Frame: the NW long edge facing the unnamed service lane / car park
  ("likely" in the doc: confirm against 03/04 before placing; if not confirmable, ship tint + facade only).
- Levels override 2 → 1 (single tall storey). Facade override → industrial. Wall tint #4b4d60.
- Frosted window strip (#5f6b69, white frame) along the long wall at ~2–4 m; navy sign panel #2e3b4d with the
  PW logo near the NE end; large "4" on the glass. Orange of the logo: needs reference (sample unreliable).
- Workshop doors/gates are NOT seen: don't add them.
Acceptance criteria:
- [ ] The hall reads industrial and single-storey; the sign end matches 01.
- [ ] Spray pad still appears on a reachable road point within 40 m and repaints the car.
- [ ] "mercedes" job drop-off still completes by driving (car within 9 m of the POI); pnpm test + typecheck green.
Size: S
```

### B2-4 · Aldi Süd Stein, Sudetenstraße 68 (#225, supermarket) — Size: S — status: ref-done (partial)
```
Goal: The Stein Aldi where the Steinböcke's VW Bus waits: a single-storey white store with a dark grey pitched
roof, a grey clad gable with the ALDI SÜD logo on navy over a covered entrance porch, a car park with blue
disabled bays, and the DHL Packstation. Exterior only.
Reference: docs/places/aldi-sued-stein.md; reference/aldi-sued-stein/01-street-front.png (key: gable, logo,
  porch), 02-street-side.png (long side, blue bays), 03-street-other.png, 04-satellite.png (dark pitched roof,
  cross-gable at the S end). Street View from Bunsenweg, Sep 2023.
Spec (via #0b):
- POI "Aldi Süd" #225 (the one with y > 5000; town-jobs.ts selects it that way). OSM footprint way 1385213575
  (50.8 × 30.6 m, addr Sudetenstraße 68). Frame: "Bunsenweg" (photos) or the car park; keep levels 1.
- Roof override: pitched, dark grey (aerial #474a5c / #7f7a82), replacing the engine's flat #939389
  (OSM roof:shape=flat is wrong). Ask first if the generic pitched roof can't show the S cross-gable.
- Walls white; gable cladding #a6a9a1 with the logo on a navy panel #303d6f; porch = canopy on white posts
  (soffit #918a7b) at the entrance end. Entrance end: likely SE (near the Packstation pins in 04): verify first.
- Ground decals: blue disabled bays where 02 shows them. Packstation sprite optional (location from the DHL
  finder, appearance not photographed: needs reference).
Acceptance criteria:
- [ ] From above: dark pitched roof instead of a flat grey slab; from the car park the gable + logo + porch match 01.
- [ ] "gartenberg-1": the VW Bus still spawns on the car-park service aisle E of the store and is reachable;
      porch posts don't block the aisle; pnpm test + typecheck green.
Size: S
```

### B2-5 · Polizeiinspektion Geretsried, Jeschkenstraße 31 (#187, police) — Size: S — status: ref-done (partial)
```
Goal: The police station the Steinböcke want the stolen taxi delivered to: a white 2-storey building with tall
windows, grey plinth, a big dark solar canopy roof on steel brackets, entrance stairs + ramp under a metal
canopy on the long side, small blue POLIZEI star sign. Exterior only.
Reference: docs/places/polizei-geretsried.md; reference/polizei-geretsried/05-web-dienstgebaeude.jpg (key,
  official photo), 01–03-street-*.png (N gable from Jeschkenstraße, PARKPLATZ/POLIZEI signs; Street View
  Sep 2023), 04-satellite.png (roof fully covered by solar panels).
Spec (via #0b):
- POI "Polizeiinspektion Geretsried" (exact; town-jobs.ts uses it). The game coordinate is correct: it lies inside
  OSM way 127717998 (amenity=police, Jeschkenstraße 31). Do not move it.
- Keep footprint (31.8 × 16.7 m, N–S) and levels 2. Wall tint white #f3f3f0, plinth #606674 (~1 m),
  tall windows. Facade override: not "house" (ask: plain white / civic).
- Roof override: dark solar-panel roof #464c5d with a visible overhang (underside #0e0e12).
- Entrance stairs + canopy on the long side: likely W (doc), verify. POLIZEI sign #203171 on the N gable.
Acceptance criteria:
- [ ] From above: white walls + dark panel roof as in 04; from Jeschkenstraße the N gable matches 01/05.
- [ ] Building stays solid; nothing spawns inside. pnpm test + typecheck green.
- [ ] ⚠ Before this item: check the stein-1 drop-off (see the P2 note). The footprint check found no car
      position within 9 m of the POI; dressing must not make it worse.
Size: S
```

### Batch 3: Am Stern (decision)
Same rules: **exterior only** via **#0b**. Seven places plus PENNY sit around one car park. Build the buildings
**once** (B3-0), then dress each unit (B3-1…B3-7 are dressing specs that B3-0 pulls in; do them in the same PR or
right after). New things #0b must support for this batch:
- **Unit wall-signs on a shared facade**: a list of `{edge, u0, u1, text/texture}` per building, not one sign per building.
- **Corner signs** (one sign wrapping a corner) and **projecting signs** (Ahorn's red "A").
- **Pylon sprite**: a post with stacked panels.
- **Roof-readable signs**: a flat decal on the roof near the store's facade, so the top-down camera can tell the units apart.
- **Footprint split or per-part height**: OSM puts two balcony blocks + a single-storey link in one outline (127872184, 822461881).

### B3-0 · Am Stern block (umbrella: buildings, car park, pylon) — Size: M — status: ref-done (partial)
```
Goal: Stein's shopping hub, built once: three white balcony blocks with terracotta roofs around one car park off
Sudetenstraße, plus EDEKA as a separate flat hall across Breslauer Weg. Each shop unit gets its own sign, the
red pylon stands at the car-park entrance, and from above the player can tell the shops apart. Exterior only.
Reference: docs/places/{denns-biomarkt,takko-am-stern,orterer-am-stern,rossmann-am-stern,penny-sudetenstrasse,
  da-daniele,ahorn-apotheke,edeka-am-stern}.md; reference/penny-sudetenstrasse/05 + 06 (overview),
  reference/denns-biomarkt/04-satellite.png and reference/ahorn-apotheke/04-satellite.png (roofs, link roof).
Spec (via #0b):
- West block, way 127872184 (Sudetenstr. 29a–c): Sudetenstraße frontage = SW edge (4149.3, 4748) →
  (4185.3, 4772.5). Units NW → SE: Denns (B3-2) · Takko (B3-4) · Orterer (B3-5, S corner + open arcade with
  grey pillars, passage to the car park). Photos: ground + 4 balcony storeys (engine 2). The outline also holds
  a north block and a single-storey link with skylights (satellite): split or per-part height, ask first.
  Marienburgweg face = NW edge (4178.8, 4704.7) → (4149.3, 4748), units N → S: GG Radsport (B4-4) · Aphrodite
  (B4-5) · Nexial (B4-6); white wall, dark steel canopy.
- Rossmann block, way 293545707 (Sudetenstr. 33): SW facade on the car park; ground + 2 balcony storeys = 3
  (engine 4), terracotta roof with chimneys (B3-3).
- Penny block, way 822461881 (Sudetenstr. 39–43): NW facade on the car park, units NE → SW: PENNY canopy
  (B1-5) · da Daniele (B3-7) · Schlüsseldienst Geyer (no sign seen on the facade; pylon panel only) · Ahorn
  Apotheke (B3-6, W corner). Ground + 4 balcony storeys (engine 2); the outline also wraps the E block around
  the round plaza: same split question.
- Car park: engine `parking` area x 4197–4287, y 4752–4824, bounded by Sudetenstraße, the Rossmann block, the
  Penny block and the Orterer passage. Entrance from Sudetenstraße at the Ahorn corner (service lane
  (4266.1, 4817.6)). Red/white barrier posts + "2 Std." sign in front of da Daniele. Must stay drivable.
- Pylon: red post at the car-park entrance beside the Ahorn corner (≈ (4268–4272, 4822–4830), place by eye from
  rossmann/03), panels top → bottom: PENNY Am Stern (red) · ROSSMANN (white) · Ahorn Apotheke (green #669c36,
  red A) · Schlüsseldienst GEYER (white). It reads GEYER, not BEYER (OSM node 3450946413, Sudetenstr. 39).
- EDEKA, way 189042651 (Breslauer Weg 113), flat hall NE of Breslauer Weg with its own car park SW and a yellow
  "Heininger & Dietz" pylon (B3-1). Not part of the Am Stern outline: separate building, same PR.
- Roof-readable signs (top-down): one decal per big unit near its facade edge: EDEKA (yellow), PENNY (red),
  ROSSMANN (red), denns (green). Small units (Takko, Orterer, da Daniele, Ahorn) rely on wall signs + HUD.
- Map labels: overlay.ts draws IMPORTANT labels in POI order and later ones yield. Rossmann (#65), PENNY (#66),
  Ahorn (#67), Denns (#82), EDEKA (#204) crowd within ≈ 250 m. Do not change label logic in this item; note it.
- Post Filiale 571 (#150, 4238.7, 4832.4) is across Sudetenstraße; its van spawns on the Sudetenstraße kerb.
  Nothing from this item may sit on Sudetenstraße's carriageway.
Acceptance criteria:
- [ ] Driving into the car park from Sudetenstraße: pylon at the Ahorn corner, Penny canopy far left, Rossmann
      ahead across the car park, as in penny/06 and rossmann/03.
- [ ] Along Sudetenstraße NW of the car park: denns · TAKKO · Orterer corner in that order, as in denns/01, takko/02.
- [ ] From the top-down camera, EDEKA / PENNY / ROSSMANN / denns can be told apart by roof signs.
- [ ] Car park drivable, pickups on it still reachable; Post van job and the #195 Orterer job unaffected;
      pnpm test + typecheck green.
Size: M
```

### B3-1 · EDEKA Heininger & Dietz, Breslauer Weg 113 (#204, supermarket) — Size: S — status: ref-done
```
Goal: A big flat EDEKA hall: yellow band with the blue EDEKA logo and "Heininger & Dietz" over a glazed front,
dark blue-grey upper band with round porthole windows, white roof edge, blue "Fleischwaren" board, yellow pylon.
Reference: docs/places/edeka-am-stern.md; reference/edeka-am-stern/01-street-front.png (key), 02/03 (front,
  pylon, car park), 04-satellite.png (flat light-grey roof). Street View Sep 2023.
Spec (via #0b, inside B3-0):
- POI #204 "EDEKA" at 4429.1, 4804.1 (there are 3 "EDEKA" POIs; match by id/position). Footprint 189042651
  (56 × 33 m, flat, levels 1, roof #dcdcde: keep). Height bump only if #0b has one: ask first.
- Shop facade = SW long edge, S (4434.4, 4836.2) → W (4398.4, 4793.3): glass strip, canopy band, yellow sign band
  (exact yellow: needs reference/brand; sunlit is clipped), blue logo #448ffd near the W corner, upper band
  #48595c with round windows, white roof edge #cacfd2. Entrance: glazed, at the W corner (Breslauer Weg end).
  "Fleischwaren" board #4060c8 + hours board at that corner. NW side (Breslauer Weg): glass, no sign.
- Yellow pylon "Heininger & Dietz" at the car-park edge (exact spot: needs reference). Roof decal "EDEKA".
- Not seen / needs reference: bakery Backhupferl sign, "Hahn im Korb", the yellow cabinet in 03.
Acceptance criteria:
- [ ] From the SW car park the front matches 01/03; from above the roof decal reads EDEKA.
- [ ] Car park (x 4362–4436, y 4797–4873) stays drivable. pnpm test + typecheck green.
Size: S
```

### B3-2 · denns BioMarkt, Sudetenstraße 29 C (#82, supermarket) — Size: S — status: ref-done (partial)
```
Goal: Green "denns BioMarkt" letters on a white band over a glazed front, NW unit of the west block.
Reference: docs/places/denns-biomarkt.md; reference/denns-biomarkt/01-street-front.png (key), 02 (height,
  NW canopy), 04-satellite.png.
Spec (via #0b, inside B3-0):
- POI #82 at 4208, 4747.7 (node sits ≈ 27 m behind the sign, in the north block: store may run deep; leave it).
- Way 127872184, SW edge, NW third: band #d9dedf, letters #8bd448; glass strip under; thin grey striped canopy
  at the NW end. Roof decal "denns" (green). Door position: needs reference.
Acceptance criteria:
- [ ] From Sudetenstraße, denns sits NW of TAKKO as in 01. pnpm test + typecheck green.
Size: S
```

### B3-3 · Rossmann, Sudetenstraße 33 (#65, drugstore) — Size: S — status: ref-done
```
Goal: Red ROSSMANN letters on the white ground floor of the 3-storey balcony block with the terracotta roof.
Reference: docs/places/rossmann-am-stern.md; reference/rossmann-am-stern/01-street-front.png (key), 02, 03 (pylon).
Spec (via #0b, inside B3-0):
- POI #65 at 4251.4, 4773.7 (another "Rossmann" #36 exists). Way 293545707, SW (car-park) facade, sign centred
  near (4247.7, 4775.3): letters #d6666b on wall #cedae2; glass strip under.
- Levels 4 → 3 (photos: ground + 2 balcony storeys): ask first. Roof decal "ROSSMANN" (red). Door: needs reference.
Acceptance criteria:
- [ ] Across the car park the block matches 01/02. pnpm test + typecheck green.
Size: S
```

### B3-4 · Takko Fashion, Sudetenstraße 29b (#81, shop) — Size: S — status: ref-done
```
Goal: The yellow-orange TAKKO panel on the middle unit of the west block's Sudetenstraße front.
Reference: docs/places/takko-am-stern.md; reference/takko-am-stern/01-street-front.png (key), 02.
Spec (via #0b, inside B3-0):
- POI #81 at 4195.3, 4751.3. Way 127872184, SW edge, middle unit: panel #e9cb76 with dark "TAKKO" lettering
  (exact lettering colour: needs reference); glass strip under. No map label (kind shop): HUD only.
Acceptance criteria:
- [ ] Order denns · TAKKO · Orterer along Sudetenstraße as in takko/02. pnpm test + typecheck green.
Size: S
```

### B3-5 · Orterer Getränkemarkt, Sudetenstraße 29a (#80, shop) — Size: S — status: ref-done (partial)
```
Goal: The drinks market at the west block's S corner: round red Orterer logo on the corner pier, an open arcade
with grey pillars and stacked crates, and the passage through to the car park.
Reference: docs/places/orterer-am-stern.md; reference/orterer-am-stern/01-street-front.png (key), 03 (arcade).
Spec (via #0b, inside B3-0):
- POI #80 at 4184.1, 4765.8. NOT #195 (2306.5, 2063.1), which town-jobs.ts targets (`p.y < 3000`): never move
  #80 north of y 3000 and never rename it.
- Way 127872184, S corner (4185.3, 4772.5): logo red #d65c68 on the pier; arcade = walkable ground floor with
  solid pillar posts; crate sprites. Keep the passage along the SE edge open. Synthetic building -156 (49 m²
  in the passage): what it is needs reference; don't dress it. Poster text: needs reference.
Acceptance criteria:
- [ ] Corner matches 01/03; player can walk through the passage. Orterer job (#195) unchanged; tests green.
Size: S
```

### B3-6 · Ahorn Apotheke, Sudetenstraße 41 (#67, pharmacy) — Size: S — status: ref-done
```
Goal: The glass corner pharmacy at the car-park entrance: light-green "Ahorn Apotheke" lettering, a red
pharmacy "A" sticking out at the corner.
Reference: docs/places/ahorn-apotheke.md; reference/ahorn-apotheke/01-street-front.png (key), 02, 03.
Spec (via #0b, inside B3-0):
- POI #67 at 4276.7, 4823.1. Way 822461881, W corner (4270.7, 4827.3): glass on both faces; green lettering
  (#609c2b / #669c36) on the NW facade and the Sudetenstraße end face; projecting red "A" sign at the corner.
Acceptance criteria:
- [ ] From Sudetenstraße the corner + pylon match 01. Post van job unaffected; tests green.
Size: S
```

### B3-7 · Bar Café da Daniele, Sudetenstraße 39 (#77, food) — Size: S — status: ref-done
```
Goal: A crimson "Bar Café da Daniele" fascia with the cup logo, a grey script sign above, parking bays with
red/white posts right in front.
Reference: docs/places/da-daniele.md; reference/da-daniele/01-street-front.png (key), 02.
Spec (via #0b, inside B3-0):
- POI #77 at 4280.4, 4816.7. Way 822461881, NW facade between the Penny canopy and Ahorn: fascia #8d384f,
  white text; grey script sign above. Barrier-post sprites along the bays.
- Terrace: not seen (website mentions an outdoor area): needs reference, add no tables.
Acceptance criteria:
- [ ] From the car park the unit matches 01. Bays stay drivable. pnpm test + typecheck green.
Size: S
```


### Batch 4: Am Stern small shops (decision)
Same rules: **exterior only** via **#0b** (unit wall-signs on a shared facade). Eight shops have photos and get a
dressing spec; three have none and stay **needs reference** with no look spec. Shops in the west complex
(127872184) are dressed **inside B3-0**; the others sit on their own buildings along Sudetenstraße, SW side
(Krömer, Sun Style + TEDi, B&L) or NE side (Woolworth), and can go in one PR "Sudetenstraße shop row, Stein".
Flamingo and Fellomenal are in the Post block 119921780 (B2-2). Backhupferl is a counter inside EDEKA (B3-1).

### B4-1 · TEDi, Sudetenstraße 26 (#15, shop) — Size: S — status: ref-done
```
Goal: Discount store under a grey canopy: two blue TEDi boxes over the door, goods racks on the pavement.
Reference: docs/places/tedi-am-stern.md; reference/tedi-am-stern/01-street-front.png (key), 02, 04.
Spec (via #0b):
- Street frame "Sudetenstraße", POI "TEDi" (#15 at 4151.2, 4783.6). Way 120402837 (shared with Sun Style B4-7),
  NE frontage (bearing 303°), SE part. Wall peach #afa187; grey canopy #575f62 along the frontage.
- Two blue sign boxes #2955a1 with white "TEDi" over the entrance; goods-rack props in front.
- Photos: ≥4 storeys (engine 2): keep levels unless #0b changes heights. Orange lower wall: needs reference.
Acceptance criteria:
- [ ] From Sudetenstraße the front matches 01 (canopy, two blue boxes, racks). Pavement stays walkable.
- [ ] pnpm test + typecheck green.
Size: S
```

### B4-2 · Woolworth, Sudetenstraße 27 (#166, shop) — Size: S — status: ref-done
```
Goal: Low white store at the Marienburgweg corner with big red WOOLWORTH letters over a glass front.
Reference: docs/places/woolworth-am-stern.md; reference/woolworth-am-stern/01-street-front.png (key), 02, 04.
Spec (via #0b):
- POI "Woolworth" (#166 at 4138.3, 4716.7). Way 1385222318 (levels 1, flat, keep). Sign on the SW edge
  (4096.1, 4695.4) → (4140.3, 4723.9), E end: white band #fdfdfe, red letters #fe635f (sunlit; exact brand red
  needs reference). Glass strip under it. Car park in front stays drivable.
Acceptance criteria:
- [ ] From the car park the band + letters match 01. pnpm test + typecheck green.
Size: S
```

### B4-3 · B&L Hairstyling, Sudetenstraße 28 (#134, shop) — Size: S — status: ref-done
```
Goal: Hair salon opposite the Am Stern car park: black board with white "B&L HAIRSTYLING", logo panels in the
windows, next to an insurance broker with blue "GE" window graphics.
Reference: docs/places/bl-hairstyling.md; reference/bl-hairstyling/01-street-front.png (key), 03, 04 (02 = context).
Spec (via #0b):
- Street frame "Sudetenstraße", POI "B&L Hairstyling" (#134 at 4196.7, 4804.3). Way 119921782, NE edge
  (4182, 4792.3) → (4228.1, 4822.2). Board #212529, white text; cream wall #9e937f, white window frames.
- Optional neighbour sign "Versicherungsmakler Dimitrios Georgiadis". White vs cream wall parts inside one
  outline: ask first. Photos: 4 storeys (engine 3).
Acceptance criteria:
- [ ] From the street the board + window panels match 01. pnpm test + typecheck green.
Size: S
```

### B4-4 · GG Radsport, Marienburgweg 25 (#116, shop) — Size: S — status: ref-done
```
Goal: Bike shop on the Marienburgweg side of the west complex: red fascia "GG Radsport", bikes on a rack,
green A-board, steps to the door.
Reference: docs/places/gg-radsport.md; reference/gg-radsport/01-street-front.png (key), 02, 03.
Spec (via #0b, inside B3-0):
- Street frame "Marienburgweg", POI "GG-Radsport" (#116 at 4174.6, 4715.9). Way 127872184, NW edge
  (4178.8, 4704.7) → (4149.3, 4748), u ≈ 12 m. Red fascia #8c2027 + white italic text; red window panel;
  dark canopy (shared with B4-5/B4-6). Props: bike rack + bikes, green A-board, blue wall box.
Acceptance criteria:
- [ ] From Marienburgweg the unit matches 01. Pavement stays walkable. pnpm test + typecheck green.
Size: S
```

### B4-5 · Aphrodite Aesthetic, Marienburgweg 25 (#157, shop) — Size: S — status: ref-done
```
Goal: Beauty studio with a dark fascia and gold script, full-height dark glazing, white wall, steps and hedge.
Reference: docs/places/aphrodite-aestetic.md; reference/aphrodite-aestetic/01-street-front.png (key), 02, 03.
Spec (via #0b, inside B3-0):
- POI "Aphrodite-aestetic" (exact; sign says "Aphrodite Aesthetic") at 4170, 4726.8. NW edge of 127872184,
  u ≈ 23 m. Fascia #191f27, gold text (hex needs reference); dark frames #1e2531; dark louvred canopy.
Acceptance criteria:
- [ ] From Marienburgweg the unit matches 01. pnpm test + typecheck green.
Size: S
```

### B4-6 · Nexial IT-Services (#114, shop) — Size: S — status: ref-done
```
Goal: IT service office at the Sudetenstraße end of the Marienburgweg face: white "nexial IT-SERVICES" panel
high on the wall, dark insurance-agency fascia below, parking in front.
Reference: docs/places/nexial.md; reference/nexial/01-street-front.png (key), 02.
Spec (via #0b, inside B3-0):
- POI "Nexial" at 4159, 4743.5. NW edge of 127872184, u ≈ 43 m (near the W corner): verify the face.
  Upper panel #b0bdcd with dark/teal text; lower fascia #5b7088 "Württembergische Versicherungsagentur
  Stricker & Reinhart". OSM says shop=hairdresser: wrong, do not add hairdresser props.
Acceptance criteria:
- [ ] Both signs readable as in 01. pnpm test + typecheck green.
Size: S
```

### B4-7 · Sun Style Bodystyling Studio, Sudetenstraße 24 (#169, shop) — Size: S — status: ref-done
```
Goal: Tanning studio with a black-and-gold "Sun Style" fascia on a glass canopy, white building with brown bay
windows, insurance broker Kafka next door.
Reference: docs/places/sun-style.md; reference/sun-style/01-street-front.png (key, Sep 2023), 02, 04.
Spec (via #0b):
- POI "Sun Style Bodystyling Studio" (#169 at 4125.7, 4764.7). Way 120402837 (shared with TEDi B4-1), NW end
  of the NE frontage. Fascia #363540, gold text + sun logo (gold needs reference); white wall, bay cladding
  #4b3f4a; glass canopy. Optional Kafka sign "Versicherungen · Finanzierungen · Kredite".
- Unit order vs Kafka needs verification (OSM node order and photo disagree). White/peach parts in one outline:
  per-part colour, ask first. Do not model the election poster in 01.
Acceptance criteria:
- [ ] From Sudetenstraße the fascia + canopy match 01. pnpm test + typecheck green.
Size: S
```

### B4-8 · Spielwaren Krömer, Sudetenstraße 20 (#170, shop) — Size: S — status: ref-done
```
Goal: Toy shop in a white block with blue stripes and yellow window lintels; white "Spielwaren Krömer" sign on a
glass canopy with blue struts, toys outside.
Reference: docs/places/spielwaren-kroemer.md; reference/spielwaren-kroemer/01-street-front.png (key, Sep 2023), 02, 04.
Spec (via #0b):
- Street frame "Sudetenstraße", POI "Spielwaren Krömer" (#170 at 4094.6, 4741.4). Way 120402849, NE edge
  (4117.4, 4755) → (4066.7, 4720.5), u ≈ 26 m. Wall #cdd1d4, stripes ≈ #59779d, lintels ≈ #b5a955 (new facade
  texture: ask first). White sign panel, blue text (hex needs reference). Goods props outside.
Acceptance criteria:
- [ ] From Sudetenstraße the front matches 01. pnpm test + typecheck green.
Size: S
```

### B4-9 · Bäckerei Backhupferl (#5, bakery) — Size: S — status: todo (needs reference)
```
In-store bakery counter inside EDEKA Heininger & Dietz, Breslauer Weg 113 (way 189042651). No photo; batch 3
EDEKA photos show no outside sign. Nothing to build until a photo shows one. See docs/places/backhupferl-sudetenstrasse.md.
```

### B4-10 · Flamingo Damenmode, Altvaterstraße 61 (#152, shop) — Size: S — status: todo (needs reference)
```
Clothes shop on the SE arm of the Post block 119921780 (B2-2), near the round plaza; Google satellite pin
confirms the spot (post-filiale-571/04). No photo of the front: no look spec. See docs/places/flamingo-damenmode.md.
```

### B4-11 · Fellomenal Hundesalon, Altvaterstraße 61 (#158, shop) — Size: S — status: todo (needs reference, probably moved)
```
Dog groomer listed in OSM at the Post block (start_date 2024-09-16). Same business (same phone/e-mail) now
lists Bahnhofstraße 27, Oberhaching-Deisenhofen. No photo. Ask whether to keep the POI before any work.
See docs/places/fellomenal-hundesalon.md.
```


## Priority list (all 234 POIs)

Order: P1 batch → gameplay places → landmarks/anchors → services → food → generic shops. Within a tier, nearest to the start (Sudetenstraße 19) first. Duplicate names are separate OSM objects; `#` = row id in `pois.csv`.

### P1 — Batch 1 (scouted; prompts above: B1-1…B1-5) ⭐ · batch 2 = the ref-done rows in P2 (prompts B2-1…B2-5) · batch 3 = Am Stern (B3-0…B3-7), rows in P3–P6 · batch 4 = Am Stern small shops (B4-1…B4-11)
| # | Name | Kind | x, y (m) | lat, lon | m from start | Status | Note |
|---|---|---|---|---|---|---|---|
| 232 | Maria Hilf | church | 3831.3, 4907.8 | 47.855863, 11.481366 | 309 | ref-done (partial) | save point (Jesus Saves); Johann-Sebastian-Bach-Straße |
| 174 | Rathaus Geretsried | civic | 2605.1, 2845.4 | 47.874411, 11.464927 | 2278 | implemented | job hub: payphone + Mercedes G / Taxi jobs; Karl-Lederer-Platz 1 |
| 168 | Rehmaus Apotheke | pharmacy | 4018.9, 4693.8 | 47.857788, 11.483882 | 50 | implemented | courier job destination (Brezn); Sudetenstraße 14 |
| 66 | PENNY | supermarket | 4288.8, 4804.3 | 47.856794, 11.4875 | 330 | ref-done | Stein's main discounter; entrance = free-standing red canopy at the NE end of way 822461881's NW facade, facing the car park (corrected in batch 3; built in B3-0) |
| 20 | Sparkasse | bank | 3550.6, 4719.7 | 47.857555, 11.477603 | 453 | implemented | Stein branch, Händelstraße (no addr in OSM; Nominatim) |

### P2 — gameplay places (jobs, save, spray, police, start)
| # | Name | Kind | x, y (m) | lat, lon | m from start | Status | Note |
|---|---|---|---|---|---|---|---|
| 48 | Mühlenbäck | bakery | 4005.5, 4651.6 | 47.858167, 11.483702 | 8 | ref-done | B2-1. Start: Sudetenstraße 19. NOT the courier pickup (that is #46) |
| 150 | Deutsche Post Filiale 571 | post | 4238.7, 4832.4 | 47.856541, 11.486828 | 303 | ref-done (partial) | B2-2. Job "post": van spawns on Sudetenstraße in front. Post sign needs reference |
| 103 | Automobilwerkstatt Wilhelm | car_repair | 4706.9, 4824.3 | 47.856614, 11.493106 | 731 | ref-done (partial) | B2-3. Spray shop (pad on the nearest driveway ≤40 m, likely the NW lane) + "mercedes" drop-off |
| 225 | Aldi Süd | supermarket | 4707.8, 5200 | 47.853235, 11.493118 | 899 | ref-done (partial) | B2-4. Sudetenstraße 68. "gartenberg-1" VW Bus spawns on the car-park aisle E of the store. OSM roof:shape=flat is wrong (pitched) |
| 181 | Gasthof Geiger | food | 2844.9, 4388 | 47.860538, 11.468142 | 1182 | todo | gang job drop |
| 187 | Polizeiinspektion Geretsried | police | 4772.3, 5626.6 | 47.849399, 11.493982 | 1248 | ref-done (partial) | B2-5. Jeschkenstraße 31; POI correct. ⚠ "stein-1" taxi drop-off likely unreachable (no car pose within 9 m): verify in game |
| 231 | Petruskirche | church | 2883.8, 2925.2 | 47.873693, 11.468663 | 2052 | todo | second save point |
| 46 | Bäckerei Mühlenbäck | bakery | 2849.3, 2775.7 | 47.875038, 11.468201 | 2196 | todo | courier job pickup |
| 219 | Metzgerei Länger | shop | 2659, 2499.5 | 47.877521, 11.465649 | 2531 | todo | gang job pickup |
| 195 | Orterer Getränkemarkt | shop | 2306.5, 2063.1 | 47.881446, 11.460923 | 3089 | todo | gang job pickup |
| 180 | Kaufland | supermarket | 2244.3, 1880.5 | 47.883088, 11.460089 | 3276 | todo | gang job (BMW) |
| 220 | Huber GmbH, Karosserie-Lack-Center | car_repair | 2353.1, 1757.6 | 47.884194, 11.461548 | 3326 | todo | spray shop |
| 89 | Auto Stapf | car_repair | 234.3, 1574.7 | 47.885838, 11.433141 | 4859 | todo | spray shop |
| 211 | Biometzgerei Pichler Großhandel | shop | 240.9, 1498.7 | 47.886522, 11.43323 | 4902 | todo | gang job drop |

### P3 — landmarks & big anchors (nearest to start first)
| # | Name | Kind | x, y (m) | lat, lon | m from start | Status | Note |
|---|---|---|---|---|---|---|---|
| 13 | VR-Bank | bank | 3957.8, 4620.3 | 47.858449, 11.483062 | 49 | todo |  |
| 82 | Denns BioMarkt | supermarket | 4208, 4747.7 | 47.857303, 11.486417 | 233 | ref-done (partial) | B3-2; NW unit of the west block; node vs sign ≈ 27 m apart, door needs reference |
| 228 | Karl-Lederer-Grundschule Geretsried | school | 3800.4, 4825.3 | 47.856605, 11.480952 | 265 | todo |  |
| 186 | Karl-Lederer-Hauptschule Geretsried | school | 3740.9, 4830.9 | 47.856555, 11.480154 | 315 | todo |  |
| 204 | EDEKA | supermarket | 4429.1, 4804.1 | 47.856796, 11.489381 | 459 | ref-done | B3-1; EDEKA Heininger & Dietz, Breslauer Weg 113; flat hall, yellow band, porthole upper wall |
| 234 | Aussegnungshalle | church | 3894.5, 4149.6 | 47.862682, 11.482214 | 509 | todo |  |
| 189 | Franz-Marc-Schule | school | 3315.3, 4811.1 | 47.856733, 11.474448 | 702 | todo |  |
| 233 | Christuskirche | church | 4193.1, 5389.8 | 47.851528, 11.486217 | 767 | todo |  |
| 10 | Netto Marken-Discount | supermarket | 4504.9, 5450.7 | 47.850981, 11.490397 | 949 | todo |  |
| 215 | Esso | fuel | 4842.4, 5157.2 | 47.85362, 11.494922 | 986 | todo |  |
| 175 | Mittelschule Geretsried | school | 3217.6, 3632.8 | 47.867329, 11.473139 | 1280 | todo |  |
| 37 | Stadtbibliothek Geretsried | civic | 3307.8, 3530.8 | 47.868247, 11.474348 | 1313 | todo |  |
| 38 | Staatliche Realschule Geretsried | school | 3166, 3529 | 47.868263, 11.472447 | 1394 | todo |  |
| 151 | Deutsche Post Filiale 569 | post | 3366.3, 5914.5 | 47.84681, 11.475132 | 1415 | todo |  |
| 39 | Gymnasium Geretsried | school | 3137.2, 3508.2 | 47.86845, 11.472061 | 1428 | todo |  |
| 176 | Schulzentrum Geretsried | school | 3142.1, 3478.9 | 47.868714, 11.472126 | 1449 | todo |  |
| 6 | Lidl | supermarket | 5065.7, 5668 | 47.849026, 11.497916 | 1477 | todo |  |
| 190 | Raiffeisenbank Isar-Loisachtal eG | bank | 3047.9, 3096.1 | 47.872156, 11.470863 | 1820 | todo |  |
| 40 | HypoVereinsbank | bank | 2843.9, 2791.1 | 47.874899, 11.468128 | 2186 | todo |  |
| 119 | Damaskus Markt | supermarket | 2793.9, 2783.6 | 47.874966, 11.467458 | 2219 | todo |  |
| 132 | Der Bauernladen | supermarket | 2869.8, 2727.1 | 47.875475, 11.468476 | 2228 | todo |  |
| 149 | Deutsche Post Filiale 470 | post | 2727.4, 2813.3 | 47.874699, 11.466566 | 2232 | todo |  |
| 100 | EDEKA | supermarket | 2694, 2835.7 | 47.874498, 11.466119 | 2233 | todo |  |
| 162 | Hermes Paketshop Schwägerl | post | 3002.4, 2633.6 | 47.876315, 11.470253 | 2247 | todo |  |
| 4 | Freie Tankstelle | fuel | 3005.9, 2626.7 | 47.876378, 11.4703 | 2252 | todo |  |
| 34 | Sparkasse | bank | 2748.9, 2748.5 | 47.875282, 11.466855 | 2273 | todo |  |
| 129 | Aldi Süd | supermarket | 2745, 2707.3 | 47.875653, 11.466802 | 2310 | todo |  |
| 163 | Hermes Paketshop Elegante | post | 2708.8, 2679.1 | 47.875906, 11.466317 | 2353 | todo |  |
| 230 | Hl. Familie | church | 3216.6, 2371.9 | 47.878669, 11.473125 | 2406 | todo |  |
| 93 | Die Dampfoase | supermarket | 2637.7, 2644.1 | 47.876221, 11.465364 | 2422 | todo |  |
| 92 | VR Bank München Land eG | bank | 2594.1, 2598.2 | 47.876634, 11.464779 | 2484 | todo |  |
| 133 | Mix Land Markt | supermarket | 2579.2, 2580.8 | 47.87679, 11.464579 | 2507 | todo |  |
| 183 | Penny | supermarket | 2991.7, 2182 | 47.880377, 11.47011 | 2663 | todo |  |
| 212 | Isardammschule | school | 3274.9, 1935.5 | 47.882594, 11.473907 | 2807 | todo |  |
| 216 | Aral | fuel | 2303.5, 2170 | 47.880485, 11.460883 | 3002 | todo |  |
| 196 | Rewe To Go | supermarket | 2319.7, 2155.4 | 47.880616, 11.4611 | 3005 | todo |  |
| 30 | Tyczka GmbH | fuel | 2162.1, 1803.6 | 47.88378, 11.458987 | 3385 | todo |  |
| 223 | Freie Waldorfschule Isartal | school | 2496.3, 1360.6 | 47.887764, 11.463468 | 3614 | todo |  |
| 229 | St. Leonhard | church | 5531.1, 1339.5 | 47.887954, 11.504156 | 3646 | todo |  |
| 221 | EDEKA | supermarket | 5538.2, 1079.8 | 47.890289, 11.504251 | 3886 | todo |  |
| 53 | Edeka | supermarket | 983.7, 112.4 | 47.898989, 11.443189 | 5446 | todo |  |

### P4 — everyday services (nearest to start first)
| # | Name | Kind | x, y (m) | lat, lon | m from start | Status | Note |
|---|---|---|---|---|---|---|---|
| 65 | Rossmann | drugstore | 4251.4, 4773.7 | 47.857069, 11.486999 | 283 | ref-done | B3-3; Rossmann block 293545707, 3 storeys (engine 4) |
| 67 | Ahorn Apotheke | pharmacy | 4276.7, 4823.1 | 47.856625, 11.487338 | 329 | ref-done | B3-6; W corner of the Penny block, red A, pylon |
| 18 | Isar-Apotheke | pharmacy | 3683.2, 4864 | 47.856257, 11.479381 | 382 | todo |  |
| 121 | Dr. Schmucker | doctor | 3685.7, 4874.6 | 47.856162, 11.479414 | 386 | todo |  |
| 5 | Bäckerei Backhupferl | bakery | 4408.8, 4798.6 | 47.856845, 11.489109 | 438 | todo | needs reference: counter inside EDEKA, no photo (B4-9) |
| 98 | Arztpraxis Lewke | doctor | 3695.3, 4056.5 | 47.863519, 11.479543 | 664 | todo |  |
| 106 | Bäckerei Manfred Burger | bakery | 4384.4, 5254.9 | 47.852742, 11.488782 | 720 | todo |  |
| 23 | Bäckerei Lidl | bakery | 3376, 5874.7 | 47.847168, 11.475262 | 1375 | todo |  |
| 60 | Bäckerei Konditorei Lidl GmbH | bakery | 3152.3, 3303.7 | 47.870289, 11.472263 | 1588 | todo |  |
| 71 | Orthopädie Isar-Loisachtal | doctor | 3144.7, 3265.3 | 47.870634, 11.472161 | 1625 | todo |  |
| 64 | Hausarztpraxis Dr. Lenz | doctor | 3393.2, 2795.2 | 47.874862, 11.475493 | 1949 | todo |  |
| 51 | Dr. Heiner Müller | doctor | 2704.1, 2853.5 | 47.874338, 11.466254 | 2212 | todo |  |
| 140 | Bauer Gyn | doctor | 2706.8, 2846.3 | 47.874403, 11.46629 | 2216 | todo |  |
| 101 | Back & Snack | bakery | 2710.8, 2828.8 | 47.87456, 11.466344 | 2228 | todo |  |
| 94 | Paracelsus Apotheke | pharmacy | 2805.3, 2758.2 | 47.875195, 11.467611 | 2235 | todo |  |
| 45 | Hofpfisterei | bakery | 2727.6, 2803.1 | 47.874791, 11.466569 | 2240 | todo |  |
| 36 | Rossmann | drugstore | 2757.2, 2716.4 | 47.875571, 11.466966 | 2296 | todo |  |
| 90 | Iris Apotheke | pharmacy | 2679.9, 2650.4 | 47.876164, 11.46593 | 2393 | todo |  |
| 29 | Dr. Bundscherer Kinderarzt | doctor | 2657.3, 2630.9 | 47.87634, 11.465627 | 2422 | todo |  |
| 91 | Praxis Dr. Sippel | doctor | 2619.7, 2632 | 47.87633, 11.465122 | 2442 | todo |  |
| 52 | Schmid-Bäck' | bakery | 2631.9, 2308.2 | 47.879242, 11.465286 | 2709 | todo |  |
| 96 | Dr. Brechtelsbauer | doctor | 2622.3, 1810.4 | 47.883719, 11.465157 | 3153 | todo |  |
| 35 | Ihle | bakery | 2223.1, 1847.1 | 47.883389, 11.459805 | 3316 | todo |  |
| 42 | Isartaler Backwerk | bakery | 994.1, 116.5 | 47.898952, 11.443328 | 5437 | todo |  |
| 31 | Sonnenapotheke | pharmacy | 775.3, 155.3 | 47.898603, 11.440394 | 5529 | todo |  |
| 32 | Dr.Stotzingen | doctor | 793.8, 136.1 | 47.898776, 11.440643 | 5534 | todo |  |

### P5 — food & drink (nearest to start first)
| # | Name | Kind | x, y (m) | lat, lon | m from start | Status | Note |
|---|---|---|---|---|---|---|---|
| 12 | HoangAnh | food | 3992.7, 4644.1 | 47.858235, 11.48353 | 6 | todo |  |
| 47 | Dolce Gelato | food | 3980.5, 4636.4 | 47.858304, 11.483367 | 21 | todo |  |
| 120 | Bistro Malor | food | 3929.9, 4632.5 | 47.858339, 11.482688 | 70 | todo |  |
| 177 | Gaststätte Isarwinkel | food | 3890.5, 4793.3 | 47.856893, 11.48216 | 181 | todo |  |
| 77 | da Daniele | food | 4280.4, 4816.7 | 47.856682, 11.487388 | 329 | ref-done | B3-7; crimson fascia; terrace not seen (needs reference) |
| 58 | Restaurant Ammos | food | 3655.2, 4645.4 | 47.858223, 11.479005 | 343 | todo |  |
| 57 | Munzur Kebap | food | 3607.4, 4689.2 | 47.857829, 11.478365 | 393 | todo |  |
| 19 | Italy | food | 3545.7, 4770.4 | 47.857099, 11.477537 | 468 | todo |  |
| 79 | Piatsa | food | 4646.3, 4763.3 | 47.857163, 11.492293 | 659 | todo |  |
| 128 | Fitness Forum & Squash | food | 4677.2, 4528.4 | 47.859275, 11.492707 | 690 | todo |  |
| 22 | Pho Viet Restaurant | food | 3358, 5828.9 | 47.847579, 11.475021 | 1343 | todo |  |
| 213 | Cafeteria | food | 5192.3, 5297.5 | 47.852358, 11.499613 | 1360 | todo |  |
| 135 | Sempol Imbiss | food | 5005.2, 5567.9 | 47.849927, 11.497105 | 1364 | todo |  |
| 83 | Primo Pizza | food | 3357.6, 5888 | 47.847048, 11.475016 | 1396 | todo |  |
| 179 | Sportheim | food | 3420.8, 3350.4 | 47.869869, 11.475863 | 1420 | todo |  |
| 33 | Cafe L´Arena | food | 3135.5, 3280.3 | 47.8705, 11.472038 | 1617 | todo |  |
| 167 | Pizza Roma | food | 3132.4, 3254.1 | 47.870735, 11.471996 | 1641 | todo |  |
| 43 | Schmid-Bäck' | food | 2802, 2788.8 | 47.87492, 11.467567 | 2211 | todo |  |
| 164 | Aram Döner | food | 2730.6, 2805.9 | 47.874766, 11.466609 | 2236 | todo |  |
| 109 | Zum Alten Öl | food | 3000.4, 2637.9 | 47.876277, 11.470227 | 2244 | todo |  |
| 118 | Amormio Gelati Caffè | food | 2675.9, 2835 | 47.874504, 11.465876 | 2244 | todo |  |
| 165 | Shinwari | food | 2778.4, 2734.2 | 47.875411, 11.46725 | 2269 | todo |  |
| 62 | Karl 13 | food | 2703.3, 2764 | 47.875143, 11.466243 | 2286 | todo |  |
| 75 | Subway | food | 2677, 2772.1 | 47.87507, 11.465891 | 2294 | todo |  |
| 205 | Ratsstuben | food | 2557.1, 2845 | 47.874414, 11.464283 | 2308 | todo |  |
| 192 | Ratsstuben | food | 2569.6, 2827 | 47.874576, 11.464451 | 2314 | todo |  |
| 147 | Rialto Eiscafe Und Pizzeria | food | 2652.2, 2664.5 | 47.876038, 11.465558 | 2397 | todo |  |
| 72 | Il Soprano | food | 2649.6, 2627.8 | 47.876368, 11.465523 | 2429 | todo |  |
| 200 | Der neue Döner-Laden | food | 2524.4, 2497.2 | 47.877542, 11.463845 | 2607 | todo |  |
| 123 | Dönerworks | food | 2208.8, 1858 | 47.883291, 11.459613 | 3314 | todo |  |
| 124 | An Niehn Asian Streetfood | food | 2202.4, 1863 | 47.883246, 11.459528 | 3314 | todo |  |
| 1 | Landgasthof Lacherdinger | food | 5471.5, 1367.8 | 47.887699, 11.503357 | 3596 | todo |  |
| 55 | Landgasthof Lacherdinger | food | 5446.5, 1356.1 | 47.887804, 11.503021 | 3596 | todo |  |
| 3 | Gasthaus "Holzwirt" | food | 4446.3, 756.3 | 47.893198, 11.489612 | 3917 | todo |  |
| 191 | Zur Post | food | 989, 54.5 | 47.89951, 11.44326 | 5491 | todo |  |

### P6 — generic shops & car repair (nearest to start first)
| # | Name | Kind | x, y (m) | lat, lon | m from start | Status | Note |
|---|---|---|---|---|---|---|---|
| 154 | Angel Nails | shop | 4000.2, 4648.4 | 47.858196, 11.483631 | 2 | todo |  |
| 155 | Stroblume | shop | 3973.7, 4631.2 | 47.858351, 11.483276 | 29 | todo |  |
| 115 | Optik Kind Geretsried-Zentrum II | shop | 3944.9, 4641.7 | 47.858256, 11.482889 | 53 | todo |  |
| 178 | Audi;Seat;Škoda;Volkswagen | shop | 4071.5, 4676.3 | 47.857945, 11.484587 | 79 | todo |  |
| 170 | Spielwaren Krömer | shop | 4094.6, 4741.4 | 47.85736, 11.484897 | 134 | ref-done | B4-8 |
| 11 | Quelle | shop | 3919.9, 4780.6 | 47.857007, 11.482554 | 154 | todo |  |
| 166 | Woolworth | shop | 4138.3, 4716.7 | 47.857582, 11.485482 | 156 | ref-done | B4-2 |
| 169 | Sun Style Bodystyling Studio | shop | 4125.7, 4764.7 | 47.85715, 11.485313 | 173 | ref-done | B4-7 |
| 114 | Nexial | shop | 4159, 4743.5 | 47.857341, 11.48576 | 187 | ref-done | B4-6; OSM shop tag wrong (IT services) |
| 116 | GG-Radsport | shop | 4174.6, 4715.9 | 47.857589, 11.485969 | 189 | ref-done | B4-4, inside B3-0 |
| 157 | Aphrodite-aestetic | shop | 4170, 4726.8 | 47.857491, 11.485907 | 189 | ref-done | B4-5, inside B3-0 |
| 15 | TEDi | shop | 4151.2, 4783.6 | 47.85698, 11.485655 | 205 | ref-done | B4-1 |
| 80 | Orterer Getränkemarkt | shop | 4184.1, 4765.8 | 47.85714, 11.486096 | 220 | ref-done (partial) | B3-5; S corner + arcade; not the job's Orterer (#195) |
| 81 | Takko Fashion | shop | 4195.3, 4751.3 | 47.857271, 11.486247 | 223 | ref-done | B3-4; middle unit of the west block |
| 138 | miwomo | shop | 4126.5, 4435.7 | 47.860109, 11.485324 | 248 | todo |  |
| 134 | B&L Hairstyling | shop | 4196.7, 4804.3 | 47.856794, 11.486265 | 253 | ref-done | B4-3 |
| 54 | Haar Genau Friseurteam | shop | 3734.1, 4574 | 47.858865, 11.480063 | 274 | todo |  |
| 159 | Bellini | shop | 3668.4, 4674.7 | 47.857959, 11.479182 | 331 | todo |  |
| 152 | Flamingo Damenmode | shop | 4258.4, 4867.9 | 47.856222, 11.487093 | 341 | todo | needs reference: no photo (B4-10) |
| 158 | Fellomenal Hundesalon | shop | 4252.8, 4876.4 | 47.856145, 11.487017 | 342 | todo | needs reference; probably moved to Deisenhofen (B4-11) |
| 161 | Pia's Hair & Beauty | shop | 3756.8, 4910.1 | 47.855842, 11.480368 | 356 | todo |  |
| 16 | Ana’s Waschservice | shop | 3638.9, 4610.8 | 47.858534, 11.478787 | 361 | todo |  |
| 160 | Feinkost Christos | shop | 3621, 4676.6 | 47.857942, 11.478547 | 378 | todo |  |
| 73 | BRK KleiderMarkt | shop | 3691.5, 4872.7 | 47.856179, 11.479492 | 380 | todo |  |
| 17 | Juchheim Cosmetics | shop | 3582.7, 4710.5 | 47.857637, 11.478033 | 420 | todo |  |
| 97 | Zirngibl Bestattungen GmbH | shop | 3524.7, 4750.8 | 47.857275, 11.477256 | 484 | todo |  |
| 218 | Carglass | car_repair | 4444.2, 4972.1 | 47.855285, 11.489584 | 552 | todo |  |
| 26 | KFZ-Meisterbetrieb Gerd Matheis | car_repair | 4268.3, 5270 | 47.852606, 11.487225 | 678 | todo |  |
| 59 | Schreibwaren Schröter | shop | 3655.5, 4007.1 | 47.863963, 11.479009 | 727 | todo |  |
| 217 | Occasione Mode & Livestyle | shop | 3644.3, 3986.2 | 47.864151, 11.478859 | 750 | todo |  |
| 78 | BSZ Direktmarketing GmbH | shop | 4744.3, 4883.4 | 47.856083, 11.493607 | 783 | todo |  |
| 110 | Premio | car_repair | 4719.9, 5087.2 | 47.85425, 11.49328 | 845 | todo |  |
| 27 | Action | shop | 4524.8, 5429.5 | 47.851171, 11.490664 | 943 | todo |  |
| 227 | L&R Automobile GbR | shop | 4878.4, 5172.5 | 47.853483, 11.495405 | 1025 | todo |  |
| 226 | Kfz Meisterwerkstatt Wor Automobile | car_repair | 4908.5, 5176.5 | 47.853447, 11.495809 | 1053 | todo |  |
| 203 | Autotechnik Dudek | car_repair | 4915.9, 5224 | 47.853019, 11.495908 | 1084 | todo |  |
| 188 | Fliesenmarkt-Süd GmbH | shop | 4949.8, 5177.8 | 47.853435, 11.496362 | 1089 | todo |  |
| 127 | Hofladen Tonibauer | shop | 2903.2, 4482.4 | 47.859689, 11.468923 | 1107 | todo |  |
| 28 | Dahlhoff Feinkost | shop | 4786.8, 5439.3 | 47.851083, 11.494177 | 1117 | todo |  |
| 63 | K1 Kadem | shop | 3418.2, 3693 | 47.866788, 11.475828 | 1117 | todo |  |
| 84 | Klamottenfabrik | shop | 4904.5, 5402.9 | 47.851411, 11.495755 | 1180 | todo |  |
| 21 | Musik Dörfler | shop | 3484.9, 5730.5 | 47.848464, 11.476722 | 1198 | todo |  |
| 126 | Brylka | car_repair | 4844.5, 5566.7 | 47.849937, 11.49495 | 1249 | todo |  |
| 68 | more & more | shop | 4880.9, 5634.1 | 47.849331, 11.495438 | 1324 | todo |  |
| 14 | Isartaler Zweirad-Haus | shop | 3301.4, 5805.9 | 47.847786, 11.474262 | 1351 | todo |  |
| 2 | Schuhe Herrmann | shop | 4939.3, 5647.8 | 47.849208, 11.496221 | 1373 | todo |  |
| 111 | Fahrzeugtechnik CM | car_repair | 5109, 5512.1 | 47.850428, 11.498497 | 1408 | todo |  |
| 8 | Fristo | shop | 5026.1, 5621.9 | 47.849441, 11.497385 | 1416 | todo |  |
| 24 | Kiosk Wendler | shop | 3366.6, 5916.6 | 47.846791, 11.475136 | 1417 | todo |  |
| 25 | Haardesign Erika | shop | 3341.1, 5910.6 | 47.846845, 11.474794 | 1423 | todo |  |
| 9 | JYSK | shop | 4991.4, 5669.3 | 47.849015, 11.49692 | 1425 | todo |  |
| 7 | KiK | shop | 5032.2, 5690.2 | 47.848827, 11.497467 | 1468 | todo |  |
| 99 | Die drei Friseure | shop | 3315.5, 3272.6 | 47.870569, 11.474451 | 1535 | todo |  |
| 86 | Piegsa Gesundheitshaus | shop | 3155.1, 3319.9 | 47.870143, 11.472301 | 1573 | todo |  |
| 143 | Lion‘s Barbershop | shop | 2915.1, 2905.9 | 47.873867, 11.469083 | 2051 | todo |  |
| 144 | Skin and Glow - Kosmetik | shop | 2931.8, 2892.1 | 47.873991, 11.469307 | 2054 | todo |  |
| 153 | Marlis Frisierkommode | shop | 3019.3, 2691.9 | 47.875791, 11.47048 | 2187 | todo |  |
| 199 | Isar Kaufhaus | shop | 2800.9, 2809.9 | 47.87473, 11.467552 | 2193 | todo |  |
| 139 | KIND Hörgeräte | shop | 2841.5, 2783.4 | 47.874968, 11.468096 | 2194 | todo |  |
| 50 | Intersport | shop | 2826.4, 2775.1 | 47.875043, 11.467894 | 2209 | todo |  |
| 171 | Haardesign Irene | shop | 2837.9, 2757.6 | 47.8752, 11.468048 | 2218 | todo |  |
| 95 | Reisebüro Hecher | shop | 2841.6, 2754.1 | 47.875232, 11.468097 | 2219 | todo |  |
| 44 | Völkers Bikeshop | shop | 3009.2, 2654.7 | 47.876126, 11.470344 | 2225 | todo |  |
| 142 | Orchidee Nagel Studio | shop | 2772.8, 2770.9 | 47.875081, 11.467175 | 2241 | todo |  |
| 85 | TOP HAAR Friseur GmbH | shop | 2714, 2792.4 | 47.874887, 11.466387 | 2256 | todo |  |
| 69 | Ernsting's family | shop | 2740.4, 2767 | 47.875116, 11.466741 | 2263 | todo |  |
| 102 | Thalia | shop | 2646.1, 2821.1 | 47.874629, 11.465476 | 2273 | todo |  |
| 104 | Frankenberger Goldschmiede | shop | 2656.9, 2805.6 | 47.874769, 11.465621 | 2279 | todo |  |
| 105 | Apollo Optik Geretsried | shop | 2673, 2779.3 | 47.875005, 11.465837 | 2291 | todo |  |
| 61 | C&A | shop | 2719.6, 2745.9 | 47.875306, 11.466462 | 2292 | todo |  |
| 141 | Le Nails Nagelstudio | shop | 2762.6, 2690.9 | 47.8758, 11.467038 | 2314 | todo |  |
| 145 | Siegert's Hairstyle | shop | 2652.7, 2753.1 | 47.875241, 11.465565 | 2324 | todo |  |
| 130 | Lotto- und Tabakladen Stirl | shop | 2726.8, 2693 | 47.875781, 11.466558 | 2332 | todo |  |
| 131 | Elegante Modeboutique | shop | 2708.7, 2677.6 | 47.87592, 11.466316 | 2355 | todo |  |
| 146 | Augenoptik Pfeiffer | shop | 2673, 2682.9 | 47.875872, 11.465837 | 2370 | todo |  |
| 148 | Friseur Villa Jasmin | shop | 2646.3, 2659.8 | 47.87608, 11.465479 | 2404 | todo |  |
| 70 | Dirtpark | shop | 2310.2, 2792.9 | 47.874883, 11.460973 | 2508 | todo |  |
| 122 | Das Miedereck | shop | 2570.6, 2570.7 | 47.876881, 11.464464 | 2520 | todo |  |
| 202 | Bestattung Klein oHG | shop | 2427.6, 2675.7 | 47.875937, 11.462547 | 2521 | todo |  |
| 184 | Friedl Reifen & Kfz-Service | shop | 3012.2, 2277.8 | 47.879515, 11.470385 | 2567 | todo |  |
| 182 | Fristo | shop | 3007.5, 2239.9 | 47.879856, 11.470322 | 2604 | todo |  |
| 185 | BayWa | shop | 2881.6, 2124.9 | 47.88089, 11.468634 | 2759 | todo |  |
| 76 | Diveworld | shop | 2393.8, 2391.6 | 47.878492, 11.462094 | 2768 | todo |  |
| 201 | Füger Fachhandel | shop | 2429.3, 2293.3 | 47.879376, 11.46257 | 2829 | todo |  |
| 172 | SMBIKES | shop | 2348.3, 2288.1 | 47.879423, 11.461484 | 2879 | todo |  |
| 87 | Hockey Sports Ott | shop | 2370.1, 2212.8 | 47.8801, 11.461776 | 2929 | todo |  |
| 173 | Lotto im Opus G | shop | 2467.2, 2047.1 | 47.88159, 11.463078 | 3018 | todo |  |
| 194 | Hyundai | shop | 2272.2, 2130.5 | 47.88084, 11.460463 | 3052 | todo |  |
| 197 | Elektro Friedl | shop | 2253, 2100.7 | 47.881108, 11.460206 | 3088 | todo |  |
| 108 | Sitzmacher | shop | 2365.9, 1861 | 47.883264, 11.46172 | 3230 | todo |  |
| 193 | Isartaler Elektromarkt | shop | 2393.8, 1842.3 | 47.883432, 11.462094 | 3232 | todo |  |
| 198 | Michael Schmidt Motor GmbH | shop | 2179.3, 1943.4 | 47.882523, 11.459218 | 3259 | todo |  |
| 156 | ALP Schuh- und Schlüsseldienst | shop | 2245.4, 1850.4 | 47.883359, 11.460104 | 3301 | todo |  |
| 125 | Cigo Kiosk, Lotto, DHL | shop | 2229.1, 1851.6 | 47.883348, 11.459886 | 3309 | todo |  |
| 74 | Deichmann | shop | 2236.2, 1839.2 | 47.88346, 11.459981 | 3316 | todo |  |
| 112 | Vinzenzmurr | shop | 2215.6, 1852 | 47.883345, 11.459705 | 3316 | todo |  |
| 222 | Blumenzauber und mehr | shop | 2745.8, 1512.4 | 47.886399, 11.466813 | 3376 | todo |  |
| 49 | Amiti | car_repair | 2315.7, 1565.5 | 47.885921, 11.461047 | 3512 | todo |  |
| 117 | KFZ-Technik Peter Stoiber | car_repair | 452.8, 1556.5 | 47.886002, 11.436071 | 4704 | todo |  |
| 208 | Herbig Weinimport | shop | 379.7, 1598.1 | 47.885628, 11.435091 | 4732 | todo |  |
| 137 | KW-Bikes | shop | 446.5, 1477.5 | 47.886713, 11.435986 | 4761 | todo |  |
| 207 | Meyer Motor Cars | shop | 274.8, 1528.8 | 47.886251, 11.433684 | 4857 | todo |  |
| 88 | Auto Stapf | shop | 231.5, 1557.9 | 47.885989, 11.433104 | 4872 | todo |  |
| 206 | Wiedenbauer Fahrzeugtechnik | car_repair | 178.3, 1564.8 | 47.885927, 11.43239 | 4909 | todo |  |
| 209 | Yamaha | shop | 249.1, 1202.7 | 47.889184, 11.43334 | 5091 | todo |  |
| 224 | Fisch & Feinkost Reeh | shop | 68.1, 1252.3 | 47.888738, 11.430913 | 5194 | todo |  |
| 210 | BMW | shop | 251.7, 978.5 | 47.8912, 11.433375 | 5244 | todo |  |
| 136 | Kiss der CarDoc | car_repair | 814.6, 310.6 | 47.897207, 11.440921 | 5380 | todo |  |
| 41 | Traditionswerk Isartal | shop | 790.9, 222.6 | 47.897998, 11.440604 | 5465 | todo |  |
| 107 | Haarstudio Christina | shop | 846.6, 174 | 47.898435, 11.44135 | 5472 | todo |  |
| 113 | Friseur Elegance | shop | 941, 90.7 | 47.899184, 11.442616 | 5488 | todo |  |
| 214 | fair | shop | 732.1, 164.9 | 47.898517, 11.439815 | 5546 | todo |  |
