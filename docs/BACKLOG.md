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

### B1-4 · Maria Hilf (#232, church) — Size: S — status: implemented (partial: nave window, side door and tower openings placed by guess)
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
- [x] From the street, a white church with the dark-framed big window, matching 01.
- [x] If the tower is placed: white square tower with a dark pyramid cap, at the corner matching 01/05.
- [x] Save pad "Maria Hilf" still reachable on foot and triggers; pnpm test + typecheck green.
Size: S
```

**B1-4 as built** (`src/world/places/maria-hilf.ts`) and gotchas for later places:
- **The "needs reference" parts were settled by the Bavarian LoD2 building model**, not guessed. It is open data
  (© Bayerische Vermessungsverwaltung, CC BY 4.0): one CityGML file per 2 km tile, e.g.
  `https://download1.bayernwolke.de/a/lod2/citygml/684_5302.gml` (38 MB; tile = UTM32 km, even numbers, SW corner).
  Building `DEBY_LOD2_4602633`, name "Maria Hilf", outline dated 2026-06-30: ground 605.47 m, the **tower in the SW
  corner** (OSM point 7), 6.1 × 6.3 m, walls to 29.8 m, a 6 m pyramid (35.8 m); the nave under a **tent roof**, every
  plane at about 39.5° (the model's `Dachneigung` is measured from the vertical: 90° − 50.5°) meeting in one apex
  19.1 m up, SE of the middle; eaves 9.4 m over the S and E walls, 4.6 m over the W, NW and N walls; and a **gabled
  porch on OSM wall 4** (SE, 10.6 m), eaves 9.4 m, ridge 12.1 m. That porch is the gable front of the parish photo
  (`stadtkirche-geretsried.de/MariaHilf/unsere-kirche/`, `bild9_kl-1.jpg`): standing in the forecourt SE of it, the
  tower is on the left and further back, the S wall recedes towards it. The 20 cm DOP20 WMS
  (`https://geoservices.bayern.de/od/wms/dop/v1/dop20`, layer `by_dop20c`) confirms it: the tower's slate square at
  the SW corner, its long shadow across the roof, the tent roof's planes. **Both sources are worth trying for every
  place**: the LoD2 file gives eaves, ridges, roof planes and tower heights per building; nothing else in `docs/`
  has them. OSM has no `building:levels` or `roof:*` on way 127604845.
- **Levels 3, `facade: "plaster"`, `wallColour` [245, 245, 243]:** a new generic facade, `facade-plaster.webp`
  (Codex, a seamless window-less render, made grey with its mean at 240 like facade-render's plaster, so
  `wallColour` is the render colour). Checked in the browser against #0b's idea, a plain full-height band: at play
  zoom both read the same (flat light grey in shade, white in sun), but a band cannot reach above the eaves (places.test
  keeps bands under `levels × 3 + 0.6`) and the gable rises to 13.4 m, so the gable would show the facade over it.
- **New generic roof options `roof.eaves` and `roof.gables`** (with `hip`; dressing.ts, scene.ts, hip-roof.ts):
  `eaves: [{ edges, z }]` gives walls their own eave height, `gables: [edges]` ends the roof in a gable there. In
  `hipFaces(ring, lift)` a wall's plane starts `lift` meters of run up its slope ((z − levels × 3) / tan pitch; a gable
  is `Infinity`, no plane, its neighbours run on to it), owners are the *lowest* plane in the wedge and the cut lines
  are where two planes are equally high. With either option the walls' tops follow the roof (`wallTops`: the roof's
  height through every roof-piece corner on the wall), each texture or band slab is clipped under that line, and the
  dark eave line follows it too (sloped on the gable). Here hip 39.5, walls 7, 8, 0, 1 at 4.6 m, gable 4: the engine's
  apex is 18.5 m at (3832.6, 4908.6), the model's 19.1 m at (3833.7, 4908.8); the porch ridge 13.4 m (model 12.1:
  one pitch per building). Without the options the old code path runs unchanged: every one of the 2112 chunk meshes
  of the real map hashed identical at HEAD and with this change minus the church; with the church only chunk 1701
  (its own) differs. Tests: hip-roof.test.ts (a gable end, a lower wall moving the ridge, the church outline: apex,
  no steps), scene places.test.ts (a gable wall reaching the ridge, a low wall at its eave, no other chunk).
- **New generic part `canopy { edge, u0, u1, z, depth, colour }`:** a flat 0.2 m slab on a wall with its top at `z` and
  its shadow; places.test keeps it at z ≥ 2.5 like balconies. The gable front has the main doors (`church-door`,
  Codex, keyed and squared like rehmaus-sign; u 4.0–6.6, z 0–3.2) under a canopy (u 3.1–7.5, z 3.6, depth 1.6, #343e39)
  and the rose window over it (`church-rose`, keyed and squared, Ø 3.4 m, centre 7.3 m up, as in the photo).
- **Tower:** `edge: 6`, `rect` [0.5, 6.6, 0.05, 6.25] (wall 7 leans 3.8° off square, so u0 under 0.45 puts a corner
  outside), h 29.8, roofH 6, white, roof [66, 82, 88] (the DOP20's weathered grey-green slate, the photo's
  near-black lightened so it reads from above), the finial as the cross, no quoins. `church-belfry` (Codex, opaque,
  2:3 stored square: two louvred round-arched sound openings over a small square window, as the winter photo
  `bild3_kl-1.jpg` shows) on all four faces at z 20.5–29.5. At 36 m it is two thirds of the camera's height, so it
  leans far out of the screen; from a car on Johann-Sebastian-Bach-Straße (stand at (3808, 4928)) its W and S faces
  show with the openings.
- **Guesses (marked in the file):** the big gridded nave window (`church-window`, Codex, opaque 2:3) at wall 6
  u 7.5–11.5, z 1.8–7.8, next to the tower where Street View's pano at house no. 5 sees it and clear of the kerb tree
  in front of the wall's middle; the side door with its canopy at u 12.2–15.2 (02 shows a side entrance "by the
  tower", maybe on the W wall); four identical tower faces and no clock (the 175 px photo shows a light disc
  halfway up the tower that might be one). The real church is fenced off since Nov 2024; no fence was added.
- **Save pad:** unchanged (3820.8, 4926.0) on the sidewalk; walked onto it in the browser: $1000 → $500 and
  `geretsried-gta.save` written.
- **Screenshots** (local): the forecourt SE of the porch (3855, 4925) shows the gable front with the rose window and
  the canopy in the top-left corner; a car at (3828, 4930) shows the S wall with the window and the tower leaning
  in; `?compare=47.85587,11.48137,28` shows the tent roof, the tower's pyramid and the porch from above.

### B1-5 · PENNY Am Stern (#66, supermarket) — Size: S — status: implemented (partial: the canopy's posts and fascia, the shop fronts' extent, the trolleys' spot, the end-wall board and the pylon's size and spot are guesses; built inside B3-0; reference/ was not on disk, so not compared with the photos)
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
- [x] From the car park, the red canopy with trolleys at the NE end of the Penny block matches da-daniele/02 + 05.
      (Canopy where the LoD2 model has it, red fascia with PENNY on its front; the trolleys stand under it, so they
      only show at its edges. Not compared with the photos: reference/ was not on disk.)
- [x] Driving past on Sudetenstraße, the PENNY board and the pylon match 01/02. (Board and pylon from the docs' look
      spec, not the photos.)
- [x] Car park stays drivable; Post Filiale 571 job (van on Sudetenstraße across the road) unaffected;
      pnpm test + typecheck green.
Size: S
```

**B1-5 as built:** inside B3-0, `src/world/places/penny-sudetenstrasse.ts` (way 822461881); see **B3-0 as built**.

### Batch 2: exterior only (decision)
Same rules as batch 1: **exterior only** (Size S/M) via **#0b**; #0c is still required before any interior.
Batch 2 needs three things #0b's batch-1 part list doesn't cover. Add them to #0b (or a follow-up S item) first:
- `facade` override per building (`industrial` / `shop` / `house`): Wilhelm and Polizei get "house" today.
- `canopy(edge, u0, u1, depth, z, posts?)`: thin flat on brackets/posts (Post glass canopy, Aldi porch, Polizei entrance).
- roof override `{pitched, colour}` per building (already in the #0b schema): Aldi (OSM says flat), Polizei (solar panels).
Every prompt below must keep the job/spray/save hooks working (names are matched exactly in code).

### B2-1 · Mühlenbäck, Sudetenstraße 19 (#48, bakery) — Size: S — status: implemented (partial: shop widths, sign artwork and No. 17's front are guesses; the photos were not on disk, so not compared with 01)
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
- [x] At the start, the shop row matches 01 left to right; the Mühlenbäck sign + awning are readable.
      (Order from the places doc; the awning and the sidewalk board read at the start, the wall sign only near a screen edge.)
- [x] Building is visibly 3 storeys; nothing blocks the start, the payphone or the pavement.
- [x] game.test.ts still finds "Mühlenbäck"; brezn courier job unchanged (pickup is #46, not this one);
      pnpm test + typecheck green.
Size: S
```

**B2-1 as built** (`src/world/places/muehlenbaeck.ts`) and gotchas for later places:
- **Public sources.** OSM gives only the nodes: Mühlenbäck and Angel Nails (both No. 19) and HoangAnh (`amenity=restaurant`,
  No. 17) inside way 127604891, no levels or roof tags, nothing for the two SE shops. The bakery has no website of its own
  (muehlenbaeck.de does not resolve; the town's tourism page lists it with no address or photo). The **LoD2 model**
  (tile `684_5302.gml`, the same file as Maria Hilf) splits the footprint into three houses along the street:
  `DEBY_LOD2_4602989` in the NW (No. 17: gable roof, eaves 11.4 m at the street, ridge 16 m), `DEBY_LOD2_4602923` in the
  middle (No. 19: gable roof along the street, eaves 8.6–9.0 m, ridge 11.5 m) and `DEBY_LOD2_4602924` in the SE (hip roof,
  eaves 9.4 m, ridge 12.1 m), all at about 28°. On wall 0 (37.8 m, u from the NW end) they cover u 0–13, 13–25 and
  25–37.8; the OSM nodes put HoangAnh at u 7, Angel Nails at u 16 and the bakery at u 22. So the doc's row (Angel Nails ·
  Mühlenbäck · red sign · red awning) is the middle and SE houses, and HoangAnh is NW of it, off 01's left edge. The
  **DOP20** shows the three roofs: grey over No. 17, brown over the middle, terracotta over the SE house. The LoD2
  outline sits 2–4 m behind OSM's street wall (the sidewalk is wider in reality); the OSM footprint stays the solid.
- **Levels 3, `facade: "render"`, `wallColour` [252, 249, 237]** (#edeadf ÷ 0.94). `roof: { colour: [152, 98, 72], hip: 28,
  gables: [5] }`: one hipped roof, ending in a gable at the NW wall like the model's NW house; the SE end is hipped.
  **Not modelled:** No. 17 is taller in the model (4 storeys at the street); a registry entry has one level count per
  footprint, and the front wall spans all three houses, so `roof.eaves` cannot raise one third of it.
- **Shop row** on wall 0, each unit an opaque `shop-front` strip (z 0–2.85: glazing and a door in aluminium frames under
  the grey #d4d4d9 fascia, Codex, 2:1 stored square) with its sign at `out` 0.1: No. 17 u 0.3–12.9 (two strips, no sign:
  unknown); Angel Nails u 13.0–18.6 (`angel-nails-sign`, pink board, white script); the bakery u 18.6–25.0 (`bakery-front`,
  the same front with bread on the counter; `muehlenbaeck-sign` z 2.85–4.2, white board, red disc with a wheat ear,
  "Mühlenbäck" in dark red, "BÄCKEREI · KONDITOREI" small); the red-sign shop u 25.1–30.8 (`shop-board-red`, no text);
  the red-awning shop u 30.8–37.5. **Guesses:** where one unit ends and the next begins (from the LoD2 house walls and
  the OSM nodes), the sign lettering and the logo (a "red round logo" is all the doc saw), No. 17's front.
- **Awnings:** `canopy` parts at z 2.55, 1.4 m deep, cream [253, 248, 238] over the bakery (u 18.8–24.8) and red
  [224, 111, 109] over the last shop (u 31.0–37.3). **New generic option `canopy.texture`** (dressing.ts, places.ts): the
  slab's top in that material times `colour`, repeated every `depth` meters along the wall, the image's top at the wall.
  `awning` (Codex, neutral grey fabric: the cassette at the wall, two panels, a darker valance) makes a plain slab read
  as an awning from above; without `texture` the old code runs unchanged. Every one of the 2112 chunk meshes hashed
  identical at HEAD and with this change minus the bakery; with the bakery only chunk 1615 (its own) differs.
  Test: scene places.test.ts (the fabric is the top's four vertices only).
- **What the camera shows at the start:** the player spawns in Sudetenstraße about 4.7 m from the front, so the front
  leans in only a few pixels (a wall's visible depth depends on its distance from the camera's foot, not on where along
  the screen it is): the roof, the cream awning and the sidewalk are what read. The wall signs show above the awnings
  when the front is near the top screen edge (stand in the middle of the street, about (3998, 4659)); the awning
  hides most of the bakery's glazing, as a real one would. Hence the **`bakery-board`** prop: the bakery's white
  sidewalk board (the doc's 02 shows sign boards on the pavement) with the red logo and "Mühlenbäck", lying flat at
  street u 0, n 5, z 0.7, turned −0.596 rad to read upright; at the start it sits next to the cream awning, right of the
  payphone. The minimap covers the bottom-right corner, where the red awning is at the start.
- **process-sprites.py:** the three boards are keyed like rehmaus-sign but keep their own colours inside (alpha over 160):
  the spill pull turned Angel Nails' pink (#ed779b is near the magenta key) a dusty red. `cp` is aliased to interactive
  here; copy Codex output with `command cp -f`, or the old file silently stays.
- **Start, phone, jobs:** unchanged (START, the home payphone and the brezn pickup #46 are not touched; nothing new is
  solid). The canopies hang at 2.55 m over the sidewalk, the board is a sprite.

### B2-2 · Deutsche Post Filiale 571, Sudetenstraße 34 (#150, post) — Size: S — status: implemented (partial: shop widths, the canopy's depth and the yellow Post board are guesses; the photos were not on disk, so not compared with 01/02)
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
- [x] From the street, canopy + sign band + yellow letter box match 01/02.
      (Built from the places doc's description; the band reads as its colour blocks when the front leans in.)
- [x] "post" job: the van still spawns on Sudetenstraße in front of the shop and can be destroyed; the canopy and
      letter box don't block the kerb lane; pnpm test + typecheck green.
      (The van stands at the far kerb of Sudetenstraße, as before this change; see below.)
Size: S
```

**B2-2 as built** (`src/world/places/post-filiale-571.ts`) and gotchas for later places:
- **Public sources.** OSM: the POI is node 12030838892 (`amenity=post_office`, Sudetenstraße 34, operator Deutsche Post);
  way 119921780 has no levels or roof tags; a `tunnel=building_passage` driveway (way 209568276) runs under the NW
  corner from the street wall's point 4 to point 7; the neighbour Nos. 28–32 (way 119921782, the same kind of row) is
  tagged `building:levels=3`, gabled. The **LoD2 model** sits in tile **`686_5302.gml`** (the POI is 14 m east of the
  684/686 boundary; the NW neighbour is in `684_5302.gml`): the street arm is three gabled houses, `DEBY_LOD2_4602691`
  (NW, ridge along the street, gable at OSM wall 5), `DEBY_LOD2_4602692` (middle) and `DEBY_LOD2_4602694` (the SE arm,
  its ridge down the arm, ending in a gable at the street); eaves 10.0–10.8 m, ridges 12.3–12.9 m, about 22°. On wall 3
  (45.8 m, u from its SE end) they cover u 0–10.3, 10.3–29.5 and 29.5–45.8; the LoD2 street wall lies 1.8–1.9 m behind
  OSM's (the canopy and the eaves are probably what OSM traced). The POI is at u 36.4, the Post finder's point at u 39.2,
  so the newsagent is the NW house's shop. The **DOP20** shows brown tiles (dark on the NE planes, pale on the SW ones)
  and solar panels only on the neighbour. No street-level photo could be fetched (Google's pano lookup is turned down,
  the headless browser cannot render Street View, Panoramax has nothing here), and a web search found no picture of
  a Post sign at No. 34.
- **Levels 3** (not the prompt's 4: the model's 10 m eaves are three storeys with a tall shop floor), `facade: "render"`,
  `wallColour` [250, 250, 248], `roof: { colour: [128, 92, 76], hip: 22, gables: [5] }`. **Not modelled:** the eaves
  are 9 m instead of 10–10.8 (the render repeats every 6 m, so a 10.2 m wall would end in part of a window row); the SE
  arm's gable to the street (it is part of wall 3, which must stay an eave), so that corner is hipped.
- **Shop row** on wall 3: `shop-front` strips at u 0.3–29.3 (other shops, names unknown), the newsagent u 29.6–40.2 and
  the next shop (a sonnenklar travel agency in 2022) u 40.4–43.6; the passage at u 43.8–45.8 is left as render.
  Over the newsagent at `out` 0.1, z 3.15–4.3: `post-sign` (u 29.8–31.8, Codex: the yellow board with the black
  posthorn and "Deutsche Post") and `gerltz-signs` (u 32.0–40.1, Codex, 4:1, the doc's order Merkur · LOTTO Bayern ·
  GerLTZ · SZ over AZ, spelled right first time), both keyed and squared like the Mühlenbäck boards. From the play
  camera the band is a strip of navy, yellow, white and green/red a few pixels tall when the front leans in at the
  bottom-left (stand in Sudetenstraße at street u 0, n −5, about (4246.7, 4819.7)); letters do not read.
- **Glass canopy:** one `canopy` part, u 0.3–43.6, z 3.05, depth 1.6, colour [214, 220, 222], with a new material
  `canopy-glass` (Codex: the steel frame from above with the panes left #FF00FF; `process-sprites.py` turns the panes into
  pale glass at 55 % alpha, which the opaque pass's alpha-to-coverage draws see-through). No engine change: the canopy
  part's `texture` option and the material alpha already did it. At 40 % the lawn under it (the aerial's ground mask
  has grass between the sidewalk and OSM's wall) made it read as a green strip.
- **Sprites:** `post-box` (Codex, the yellow letter box with the posthorn, slightly cheated top-down like
  `bakery-board`) at street u 5, n 4.7, z 1.2 and `litter-bin` (brown slatted bin) at u 6.3, n 4.7, z 0.9, both turned
  by 2.578 (minus the frame's −2.578 rad) to read upright, on the sidewalk by the passage as 02 has them.
  places.test.ts keeps them past the street's half width.
- **The van:** `jobCar` puts it at `half + 1` = 5 m from the centre line on its right-hand side, which here is the far
  (PENNY) kerb of Sudetenstraße, opposite the Post, half on that sidewalk (street frame n −5). That is unchanged by this
  entry (no part is solid); a van at that spot, set burning in the browser, burnt out and became a wreck. Moving it to
  the Post side would be a change to `jobCar`, not to the dressing.
- **Guesses (marked in the file):** where each shop begins and ends, the other shops' fronts, the canopy's depth and
  height, and the yellow Post board: no photo shows one (the 2022 photos predate the counter's return to No. 34), but
  the finder lists a Postfiliale there and the prompt's "ask first" could not be put to the user from this run. Remove
  the `post-sign` part if a photo shows none.

### B2-3 · Automobilwerkstatt Wilhelm, Wallensteinstraße 4 (#103, car_repair) — Size: S — status: implemented (partial: the window band's length, where the sign and the "4" sit, the logo's orange and the "4"'s colour are guesses; the photos were not on disk, so not compared with 01/02)
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
- [x] The hall reads industrial and single-storey; the sign end matches 01.
      (Built from the places doc's description; the navy board with the orange logo and "AUTO MOBIL" reads when the
      NW wall leans in at the bottom of the screen.)
- [x] Spray pad still appears on a reachable road point within 40 m and repaints the car.
- [x] "mercedes" job drop-off still completes by driving (car within 9 m of the POI); pnpm test + typecheck green.
Size: S
```

**B2-3 as built** (`src/world/places/werkstatt-wilhelm.ts`) and gotchas for later places:
- **Public sources.** OSM: the POI is node 7216140284 (`shop=car_repair`, operator Robert Wilhelm, Wallensteinstraße 4,
  brakes, tyres, inspection…), 3.8 m inside the NW wall and 11 m from the NE end; way 128266487 has no levels or roof
  tags. A web search found no site, listing photo or article for the shop. The **LoD2 model** (tile `686_5302.gml`,
  the one B2-2 used) has it as `DEBY_LOD2_4667533`, a commercial building (`31001_2000`) with a **flat roof**
  (`roofType` 1000) at **4.79 m**, its outline within 1–2 m of OSM's. The **DOP20** (fetched as for Maria Hilf) shows
  the roof light brown with a faint seam down the middle, no shading difference between halves, the customers' cars
  nosed in along the **NW wall** at its NE end, the car park beyond the service lane there, and gardens behind the SE
  wall. With the POI near the NW wall, that settles the doc's "likely" front: wall 0 (NW, faces 322°, u 0 at its NE end).
- **Levels 1.4, `facade: "industrial"`, `wallColour` [150, 146, 178], `roof: { pitched: false, colour: [196, 170, 140] }`.**
  A flat roof's walls run 0.6 m past it (parapet), so 1.4 storeys (4.2 m) give the model's 4.8 m; `levels` is a plain
  number in the schema (OSM allows fractional `building:levels`). With the engine's pitched roof the DOP's light
  brown came out as orange clay tiles (roof-tone grades warm pitched roofs to terracotta); flat with a colour is the
  gravel texture tinted light brown inside a light coping, close to the DOP20 from above. The metal facade's mean is
  about (169, 180, 185), so the tint is the slate target ÷ that; from the play camera the wall reads dark slate-blue.
- **Wall signs on wall 0** (all new materials, Codex): `werkstatt-sign` (the navy board with the orange ring logo
  "Pw", "AUTO MOBIL" / "robert wilhelm" in orange, the small white line "KFZ Fachbetrieb für Reparaturen &
  Unfallinstandsetzung" and a white EINGANG → box, spelled right first time; keyed and squared like the Mühlenbäck
  boards) at u 0.4–6.2, z 2.5–4.5; `werkstatt-windows` (frosted grey-green panes in white frames, six per strip, half a
  mullion at each end so strips join; opaque, 3:1 stored square) in nine strips from u 6.6 to 59.3, z 2.0–3.9;
  `werkstatt-4` (a navy "4", keyed and squared) at u 7.3–8.3, z 2.2–3.7, `out` 0.1 over the glass. Below 2 m the
  cladding shows; no doors (none seen).
- **What the camera shows:** a 4.8 m wall leans in only a strip. Stand in the car park NW of the NE end, about
  (4707, 4808): the sign end sits at the bottom of the screen, upside down; rotate the crop 180° to read "Pw AUTO
  MOBIL", the frosted band and the "4". From above, the long light-brown flat roof with its coping and vents.
- **Every other building is unchanged:** all 2112 chunk meshes hashed identical at HEAD and with this change minus the
  workshop (the three materials are appended, nothing else in the engine changed); with it only chunk 1664 differs.
- **Spray pad and job, checked in the browser:** the pad stays at (4701.7, 4821.3) on the NW lane (nothing new is
  solid); a car put on it was resprayed ($1000 → $700, "Frisch lackiert bei Automobilwerkstatt Wilhelm!"). The
  "mercedes" drop-off, driven up the lane with the throttle held: it passed at 8.1 m from the POI along the hall side
  of the lane (+$2500). Down the lane's centre line a car passes 9.4 m from the POI, just outside `STOP_REACH`: that
  was so before this entry (the footprint did not change).
- **Guesses (marked in the file):** how far the window band runs (the whole wall here), where the sign and the "4" sit,
  the logo's orange (#F07D1A, the doc's sample was unreliable) and the "4" in navy, and the logo's lettering ("Pw").

### B2-4 · Aldi Süd Stein, Sudetenstraße 68 (#225, supermarket) — Size: S — status: implemented (partial: which gable carries the logo, where the doors are, that the DOP20 strip is a glass canopy and the shelter's size are guesses; no porch posts; the Packstation left out; the photos were not on disk, so not compared with 01/02)
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
- [x] From above: dark pitched roof instead of a flat grey slab; from the car park the gable + logo + porch match 01.
      (Roof and cross gables from the LoD2 model and the DOP20; the logo reads above the glass canopy when the car-park
      wall leans in at the left screen edge. Not compared with 01: the photos were not on disk.)
- [x] "gartenberg-1": the VW Bus still spawns on the car-park service aisle E of the store and is reachable;
      porch posts don't block the aisle; pnpm test + typecheck green.
      (Nothing new is solid and there are no posts; the bus stood on the aisle 10.7 m out from the wall, was blown up
      and the job paid. From the real phone it is culled first: see below.)
Size: S
```

**B2-4 as built** (`src/world/places/aldi-sued-stein.ts`) and gotchas for later places:
- **Public sources.** OSM way 1385213575 has `building:levels=1`, `roof:levels=0`, `roof:shape=flat` (wrong). The Aldi Süd
  store page (`filialen.aldi-sued.de/bayern/geretsried/sudetenstrasse-68`) redirects to a generic page with no photo; a web
  search found no picture. The **LoD2 model** (tile `686_5302.gml`, the one B2-2/B2-3 used; the store is near its S edge)
  has it as `DEBY_LOD2_4667297`, a commercial building with roof type 3100 (gabled), ground 607.97 m: a gable roof along
  the long axis at about 22°, eaves 5.6 m, ridge 10.7 m, 12.6 m in from the WNW wall (OSM wall 2, which matches the
  model's eave within 0.1 m); **two cross gables**, each 15 m wide (eaves 5.6, ridges 8.6 m), side by side over the whole
  ESE wall to the car park (OSM wall 8, u 0 at its SSW end), the wing under them standing 4.9 m out of the main block's
  ESE eave line; and a small gabled annex at the SSW corner (walls 3, 4; ridge 7.4 m, its gable to the SSW). So the doc's
  "cross-gable at the S end" is the two ESE gables. The **DOP20** (fetched as for Maria Hilf) shows all of it: the lit
  WNW plane, the dark ESE plane, the cross gables' light S-facing planes, a 2 m strip of dark panes in a grid along wall
  8 (read as a glass canopy), a light flat roof about 3 × 6 m in front of wall 6 by the corner (the trolley shelter) and
  two blue bays in front of the SSW gable, at right angles to the wall. The car park and the aisle are on the ESE side;
  the DHL finder's Packstation point lies against wall 8, 5.5 m from its SSW end.
- **Levels 5.6 / 3, `facade: "plaster"`, `wallColour` [240, 240, 238], `roof: { colour: [124, 122, 130], hip: 22, eaves,
  gables }`:** gables at walls 9, 0, 1 (the NNE end, three collinear pieces), 5 and 3 (the SSW end and the annex) and 7.
  The trick that puts the ridge where the model has it: **wall 8 gets its own, lower eave (3.42 m)**, so its plane is
  the model's main ESE plane extended out to the wing's wall (it passes 5.6 m where the model's eave line is), and the
  ridge comes out 12.6 m from wall 2 at 10.7 m. Wall 6, 3.3 m further in, gets 4.72 m, a hair under that same plane, so
  it owns its stretch without a step in the ridge; wall 7 between them is a gable. Wall 4's own plane gives the annex its
  low ridge and wall 3 its gable, as in the model. The ESE walls are lower than in reality (3.4 m under the gables, 4.7 m
  on wall 6, where OSM's wall lies 1.7 m outside the model's).
- **New generic part `gable { edge, u0, u1, z0, z, pitch, depth, colours: { wall, gable, roof } }`** (dressing.ts,
  places.ts): a cross gable on a wall, its two roof planes from the eaves (overhanging 0.35 m and continuing the slope) to
  a ridge over the stretch's middle running `depth` m into the building, lit and tiled like the hip roof (roof-tiles detail,
  rows along the eaves), dark edges along the eaves and the rake, the gable triangle 0.04 m proud of the wall over a strip
  of wall from `z0` to the eaves, and two side walls. It does not cut the building's roof: whatever runs under that roof is
  hidden by the depth test, so `depth` only has to reach it (here 13.5 m; the ridge meets the main plane about 13 m in).
  Two gables on one wall share a side wall (same colour, so the coincident faces don't show). Here u 0.05–14.85 and
  14.85–29.65, z0 3.32 (just under wall 8's top), z 5.6, pitch 22, grey cladding #a6a9a1. places.test checks it on a real
  wall like the other wall parts; scene places.test the tip, the ridge, the overhang and that no other chunk changes.
  **Every other building is unchanged:** all 2112 chunk meshes hashed identical at HEAD and with this change minus the
  Aldi; with it only chunk 1796 (its own) differs.
- **Parts:** `aldi-logo` (new material, Codex: the ALDI SÜD logo on its navy #303d6f panel, keyed and squared like the
  Mühlenbäck boards) in the SSW gable, u 6.3–8.6, z 5.75–8.05, `out` 0.1; `shop-front` glazing as the entrance at u 0.4–5.6
  (hidden by the canopy from above); a glass `canopy` along wall 8 (u 0.3–29.4, z 3.1, depth 2, `canopy-glass`); the
  trolley shelter as a light grey canopy on wall 6 (u 10–16.4, z 2.6, depth 3.2); two `disabled-bay` props (new, Codex: a
  blue bay with the white wheelchair, keyed, turned on its side so its length runs along the image's width) flat at z 0.12
  (above the shadow layer at 0.1, so their own silhouette does not darken them), street u −4.1 / −1.3, n 22.25, angle −π/2,
  4.6 m long. They overlap the edge of OSM's service aisle by about a meter: in the DOP20 the aisle runs further out.
- **What the camera shows:** from above (`?compare=47.85315,11.49315,32`) the roof reads like the DOP20: the dark main
  roof, the two cross gables with their light S planes and valleys, the canopy's grid, the shelter and the bays. The
  car-park wall faces ESE; stand in the car park about (4738, 5208.4), so it is at the left screen edge: the glass canopy
  in front, the logo over it under the gable's eave. **An opaque canopy hides a gable over it from this camera** (its
  outer edge leans less than the gable's foot does at any lean the play camera has): the first try, a dark solid canopy,
  hid the logo; the glass canopy shows it through the panes. The grey cladding mostly hides under the eave's overhang.
- **"gartenberg-1", checked in the browser:** taken at the Gartenberg phone, the VW Bus is placed at (4730.7, 5215.2),
  on the aisle's far kerb 10.7 m out from wall 8, clear of the canopy and the bays; a rocket from the car park destroyed
  it: "Geschafft! $2000", Krachlederne +25, Steinböcke −19. **Existing bug, not changed here:** `fillTraffic` drops every
  parked car more than `NPC_FAR` (650 m) from the player, and the job car is a parked car, so a bus placed 3.1 km from the
  phone is gone by the time you arrive (only its red marker remains). For the check it was put back into `game.parked`.
  The same hits any steal/destroy job whose car is over 650 m from its phone (Kaufland's BMW). A fix belongs in `game.ts`
  (keep `jobs.active.target` out of the cull), not in a place entry.
- **Left out:** porch posts (the canopy part has none; the doc's "white posts" were not modelled), the DHL Packstation
  (where the finder puts it, it would stand under the canopy, and no photo shows it; the sprite was made and dropped), the
  small blue ALDI sign over the doors.

### B2-5 · Polizeiinspektion Geretsried, Jeschkenstraße 31 (#187, police) — Size: S — status: implemented (partial: the plinth height, the door, the stairs, the ramp and their canopy, the sign's spot and size and the post spacing are guesses; the photos were not on disk, so not compared with 01/05; the stein-1 drop-off is unchanged, not fixed)
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
- [x] From above: white walls + dark panel roof as in 04; from Jeschkenstraße the N gable matches 01/05.
      (From above the 2 × 4 panel fields read as in the DOP20; the N gable shows white with tall windows and the blue
      sign under the canopy's edge. Not compared with 01/04/05: the photos were not on disk.)
- [x] Building stays solid; nothing spawns inside. pnpm test + typecheck green.
- [x] ⚠ Before this item: check the stein-1 drop-off (see the P2 note). The footprint check found no car
      position within 9 m of the POI; dressing must not make it worse.
      (Not worse: the footprint and levels are OSM's and every new part is never solid. Still not fixed: see below.)
Size: S
```

**B2-5 as built** (`src/world/places/polizei-geretsried.ts`):
- **Sources.** `reference/polizei-geretsried/` was not on disk, so the photos (01–05) were not used. The **LoD2 model**
  (`DEBY_LOD2_4667037`, ALKIS function 3071 "Polizei") has the walls on 12.5 × 28.6 m only, flush with OSM's W and N
  walls (OSM's E wall stands 5.3 m and its S wall 3.5 m outside them), under a very low gable roof along the long axis,
  eaves 8.7 m, ridge 9.3 m: the laser-scanned top of the solar canopy. The **DOP20** shows that canopy as a 15.2 × 30.6 m
  field of dark panels in a light frame, in 2 × 4 fields, and a stepped light structure off the W wall 7–15 m from the N
  corner, read as the entrance stairs and ramp. So the entrance is on the **W** side, as the doc guessed.
- **Footprint and levels kept** (OSM way 127717998, 2 storeys); wall 0 is the N gable towards Jeschkenstraße (u 0 at its
  E end), 1 the E side, 2 the S gable, 3 and 4 the W side (4 the N 23.9 m of it, u 0 at the N corner).
- **New facade `civic`** (Codex: white render, two tall small-pane windows per storey, seamless; `facade-civic.webp`),
  `wallColour` #f3f3f0, a plain grey plinth band z 0–0.55 (a guess), the flat roof under the canopy dark #464c5d.
- **New generic parts** (dressing.ts, places.ts; tested in scene places.test): `deck { edge, rect, z, thickness, colour,
  texture?, top?, repeat?, posts? }`, a flat slab on a rectangle in a wall's frame with its top textured and repeated,
  and square posts on every wall of the footprint from `posts.z0` up to it; `stairs { edge, u0, u1, depth, h, steps }`;
  `ramp { edge, u0, u1, depth, h, low, rail? }` with a rail along its outer edge. All relief, never solid.
- **Parts here:** the solar canopy as a `deck` at 9 m (the LoD2 top, the 5° gable flattened), 0.35 m thick, over OSM's
  walls plus the DOP20's overhang (1.35 m past the long walls, 1 m past the gables), textured with `solar-field` (Codex:
  one panel field seen from above, opaque) 2 × 4 times, steel posts about every 4 m from the walls' top (6.6 m; spacing a
  guess). On wall 4 a ramp (u 5–11.5, up from the N, 0.9 m, rail), stairs (u 11.5–14.5, 5 steps), a `shop-front` door at
  their top and a flat metal canopy at 3.7 m (all guesses in shape and size; the aerial only shows something stands
  there). The blue POLIZEI star sign (`polizei-sign`, Codex, keyed and squared) on the N gable at u 14.8–15.6, z 2.2–3.0,
  near the W corner (spot and the 0.8 m size are guesses).
- **What the camera shows:** from above (`?compare=47.849399,11.493982,28`) the panel fields and frame read like the
  DOP20, the entrance canopy pokes out on the W side. In play the canopy covers most of the walls; standing W of the
  building (4748, 5622) shows the white long side with its tall windows, the entrance canopy and the ramp; from the N
  (4768, 5601) the gable shows as a white strip with windows and the small blue sign under the canopy's edge.
- **Every other building is unchanged:** all 2111 chunk meshes hashed identical at HEAD and with this change minus the
  police station; with it only chunk 1929 (its own) differs.
- **"stein-1" drop-off, not fixed (job logic, out of scope):** the footprint and the solid are OSM's as before and no new
  part is solid, so the reach is exactly as the P2 note says: the POI sits mid-building, 8.3–8.4 m from the long walls, and
  a car centre cannot get within `STOP_REACH` (9 m). A fix belongs in the job code (a kerb drop-off point or a larger
  reach), not in a place entry.

### Batch 3: Am Stern (decision)
Same rules: **exterior only** via **#0b**. Seven places plus PENNY sit around one car park. Build the buildings
**once** (B3-0), then dress each unit (B3-1…B3-7 are dressing specs that B3-0 pulls in; do them in the same PR or
right after). New things #0b must support for this batch:
- **Unit wall-signs on a shared facade**: a list of `{edge, u0, u1, text/texture}` per building, not one sign per building.
- **Corner signs** (one sign wrapping a corner) and **projecting signs** (Ahorn's red "A").
- **Pylon sprite**: a post with stacked panels.
- **Roof-readable signs**: a flat decal on the roof near the store's facade, so the top-down camera can tell the units apart.
- **Footprint split or per-part height**: OSM puts two balcony blocks + a single-storey link in one outline (127872184, 822461881).

### B3-0 · Am Stern block (umbrella: buildings, car park, pylon) — Size: M — status: implemented (partial: the unit signs along the fronts are B3-1…B3-7's; the balconies, the roof signs' spots, the flat roofs' colours, the pylon's size and spot are guesses; reference/ was not on disk, so nothing was compared with the photos)
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
- [x] Driving into the car park from Sudetenstraße: pylon at the Ahorn corner, Penny canopy far left, Rossmann
      ahead across the car park, as in penny/06 and rossmann/03. (Layout from the docs and the LoD2 model; not
      compared with the photos.)
- [ ] Along Sudetenstraße NW of the car park: denns · TAKKO · Orterer corner in that order, as in denns/01, takko/02.
      (The west block, its balconies and denns' roof sign stand; the three unit signs are B3-2, B3-4, B3-5.)
- [x] From the top-down camera, EDEKA / PENNY / ROSSMANN / denns can be told apart by roof signs.
- [x] Car park drivable, pickups on it still reachable; Post van job and the #195 Orterer job unaffected;
      pnpm test + typecheck green.
Size: M
```

**B3-0 as built** (`src/world/places/am-stern.ts` shared, `am-stern-west.ts`, `rossmann-am-stern.ts`,
`penny-sudetenstrasse.ts`, `edeka-am-stern.ts`) and notes for B3-1…B3-7, B4-4…B4-6:
- **Sources.** `reference/` does not exist on disk, so no photo was used; everything comes from `docs/places/*.md`,
  the Bavarian **LoD2 model** (tiles `684_5302.gml` for the west block, `686_5302.gml` for the rest; the B1-4 / B2-2
  downloads) and the **DOP20** (fetched as for Maria Hilf). The model splits every OSM outline here into the real
  buildings, each with its own eaves and ridge, which settles the "split or ask first" question without asking.
- **Decision: one place per footprint, the footprint split into `masses`.** The registry pins one dressing per OSM way
  (places.test checks), so there are four place files, one per block, named by the slug of their main shop; the
  shared colours and the balcony helper are in `am-stern.ts`. Each later unit (denns, Takko, Orterer, the
  Marienburgweg shops in `am-stern-west.ts`; da Daniele, Ahorn in `penny-sudetenstrasse.ts`; Rossmann's chimneys in
  `rossmann-am-stern.ts`; EDEKA's front and pylon in `edeka-am-stern.ts`) adds its wall signs to the `parts` of its
  block. There is no per-building sign list type: a list of `wallSign`s on one footprint already is that.
- **New generic option `masses`** (dressing.ts, scene.ts): a place's footprint drawn as several volumes, each a ring
  of map points with its own `levels`, `roof` (hip / gables / flat, colour), and optionally wall colour and bands.
  scene.ts draws each as a building of its own (the footprint's roof colour, id and facade) instead of the footprint;
  the OSM outline stays the solid and keeps carrying the wall parts (a mass's outer walls lie on the footprint's
  walls). Rings are the OSM outline cut along the LoD2 walls (Sutherland–Hodgman in the scratchpad, rounded to
  0.1 m); places.test checks that they tile the footprint (every sampled spot more than 0.3 m from a wall lies in
  exactly one mass). Masses per block, heights from the model:
  - West block 127872184: Sudetenstraße block 16 m eaves, hip 22° to the model's 19.3 m ridge, gables at the ends;
    the link 5.7 m flat (grey-green, the skylight roof); the north block 12.6 m, hip 19° (ridge 15.3 m); the NE strip
    6.8 m flat. The model's low shed roofs stepped at the ridge are drawn as gabled roofs that reach its ridge.
  - Rossmann 293545707: 12.3 m eaves (OSM's 4 storeys are right; "ground + 2 balcony storeys" is a tall shop floor),
    hip 18° to 15 m, gables at the ends; the 3.4 m strip along the NE side 5.2 m flat.
  - Penny 822461881: the block along the car park 15 m, hip 16.5° to 17.5 m, gables at the SW and NE ends; the
    store's hall behind it 6.9 m flat under a green roof (the DOP20's green: the hall is Penny's sales floor); the E
    block round the plaza 16.2 m, hip 26° to 19.4 m. The model's 7 m strip on the plaza side is left in the E block.
  - EDEKA 189042651: the hall flat at the shop front's 9.4 m (the model's roof falls 5.5° to 6.2 m at the NE wall;
    flattened), the entrance corner at the W end of the shop front (15.9 × 3.4 m) 5.9 m. OSM's 3.6 m box was 6 m low.
- **New generic parts** (dressing.ts, places.ts, tested in scene places.test): `roofSign { texture, edge, u0, u1, n0,
  n1, z0, z1, up? }`, a material lying over a rectangle in a wall's frame, z0 along n0 and z1 along n1 so it lies on
  a roof plane, the image's top towards `up`; `pylon { u, n, angle, w, d, h, colour, texture, z0, z1 }`, a box in
  the street frame with the texture on both broad faces; `canopy` got `fascia { h, colour }` (a board round its
  three outer sides; lettering goes on it as a wallSign with `out` = depth + 0.03) and `posts { every, colour }`
  (under its front, never solid). places.test keeps a canopy's fascia bottom above 2.5 m and a roof sign's corners
  inside the footprint.
- **Roof signs** (Codex boards, keyed and squared; `roof-denns`, `roof-rossmann`, `roof-edeka`, and `penny-sign`
  reused): denns over the NW third of the west block's Sudetenstraße roof plane, ROSSMANN on the car-park plane by
  the POI, EDEKA on the hall roof near the shop front past the entrance corner, PENNY on the hall's flat green roof
  by its NE wall, image top to the NNE: on the block's roof the plane up to the ridge (8.5 m) is too narrow for a sign
  that reads upright from the top-down camera. From `?compare=47.85685,11.4876,90` all four read.
- **PENNY (B1-5):** the LoD2 model has the free-standing canopy (`105019147`, function "Überdachung"): 12.2 × 5.4 m,
  4.6 m high, in front of wall 2 at u 5.5–17.7 (wall 2 runs from the NE end), 3.9 m out from OSM's wall (OSM's wall
  lies 1.5 m in front of the model's). So the canopy is on wall 2, not on wall 3 as the spec's area guessed; the
  aisle runs 8.5 m out, so canopy and posts stay clear of it. Light top (DOP20 #bbae9f), red fascia 1.1 m, grey posts
  every ~6 m, `penny-sign` 3.4 × 1.1 m on its front; `shop-front` glazing on wall 3 and wall 2 up to u 18; two
  `trolley-row` sprites (Codex, top-down) under the canopy; the PENNY. board 4.2 × 1.4 m on the end wall (wall 0)
  over the Ahorn corner at z 3.6–5.0.
- **Pylon:** in Penny's street frame at u −6, n 9.5 (world ≈ 4266.5, 4827): 5 m from the Ahorn corner, 5.5 m from
  the car-park entrance lane's centre, 4.5 m off Sudetenstraße's carriageway; 7.6 m high, 2 m wide, its four panels
  (`am-stern-pylon`, Codex: PENNY Am Stern, ROSSMANN, Ahorn Apotheke with the red A, Schlüsseldienst GEYER) facing
  both ways along Sudetenstraße. places.test keeps it and the trolleys off the carriageway and the sidewalk.
- **Balconies** (a guess in count, floors and depth): four storeys (z 4.5–13.5) along the west block's Sudetenstraße
  front, four (z 5.0–13.4, the lowest clear of the canopy) along Penny's car-park front, two (z 4.8, 8.2) along
  Rossmann's; white slabs, grey rails. Walls are `facade: "render"` in white (#f8f8f6).
- **Every other building is unchanged:** all 2111 chunk meshes hash identical at HEAD and with this change minus the
  four places; with them only chunks 1660–1662 (their own) differ.
- **Not done here / still open:** the unit signs (B3-1…B3-7, B4-4…B4-6); Rossmann's chimneys; the "2 Std." sign and
  the barrier posts in front of da Daniele (B3-7); EDEKA's front, fascia and yellow pylon (B3-1). Map labels: not
  touched (overlay.ts); Rossmann, PENNY, Ahorn, Denns and EDEKA still crowd within 250 m.
- **Screenshots** (local): `?compare=47.85685,11.4876,90` from above; on foot at (4260, 4822) the pylon at the
  corner; at (4276, 4794) the canopy's red fascia with PENNY at the bottom right.

### B3-1 · EDEKA Heininger & Dietz, Breslauer Weg 113 (#204, supermarket) — Size: S — status: implemented (partial: the band, canopy and porthole heights, how far the band and glazing run, the portholes' spots, the NW glazing, the pylon's size and spot, the exact yellow and the roof board are guesses)
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
- [x] From the SW car park the front matches 01/03; from above the roof decal reads EDEKA.
- [x] Car park (x 4362–4436, y 4797–4873) stays drivable. pnpm test + typecheck green.
Size: S
```

**B3-1 as built** (`src/world/places/edeka-am-stern.ts`, extending B3-0's masses and roof sign):
- **Sources.** `reference/edeka-am-stern/01–04` and `SOURCES.md` are on disk now (B3-0 did not have them) and were
  used for the front; heights from B3-0's LoD2 masses (hall 9.44 m, entrance corner 5.93 m), roof from the DOP20.
- **Walls** (`facade: render`, bands; the corner mass has its own): white glazed storey to 3.4 m, a light band to
  3.95 m, blue-grey panels `#48595c` to 8.6 m, white roof edge `#cacfd2` on top (corner: panels to 5.5 m, edge over).
- **Front, wall 1** (u 0 at the W corner): glazing (`shop-front`) u 5.6–55.6; a light canopy 1.6 m deep at 3.75 m
  along the whole front, clear of the car park (3.6 m out); Fleischwaren + opening-hours boards (`edeka-boards`) on the
  white corner u 1–4; the yellow band (`edeka-band`, "Heininger & Dietz") u 0.2–22 at z 4.35–5.45 with the blue
  EDEKA logo box (`edeka-logo`) proud of it at u 4.9–6.8; porthole bays (`edeka-panels`, 3.2 m) at u 25, 33, 41, 49.
- **NW wall on Breslauer Weg (wall 2):** glazing, no lettering, three porthole bays, the logo over the corner (01's
  left edge).
- **Pylon:** yellow "Heininger & Dietz" face with the E (`edeka-pylon`), 0.8 × 4.1 m, between the corner and the
  entrance, 3 m in front of wall 1 at u 5.5 (street frame u 20.38, n 14.04), its faces to the car park and the store.
- **Sprites:** Codex (five images), processed by `scripts/process-sprites.py`; the band's lettering is stretched
  into a 20:1 band so it keeps the photo's wide letters on the wall.
- **Generic test change:** places.test's "keeps bands within the walls" now measures a place with `masses` against
  its tallest mass, and each mass's own bands against that mass (before it used OSM's levels, 3.6 m here).
- **Guesses:** band, canopy and porthole heights (read off 01 against the LoD2 heights); how far the yellow band and
  the glazing run; porthole count and spots; the NW glazing; the pylon's size and spot; the yellow `#ffe31a`-ish
  (photo clipped); the roof board (B3-0). Not built: bakery Backhupferl, "Hahn im Korb" (no sign seen), the yellow
  cabinet in 03 (not identified), the seasonal pallets.
- **Every other chunk unchanged:** all 2111 chunk meshes hash identical before and after except chunk 1662 (EDEKA's).

### B3-2 · denns BioMarkt, Sudetenstraße 29 C (#82, supermarket) — Size: S — status: implemented (partial: where the cladding ends and the glazing starts, how far the glazing runs, the letters' spot and size, the ledge, the cladding's windows and the shop front standing flush with the balconies are guesses; no door drawn)
```
Goal: Green "denns BioMarkt" letters on a white band over a glazed front, NW unit of the west block.
Reference: docs/places/denns-biomarkt.md; reference/denns-biomarkt/01-street-front.png (key), 02 (height,
  NW canopy), 04-satellite.png.
Spec (via #0b, inside B3-0):
- POI #82 at 4208, 4747.7 (node sits ≈ 27 m behind the sign, in the north block: store may run deep; leave it).
- Way 127872184, SW edge, NW third: band #d9dedf, letters #8bd448; glass strip under; thin grey striped canopy
  at the NW end. Roof decal "denns" (green). Door position: needs reference.
Acceptance criteria:
- [x] From Sudetenstraße, denns sits NW of TAKKO as in 01. pnpm test + typecheck green. (TAKKO's own sign is B3-4.)
Size: S
```

**B3-2 as built** (`src/world/places/am-stern-west.ts`, on B3-0's west block; roof sign `roof-denns` from B3-0):
- **Sources.** `reference/denns-biomarkt/01–04` + `SOURCES.md` on disk and used: 01 and 02 for the front, 03 for the
  context. Heights from B3-0's masses (the block's 16 m, balconies from 4.5 m). No door is seen in the photos.
- **Wall 0** (Sudetenstraße, u 0 at the NW end): at u 0.6–9.4 white cladding with grey vertical grooves and three
  narrow poster windows (`denns-cladding`) under a thin grey ledge 1.9 m out at 3.35 m; at u 9.6–21.6 the dark-framed
  glazing with posters (`denns-front`, three 4 m bays) to 3.2 m; over both a white band to 4.4 m (a canopy's fascia
  under the lowest balcony) with the green "denns BioMarkt" letters (`denns-letters`, 6.6 × 0.8 m, z 3.45) at its NW
  end of the glazing.
- **Shop front flush with the balconies.** 01 shows no soffit between the white band and the first balconies, so the
  shop storey's front (glazing, cladding, band) stands on the balconies' front line, 1.4 m out of OSM's wall
  (`BALCONY_DEPTH`, now exported from `am-stern.ts`). It also keeps it in sight: from the play camera's 54 m straight
  down, a wall under 1.4 m balconies is hidden at every on-screen distance. Takko (B3-4) and Orterer (B3-5) will want
  the same line.
- **Sprites:** Codex (three images), processed by `scripts/process-sprites.py` (letters keyed and cropped, 8.3:1,
  stored square; front and cladding opaque).
- **Guesses:** the cladding's end and the glazing's start (u 9.4–9.6), the glazing's end at u 21.6 (Takko's start),
  the letters' spot and size, the ledge's depth and height, three cladding windows (02 shows three and a grey door;
  the door is left out), the shop front's line (above). Not built: the entrance door (not seen), the bike stands.
- **Every other chunk unchanged:** all 2111 chunk meshes hash identical before and after except chunk 1660 (the west
  block's).

### B3-3 · Rossmann, Sudetenstraße 33 (#65, drugstore) — Size: S — status: implemented (partial: the balcony floors, the pillars' spacing, how far the glazing runs, the letters' spot and size, the chimneys' spots, height and size, and the shop front standing flush with the balconies are guesses; no door drawn)
```
Goal: Red ROSSMANN letters on the white ground floor of the 3-storey balcony block with the terracotta roof.
Reference: docs/places/rossmann-am-stern.md; reference/rossmann-am-stern/01-street-front.png (key), 02, 03 (pylon).
Spec (via #0b, inside B3-0):
- POI #65 at 4251.4, 4773.7 (another "Rossmann" #36 exists). Way 293545707, SW (car-park) facade, sign centred
  near (4247.7, 4775.3): letters #d6666b on wall #cedae2; glass strip under.
- Levels 4 → 3 (photos: ground + 2 balcony storeys): ask first. Roof decal "ROSSMANN" (red). Door: needs reference.
Acceptance criteria:
- [x] Across the car park the block matches 01/02. pnpm test + typecheck green.
Size: S
```

**B3-3 as built** (`src/world/places/rossmann-am-stern.ts`, on B3-0's masses; roof sign `roof-rossmann` from B3-0):
- **Sources.** `reference/rossmann-am-stern/01–04` + `SOURCES.md` on disk and used: 01 for the front and the heights
  (read against the LoD2 eaves at 12.3 m), 02 for the context, 04 for the chimneys. Levels stay as B3-0 set them
  (the model's 12.3 m eaves; the photos' "3 storeys" is a tall shop floor and tall flats), so nothing to ask.
- **Front, walls 3 and 4** (the car-park front, u 0 at their NW ends, the bend by the POI between them): a colonnade,
  white posts about every 6.2 m (`canopy` with `posts`) carrying a white band from 3 m up under the lowest balcony
  (its fascia); the store's dark-framed glazing with posters (`rossmann-front`, five ~4 m panels) from wall 3 u 17.2
  to wall 4 u 10.2; the red ROSSMANN letters with the logo disc as the O (`rossmann-letters`, 6.9 × 0.95 m, z 3.7)
  on the band at wall 4 u 0.2. The bays NW and SE of the store stay closed white wall, as in 01. Like denns, band,
  posts and glazing stand on the balconies' front line (`BALCONY_DEPTH`).
- **Balconies** moved from B3-0's floors 4.8 / 8.2 m to 5.2 / 8.4 m (01's parapets start at about 5.3 and 8.5 m).
- **Chimneys:** four pairs (0.9 m apart) of terracotta chimneys with a darker cap, 7.6–8.1 m in from the front just
  short of the ridge, at u 6.2 and 18 on wall 3 and 4.8 and 17.2 on wall 4 (04 shows four dark pairs there; 01 their
  pots over the ridge), tops 0.8 m over the roof (15.8 m). Drawn with the generic `tower` part (a 0.44 m box with a
  cap), no engine change.
- **Sprites:** Codex (two images), processed by `scripts/process-sprites.py` (letters keyed and cropped, 7.26:1,
  stored square; the glazing opaque).
- **Guesses:** the balcony floors and depth, the pillars' spacing and their drawing as thin posts, where the glazing
  starts and ends, the letters' spot (01 has them centred a few meters SE of the bend; places.test wants a sign on one
  wall, so they start at wall 4's NW end) and size, the chimneys' spots (±1 m from 04), height and size, the shop
  front's line. Not built: the entrance door (not resolved in the photos), the blue parking sign on the glass.
- **Every other chunk unchanged:** all 2111 chunk meshes hash identical before and after except chunk 1662 (the
  Rossmann block's).
- **Screenshots** (local): `?compare=47.85705,11.48705,40` from above (ROSSMANN board, chimney pairs); on foot at
  (4247, 4783) the band with the red letters' edge under the balconies.

### B3-4 · Takko Fashion, Sudetenstraße 29b (#81, shop) — Size: S — status: implemented (partial: where the glazing ends, the panel's spot and size, the lettering colour and the shop front standing flush with the balconies are guesses; no door drawn)
```
Goal: The yellow-orange TAKKO panel on the middle unit of the west block's Sudetenstraße front.
Reference: docs/places/takko-am-stern.md; reference/takko-am-stern/01-street-front.png (key), 02.
Spec (via #0b, inside B3-0):
- POI #81 at 4195.3, 4751.3. Way 127872184, SW edge, middle unit: panel #e9cb76 with dark "TAKKO" lettering
  (exact lettering colour: needs reference); glass strip under. No map label (kind shop): HUD only.
Acceptance criteria:
- [x] Order denns · TAKKO · Orterer along Sudetenstraße as in takko/02. pnpm test + typecheck green.
      (Orterer's own corner is B3-5.)
Size: S
```

**B3-4 as built** (`src/world/places/am-stern-west.ts`, next to denns on B3-0's west block; no roof sign, as B3-0 says):
- **Sources.** `reference/takko-am-stern/01–04` + `SOURCES.md` on disk and used: 01 for the front, the panel and its
  size (read against the 3 m glazing), 02 and denns/01 for the order denns · TAKKO · Orterer and the glazing running on
  from denns' without a break. Heights from B3-0 / B3-2 (balconies from 4.5 m, the white band 3.2–4.4 m).
- **Wall 0** (u 0 at the NW end): Takko's dark-framed glazing with window displays (`takko-front`, three 3.2 m bays)
  from denns' end at u 21.6 to u 31.2, where 01's white pier with Orterer's logo starts (B3-5's); the white band
  (the fascia canopy B3-2 put in) now runs over both units to u 31.2; the yellow TAKKO panel (`takko-sign`,
  2.4 × 0.9 m, z 3.35–4.25) on the band over the middle bay, 0.03 m proud of it. Like denns, all on the balconies'
  front line (`BALCONY_DEPTH`), so from the play camera the glazing and the panel's yellow edge show under the balconies.
- **Sprites:** Codex (two images), processed by `scripts/process-sprites.py` (panel keyed and cropped, 2.67:1, stored
  square; the glazing opaque).
- **Guesses:** where the glazing ends (u 31.2) and its bays, the panel's spot and size, the lettering's charcoal
  (too small in 01 to sample), the shop front's line. Not built: the entrance door (not seen), the poster stands.
- **Every other chunk unchanged:** all 2111 chunk meshes hash identical before and after except chunk 1660 (the west
  block's).

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


### Batch 5: job places (decision)
Same rules: **exterior only** via **#0b**. These six are where jobs and the second save point happen, so each item
also lists what the code does there (read from `src/sim/town-jobs.ts`, `mission.ts` STOP_REACH = 9 m,
`shops.ts`, `game.ts` jobCar). Pickups/dropoffs are the raw POI points; three of them sit inside buildings.
⚠ Orterer Nord (#195) is 14 m inside its hall, so the "gelting-1" pickup looks unreachable: verify in game first.

### B5-1 · Gasthof Geiger, Tattenkofener Straße 1 (#181, food) — Size: S — status: ref-done (partial)
```
Goal: Old Bavarian inn by the B11 behind the Nikolauskapelle: white two-storey house, red-brown tiled roof,
  "Gasthof Geiger" painted in black script over the door. The mayor's Weißwürste end up here.
Reference: docs/places/gasthof-geiger.md; reference/gasthof-geiger/05-web-commons-nikolauskapelle.jpg (key,
  Commons CC BY-SA 3.0, 2012), 06-crop-sign.png, 04-satellite.png. No Street View coverage.
Spec (via #0b):
- Street frame "Bundesstraße" (B11), POI "Gasthof Geiger" (#181 at 2844.9, 4388). Way 122032724 (414 m²),
  lettered facade = W side (faces the B11 / chapel meadow).
- Roof colour → red-brown tile (engine DOP gives grey #44473f / beige #bca68e). White walls.
- W facade: black script "Gasthof Geiger" + dark beam above it, centred over a dark door with a wall lamp;
  grey-green curved window surrounds #414a49 on both floors; small bracket sign with a white/red blade.
- Gravel parking N of the house along the B11 (satellite). Beer garden / other sides: needs reference.
In-game: dropoff of job "weisswurst" (Rathaus phone; pickup Metzgerei Länger #219; 170 s, €2000).
  STOP_REACH 9 m: the point is inside the house, 6.3 m from the nearest wall → reachable when you come up
  to the house; the B11 kerb (14.4 m) alone is too far. Kind food → no map label.
Acceptance criteria:
- [ ] From the B11 the W facade matches 05 (white house, red roof, black script name, window surrounds).
- [ ] The weisswurst dropoff still triggers when the player stops at the house.
- [ ] pnpm test + typecheck green.
Size: S
```

### B5-2 · Petruskirche, Egerlandstraße 39 (#231, church) — Size: S — status: ref-done (partial)
```
Goal: The 1960 Lichtblau "concrete tent": a huge steep dark roof almost to the ground over peach walls,
  glass strips in the gable, and a tall free-standing peach tower with a red clock. Second "Jesus Saves" point.
Reference: docs/places/petruskirche.md; reference/petruskirche/05-web-dekanat.jpg (key), 08-crop-tower.png,
  06-web-parish-winter.jpg, 07-web-parish-drawing.png, 02-street-side.png, 04-satellite.png.
Spec (via #0b):
- POI "Petruskirche" (#231 at 2883.8, 2925.2), church way 121436739 (333 m²), Egerlandstraße 25 m E.
- Roof: steep pitched, dark grey shingle #403f40 (engine #717066 ok), eaves low. Walls peach #b69c85.
- Gable end: tall vertical glass strips #222223 between narrow pale pillars; round white cross emblem on the side wall.
- Bell tower = way 188048958 ("Kirchturm Petruskirche", 20 m², ~21 m N): engine has it at 2 levels → needs a
  height override (slim prism, many times the church eave); peach render, dark louvre near the top, clock with
  red hands + red marks painted on the wall (no dial), small windows, cross on top. Exact height: needs reference.
- Mosaic "Petruskirche" + St Peter, bronze portal, front of the entrance gable: needs reference (text sources only).
In-game: save point (shops.ts SAVE_AT), €500, foot pad 1.8 m, re-arm after 8 m. Pad = spotNear: first free
  road/path spot ≤40 m, not under tree crowns → probably the footway ~14 m from the POI; runtime decides.
  Kind church → no map label.
Acceptance criteria:
- [ ] From the camera the church reads as a dark tent roof with a separate tall tower next to it (05/06).
- [ ] The save pad is visible (not under the trees) and still works.
- [ ] pnpm test + typecheck green.
Size: S
```

### B5-3 · Bäckerei Mühlenbäck, Fasanenweg / Egerlandstraße 54 (#46, bakery) — Size: S — status: todo (needs reference)
```
Bakery in the Fasanenweg shop row (way 1466483403, 3245 m², flat), Fasanenweg kerb 11.1 m. Satellite only:
no shop front, no sign → no look spec (do not copy the Stein branch). See docs/places/muehlenbaeck-zentrum.md.
In-game: pickup of the first job "brezn" (home phone; → Rehmaus Apotheke #168; 150 s, €1500), chosen by
across(): nearest Mühlenbäck > 300 m from home. STOP_REACH 9 m: point 0.4 m inside the wall → reachable.
Need: a Street View/photo of the front on Fasanenweg or Egerlandstraße 54.
```

### B5-4 · Metzgerei Länger, Amselweg 9 (#219, shop) — Size: S — status: ref-done
```
Goal: Family butcher on Amselweg: white house with red-brown pilasters, a big black cow painted on the wall,
  an old crest sign with ram, cow and pig heads, a red/white awning. Where the mayor's Weißwürste come from.
Reference: docs/places/metzgerei-laenger.md; reference/metzgerei-laenger/01-street-front.png (key), 02, 03, 04,
  05-web-crest.png (crest artwork), 06-web-logo.png.
Spec (via #0b):
- Street frame "Amselweg" (kerb 17 m NE, bearing 135°), POI "Metzgerei Länger" (#219 at 2659, 2499.5),
  way 858188287 (660 m², pitched, red-brown tiles). White walls, red-brown pilaster strips #7c5e68.
- Ground-floor shop front, dark green fascia #2d3537; black cow silhouette #242b37 upper left; crest
  (05: "Aus Liebe zum Handwerk / Metzgerei Länger") centre-right + one at the corner; red/white striped awning
  over the left window; pig picture board over the door; dark menu boards with round food photos.
- Light paved forecourt #ded5c3 with benches and planters; garages beside.
In-game: pickup of job "weisswurst" (Rathaus phone; → Gasthof Geiger #181). STOP_REACH 9 m: point 5.8 m
  inside the wall → reachable at the shop front, not from Amselweg (17 m). Kind shop → no map label.
Acceptance criteria:
- [ ] From the forecourt the front matches 01 (cow, crest, awning, green fascia). Forecourt walkable.
- [ ] The weisswurst pickup still triggers at the shop front.
- [ ] pnpm test + typecheck green.
Size: S
```

### B5-5 · Orterer Getränkemarkt, Banater Straße 3 (#195, shop) — Size: S — status: ref-done
```
Goal: Drinks market hall with a solar roof and the red-striped Orterer arch by the car park. The Bauernmafia's
  Weißbier run starts here.
Reference: docs/places/orterer-nord.md; reference/orterer-nord/01-street-front.png (key), 02, 03, 04,
  05-web-logo.png.
Spec (via #0b):
- POI "Orterer Getränkemarkt" with y < 3000 (#195 at 2306.5, 2063.1), way 187819175 (903 m²). Banater Straße
  kerb 42.3 m (bearing 223°); car-park service roads 19 / 32 m.
- Fix the shape: **one storey, pitched red-tile roof #cc8467 covered with solar panels #909bb7** (engine:
  2 levels, flat #a49e8e — wrong). White walls #fdfdfb, wide blue-framed windows with posters.
- Glass canopy over the entrance with the round blue/white Orterer logo above it.
- Prop: free-standing arched pylon (red/white striped half-sun #e51e23, blue "Orterer" #1470b7,
  "Getränke-Märkte") at the car-park entrance; red/white barrier posts; light paving.
In-game: pickup of job "gelting-1" (Gelting gang phone; → Biometzgerei Pichler Großhandel #211; 150 s, €2000).
  ⚠ STOP_REACH 9 m but the point is 14.0 m inside the hall → probably unreachable. Verify; the fix (move the
  pickup to the entrance, or snap job places to a reachable spot) is a code decision for the dev.
Acceptance criteria:
- [ ] From the car park the hall matches 01 (one storey, solar roof, canopy logo, arch pylon).
- [ ] The gelting-1 pickup can be reached and triggers.
- [ ] pnpm test + typecheck green.
Size: S
```

### B5-6 · Kaufland, Bayerwaldstraße 2 (#180, supermarket) — Size: S — status: ref-done (partial)
```
Goal: The big Kaufland hall in the north with its solar roof and red K sign over a large car park, where the
  councillor's BMW gets wrecked.
Reference: docs/places/kaufland.md; reference/kaufland/02-street-side.png (key, from Blumenstraße), 04-satellite.png.
Spec (via #0b):
- POI "Kaufland" (#180 at 2244.3, 1880.5), way 121822645 (6373 m², 1 level, flat). Car-park service roads
  ~31 m; Thüringer-Wald-Straße 41 m; Blumenstraße on the W/SW side.
- White sign band #d7dee0 with red square K logo + red "Kaufland" #cc4644 on the Blumenstraße side; solar
  panels on the roof #616f86 (roof shape: needs reference). Low wall along Blumenstraße.
- Entrance, trolley bays, mall signs (Ihle, Deichmann, Vinzenzmurr, Dönerworks …), charging station: needs reference.
In-game: job "kaufland" (Rathaus phone, after weisswurst): destroy a BMW (model 1), 120 s, €3500. jobCar parks it
  at the right-hand kerb of the nearest road within 80 m → most likely a car-park aisle (POI is 26.5 m inside
  the hall). Kind supermarket → map label "Kaufland".
Acceptance criteria:
- [ ] From Blumenstraße the hall matches 02 (sign band with red K, solar roof).
- [ ] The BMW still spawns on a drivable aisle in view of the sign.
- [ ] pnpm test + typecheck green.
Size: S
```

### Batch 6a: start area, nearest 10 (decision)
Same rules as batches 1–5: **exterior only** (Size S), everything plugs into **#0b** (wallSign / awning / sprite parts in the
street frame), no interiors (#0c not needed), no new ShopKind. Rows are in the Start area section and P2–P6. Photos:
reference/<slug>/ (gitignored by #0); docs: docs/places/<slug>.md. The first six sit in two OSM buildings right at the spawn:
way 127604891 (Sudetenstr. 17–19: unit 17 · Angel Nails · Mühlenbäck) and way 127604887 (Sudetenstr. 11–15: VR-Bank · Bodystreet ·
Stroblume · Dolce Gelato, NW→SE), both NE of Sudetenstraße (bearing 304°). Build B6a-1…B6a-5 as one pass so the signs line up.
Open questions for Alex: HoangAnh vs Deliqos (B6a-2), Autohaus name (B6a-8), drop Quelle (B6a-9).

### B6a-1 · Angel Nails, Sudetenstraße 19 (#154, shop) — Size: S — status: ref-done
```
Goal: Pink nail studio right next to the spawn: pink fascia, pink pillar by the door, NW of the Mühlenbäck front.
Reference: docs/places/angel-nails.md; reference/angel-nails/02-street-side.png (key), 05-crop-sign.png, 01, 04.
Spec (via #0b):
- Street frame "Sudetenstraße", POI "Angel Nails" (#154 at 4000.2, 4648.4). Way 127604891, NE frontage, immediately NW of
  the Mühlenbäck sign (B2-1). Fascia wallSign pink #ec86a0 (~5 m) with white "Angel Nails"; pillar strip #9b4668 left of the door.
- Wall stays as the building (#b5b7b4 white/cream). No canopy of its own.
Acceptance criteria:
- [ ] From the spawn the pink fascia is visible left of Mühlenbäck, matching 02. The player still spawns on the pavement.
- [ ] pnpm test + typecheck green.
Size: S
```

### B6a-2 · HoangAnh, Sudetenstraße 17 (#12, food) — Size: S — status: todo (needs reference; ask Alex)
```
Unit 17 (NW end of way 127604891). Listings (2024–2026) and the Google pin say HoangAnh is open, but Street View (Aug 2022)
shows the unit dressed as Deliqos Burger & Pizza (also listed at Sudetenstr. 17). No HoangAnh photo: nothing to build
until Alex decides HoangAnh / Deliqos / both. See docs/places/hoanganh.md.
```

### B6a-3 · Dolce Gelato, Sudetenstraße 15 (#47, food) — Size: S — status: ref-done
```
Goal: Ice-cream café with a red awning and white chairs at the SE end of the VR-Bank row.
Reference: docs/places/dolce-gelato.md; reference/dolce-gelato/01-street-front.png (key), 02, 04.
Spec (via #0b):
- Street frame "Sudetenstraße", POI "Dolce Gelato" (#47 at 3980.5, 4636.4). Way 127604887, NE frontage, SE end.
- White sign plate #d9d5da "Dolce Gelato" above a red awning #d46172 (~10 m). 4–6 white chairs + 2 small tables under it;
  blue P-sign sprite + street tree as in 01 (only if trees/signs are already supported; else skip).
Acceptance criteria:
- [ ] Front matches 01; pavement stays walkable past the chairs.
- [ ] pnpm test + typecheck green.
Size: S
```

### B6a-4 · Stroblume, Sudetenstraße 15 (#155, shop) — Size: S — status: ref-done
```
Goal: Florist with a long red awning and a table of potted flowers on the pavement.
Reference: docs/places/stroblume.md; reference/stroblume/01-street-front.png (key), 02, 04.
Spec (via #0b):
- Street frame "Sudetenstraße", POI "Stroblume" (#155 at 3973.7, 4631.2). Way 127604887, NE frontage, between Bodystreet (NW)
  and Dolce Gelato (SE). Red awning #d25f5e (~10 m) with white script "Stroblume"; wall #c4bba2.
- Props: plant table + pots + a red heart sign on a stand (keep ≥2 m clear).
- Bodystreet (NW neighbour, not a POI yet, see I-1): black band #181718 "BODY STREET" + maroon awning in 02/05; dress it
  only once its POI exists.
Acceptance criteria:
- [ ] Front matches 01 (awning, script, plants). pnpm test + typecheck green.
Size: S
```

### B6a-5 · VR Bank München Land, Sudetenstraße 11 (#13, bank) — Size: S — status: ref-done
```
Goal: The bank at the NW corner of the row: orange ground floor, blue "VR Bank München Land" letters, grey canopy.
Reference: docs/places/vr-bank-zentrum.md; reference/vr-bank-zentrum/01-street-front.png (key), 02, 04.
Spec (via #0b):
- Street frame "Sudetenstraße", POI "VR-Bank" (#13 at 3957.8, 4620.3). Way 127604887, NE frontage, NW end (car park on its NW side).
- Ground-floor band orange #e2a470 (sun) / #d68756 (shade), 0–3.5 m, only on the bank part; upper wall stays white (#e1e4e7).
- Letters wallSign blue #5574d5 + square VR logo above a grey canopy strip #787c75.
- ATM position: needs reference (OSM atm=yes). Do not add one.
Acceptance criteria:
- [ ] Front matches 01; the orange band does not bleed onto Bodystreet. pnpm test + typecheck green.
Size: S
```

### B6a-6 · KIND Augenoptik, Sudetenstraße 10 (#115, shop) — Size: S — status: ref-done
```
Goal: Optician on the corner opposite the VR-Bank: dark-blue "KIND" band wrapping the corner of a white block.
Reference: docs/places/optik-kind.md; reference/optik-kind/01-street-front.png (key), 02, 03, 04.
Spec (via #0b):
- Street frame "Sudetenstraße", POI "Optik Kind Geretsried-Zentrum II" (#115 at 3944.9, 4641.7). Way 538512734, SW side of
  Sudetenstraße, Sudetenstraße/Kirchweg corner. Blue band #305499 with white "KIND" ×3, wrapping the corner; wall #b4b7c1.
- Props: A-board sprite. Leave the NW part of the frontage free for the Bistro Malor terrace (B6a-7).
Acceptance criteria:
- [ ] From the VR-Bank pavement the corner matches 01/03. pnpm test + typecheck green.
Size: S
```

### B6a-7 · Bistro Malor, Sudetenstraße 10 (#120, food) — Size: S — status: ref-done (partial)
```
Goal: Bistro terrace beside the KIND corner: wood tables, rattan chairs, low hedges.
Reference: docs/places/bistro-malor.md; reference/bistro-malor/05-web-terrace.jpg (key, website), 06-web-logo.png, 07-crop-sv-terrace.png.
Spec (via #0b):
- Street frame "Sudetenstraße", POI "Bistro Malor" (#120 at 3929.9, 4632.5). Way 538512734 (shared with KIND), NW part, street side.
- Terrace part ~8×5 m: wood tables + brown rattan chairs, low hedge strip around it.
- Terrace roof: website shows a dark steel frame, Street View a dark-red roof: needs reference → build no roof yet.
- Restaurant facade sign: needs reference (logo #a82b1c / #464140 exists, but not seen on the building) → no wallSign.
Acceptance criteria:
- [ ] Terrace next to the KIND corner, pavement walkable. pnpm test + typecheck green.
Size: S
```

### B6a-8 · Autohaus Billion, Sudetenstraße 25 (#178 "Audi;Seat;Škoda;Volkswagen", shop) — Size: S — status: ref-done
```
Goal: VW dealer SE of the start: white block, terracotta awnings, VW pylon + flags, cars on a paved forecourt.
Reference: docs/places/autohaus-billion.md; reference/autohaus-billion/01-street-front.png (key), 02, 03, 05-crop-side-sign.png, 04.
Spec (via #0b):
- Street frame "Sudetenstraße", POI "Audi;Seat;Škoda;Volkswagen" (#178 at 4071.5, 4676.3; the POI is the building centre,
  26.5 m from the kerb). Way 120402846 street (SW) edge: segmented terracotta awnings #f5bb95, white name plate
  #fdfdfe "Autohaus Billion"; showroom glass between grey pillars #6f7477.
- Props at the NW end of the forecourt: VW pylon #d7d7d6 + 3 flags; 4–6 static parked cars on the forecourt.
- Naming: the POI name is the OSM brand list (build.ts `brand ?? name`). Do NOT rename here; Alex decides (see doc).
Acceptance criteria:
- [ ] From Sudetenstraße the front matches 01/02; forecourt cars do not block the road. pnpm test + typecheck green.
Size: S
```

### B6a-9 · Quelle (#11, shop) — Size: S — status: todo (needs reference; probably closed)
```
OSM node 370882637 (shop=electronics, no address) sits in a small house on Beethovenweg/Kirchweg. Directories list a
"Quelle-Agentur" (mail-order agency) at Beethovenweg 2; Quelle agencies ended with the 2009 insolvency. Street View: houses,
no sign. Nothing to build. Ask Alex whether to drop the POI. See docs/places/quelle-sudetenstrasse.md.
```

### B6a-10 · Gaststätte Isarwinkel, Richard-Wagner-Straße 14 (#177, food) — Size: S — status: ref-done (partial)
```
Goal: Old-style Gaststätte with its name painted on the wall, a landscape mural, a tiled porch roof and red awnings.
Reference: docs/places/gaststaette-isarwinkel.md; reference/gaststaette-isarwinkel/01-street-front.png (key), 02, 04, 05.
Spec (via #0b):
- Street frame "Richard-Wagner-Straße" (not Sudetenstraße), POI "Gaststätte Isarwinkel" (#177 at 3890.5, 4793.3).
  Way 119894071, W street edge. Wall tint #b89a86; dark lettering "GASTSTÄTTE ISARWINKEL"; mural panel upper right;
  terracotta tile lean-to #c8886f over the door; red awnings #fbb2b0 along the ground floor.
- Props: hedge strip + planters in front; pole sign by the car park with a plain white "Restaurant Isarwinkel" board
  (brewery roundel unreadable → leave it out).
Acceptance criteria:
- [ ] Front matches 01/02. pnpm test + typecheck green.
Size: S
```

### Batch 6b: start area, next 8 (decision)
Same rules as 6a: **exterior only** (Size S), everything through **#0b**, no interiors, no new ShopKind. Flamingo (#152) and
Fellomenal (#158) are batch 4 (B4-10/B4-11). Street View had no usable fronts for these 8 (only distant/obstructed views and
one interior photosphere), so the references are: **BVV DOP20 orthophoto** + **BVV LoD2 3D model** (both CC BY 4.0, credit
"© Bayerische Vermessungsverwaltung – www.geodaten.bayern.de"), business websites (logos, reference only) and OSM tags. Result:
massing and roof are known for all 8, **no shop front was seen for any of them**, so no wallSign/awning/props yet: every item
below only does what the data shows (levels, roof colour) and is marked "needs facade reference".
Wikimedia Commons has nothing for these buildings; Mapillary needs an OAuth token (not used).
Finding: **multipolygon buildings are dropped by the import** (scripts/import-osm.ts fetches only `way["building"]`), so the
Karl-Lederer-Grundschule (relation 2014408) is missing in-game (B6b-2).
Open questions for Alex: miwomo closes end of 2026 → keep / rename to THOMA Reisemobile / drop (B6b-1); Mittelschule merger and
OSM name (B6b-4); POI name "Bellini" → "Hair & Style Bellini"? (B6b-5); Ana's vs ZER-O-WASH at Händelstraße 2 (B6b-8);
apply the LoD2 levels below now, or wait for facade photos?

### B6b-1 · miwomo / THOMA Reisemobile, Breslauer Weg 9 (#138, shop) — Size: S — status: todo (needs facade reference; ask Alex)
```
Massing already matches: way 127872177, engine levels 2 + flat roof #f5ece5 = LoD2 (flat, 7.9 m) + DOP (#f6ebe5). Nothing to
build. Street View (Nov 2022, text only): grey two-storey workshop with red trim behind trees, no sign. miwomo.de: the rental
closes at the end of 2026; THOMA Reisemobile (caravan repairs, same address) continues. Do not add a miwomo sign (never seen on
the building). Alex decides the POI name. See docs/places/miwomo.md.
```

### B6b-2 · Karl-Lederer-Grundschule, J.-S.-Bach-Straße 4 (#228, school) — Size: S (after the import fix) — status: todo (needs facade reference + import fix)
```
Goal: The primary school exists in-game as a ring-shaped 3-storey-high block around a courtyard, with a light-grey flat roof.
Reference: docs/places/karl-lederer-grundschule.md; reference/karl-lederer-grundschule/01-dop20-ortho.jpg, 02 (outline),
03/04 (LoD2 massing).
Blocker: scripts/import-osm.ts only fetches way["building"], so OSM relation 2014408 (type=multipolygon, building=yes; outer
way 127604842, inner courtyard way 156041502) never becomes a building. Fold "keep multipolygon buildings (outer + holes)" into
I-1 or a small import item first; check how many other relation buildings in the bbox are missing.
Spec (via #0b, once the building exists):
- POI "Karl-Lederer-Grundschule Geretsried" (#228 at 3800.4, 4825.3, in the courtyard). levels 3 (LoD2: flat roofs 9.5–10.4 m,
  one low gable wing 9.7–10.3 m), roof colour #c0b8ab, flat.
- Walls, windows, entrance, the 2018 timber storey: needs reference. No wallColour, no signs.
Acceptance criteria:
- [ ] The ring block with its open courtyard stands where the DOP shows it; the POI is in the courtyard, not inside a wall.
- [ ] pnpm test + typecheck green.
Size: S
```

### B6b-3 · Friseurteam Haar Genau, Carl-Maria-von-Weber-Weg 34 (#54, shop) — Size: S — status: todo (needs facade reference)
```
Goal: The salon's building gets its real height: a 5-storey-high flat-roof block.
Reference: docs/places/haar-genau.md; reference/haar-genau/01-dop20-ortho.jpg, 03/04 (LoD2), 06-web-logo.jpg (logo, reference only).
Spec (via #0b):
- POI "Haar Genau Friseurteam" (#54 at 3734.1, 4574). Way 127604894: levels 5 (LoD2 main roof 16.2 m = 5×3 + 0.6 parapet);
  roof stays flat (#b4aa9b engine / #aaac9e DOP). The 18.9 m rooftop box and the 4.1 m low part are not modelled.
- Logo exists (teal-green #05e49a "HAAR" + dark #25170e "GENAU", scissors-G) but where it hangs is not seen → no wallSign.
Acceptance criteria:
- [ ] Only way 127604894 gets taller; neighbours unchanged. pnpm test + typecheck green.
Size: S
```

### B6b-4 · Karl-Lederer-Mittelschule (OSM: Hauptschule), J.-S.-Bach-Straße (#186, school) — Size: S — status: todo (needs facade reference; ask Alex)
```
Goal: The Mittelschule gets its real height: a long ~13 m block with a lower N wing.
Reference: docs/places/karl-lederer-mittelschule.md; reference/karl-lederer-mittelschule/01-dop20-ortho.jpg, 03/04 (LoD2).
Spec (via #0b):
- POI "Karl-Lederer-Hauptschule Geretsried" (#186 at 3740.9, 4830.9). Way 127604843: levels 4 (LoD2 main roofs 12.8–14.1 m,
  very low gable → keep flat, roof #d3cfcd). N wing way 188651575: levels 3 (LoD2 9.6–11.1 m).
- Walls (Street View: "light multi-storey block through trees", no capture), entrance, sign: needs reference.
- Name: do not rename; Alex decides (school is being merged into the Adalbert-Stifter-Mittelschule by 2029–2031).
Acceptance criteria:
- [ ] Only the two school ways change height. pnpm test + typecheck green.
Size: S
```

### B6b-5 · Hair & Style Bellini, Neuer Platz 22 (#159, shop) — Size: S — status: todo (needs facade reference; ask Alex)
```
Goal: The long Neuer Platz block (Bellini and its neighbours) gets its real height: 4 storeys under a brown gable roof.
Reference: docs/places/bellini.md; reference/bellini/01-dop20-ortho.jpg, 03/04 (LoD2), 06-web-logo.png (logo, reference only).
Spec (via #0b):
- POI "Bellini" (#159 at 3668.4, 4674.7). Way 127604892 (L-shaped, whole block): levels 4 (LoD2 eaves 12.2–13.6 m, ridges
  14.4–16.0 m); keep pitched + the DOP roof colours (#a29078). This changes every tenant in the block; the LoD2 splits it into
  11 segments (Bellini's: 4602775, eave 12.2 m, plus a 3.9 m single-storey part) if per-part masses are preferred (as for Am Stern).
- Salon front: not seen; plaza (W) or car-park (E, address node Neuer Platz 22) side unknown → no wallSign. Logo: light-grey
  #d3cfcf "HAIR&STYLE" + purple #86639b script "Bellini".
- Not the same place as Ammos (B6b-6).
Acceptance criteria:
- [ ] The block is taller, the plaza stays open and walkable. pnpm test + typecheck green.
Size: S
```

### B6b-6 · Restaurant Ammos, Neuer Platz 9 (#58, food) — Size: S — status: todo (needs facade reference)
```
Goal: Ammos' low building N of the Neuer Platz fountain gets its grey-green roof.
Reference: docs/places/ammos.md; reference/ammos/01-dop20-ortho.jpg, 03/04 (LoD2).
Spec (via #0b):
- POI "Restaurant Ammos" (#58 at 3655.2, 4645.4). Way 188651577: roof { colour: "#858d7e" } (engine has no DOP colour here);
  levels stay 2 (LoD2 eave 7.0 m, ridge 7.9 m).
- Facade, sign, terrace furniture: needs reference (only an interior photosphere exists). No props.
Acceptance criteria:
- [ ] Roof colour matches 01. pnpm test + typecheck green.
Size: S
```

### B6b-7 · Pia's Hair & Beauty, J.-S.-Bach-Straße 11a (#161, shop) — Size: S — status: todo (needs facade reference)
```
Massing already matches: way 127604860, engine levels 2 + pitched + DOP roof colours = LoD2 (eave 6.8 m, ridge 10.0 m) + DOP
(red tiled roof #d8a384 with roof windows). Street View (text only): cream residential block, red roof, no sign. Nothing to
build until a photo shows the 11a entrance/sign. See docs/places/pias-hair-beauty.md.
```

### B6b-8 · Ana's Waschservice, Händelstraße 2 (#16, shop) — Size: S — status: todo (needs reference; ask Alex)
```
OSM node 370891567 (shop=laundry, no address) sits in way 127604869, whose outline carries the address node Händelstraße 2.
Old listings: "Ana's Wäscheservice", Händelstr. 2. zerowash.de (ZER-O-WASH laundry pickup service) also gives Händelstraße 2.
Which name trades there is unknown → no sign. Independent of the name, the massing is wrong: LoD2 = hipped roof, eave 20.4 m,
ridge 21.9 m (+ a 4.6 m low part); engine has levels 2. Optional: #0b levels 7 on way 127604869 (DOP roof #a39179).
See docs/places/anas-waschservice.md.
```

## Start area (everything within ~800 m of the start)

Start = Sudetenstraße 19 spawn at map (3997.4, 4648.0). Radius 800 m, map metres (project.ts). Source: public/geretsried.map.json pois
at HEAD c5af0a7, statuses from the priority list below. 64 POIs in the map are within 800 m: 41 todo, 23 already ref-done/partial/implemented (before 6a; after 6a: 33 todo, 31 done/partial/implemented).
Capture order: nearest first, ~10 per batch: 6a (done) → 6b (researched; no fronts seen) → 6c → 6d → then 6e + all gyms, once I-1 has made them POIs.
Exterior only, same rules as batches 1–5 (NEVER invent appearance).

### 6a (captured 2026-10-25: B6a-1…B6a-10)
| # | Name | Kind | m from start | Status |
|---|---|---|---|---|
| 154 | Angel Nails | shop | 3 | ref-done |
| 12 | HoangAnh | food | 6 | todo (needs reference; unit shows Deliqos) |
| 47 | Dolce Gelato | food | 20 | ref-done |
| 155 | Stroblume | shop | 29 | ref-done |
| 13 | VR-Bank | bank | 48 | ref-done |
| 115 | Optik Kind Geretsried-Zentrum II | shop | 53 | ref-done |
| 120 | Bistro Malor | food | 69 | ref-done (partial) |
| 178 | Audi;Seat;Škoda;Volkswagen | shop | 79 | ref-done |
| 11 | Quelle | shop | 154 | todo (needs reference; probably closed) |
| 177 | Gaststätte Isarwinkel | food | 180 | ref-done (partial) |

### 6b (researched 2026-10-25 from DOP20/LoD2/web: B6b-1…B6b-8; no shop fronts seen)
| # | Name | Kind | m from start | Status |
|---|---|---|---|---|
| 138 | miwomo | shop | 248 | todo (needs facade reference; closes end 2026, ask Alex) |
| 228 | Karl-Lederer-Grundschule Geretsried | school | 265 | todo (needs facade reference; building missing in-game: import fix) |
| 54 | Haar Genau Friseurteam | shop | 274 | todo (needs facade reference; massing ref-done) |
| 186 | Karl-Lederer-Hauptschule Geretsried | school | 315 | todo (needs facade reference; ask Alex) |
| 159 | Bellini | shop | 330 | todo (needs facade reference; massing ref-done) |
| 152 | Flamingo Damenmode | shop | 341 | todo (needs reference; B4-10) |
| 58 | Restaurant Ammos | food | 342 | todo (needs facade reference; massing ref-done) |
| 158 | Fellomenal Hundesalon | shop | 343 | todo (needs reference, probably moved; B4-11) |
| 161 | Pia's Hair & Beauty | shop | 356 | todo (needs facade reference; massing ref-done) |
| 16 | Ana’s Waschservice | shop | 360 | todo (needs reference; Ana's or ZER-O-WASH, ask Alex) |

### 6c
| # | Name | Kind | m from start | Status |
|---|---|---|---|---|
| 160 | Feinkost Christos | shop | 377 | todo |
| 73 | BRK KleiderMarkt | shop | 380 | todo |
| 18 | Isar-Apotheke | pharmacy | 381 | todo |
| 121 | Dr. Schmucker | doctor | 385 | todo |
| 57 | Munzur Kebap | food | 392 | todo |
| 17 | Juchheim Cosmetics | shop | 419 | todo |
| 5 | Bäckerei Backhupferl | bakery | 438 | todo |
| 19 | Italy | food | 468 | todo |
| 97 | Zirngibl Bestattungen GmbH | shop | 484 | todo |
| 234 | Aussegnungshalle | church | 509 | todo |

### 6d
| # | Name | Kind | m from start | Status |
|---|---|---|---|---|
| 218 | Carglass | car_repair | 552 | todo |
| 79 | Piatsa | food | 659 | todo |
| 98 | Arztpraxis Lewke | doctor | 664 | todo |
| 26 | KFZ-Meisterbetrieb Gerd Matheis | car_repair | 678 | todo |
| 128 | Fitness Forum & Squash | food | 690 | todo |
| 189 | Franz-Marc-Schule | school | 701 | todo |
| 106 | Bäckerei Manfred Burger | bakery | 720 | todo |
| 59 | Schreibwaren Schröter | shop | 726 | todo |
| 217 | Occasione Mode & Livestyle | shop | 750 | todo |
| 233 | Christuskirche | church | 767 | todo |
| 78 | BSZ Direktmarketing GmbH | shop | 783 | todo |

### Already done in the start area (no capture needed)
| # | Name | Kind | m from start | Status |
|---|---|---|---|---|
| 48 | Mühlenbäck | bakery | 8 | implemented (partial) |
| 168 | Rehmaus Apotheke | pharmacy | 50 | implemented |
| 170 | Spielwaren Krömer | shop | 135 | ref-done |
| 56 | Cafe Waldmann | food | 148 | implemented |
| 166 | Woolworth | shop | 157 | ref-done |
| 169 | Sun Style Bodystyling Studio | shop | 173 | ref-done |
| 114 | Nexial | shop | 188 | ref-done |
| 116 | GG-Radsport | shop | 190 | ref-done |
| 157 | Aphrodite-aestetic | shop | 190 | ref-done |
| 15 | TEDi | shop | 205 | ref-done |
| 80 | Orterer Getränkemarkt | shop | 221 | ref-done (partial) |
| 81 | Takko Fashion | shop | 223 | implemented (partial) |
| 82 | Denns BioMarkt | supermarket | 233 | implemented (partial) |
| 134 | B&L Hairstyling | shop | 253 | ref-done |
| 65 | Rossmann | drugstore | 283 | implemented (partial) |
| 150 | Deutsche Post Filiale 571 | post | 4238.7, 4832.4 | 47.856541, 11.486828 | 303 | implemented (partial) | B2-2. Job "post": van spawns on Sudetenstraße (far kerb). Yellow Post board a guess (no photo) |
| 232 | Maria Hilf | church | 3831.3, 4907.8 | 47.855863, 11.481366 | 309 | implemented (partial) | save point (Jesus Saves); Johann-Sebastian-Bach-Straße |
| 77 | da Daniele | food | 329 | ref-done |
| 67 | Ahorn Apotheke | pharmacy | 330 | ref-done |
| 66 | PENNY | supermarket | 331 | implemented (partial) |
| 20 | Sparkasse | bank | 3550.6, 4719.7 | 47.857555, 11.477603 | 453 | implemented | Stein branch, Händelstraße (no addr in OSM; Nominatim) |
| 204 | EDEKA | supermarket | 459 | implemented (partial) |
| 103 | Automobilwerkstatt Wilhelm | car_repair | 4706.9, 4824.3 | 47.856614, 11.493106 | 731 | implemented (partial) | B2-3. Spray shop (pad on the NW lane, unchanged) + "mercedes" drop-off. Front = NW wall (DOP20 + POI); band length, sign spot, logo orange are guesses |

### 6e: not in the map yet: pending I-1 (import), capture after 6b–6d together with the gyms
Status: every row below is todo until I-1 lands; I-1 uses this table as its check list. Capture (exterior) only after the
POI exists, then add the new #id from docs/poi-id-map.csv.
Overpass, 2026-10-25: shop/amenity/leisure/office/craft/healthcare/tourism within 800 m of lat 47.858199, lon 11.483593,
minus street furniture (parking, benches, bins, ATMs …) and minus everything that matched a map POI by name/position.
45 OSM features are not in the map; plus 4 studios from web search that are not in OSM at all (marked web).
Why they are missing: scripts/import-osm.ts PLACES_QUERY only asks for shop=* and a fixed amenity list; it never asks for
leisure, office, craft, healthcare, or amenity dentist/veterinary/kindergarten/social_facility/bar/nightclub/dojo.

| OSM | Name | Tag | Address | m from start | Note |
|---|---|---|---|---|---|
| node 370882651 | Bodystreet | leisure=fitness_centre | Sudetenstraße 13 | 39 | gym (see Gyms) |
| way 666167813 | Sonnengarten | amenity=social_facility | Sudetenstraße 18 | 90 |  |
| way 127604847 | Pflegeheim St. Ursula | amenity=social_facility | Sudetenstraße 5 | 92 |  |
| node 12430682955 | Rechtsanwalt Stevan Krnjaic | office=lawyer |  | 168 |  |
| node 12430682954 | Beautydate | office=beauty |  | 172 |  |
| node 12430682956 | FMDienste | craft=cleaning |  | 175 |  |
| node 12430682957 | Selbstverteidigungsschule PT-Kubis | amenity=dojo |  | 181 | gym/martial arts (see Gyms) |
| node 370882638 | Versicherungmakler Kafka | office=insurance | Sudetenstraße 24 | 183 |  |
| node 7216140246 | Taxiunternehmen Kottysch | office=company | Danziger Weg 8 | 194 |  |
| way 919079656 | Caritas Kindergarten | amenity=kindergarten |  | 226 |  |
| way 127872197 | Classic ShishaBar Lounge Geretsried | amenity=bar | Breslauer Weg 11 | 233 |  |
| node 370886362 | Zahnärztin Dr. Marta Thum | amenity=dentist | Richard-Wagner-Straße 1 | 235 |  |
| way 127872149 | (unnamed) | leisure=sports_centre |  | 246 | school sports hall next to Karl-Lederer-Grundschule, not a business: skip |
| way 533111661 | Caritas | amenity=social_facility | Adalbert-Stifter-Straße 56 | 276 |  |
| node 6269898744 | Starke Bedachungen GmbH | craft=roofer | Richard-Wagner-Straße 20 | 286 |  |
| node 12427142626 | Tierärztin C. Schedel | amenity=veterinary |  | 320 |  |
| node 12427142624 | dada ATELIER | amenity=fixme |  | 323 | closed Dec 2025 (Merkur): skip |
| node 6269837940 | Kinderland Geretsried | amenity=kindergarten | Künnekeweg 5 | 325 |  |
| node 12427142625 | Athletik Delta | leisure=fitness_centre |  | 327 | gym (see Gyms) |
| node 3450946413 | Schlüsseldienst Geyer | craft=key_cutter | Sudetenstraße 39 | 330 |  |
| node 12427142628 | Christopherus Hospitzverein | healthcare=hospice |  | 336 |  |
| node 12427142629 | Fuch & Fuchs | office=lawyer |  | 342 |  |
| node 12427142630 | ambulantex | amenity=social_facility |  | 347 |  |
| node 12427142631 | Augentierarztpraxis Dr.med.vet. Gabriele Rogge | amenity=veterinary |  | 350 |  |
| node 12474160939 | DHL Packstation | amenity=parcel_locker |  | 353 |  |
| node 12427142632 | Weidinger | office=engineer |  | 356 |  |
| node 12427142633 | Vermas Versicherungs- und Finanzdienstleistungen | office=financial |  | 361 |  |
| node 12430682960 | Tierärztliche Praxis Dr. Heidi Buschmann | amenity=veterinary |  | 362 |  |
| node 12427142634 | Erle Elebnis Lernen e.V. | amenity=childcare |  | 368 |  |
| node 9655610666 | HUK-Coburg | office=insurance | Neuer Platz | 404 |  |
| node 2820202651 | DHL Packstation | amenity=parcel_locker |  | 473 |  |
| node 9172434597 | Wirth Steffen | amenity=dentist |  | 475 |  |
| node 12824612410 | (unnamed) | leisure=fitness_centre |  | 542 | = Sportstudio Innings, Sudetenstr. 49 (no name in OSM) |
| node 11871707114 | DHL Packstation | amenity=parcel_locker |  | 577 |  |
| relation 2979379 | Seniorendomizil Haus Elisabeth | amenity=social_facility | Johann-Sebastian-Bach-Straße 16 | 585 |  |
| node 9876731044 | TherapierBar | healthcare=physiotherapist | Sudetenstraße 51 | 591 |  |
| way 128266526 | Fullhouse IT-Services AG | office=it | Daimlerweg 5 | 594 |  |
| way 1069120600 | Haus Elisabeth, Betreutes Wohnen | amenity=social_facility | Johann-Sebastian-Bach-Straße 18 | 623 |  |
| node 3528911945 | M1 Lounge | amenity=nightclub | Lausitzer Straße 12 | 642 |  |
| node 6261802824 | Physio Geretsried | healthcare=physiotherapist | Adalbert-Stifter-Straße 43b | 644 |  |
| node 3528911971 | Vegas Casino | amenity=nightclub | Lausitzer Straße 12 | 650 |  |
| way 501380014 | CHT Geretsried | office=company | Breslauer Weg 123 | 667 |  |
| way 1271753009 | Blechkiste | amenity=kindergarten |  | 689 | same site as Kita Blechkiste |
| node 7230557829 | DMG MORI Spare Parts GmbH | office=company |  | 786 |  |
| way 1271753000 | Kita Blechkiste | amenity=kindergarten |  | 788 |  |
| web | BeaFit Frauenfigurstudio | women's gym | Schubertweg 13 | 459 | not in OSM; verify still open |
| web | Lu Jong Yoga Studio Ingrid Antoch | yoga | Haydnweg 28 | 537 | not in OSM; verify |
| web | Takt Tanz – Kunst (dance school) | dance (related) | Sudetenstraße 47 | 483 | not in OSM; related, optional |
| web | Carsten Schwarz Tanzstudio | dance (related) | Sudetenstraße 47 | 483 | not in OSM; related, optional; verify |

## Gyms (all fitness studios in Geretsried)

Pending I-1 (import, whole town). Capture all gyms after 6b–6d, together with 6e.

Full list with lat/lon, map x/y, building id and Street View links: gyms.csv. Only ONE gym is in the map today (#128), and it
has the wrong kind. No Kieser in Geretsried.

| Name | Address | m from start | In map | OSM |
|---|---|---|---|---|
| Bodystreet Geretsried (EMS) | Sudetenstraße 13 | 39 | no | node 370882651 |
| Sportschule Kubis / PT-Kubis (kickboxing, MMA, self-defence) | Richard-Wagner-Straße 12 b/c | 181 | no | node 12430682957 |
| Athletik Delta | Neuer Platz 22 | 327 | no | node 12427142625 |
| BeaFit Frauenfigurstudio | Schubertweg 13 | 459 | no | not in OSM |
| Takt Tanz – Kunst (dance school) | Sudetenstraße 47 | 483 | no | not in OSM |
| Carsten Schwarz Tanzstudio | Sudetenstraße 47 | 483 | no | not in OSM |
| Lu Jong Yoga Studio Ingrid Antoch | Haydnweg 28 | 537 | no | not in OSM |
| Sportstudio Innings (incl. EMS-Bodytrain, boxing, yoga) | Sudetenstraße 49 | 542 | no | node 12824612410 |
| Fitness Forum & Squash Point | Breslauer Weg 103 | 665 | #128 (kind food) | way 188648201 |
| Tina´s Fitnesstreff | Spreestraße 26 | 990 | no | node 371388338 |
| Club Vital | Sudetenstraße 73 | 1150 | no | node 370873070 |
| clever fit Geretsried | Jeschkenstraße 29 | 1310 | no | node 2301162996 |
| Muscle & Mind Bodyforming | Lerchenweg 1 | 1964 | no | not in OSM |
| BaseFit Gesundheitszentrum (gym + physio) | Banater Straße 14 | 3011 | no | node 14133849218 |
| Elements Yoga und Pilates Studio | Blumenstraße 19 (EG | 3484 | no | not in OSM |
| Fitness-Studio imPuls in- + Outdoor | Bürgermeister-Graf-Ring 13 (Gelting) | 4746 | no | not in OSM |

### I-1 · Import all missing places: start area 6e + every gym (whole town) — Size: L — status: todo
Supersedes G-1: G-1's gym kind, the #128 fix and the hand-added studios are folded in below (step 3, 4, 5), so do NOT run G-1 separately.
Alex: "füg mal alle hinzu". This is a whole-town import (the query runs over the full map bbox), not only the start area;
the 6e table (Start area section) and gyms.csv are the CHECK LIST it must satisfy.
```
Goal: The places OSM knows but the game drops (gyms, dojos, dentists, vets, kindergartens, care homes, bars/clubs,
parcel lockers, offices, craft businesses, healthcare) become POIs, plus hand-added studios OSM does not have,
without losing or changing any existing POI except the #128 kind fix.

Context (read only, verified at e1fcf8e):
- scripts/import-osm.ts PLACES_QUERY (line ~46) asks only for nwr["shop"], a fixed amenity list
  (fuel|pharmacy|bank|police|post_office|townhall|fast_food|restaurant|cafe|ice_cream|pub|biergarten|cinema|hospital|
  doctors|school|library) and traffic signals. data/places.json is a gitignored cache, re-downloaded only by
  `pnpm map:fetch` (which ALSO refreshes data/raw.json = roads/buildings) or when the file is missing.
- src/map/build.ts: poiKind() = amenity via POI_KINDS, else shop → POI_KINDS[shop] ?? "shop", else null. A POI is kept
  only if poiKind ≠ null AND (brand ?? name) exists, so unnamed nodes are dropped. POI name = tags.brand ?? tags.name.
- src/map/types.ts PoiKind (line 62): supermarket drugstore bakery fuel pharmacy bank food police post school doctor civic
  church car_repair shop. Records over PoiKind: overlay.ts POI_STYLE (icon+colour, exhaustive), facade.ts SHOP_FRONTS,
  overlay.ts IMPORTANT (labelled kinds).
- Gameplay that reads kinds: src/sim/game.ts findHospital() respawns you at the "doctor" POI nearest home (today
  Dr. Schmucker, 385 m from the start). src/sim/pickups.ts makes a pickup candidate behind EVERY POI except school/police.
- POI ids in docs/BACKLOG.md (#n) are list positions (index+1 in map.pois). Adding places renumbers them.

Change:
1. Fetch. Add to PLACES_QUERY:
     nwr["leisure"="fitness_centre"](B);  nwr["leisure"="sports_centre"]["name"](B);
     nwr["amenity"~"^(dojo|dentist|veterinary|kindergarten|childcare|social_facility|bar|nightclub|parcel_locker)$"](B);
     nwr["office"](B);  nwr["craft"](B);  nwr["healthcare"](B);
   Refresh ONLY the places cache: delete data/places.json and run `pnpm map` (do not use map:fetch, it re-downloads
   roads/buildings and can move dressed places). If the refreshed cache drops or renames EXISTING POIs (OSM edits since the
   old cache), put the new filters in a separate query with its own cache (data/places-more.json, gitignored) instead
   and restore the old places.json, so the old POIs stay byte-identical.
2. Kinds: keep the list minimal. Reuse where honest, add only these new PoiKinds (each needs a POI_STYLE icon+colour):
     gym           leisure=fitness_centre, leisure=sports_centre (named), amenity=dojo, hand-added studios
     health        amenity=dentist, amenity=veterinary, healthcare=* (physio, hospice, …) unless amenity already matched.
                   NOT "doctor": dentist Dr. Thum (235 m) / vets (320 m) would become the respawn "hospital".
                   healthcare=doctor|clinic may map to "doctor", but then check findHospital (see Done when).
     kindergarten  amenity=kindergarten, amenity=childcare
     care_home     amenity=social_facility
     bar           amenity=bar, amenity=nightclub
     parcel_locker amenity=parcel_locker
     office        office=*, craft=*
   Order in poiKind(): existing amenity match → new amenity map → leisure → healthcare → shop → office/craft → null.
   SHOP_FRONTS: add gym and bar (street-level businesses); leave the others out. IMPORTANT (map labels): add none.
   pickups.ts: exclude parcel_locker, kindergarten and care_home from pickup candidates (no pickups in a Kita yard);
   report candidate count before/after.
3. #128 "Fitness Forum & Squash": exists only because OSM node 9955217554 is amenity=pub (the bar inside); the building
   way 188648201 carries leisure=fitness_centre with the same name. Dedupe: same name within 50 m → keep ONE POI, prefer
   the non-food kind (gym). Apply this rule generally (e.g. a node with healthcare=* duplicating an amenity=doctors node).
4. Hand-added POIs (no OSM element or no OSM name): a small typed list in build.ts (or src/map/extra-pois.ts) of
   { name, kind, lat, lon }, projected with the same projection as OSM places, appended after the OSM POIs:
     Sportstudio Innings              gym  47.855834, 11.489942   (OSM node 12824612410 has no name; Sudetenstraße 49)
     BeaFit Frauenfigurstudio         gym  47.8544578, 11.4809921 (Schubertweg 13)
     Lu Jong Yoga Studio              gym  47.8548526, 11.478401  (Haydnweg 28)
     Takt Tanz                        gym  47.8558943, 11.4890777 (Sudetenstraße 47, dance school)
     Carsten Schwarz Tanzstudio       gym  47.8558943, 11.4890777 (Sudetenstraße 47; same building as Takt Tanz)
     Muscle & Mind Bodyforming        gym  47.8742379, 11.4725497 (Lerchenweg 1)
     Elements Yoga und Pilates        gym  47.8856908, 11.4611779 (Blumenstraße 19; position approx., street geocode)
     Fitness-Studio imPuls            gym  47.8879683, 11.4379915 (Bürgermeister-Graf-Ring 13, Gelting)
   If the unnamed Innings node also matches the leisure filter, it is dropped (no name) and the hand entry covers it.
5. Skip on purpose: the unnamed leisure=sports_centre way 127872149 (Karl-Lederer school hall; the ["name"] filter and the
   no-name rule drop it) and dada ATELIER (node 12427142624, amenity=fixme, closed Dec 2025; not matched by any filter).
6. IDs WILL RENUMBER. Write docs/poi-id-map.csv: old_id,new_id,name,kind_old,kind_new (old = index+1 in the committed
   public/geretsried.map.json before your change, new = after; matched by name + position ≤ 1 m, #128 → its gym POI).
   Do NOT edit the #ids in docs/BACKLOG.md yourself; the remap is done afterwards from that file.
   Names/indices used in code (town-jobs.ts named(...), places/*.ts poi:, cafe.ts) are by name: check none now resolves
   to a different POI (e.g. a new "Sparkasse" office would break places.test's count of 2).

Check list (the acceptance data): every row of the "6e: not in the map yet" table in docs/BACKLOG.md (except the two
skips) and every row of the "Gyms" table in docs/BACKLOG.md (same rows as gyms.csv; OSM ids there, lat/lon of the
non-OSM ones in step 4) must appear as a POI in public/geretsried.map.json with the
right name and position within ±10 m of the listed OSM element / lat-lon. "Right name" = what build.ts produces
(brand ?? name), e.g. clever fit may come out as its brand "Clever fit", DHL Packstation as "DHL": list such cases.

Done when:
- every check-list row is a POI (name, position ±10 m, kind as above) — print a table: row, found POI id, distance, kind;
- no existing POI lost: all 234 old POIs still present (name + position ≤ 1 m); only #128's kind changed (food → gym);
- docs/poi-id-map.csv written; findHospital still picks Dr. Schmucker for the default start (or explain why not);
- dressed places render unchanged (places.test passes; Cafe Waldmann untouched);
- `pnpm check` passes, `pnpm build` passes, and the game starts at Sudetenstraße 19 and runs (open it, drive a bit).
Report: counts per new kind, the whole-town POI count before/after, the check-list table, any OSM POIs that changed.
```

### G-1 · Gyms: add POIs (import change) — Size: M — status: superseded by I-1
Folded into I-1 (gym kind, #128 dedupe, hand-added studios). Do not run separately.

## Priority list (all 234 POIs)

Order: P1 batch → gameplay places → landmarks/anchors → services → food → generic shops. Within a tier, nearest to the start (Sudetenstraße 19) first. Duplicate names are separate OSM objects; `#` = row id in `pois.csv`.

### P1 — Batch 1 (scouted; prompts above: B1-1…B1-5) ⭐ · batch 2 = the ref-done rows in P2 (prompts B2-1…B2-5) · batch 3 = Am Stern (B3-0…B3-7), rows in P3–P6 · batch 4 = Am Stern small shops (B4-1…B4-11) · batch 5 = job places (B5-1…B5-6), rows in P2 · batch 6a = start area nearest 10 (B6a-1…B6a-10) · batch 6b = start area next 8 (B6b-1…B6b-8, massing only)
| # | Name | Kind | x, y (m) | lat, lon | m from start | Status | Note |
|---|---|---|---|---|---|---|---|
| 232 | Maria Hilf | church | 3831.3, 4907.8 | 47.855863, 11.481366 | 309 | implemented (partial) | save point (Jesus Saves); Johann-Sebastian-Bach-Straße |
| 174 | Rathaus Geretsried | civic | 2605.1, 2845.4 | 47.874411, 11.464927 | 2278 | implemented | job hub: payphone + Mercedes G / Taxi jobs; Karl-Lederer-Platz 1 |
| 168 | Rehmaus Apotheke | pharmacy | 4018.9, 4693.8 | 47.857788, 11.483882 | 50 | implemented | courier job destination (Brezn); Sudetenstraße 14 |
| 66 | PENNY | supermarket | 4288.8, 4804.3 | 47.856794, 11.4875 | 330 | implemented (partial) | Stein's main discounter; entrance = free-standing red canopy at the NE end of way 822461881's NW facade, facing the car park (corrected in batch 3; built in B3-0) |
| 20 | Sparkasse | bank | 3550.6, 4719.7 | 47.857555, 11.477603 | 453 | implemented | Stein branch, Händelstraße (no addr in OSM; Nominatim) |

### P2 — gameplay places (jobs, save, spray, police, start)
| # | Name | Kind | x, y (m) | lat, lon | m from start | Status | Note |
|---|---|---|---|---|---|---|---|
| 48 | Mühlenbäck | bakery | 4005.5, 4651.6 | 47.858167, 11.483702 | 8 | implemented (partial) | B2-1. Start: Sudetenstraße 19. NOT the courier pickup (that is #46) |
| 150 | Deutsche Post Filiale 571 | post | 4238.7, 4832.4 | 47.856541, 11.486828 | 303 | implemented (partial) | B2-2. Job "post": van spawns on Sudetenstraße (far kerb). Yellow Post board a guess (no photo) |
| 103 | Automobilwerkstatt Wilhelm | car_repair | 4706.9, 4824.3 | 47.856614, 11.493106 | 731 | implemented (partial) | B2-3. Spray shop (pad on the NW lane, unchanged) + "mercedes" drop-off. Front = NW wall (DOP20 + POI); band length, sign spot, logo orange are guesses |
| 225 | Aldi Süd | supermarket | 4707.8, 5200 | 47.853235, 11.493118 | 899 | implemented (partial) | B2-4. Sudetenstraße 68. "gartenberg-1" VW Bus spawns on the car-park aisle E of the store. OSM roof:shape=flat is wrong (gable roof with two cross gables, LoD2) |
| 181 | Gasthof Geiger | food | 2844.9, 4388 | 47.860538, 11.468142 | 1182 | ref-done (partial) | B5-1. Tattenkofener Str. 1. "weisswurst" dropoff (Rathaus job, not a gang job). Roof should be red-brown tile |
| 187 | Polizeiinspektion Geretsried | police | 4772.3, 5626.6 | 47.849399, 11.493982 | 1248 | implemented (partial) | B2-5. Jeschkenstraße 31; POI correct. ⚠ "stein-1" taxi drop-off likely unreachable (no car pose within 9 m): verify in game |
| 231 | Petruskirche | church | 2883.8, 2925.2 | 47.873693, 11.468663 | 2052 | ref-done (partial) | B5-2. Egerlandstraße 39. Save point; bell tower = way 188048958 (engine 2 levels, too low). Mosaic/portal need reference |
| 46 | Bäckerei Mühlenbäck | bakery | 2849.3, 2775.7 | 47.875038, 11.468201 | 2196 | todo | B5-3. needs reference (satellite only). "brezn" pickup (home phone) |
| 219 | Metzgerei Länger | shop | 2659, 2499.5 | 47.877521, 11.465649 | 2531 | ref-done | B5-4. Amselweg 9. "weisswurst" pickup (Rathaus job, not a gang job) |
| 195 | Orterer Getränkemarkt | shop | 2306.5, 2063.1 | 47.881446, 11.460923 | 3089 | ref-done | B5-5. Banater Str. 3. "gelting-1" pickup; ⚠ point 14 m inside the hall (STOP_REACH 9): likely unreachable. Engine roof flat/2 lv wrong (1 storey, pitched + solar) |
| 180 | Kaufland | supermarket | 2244.3, 1880.5 | 47.883088, 11.460089 | 3276 | ref-done (partial) | B5-6. Bayerwaldstraße 2. "kaufland" destroy-BMW (Rathaus job, not a gang job); entrance needs reference |
| 220 | Huber GmbH, Karosserie-Lack-Center | car_repair | 2353.1, 1757.6 | 47.884194, 11.461548 | 3326 | todo | spray shop |
| 89 | Auto Stapf | car_repair | 234.3, 1574.7 | 47.885838, 11.433141 | 4859 | todo | spray shop |
| 211 | Biometzgerei Pichler Großhandel | shop | 240.9, 1498.7 | 47.886522, 11.43323 | 4902 | todo | gang job drop |

### P3 — landmarks & big anchors (nearest to start first)
| # | Name | Kind | x, y (m) | lat, lon | m from start | Status | Note |
|---|---|---|---|---|---|---|---|
| 13 | VR-Bank | bank | 3957.8, 4620.3 | 47.858449, 11.483062 | 49 | ref-done | B6a-5. Sudetenstraße 11, sign "VR Bank München Land" |
| 82 | Denns BioMarkt | supermarket | 4208, 4747.7 | 47.857303, 11.486417 | 233 | implemented (partial) | B3-2; NW unit of the west block; node vs sign ≈ 27 m apart, door needs reference |
| 228 | Karl-Lederer-Grundschule Geretsried | school | 3800.4, 4825.3 | 47.856605, 11.480952 | 265 | todo (needs facade reference) | B6b-2. Relation building missing in-game (import); LoD2 ~10 m |
| 186 | Karl-Lederer-Hauptschule Geretsried | school | 3740.9, 4830.9 | 47.856555, 11.480154 | 315 | todo (needs facade reference) | B6b-4. Now Karl-Lederer-Mittelschule; merger by 2029–2031 (ask Alex); LoD2 ~13 m |
| 204 | EDEKA | supermarket | 4429.1, 4804.1 | 47.856796, 11.489381 | 459 | implemented (partial) | B3-1; EDEKA Heininger & Dietz, Breslauer Weg 113; flat hall, yellow band, porthole upper wall |
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
| 65 | Rossmann | drugstore | 4251.4, 4773.7 | 47.857069, 11.486999 | 283 | implemented (partial) | B3-3; Rossmann block 293545707, 3 storeys (engine 4) |
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
| 12 | HoangAnh | food | 3992.7, 4644.1 | 47.858235, 11.48353 | 6 | todo (needs reference; unit shows Deliqos) | B6a-2. Sudetenstraße 17. SV 2022 shows Deliqos at this unit; listings say HoangAnh open. Ask Alex |
| 47 | Dolce Gelato | food | 3980.5, 4636.4 | 47.858304, 11.483367 | 21 | ref-done | B6a-3. Sudetenstraße 15 |
| 120 | Bistro Malor | food | 3929.9, 4632.5 | 47.858339, 11.482688 | 70 | ref-done (partial) | B6a-7. Sudetenstraße 10, terrace by the KIND corner; facade sign needs reference |
| 177 | Gaststätte Isarwinkel | food | 3890.5, 4793.3 | 47.856893, 11.48216 | 181 | ref-done (partial) | B6a-10. Richard-Wagner-Straße 14 (not Sudetenstraße); pole brewery logo needs reference |
| 77 | da Daniele | food | 4280.4, 4816.7 | 47.856682, 11.487388 | 329 | ref-done | B3-7; crimson fascia; terrace not seen (needs reference) |
| 58 | Restaurant Ammos | food | 3655.2, 4645.4 | 47.858223, 11.479005 | 343 | todo (needs facade reference) | B6b-6. Neuer Platz 9; roof #858d7e; front needs reference |
| 57 | Munzur Kebap | food | 3607.4, 4689.2 | 47.857829, 11.478365 | 393 | todo |  |
| 19 | Italy | food | 3545.7, 4770.4 | 47.857099, 11.477537 | 468 | todo |  |
| 79 | Piatsa | food | 4646.3, 4763.3 | 47.857163, 11.492293 | 659 | todo |  |
| 128 | Fitness Forum & Squash | food | 4677.2, 4528.4 | 47.859275, 11.492707 | 690 | todo | WRONG KIND: is a gym (Breslauer Weg 103); food only because OSM node 9955217554 is amenity=pub. Fix in I-1 |
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
| 154 | Angel Nails | shop | 4000.2, 4648.4 | 47.858196, 11.483631 | 2 | ref-done | B6a-1. Sudetenstraße 19, NW-adjacent to Mühlenbäck (3 m from the spawn) |
| 155 | Stroblume | shop | 3973.7, 4631.2 | 47.858351, 11.483276 | 29 | ref-done | B6a-4. Sudetenstraße 15 |
| 115 | Optik Kind Geretsried-Zentrum II | shop | 3944.9, 4641.7 | 47.858256, 11.482889 | 53 | ref-done | B6a-6. Sudetenstraße 10, sign "KIND" |
| 178 | Audi;Seat;Škoda;Volkswagen | shop | 4071.5, 4676.3 | 47.857945, 11.484587 | 79 | ref-done | B6a-8. = Autohaus Billion, Sudetenstraße 25 (POI shows the OSM brand list). Ask Alex about the name |
| 170 | Spielwaren Krömer | shop | 4094.6, 4741.4 | 47.85736, 11.484897 | 134 | ref-done | B4-8 |
| 11 | Quelle | shop | 3919.9, 4780.6 | 47.857007, 11.482554 | 154 | todo (needs reference; probably closed) | B6a-9. Quelle-Agentur, Beethovenweg 2 (directory listing); probably closed. Ask Alex: drop? |
| 166 | Woolworth | shop | 4138.3, 4716.7 | 47.857582, 11.485482 | 156 | ref-done | B4-2 |
| 169 | Sun Style Bodystyling Studio | shop | 4125.7, 4764.7 | 47.85715, 11.485313 | 173 | ref-done | B4-7 |
| 114 | Nexial | shop | 4159, 4743.5 | 47.857341, 11.48576 | 187 | ref-done | B4-6; OSM shop tag wrong (IT services) |
| 116 | GG-Radsport | shop | 4174.6, 4715.9 | 47.857589, 11.485969 | 189 | ref-done | B4-4, inside B3-0 |
| 157 | Aphrodite-aestetic | shop | 4170, 4726.8 | 47.857491, 11.485907 | 189 | ref-done | B4-5, inside B3-0 |
| 15 | TEDi | shop | 4151.2, 4783.6 | 47.85698, 11.485655 | 205 | ref-done | B4-1 |
| 80 | Orterer Getränkemarkt | shop | 4184.1, 4765.8 | 47.85714, 11.486096 | 220 | ref-done (partial) | B3-5; S corner + arcade; not the job's Orterer (#195) |
| 81 | Takko Fashion | shop | 4195.3, 4751.3 | 47.857271, 11.486247 | 223 | implemented (partial) | B3-4; middle unit of the west block |
| 138 | miwomo | shop | 4126.5, 4435.7 | 47.860109, 11.485324 | 248 | todo (needs facade reference) | B6b-1. Breslauer Weg 9; rental closes end 2026, THOMA Reisemobile stays (ask Alex) |
| 134 | B&L Hairstyling | shop | 4196.7, 4804.3 | 47.856794, 11.486265 | 253 | ref-done | B4-3 |
| 54 | Haar Genau Friseurteam | shop | 3734.1, 4574 | 47.858865, 11.480063 | 274 | todo (needs facade reference) | B6b-3. C.-M.-v.-Weber-Weg 34; LoD2 16.2 m → levels 5 |
| 159 | Bellini | shop | 3668.4, 4674.7 | 47.857959, 11.479182 | 331 | todo (needs facade reference) | B6b-5. Hair & Style Bellini, Neuer Platz 22 (not Ammos); LoD2 → levels 4 |
| 152 | Flamingo Damenmode | shop | 4258.4, 4867.9 | 47.856222, 11.487093 | 341 | todo | needs reference: no photo (B4-10) |
| 158 | Fellomenal Hundesalon | shop | 4252.8, 4876.4 | 47.856145, 11.487017 | 342 | todo | needs reference; probably moved to Deisenhofen (B4-11) |
| 161 | Pia's Hair & Beauty | shop | 3756.8, 4910.1 | 47.855842, 11.480368 | 356 | todo (needs facade reference) | B6b-7. J.-S.-Bach-Str. 11a; massing already right |
| 16 | Ana’s Waschservice | shop | 3638.9, 4610.8 | 47.858534, 11.478787 | 361 | todo (needs reference) | B6b-8. Händelstraße 2; Ana's vs ZER-O-WASH (ask Alex); LoD2 20.4 m |
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
