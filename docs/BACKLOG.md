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

### P-1 · Foto-Tour (Alex, Handy) — status: todo — Aufgabe für ALEX, nicht für Claude Code
> **Claude Code: dieses Item NICHT bearbeiten.** Das ist ein Spaziergang für Alex mit dem Handy. Er liefert die Fotos, aus denen die
> offenen "needs reference"-Stellen (Batches 1–6d, Start-Straßen, I-1/I-2-Orte, V-13) ihren Look bekommen. Erst danach werden die B-Items fertig.

**So geht's:** pro Ort **2 Fotos**: frontal mit Schild + schräg. Was zusätzlich gebraucht wird, steht hinter dem Ort.
Bei Tageslicht und von öffentlichem Grund aus. Keine Menschen oder Kennzeichen im Fokus (Schulen/Kitas am Wochenende).
Fotos einfach in den Chat schicken. Der Scout legt sie in `reference/<slug>/` ab (gitignored) und aktualisiert `places/<slug>.md` + das B-Item.
Abhaken hier, sobald das Foto im Chat ist. Nicht mehr gebraucht: HoangAnh, Ammos, Bistro Malor (Web-Fotos reichen).
Jede Gruppe ist eine Etappe in Google Maps (zu Fuß, Koordinaten). Die Links dazu stehen unter jeder Runde.

**Stand 2026-10-26:** 2 Orte der Liste fertig (Spielplatz Breslauer Weg, EDEKA Band + Pylon) + 2 Extras (Seitz, Königsberger Weg). Offen: Backhupferl und der Rest.

**Runde 1: Start → Am Stern → Ost → Süd (≈ 3,5 km)**

*G1 · Start, Sudetenstraße Mitte (0–210 m)*
- [ ] Sudetenstraße am Spawn: Straßenbild — Sudetenstr. 14–19 — SW-Zebrastreifen-Schild (VZ 350) + Blinklicht nah; runde blaue Tafel bei der Rehmaus; Parkstreifen + Laternen längs (start-area-streets)
- [ ] Mühlenbäck (Detail) — Sudetenstr. 19 — Schild nah; Namen der Läden mit rotem Schild/roter Markise daneben (B2-1)
- [ ] Rehmaus Apotheke (Detail) — Sudetenstr. 14 — rotes "A"-Schild + Banner nah; Arkade schräg, Bögen zählbar (B1-1)
- [ ] VR Bank (Detail) — Sudetenstr. 11 — wo der Geldautomat sitzt (B6a-5)
- [ ] Quelle — Beethovenweg 2 / Kirchweg — gibt's den Laden noch? Front oder leerer Laden (B6a-9)
- [ ] Gaststätte Isarwinkel (Detail) — Richard-Wagner-Str. 14 — rundes Brauerei-Schild am Mast nah (B6a-10)
- [ ] Versöhnungskirche — Richard-Wagner-Str. 3 — frontal + schräg (Sechseck-Module, Schindeln) (V-13 L15)

*G2 · Breslauer Weg Nord (250–320 m)*
- [ ] miwomo / THOMA Reisemobile — Breslauer Weg 9 — Front + Schild, falls vorhanden (B6b-1)
- [x] Spielplatz Breslauer Weg — Breslauer Weg — Geräte + Belag, Übersicht über den Zaun (B6d-13) — Foto 2026-10-26 → `reference/spielplatz-breslauer-weg/40`
- [x] Extra (von Alex geliefert): Fahrzeugtechnik Seitz — Breslauer Weg 75 — Front + Schild (B6d-17) — Foto 2026-10-26 → `reference/fahrzeugtechnik-seitz/40`

*G3 · Am Stern: Sudetenstr. 20–43, Marienburgweg, Altvaterstraße, EDEKA (150–460 m)*
- [ ] Flamingo Damenmode — Altvaterstr. 61 — Front + Schild (B4-10)
- [ ] Fellomenal Hundesalon — Altvaterstr. 61 — gibt's den noch? Front oder leerer Laden (B4-11)
- [ ] da Daniele (Detail) — Sudetenstr. 39 — Terrasse/Außenbereich (B3-7)
- [ ] Post Filiale 571 (Detail) — Sudetenstr. 34 — Post-/DHL-Schild nah; ganze Höhe (Stockwerke) (B2-2)
- [ ] PENNY · Rossmann · denns (Detail) — Sudetenstr. 43 / 33 / 29 C — jeweils die Eingangstür (B1-5, B3-3, B3-2)
- [ ] Orterer · Takko · TEDi · Woolworth (Detail) — Sudetenstr. 29a / 29b / 26 / 27 — Plakat an der Orterer-Glasfront + was das Ding im Durchgang ist; Takko-Schriftzug nah; TEDi orange Wand unten; Woolworth-Logo nah (B3-5, B3-4, B4-1, B4-2)
- [ ] Sun Style · Aphrodite · Spielwaren Krömer (Detail) — Sudetenstr. 24 / Marienburgweg 25 / Sudetenstr. 20 — Schilder nah für die Goldtöne/das Blau (B4-7, B4-5, B4-8)
- [x] EDEKA — Breslauer Weg 113 — gelbes Band + Pylon am Parkplatz (B3-1) — Foto 2026-10-26 → `reference/edeka-am-stern/40` (Ecke "113", Dachschild, Pylon an der Einfahrt)
- [ ] Backhupferl (in der EDEKA) — Theke drinnen nur, wenn's ohne Leute geht (B4-9)
- [x] Extra (von Alex geliefert): Wohnblöcke Königsberger Weg — Hof, Müllhaus, Hochhaus, Straße (V-2, V-11) — Fotos 2026-10-26 → `reference/wohnblock-koenigsberger-weg/40–43`

*G4 · Ost: Breslauer Weg 103, Lausitzer Str., Sudetenstr. 47–50, Wallensteinstr. (500–790 m)*
- [ ] Fitness Forum & Squash — Breslauer Weg 103 — Eingang + Schild; Biergarten (B6d-5)
- [ ] Piatsa — Lausitzer Str. 12 — Mastschild nah; welche Tür Piatsa ist, welche Vegas Casino (B6d-2)
- [ ] Werkstatt Wilhelm (Detail) — Wallensteinstr. 4 — Eingangstür + Werkstatttore (B2-3)
- [ ] BSZ Direktmarketing — Wallensteinstr. 6b — Fassade, Ladetore, Schild (über die Hecke) (B6d-11)
- [ ] Café Bar DUO — Sudetenstr. 47a — Front + Schild; welche Einheit (47 vs. 47a) (B6d-12)
- [ ] Carglass — Sudetenstr. 50 — Werkstatttor; Nachbarhalle (wer drin ist) (B6d-1)

*G5 · Süd: Benzweg, Spreestraße, Jeschkenstraße (680–820 m)*
- [ ] Bäckerei Burger — Benzweg 2 — Drive-in-Spur (B6d-7)
- [ ] KFZ Matheis — Spreestr. 11 — Halle, Tore + Schild (B6d-4)
- [ ] Champini Kita — Jeschkenstr. 103 — Banner nah (Untertitel, Buchstabenfarben) (B6d-16)
- [ ] Christuskirche — Jeschkenstr. 125 — Türmchen: schräg, so dass man sieht, wo es sitzt und wie hoch (B6d-10)

Runde 1 in Maps (zu Fuß, 3 Etappen):
[A](https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=47.858199,11.483593&waypoints=47.860109,11.485324%7C47.85898,11.487694%7C47.856222,11.487093&destination=47.856796,11.489381) ·
[B](https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=47.856796,11.489381&waypoints=47.859275,11.492707%7C47.857163,11.492293%7C47.856083,11.493607&destination=47.855285,11.489584) ·
[C](https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=47.855285,11.489584&waypoints=47.852742,11.488782%7C47.852606,11.487225%7C47.851222,11.487208&destination=47.851528,11.486217)

**Runde 2: J.-S.-Bach-Straße → Neuer Platz → Stadtwald → Waldfriedhof (≈ 3,5 km)**

*G6 · Johann-Sebastian-Bach-Straße, Schulen (265–480 m)*
- [ ] Karl-Lederer-Grundschule — J.-S.-Bach-Str. 4 — Fassade, Eingang, Holz-Geschoss (B6b-2)
- [ ] Karl-Lederer-Mittelschule — J.-S.-Bach-Straße — Fassade, Eingang, Schulschild (B6b-4)
- [ ] Maria Hilf (Detail) — J.-S.-Bach-Straße — Haupteingangs-Seite; Turm ganz drauf (Höhe, Dachfarbe) (B1-4)
- [ ] Pia's Hair & Beauty — J.-S.-Bach-Str. 11a — Eingang + Schild (B6b-7)
- [ ] Dr. Schmucker — J.-S.-Bach-Str. 13 — Praxisschild nah + Eingang (B6c-2)
- [ ] Italy da Umile + Zirngibl Bestattungen — J.-S.-Bach-Str. 23 / 25 — Schilder nah, Mastschild; Zirngibl-Front (B6c-4)

*G7 · Neuer Platz / Händelstraße (330–450 m)*
- [ ] Sparkasse Stein (Detail) — Händelstraße — Südteil: ist der niedriger (Sockelbau)? (B1-2)
- [ ] Juchheim Cosmetics — Neuer Platz 2 — Schild nah (heißt er noch so?) (B6c-3)
- [ ] Centrale Geretsried — Neuer Platz 5 — Namensschild ("Centrale" oder "Coffeeholic") (B6d-12)
- [ ] Feinkost Christos · Munzur Kebap (Detail) — Neuer Platz 7 / 3 — obere Fensterreihe; wie breit Munzur ist (B6c-1)
- [ ] Hair & Style Bellini — Neuer Platz 22 — Front + Schild; welche Seite (Platz oder Parkplatz) (B6b-5)
- [ ] Ana's Waschservice — Händelstr. 2 — Laden + Schild (Ana's oder ZER-O-WASH), wo im Block (B6b-8)
- [ ] Friseurteam Haar Genau — Carl-Maria-von-Weber-Weg 34 — Front + Schild, welche Seite (B6b-3)

*G8 · Westen: Franz-Marc-Schule, Stadtwald (670–790 m)*
- [ ] Franz-Marc-Schule — Robert-Schumann-Weg 5 — Schulschild + Eingangsseite (B6d-6)
- [ ] Verkehrsübungsplatz (optional) — bei der Franz-Marc-Schule — Schilder/Ampeln (B6d-14)
- [ ] Spielplatz J.-S.-Bach-Straße — J.-S.-Bach-Str. (West) — Geräte, Übersicht (B6d-13)
- [ ] Fitness-Station (beleuchtet) — Stadtwald, way 497511384 — Geräte + Boden (B6d-15)
- [ ] Fitness-Station — Stadtwald, way 574767212 — Geräte + Boden (B6d-15)

*G9 · Waldfriedhof (430–510 m)*
- [ ] Aussegnungshalle — Waldfriedhof — Wände + Glockenturm schräg (B6c-5)
- [ ] Waldfriedhof-Denkmäler — Kriegergedenkstätte + Fahnenmasten, 6 Stelen — je 1 Foto (V-13 L11/L12)

Runde 2 in Maps (zu Fuß, 4 Etappen):
[D](https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=47.858199,11.483593&waypoints=47.85848,11.48083%7C47.856893,11.48216%7C47.856605,11.480952&destination=47.855842,11.480368) ·
[E](https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=47.855842,11.480368&waypoints=47.857099,11.477537%7C47.857555,11.477603%7C47.8577969,11.4785523&destination=47.858534,11.478787) ·
[F](https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=47.858534,11.478787&waypoints=47.858865,11.480063%7C47.856733,11.474448%7C47.858685,11.474506&destination=47.861853,11.474556) ·
[G](https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=47.861853,11.474556&waypoints=47.862484,11.475803%7C47.862682,11.482214&destination=47.858199,11.483593)

**Extra: mit Rad oder Auto (1–5 km, wenn du eh dort bist)**

*G10 · West, Tattenkofener Straße (≈ 1,2 km)*
- [ ] Gasthof Geiger (Detail) — Tattenkofener Str. 1 — Biergarten, Parkplatz, N/O/S-Seiten (B5-1)
- [ ] Nikolauskapelle — bei der Tattenkofener Straße (way 822460728) — frontal + schräg (Achteck, Zwiebelturm) (V-13 L1)

*G11 · Stadtmitte, Karl-Lederer-Platz / Egerlandstraße (≈ 2–3,3 km)*
- [ ] Rathaus (Detail) — Karl-Lederer-Platz 1 — Turm ganz drauf (Höhe) (B1-3)
- [ ] Gorilla · "Dialog" · Wasserträgerinnen + Bachlauf · Stele "Stadt Geretsried" — Karl-Lederer-Platz — je 1 Foto + Standort (V-13 L6–L9)
- [ ] Petruskirche (Detail) — Egerlandstr. 39 — Eingangsgiebel frontal, Bronzeportal, Mosaik; Turm ganz drauf (B5-2)
- [ ] Bäckerei Mühlenbäck Zentrum — Egerlandstr. 54 / Fasanenweg — Front + Schild, Sitzplätze (B5-3)
- [ ] Schriftzug "Geretsried" (Skulptur) — node 2886910016 — 1 Foto (V-13 L10)
- [ ] Kaufland (Detail) — Bayerwaldstr. 2 — Eingang, Parkplatzseite, Mall-Schilder, Ladesäule (B5-6)

*G12 · V-13 Wahrzeichen weiter draußen (nur von außen/vom Weg)*
- [ ] Blauer Bunker (nur vom Weg, einsturzgefährdet) · Kohlebunker Isardamm 20 · Kalkbrennofen am Isarufer — je 1–2 Fotos (V-13 L3, L2, L5)
- [ ] Löschkette-Brunnen (Feuerwehrschule) · Obelisk Südrand — je 1 Foto (V-13 L14, L13)
- [ ] Schloss Ascholding + St. Leonhard · St.-Anna-Kapelle Gelting · DITIB-Moschee · Erinnerungsort Badehaus — je 1–2 Fotos (V-13 L18, L16, L17, L19)
- [ ] Ruine Werksgelände · drei Türme — was ist das? (V-13 L4, L20)

**Noch nicht drin:** die 49 Orte aus 6e und die Gyms. Die sind noch nicht recherchiert; das macht zuerst der Scout per Street View, nach I-1.
Fotos davon nur, wenn du eh vorbeiläufst.

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

### S-1 · Start-area streetscape: Sudetenstraße at the spawn — Size: M — status: implemented (partial: parking extents and gaps, lamp spacing and side, S3/S4 positions, the 6 m kerb radii, the Rehmaus parking bay and the road-name lettering are guesses; NE pavement stays 1.9 m because the OSM fronts were kept; S1 stands 1.3 m off its listed spot)
**Goal:** the first 30 seconds of play happen on Sudetenstraße. Today it reads as an 8 m road between two thin 2.6 m sidewalks,
grass behind, one tree, no parked cars, no signs or lamps. Real Sudetenstraße is a ~25 m wide shopping street: wide paved
pavements with café seating and street trees, cars parked along both kerbs, granite-sett gutters, curved-arm lamps, a zebra
with blue signs and a flashing light, and a P sign with time plates. Make the spawn street look and feel like that.
**Reference:** places/start-area-streets.md (all numbers, axis convention, evidence per item); reference/start-area-streets/
01–10 (Street View 2022/23), 20–24 (DOP20, game render, overlay, cross-section strips). OSM way 157363825 (tertiary). Frame:
station along the centreline from **(3992.8, 4654.8)** (+ = NW, bearing 304°), offset + = NE (shop row).
Scope: station **+170 … −170** only (Richard-Wagner signals → past Autohaus Billion). Don't change other streets.

Engine today (read-only finding): tertiary = 8 m carriageway; `SIDEWALK_M = 2.6`, `KERB_M = 0.3` fixed in
src/render/scene/scene.ts (and a copy in street.ts, stations.ts); markings only on primary/secondary/tertiary; lamps only on
primary/secondary; no sign type; OSM `width` ignored; src/map/build.ts:201 pushes a bus shelter for **every** highway=bus_stop,
ignoring `shelter=no`.

**Spec:**
1. **Street profile override (data, not OSM):** a typed per-way profile (e.g. `src/world/places/streets.ts`, keyed by OSM way
   id + station range) that scene + collision read instead of the class default. For 157363825 at station −20 … +60:
   NE pavement **+6.0 … facade**, NE parking +4.0 … +6.0, running lanes −4.0 … +4.0 (dashed centre line, **no** solid edge
   lines *(SV?)*), SW parking −6.0 … −4.0, SW pavement −6.0 … −8.5, then paved forecourt to the SW facade (−14.6).
   Elsewhere in scope keep the 8 m lanes and use parking bands only where the SV shows parked cars *(SV?)*.
2. **Paved forecourts instead of grass** between the pavement and the facades on both sides (NE café forecourt; SW Autohof
   Jorde forecourt, private parking at −10 … −14.6). Grey slab texture (new Codex texture `paving_slab_grey`), not grass.
3. **Granite-sett gutter**: 0.4 m strip of grey setts on the road side of each kerb (new texture `sett_gutter_grey`).
4. **Parked cars**: static parked-car props in the parking bands, gaps at the zebra (±5 m), Berliner Weg mouth, driveways,
   bus stops. Not drivable traffic; solid for collision.
5. **Berliner Weg corner plaza**: rounded kerb (radius ≈ 6 m *(SV?)*) at node 60383008 (4025.9, 4677.1); paved plaza
   from the start building's SE gable (station −22…−25) to the corner.
6. **Street trees**: NE pavement trees in pits at about stations +8, −5, −18 *(DOP; ±2 m)*; SW tree row ~6 trees at
   ~10 m spacing between stations +30 and −30, offset ≈ −8 *(DOP)*. Use the existing tree renderer; don't double the
   aerial-detected one.
7. **Lamps**: grey pole + single curved arm over the carriageway, NE side, ~30 m spacing *(SV? spacing and side)*.
   Allow lamps on this tertiary (data flag in the profile), don't change the class rule globally.
8. **Bollards**: red/white bollards every ~1.5 m along the SW kerb, station −41 … −66 (in front of Rehmaus Apotheke).
9. **Signs (new `StreetSign` data type + sprites)**: `{ vz: string; x; y; facing; plates?: string[] }`, rendered as a grey pole
   (Ø 0.07 m) with a sign sprite 0.6 × 0.6 m whose bottom edge is at 2.2 m, Zusatzzeichen 0.6 × 0.33 m below. Sprites as
   new Codex textures (`vz314_parken_links`, `vz1040-32_2std`, `zz_mo_sa_8_19`, `vz350`, `vz224`, `flash_amber`).
   Instances (map m):
   - S1 VZ 314 + arrow left + "Mo-Sa 8-19 h" + 1040-32 "2 Std." at **(4017.5, 4660.2)**, facing SW (seen, 09).
   - S2 VZ 350 + amber flashing light (blinks ~1 Hz) at **(4019.4, 4665.6)** (seen, 10).
   - S3 VZ 350 + flashing light at **(4012.6, 4675.6)** *(SV?)*.
   - S4 VZ 224 at both bus stops *(SV?)*.
   No street-name plate: render "Sudetenstraße" painted on the asphalt near station −45 (06) instead.
10. **Bus stop shelters honour OSM `shelter`**: in build.ts keep the shelter for `shelter=yes`/missing tag, but give
   `shelter=no` stops (3448196000, 2024816308, 3823202158) only the H pole. Bus lines still stop there.
11. **Facade line (optional, ask first)**: the NE OSM footprints sit 3–4.5 m closer to the road than the LoD2 walls
   (start building 7.1 m vs 10.4–10.9 m). Either move those fronts to the LoD2 walls via #0b masses or keep them and
   narrow the NE pavement; don't let the pavement overlap the building.

**Acceptance criteria:**
- [ ] At station 0: kerb-to-kerb **12 ± 0.5 m**; NE pavement (kerb → facade) **≥ 4 m**; facade-to-facade **24.9 ± 1 m**
      if spec 11 is done, else **21.0 m** with no overlap. *(Partly met: kerb to kerb 12.0 m, no overlap; the NE pavement is
      1.9 m (kerb +5.3 → OSM front +7.2), so ≥ 4 m fails while the fronts stay. The game's facades at station 0 are
      +7.2 / −17.7 = 24.9 m: the SW footprint 120402836 stands at −17.7, not −13.9.)*
- [x] No grass between the SW kerb and the Autohof Jorde facade at station −10 … +10 (compare 24 vs 23).
- [ ] Sign poles within **± 1 m** of the listed positions; the VZ 350 light blinks; sprites readable from the play camera.
      *(Partly met: S2 0.0 m, S3 0.9 m, the lights blink at 1 Hz, signs read at 0.6 m; S1 1.3 m off: its listed spot is
      inside the kept OSM footprint of No. 19.)*
- [x] Trees: ≥ 8 street trees within station ±30 m (DOP shows 9); exactly one per real crown, no stacking with the aerial tree.
- [x] Lamps present on Sudetenstraße in scope; none added to other tertiary roads.
- [x] Stop 3448196000 shows a pole, **no shelter**; stop 3448196002 keeps its shelter.
- [x] Zebra 370882647 still at (4016.0, 4670.6) and walkable; traffic lanes, NPC sidewalks and car paths unchanged in
      count; parked cars and bollards are solid and don't block the zebra or driveways.
- [ ] `?compare=47.858199,11.483593,110` screenshot overlays the DOP (20) with carriageway and pavement edges within ±0.5 m.
      *(Met from station +28 to −40 (kerb faces +5.0 / −7.0 vs DOP +5.2 / −7.2); NW of +28 the class carriageway stays.)*
- [x] `pnpm test` + typecheck green; a test asserts the profile bands tile kerb to facade with no gaps/overlaps.
**Size:** M (new street-profile + sign data types, several sprites, no interior).

**S-1 as built** (`src/world/street-profile.ts`, data in `src/world/places/streets.ts`, tests in
`src/world/street-profile.test.ts`) and gotchas for later street profiles:
- **A profile is data per OSM way:** `build.ts` now keeps the way id on every road (`Road.id`) and the node and
  `shelter=no` on bus stops; the map's `roads` and `props` were re-baked from `data/` and spliced into
  `public/geretsried.map.json` (a full `pnpm map` would also change buildings, `covered` and `trees.bin`, unrelated to
  S-1). Stations run from the foot of an origin point along the way (`direction` ±1), offset + is right of +station.
- **What changes and what does not:** a range's bands (lanes, parking, sett gutter, kerb, slab pavement, class sidewalk,
  forecourt) replace the drawn cross-section; a `"facade"` band ends at the first building (ray march, capped by the
  side's `reach`), so nothing is drawn into a wall. `Road.width` stays 8 m: traffic lanes (±2 m), the line people walk
  (±5 m), zebras and stop lines are the sim's and were not touched. The parked cars' solids are kept off that ±5 m line
  (NE parked cars at +3.95, SW at −5.95, solids 4.2 × 1.7 m), so walkers on the SW side now walk between the lane and
  the parked cars (the real pavement is at −7.3 … −9.5); fixing that needs the sim to read the profile.
- **Sudetenstraße (way 157363825):** +28 … −39.9 (Berliner Weg node): NE lanes to 3.0, parking 3.0–4.6, gutter to 5.0,
  kerb 5.0–5.3, pavement to the OSM front (+7.2); SW lanes to 5.0, parking 5.0–6.6, gutter to 7.0, kerb 7.0–7.3,
  pavement to 9.5, forecourt to the facade (−17.5 at most). −39.9 … −72: NE the class default, SW the Rehmaus parking bay
  and pavement to 9.5 (the lawn behind stays). No solid edge lines from +170 to −170. Read off a DOP20 strip
  (`by_dop20c`, 5 px/m) rotated along the OSM centre line, which runs ~1 m NE of the real one.
- **Rounded kerb at Berliner Weg:** `corners` with radii 6/6 m: the kerb, gutter and pavement stop between the two
  tangent points (−26.7 and −46.3), an asphalt fan fills each corner, and the paved plaza runs from the start building's
  SE gable (−24.6) to Berliner Weg.
- **Parked cars:** 19, regular car sprites (Golf, BMW, A3, G, VW bus; hue-tinted), solid; automatic gaps at the zebra
  (±7 m), the corner, every road or drive meeting the kerb; data gaps for the player's car (NE +28 … −1.5: `game.test.ts`
  drives it straight ahead 20 m) and SW −12 … −40 (police cars turning out of Berliner Weg swing wide and got stuck on
  a parked car, failing the arrest test).
- **Bollards:** 17 red/white posts at −7.5, −41 … −66, drawn 0.16 m but solid 0.5 m square: a car's collision points
  sit a meter apart, so thinner solids let a car through; people still walk between them.
- **Trees:** nine street trees from the DOP20 crowns (NE +11, −1.5, −21 at +6.2; SW +8, −1.5, −9, −17, −24, −31 at −8.4);
  aerial crowns within r + 2 m of one are dropped (the one tree the game drew, at −12.7/−6.7, is one of them).
- **Lamps:** 11 on the NE side every 30 m from +168 to −170 (the class rule for primary/secondary is unchanged),
  slid up to 6 m off zebras, the corner and road mouths.
- **Signs (`StreetSign`):** a 7 cm pole and the signs as flat sprites at their heights (0.6 m, bottom at 2.2 m; plates
  0.6 × 0.33 m stacked down the screen), so the top-down camera reads them; `facing` is kept as data. S1 VZ 314 +
  "Mo-Sa 8-19 h" + 1040-32 at (4018.5, 4661.0); S2/S3 VZ 350 with the flashing light (entities.ts, on half of every
  second) at (4019.4, 4665.6) / (4012.0, 4676.3); S4 VZ 224 on both H poles. Zebra bars now span kerb to kerb (render
  only). "Sudetenstraße" painted in the SE-bound lane at −45.
- **Shelters:** `shelter=no` is honoured only for the stops checked (`POLE_ONLY_STOPS`: 3448196000, 2024816308,
  3823202158); 55 more stops carry the tag unchecked and keep their shelters. Bus lines and the job phones are untouched.
- **Chunk hashes** (every chunk's vertices, indices and index counts, before/after): 7 of 2112 changed: 1570, 1614,
  1615, 1616, 1660 (the scope) and 1612, 1657 (Neuer Platz and Karl-Lederer-Schule stops).
- **New textures (Codex):** materials `paving-slab-grey`, `sett-gutter-grey`, `road-name-sudetenstrasse`; props
  `vz314-parken-links`, `zz-mo-sa-8-19`, `vz1040-32-2std`, `vz350`, `vz224`, `flash-amber` (`process-sprites.py`).
- **Guesses:** parking extents and gaps (DOP shows cars, no bays), lamp spacing/side, S3 and S4 spots, the 6 m radii,
  the Rehmaus bay as parallel parking (the DOP looks angled), the lettering's wording/lane, NE tree offsets (pushed onto
  the narrow pavement). Reference images 01–13 and 20–24 were all on disk.

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

Follow-up (6d research, 2026-10-25, docs only; this item stays as built): newer Google Maps user photos (reference/hoanganh/30–32)
show No. 17 as **HoangAnh** (gold 3D letters "HOÀNG ANH", red neon "Asiatische Küche", dark-grey frames, "NEUERÖFFNUNG").
The sign for the No. 17 strips (wall 0 u 0.3–12.9) is now spec'd in B6a-2.

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
- [x] Along Sudetenstraße NW of the car park: denns · TAKKO · Orterer corner in that order, as in denns/01, takko/02.
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

**B3-1 follow-up (Alex's photo 2026-10-26, `reference/edeka-am-stern/40-alex-ecke-pylon.jpg`) — built 2026-10-26:** dark ochre
(`process-sprites.py` re-tints edeka-band/logo/pylon/roof-edeka), grey corner `#464a4d` with a "113" plate (`edeka-113`,
PIL) and a white pillar, dark canopy `#17181b` with the Heininger & Dietz box on its edge, the ochre roof box with the E logo on
the corner's roof edge, the pylon moved to the car-park entrance (9 m in from Breslauer Weg, right of the lane) with a plain blue
P board. Guesses: box sizes, the pylon's exact metres. Not built: gabion wall, ad boards, Feuerwehrzufahrt sign. Notes:
- **Pylon spot:** at the **car-park entrance from the street**, right of the entry lane, with a blue "P" board
  ("Privatparkplatz – 120 Min. pro Tag", "min. 30 Euro") and a "Feuerwehrzufahrt" sign beside it; a row of advertising
  boards on rails and a **gabion wall** in front, at the car-park edge. Today's pylon (3 m in front of wall 1 at u 5.5) is
  next to the store, not at the entrance → compare in game; move only if Alex wants it.
- **Roof board:** a yellow **box sign on the roof edge at the corner** (yellow panels, blue bottom stripe, square logo
  with a blue "E" and "EDEKA"), not a painted roof logo.
- **Corner:** grey plaster `#464a4d` with house number "113", a white plaster pillar, then the glass front under a dark
  canopy `#17181b`; the "Heininger & Dietz" fascia runs along the canopy edge.
- **Yellow:** overcast phone samples band `#5b4900`, pylon `#6e5901` (unclipped but under-exposed). Not the brand hex.
  **Alex 2026-10-26: dunkles Ocker behalten** → band, roof box and pylon use the dark photo ochre ~`#5b4900`
  (pylon `#6e5901`) instead of the built `#ffe31a`-ish brand yellow (to fit the dark palette).
- Backhupferl: still needs reference (B4-9).

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

### B3-5 · Orterer Getränkemarkt, Sudetenstraße 29a (#80, shop) — Size: S — status: implemented (partial: the pier's and corner opening's widths, the board's size and height, the wall-1 arcade's length, pillar size and spacing and the beam's depth, the small board's and the crate rows' spots, and the shop front standing flush with the balconies are guesses; no door drawn)
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
- [x] Corner matches 01/03; player can walk through the passage. Orterer job (#195) unchanged; tests green.
      (Corner and arcade drawn as relief on the solid outline, so the passage is exactly as walkable as before.)
Size: S
```

**B3-5 as built** (`src/world/places/am-stern-west.ts`, after Takko on B3-0's west block; no roof sign, as B3-0 says):
- **Sources.** `reference/orterer-am-stern/01–04` + `SOURCES.md` on disk and used: 01 for the pier, the board and the
  open corner, 03 for the arcade along the SE end (grey square pillars, white beam with a small board, glazing set back,
  crates), 02 (= takko/01) for the order. Heights from B3-0 / B3-2 (balconies from 4.5 m, the white band 3.2–4.4 m).
  POI #80, its name and position untouched; town-jobs.ts / #195 not touched.
- **Wall 0** (u 0 at the NW end): a plain white pier (`orterer-pier`, a window-free patch of the white render facade)
  from Takko's end at u 31.2 to u 35.4 under the band, which now runs on over it; the round-topped Orterer board
  (`orterer-logo`, 1.27 × 1.3 m, z 2.95–4.25) on it, at the TAKKO panel's height. Then the open corner to the S corner
  (u 35.4–43.5): the band as the beam over it on a grey square pillar (0.45 m) at the corner, the shaded arcade
  (`orterer-arcade`: glazing with crates in front, two bays) on OSM's wall 1.4 m behind, so the opening has real depth.
  Pier, band and beam stand on the balconies' front line (`BALCONY_DEPTH`) like denns and Takko.
- **Wall 1** (the passage, u 0 at the S corner): the beam 0.6 m out from u 0 to 15.9 (the Sudetenstraße block's end) on
  five grey square pillars about 4 m apart, a small Orterer board on it at u 9.6, four arcade bays on the wall behind.
- **Crates:** two rows of crates on pallets (`crate-stack` prop, top-down, 2.2 m) in the corner opening, half out from
  under the beam so the play camera sees them.
- **Generic engine change:** canopy `posts` got an optional `side` (meters square; without it the old thin steel posts),
  so the arcade's pillars are square and chunky. Never solid, like every post.
- **Passage untouched.** Nothing new is solid (posts and sprites never are), the footprint and building -156 are as they
  were; places.test keeps wall 1's pillars clear of -156 and the crates off Sudetenstraße's carriageway and sidewalk.
  Note: -156 (a 3.9 × 12.6 m flat box 0.7–1.2 m off wall 1, u 0.4–13) stands where 03 shows open pavement in front of
  the arcade, and from the play camera it hides most of wall 1's arcade; left as it is (B3-0: "don't dress it").
- **Sprites:** Codex (three images), processed by `scripts/process-sprites.py` (board keyed and cropped, 0.98:1, stored
  square; the arcade bay opaque; the crate row keyed and cropped like the trolleys).
- **Guesses:** the pier's width (u 31.2–35.4) and so the corner opening's, the board's size and height, the wall-1
  arcade's length, the pillars' size and spacing, the beam's depth on wall 1 (kept clear of -156), the small board's
  spot, the crate rows' spots, the shop front's line. Not built: the blue "1880" box and the poster column on the verge
  (street furniture), the poster text (unreadable), the door (not seen).
- **Every other chunk unchanged:** all 2111 chunk meshes hash identical before and after except chunk 1660 (the west
  block's); with the west block skipped, all identical.
- **Screenshots** (local): on foot at (4193, 4779) the crate rows at the corner; at (4200, 4772) the wall-1 beam with
  the small board beside -156; `?compare=47.85712,11.48605,28` from above.

### B3-6 · Ahorn Apotheke, Sudetenstraße 41 (#67, pharmacy) — Size: S — status: implemented (partial: the unit's start on wall 1, the end wall's bays and piers, the letters', boards' and A box's sizes and heights, the pillars and the glass' set-back are guesses)
```
Goal: The glass corner pharmacy at the car-park entrance: light-green "Ahorn Apotheke" lettering, a red
pharmacy "A" sticking out at the corner.
Reference: docs/places/ahorn-apotheke.md; reference/ahorn-apotheke/01-street-front.png (key), 02, 03.
Spec (via #0b, inside B3-0):
- POI #67 at 4276.7, 4823.1. Way 822461881, W corner (4270.7, 4827.3): glass on both faces; green lettering
  (#609c2b / #669c36) on the NW facade and the Sudetenstraße end face; projecting red "A" sign at the corner.
Acceptance criteria:
- [x] From Sudetenstraße the corner + pylon match 01. Post van job unaffected; tests green.
      (Pylon untouched as B3-0 set it; nothing new is solid or on the carriageway; src/sim and town-jobs.ts untouched.)
Size: S
```

**B3-6 as built** (`src/world/places/penny-sudetenstrasse.ts`, on B3-0's Penny block; no roof sign, as B3-0 says):
- **Sources.** `reference/ahorn-apotheke/01–04` + `SOURCES.md` on disk and used: 01 for the corner, the end wall and the
  "A" box, 02 for the car-park front (letters, set-back glass, window film), 03 for the context, and
  `reference/penny-sudetenstrasse/01` for the end wall's S part. Heights from B3-0 (balconies from 5.0 m on Penny's block).
  POI #67, its name and position untouched.
- **Wall 1** (the car-park front, u 0 at its NE end, the W corner at u 11.4): from u 2.4 (the white pier by da Daniele)
  to the corner the white band from 3.2 m up under the lowest balcony, standing on the balconies' front line
  (`BALCONY_DEPTH`) like denns / Takko / Orterer, on a white pier and a square white pillar at the corner (canopy posts,
  0.5 m); the light-green "Ahorn-Apotheke" letters with the maple leaf (`ahorn-letters`, 6.4 × 0.79 m, z 3.65) on it;
  three bays of glazing with the green window film and red "A"s (`ahorn-front`) 0.5 m behind the band's face.
- **Wall 0** (the end wall to Sudetenstraße, u 0 at the corner, no balconies): a bay behind the corner pillar (u 0.3–3.4),
  a white pier, a bay (u 4.1–7.1) under the framed white light box "Ahorn Apotheke" (`ahorn-board`, 3 × 0.75 m,
  z 3.75), the plain stretch with the downpipes, then two bays of film glazing (u 9.9–17.6).
- **PENNY.'s end-wall board moved** from over the corner (u 1–5.2, B3-0's guess) to over the S glazing (u 10.4–14.6,
  same height and size): 01 and penny/01 both show it there, and the light box takes the corner bay.
- **The red "A"**: a white light box 0.9 × 0.3 m, 4.1–5.0 m up, held out 0.3–1.2 m from the end wall 1.2 m from the
  corner, the pharmacy "A" (`ahorn-a`, the existing `pharmacy-a` prop stretched to a material layer) on both faces,
  looking along Sudetenstraße.
- **Generic engine change:** `pylon` got an optional `base` (the box starts that high, no ground shadow), for a sign
  held out from a wall. Tested in render/scene/places.test.ts.
- **Sprites:** Codex (three images), processed by `scripts/process-sprites.py` (letters keyed and cropped, 8.15:1,
  stored square; board and glazing opaque; `ahorn-a` made from `pharmacy-a`).
- **Guesses:** where the unit starts on wall 1 (u 2.4), the end wall's bay and pier widths, the letters', light box's and
  A box's sizes and heights, the A box's reach, the pillars' size, the glass' 0.5 m set-back. Not drawn apart: the door.
- **From the play camera** (straight down) the band, the corner pillar and the A box read; the letters on the band's
  face and the end wall's glazing only show at the screen's edge, as with the other Am Stern units.
- **Every other chunk unchanged:** all 2111 chunk meshes hash identical before and after except chunk 1661 (the Penny
  block's); with the Penny block skipped, all identical.
- **Screenshots** (local): on foot at (4262, 4822) and (4268, 4818) the car-park front with the pylon; at (4270, 4834)
  the end wall with the A box, the glazing and PENNY.'s board; `?compare=47.85663,11.48738,22` from above.

### B3-7 · Bar Café da Daniele, Sudetenstraße 39 (#77, food) — Size: S — status: implemented (partial: the units' split, the board's and script's sizes and heights, the barrier's spot, the boom's height and bands, the sign's size are guesses; the band's foot is 0.3 m higher than in 01)
```
Goal: A crimson "Bar Café da Daniele" fascia with the cup logo, a grey script sign above, parking bays with
red/white posts right in front.
Reference: docs/places/da-daniele.md; reference/da-daniele/01-street-front.png (key), 02.
Spec (via #0b, inside B3-0):
- POI #77 at 4280.4, 4816.7. Way 822461881, NW facade between the Penny canopy and Ahorn: fascia #8d384f,
  white text; grey script sign above. Barrier-post sprites along the bays.
- Terrace: not seen (website mentions an outdoor area): needs reference, add no tables.
Acceptance criteria:
- [x] From the car park the unit matches 01. Bays stay drivable. pnpm test + typecheck green.
      (Crimson board under the grey script on a white band, set-back glazing; the barrier and its "2 Std." sign at the
      bays' SW end, never solid and clear of every lane; src/sim and town-jobs.ts untouched.)
Size: S
```

**B3-7 as built** (`src/world/places/penny-sudetenstrasse.ts`, on B3-0's Penny block next to B3-6's Ahorn; no roof sign):
- **Sources.** `reference/da-daniele/01–04` + `SOURCES.md` on disk and used: 01 for the front (board, script, band, Geyer's
  window NE of the café), 02 and 03 for the barrier and its sign stack, 04 for the context. Heights from B3-0 / B3-6
  (balconies from 5.0 m, band top 4.9 m). POI #77, its name and position untouched.
- **The band** (white, flush with the balconies' fronts via `BALCONY_DEPTH`, like Ahorn's and the west block's) runs on
  wall 2 from the end of Penny's glass (u 18.1) to the bend (u 29.68) on three white piers (u 18.1, 23.9, 29.68), and
  on along wall 1 from u 0 to Ahorn's pier at u 2.4 (walls 1 and 2 are collinear within 0.2°). Glazing (`shop-front`)
  0.5 m behind its face. The pier at u 23.9 splits Geyer (NE, left plain: no facade sign per the brief; 01 shows a
  small grey board there, not drawn) from the café, which holds the POI (wall 2 u ≈ 26.9).
- **Signs:** the crimson "Bar Café [cup] da Daniele" board (`daniele-fascia`, 3.6 × 0.95 m, u 25.0–28.6) at the band's
  foot, the grey script "da Daniele Bar · Café" with the cup (`daniele-script`, keyed, 3 × 0.8 m, z 3.75–4.55) on the
  band above it. 01 puts the band's foot at about 2.2 m; it stays at 2.5 m, the lowest a canopy fascia may hang
  (places.test).
- **"Barrier posts":** the photos show no posts along the bays. The red/white post in 02/03 is the car park's
  **raised barrier boom** (its sign reads "Schrankenöffnungszeiten 7 bis 20 Uhr"): grey housing, the white boom
  standing 6.6 m upright with five red bands, and beside it (towards the building) a post with the sign stack
  (`daniele-parking`: opening times, the blue parking-disc "2 Std." panel, "Hier gilt die StVO"; facing SW, the way
  in). It stands on the kerb at the bays' SW end, 5.5 m out from wall 1 at its u 2.4 (world ≈ 4270.9, 4816.8),
  ≥ 1.5 m clear of the aisle's edge. All of it is `pylon` parts, never solid. Not built: the second raised boom in
  01's foreground (its spot can't be told from the photos), the outdoor seating (no photo).
- **Generic engine change:** `pylon` without `texture` (then no `z0`/`z1`) is a plain box in its colour, for posts,
  a barrier housing and the boom's bands. Tested in render/scene/places.test.ts.
- **Sprites:** Codex (three images) via `scripts/process-sprites.py`: board opaque (cut above a strip under its rim),
  script keyed and cropped (3.74 : 1), sign stack opaque; all stored square.
- **Test** (world/places/places.test.ts): board and script on wall 2 past PENNY's canopy and before the bend, script
  over the board, band reaching the bend and as deep as the balconies; the barrier's parts outside the building and
  more than half a lane + 0.5 m from every nearby road (car-park lanes and Sudetenstraße).
- **From the play camera** (straight down) the barrier's bands and shadow read; the board and script show at the
  screen's edge, as with the other Am Stern units.
- **Every other chunk unchanged:** all 2111 chunk meshes hash identical before and after except chunk 1661 (the Penny
  block's); with the Penny block skipped, all identical.
- **Screenshots** (local): on foot at (4266.5, 4807.9) the board, script and barrier at the screen's lower right;
  `?compare=47.85668,11.48739,22` from above.


### Batch 4: Am Stern small shops (decision)
Same rules: **exterior only** via **#0b** (unit wall-signs on a shared facade). Eight shops have photos and get a
dressing spec; three have none and stay **needs reference** with no look spec. Shops in the west complex
(127872184) are dressed **inside B3-0**; the others sit on their own buildings along Sudetenstraße, SW side
(Krömer, Sun Style + TEDi, B&L) or NE side (Woolworth), and can go in one PR "Sudetenstraße shop row, Stein".
Flamingo and Fellomenal are in the Post block 119921780 (B2-2). Backhupferl is a counter inside EDEKA (B3-1).

### B4-1 · TEDi, Sudetenstraße 26 (#15, shop) — Size: S — status: implemented (partial: the stair strip's and the boxes' spot and size, the canopy's height and depth (drawn flat), the bays, the door's and racks' spots, the roof sign and the roof colours are guesses; orange lower wall not built)
```
Goal: Discount store under a grey canopy: two blue TEDi boxes over the door, goods racks on the pavement.
Reference: docs/places/tedi-am-stern.md; reference/tedi-am-stern/01-street-front.png (key), 02, 04.
Spec (via #0b):
- Street frame "Sudetenstraße", POI "TEDi" (#15 at 4151.2, 4783.6). Way 120402837 (shared with Sun Style B4-7),
  NE frontage (bearing 303°), SE part. Wall peach #afa187; grey canopy #575f62 along the frontage.
- Two blue sign boxes #2955a1 with white "TEDi" over the entrance; goods-rack props in front.
- Photos: ≥4 storeys (engine 2): keep levels unless #0b changes heights. Orange lower wall: needs reference.
Acceptance criteria:
- [x] From Sudetenstraße the front matches 01 (canopy, two blue boxes, racks). Pavement stays walkable.
- [x] pnpm test + typecheck green.
Size: S
```

**B4-1 as built** (`src/world/places/tedi-sudetenstrasse.ts`, a new place for the whole of way 120402837, so B4-7 Sun
Style / Kafka add their signs to the same file):
- **Sources.** `reference/tedi-am-stern/01, 02, 04` + `SOURCES.md` on disk and used (01 for the front, 02 for the
  canopy's run), plus `reference/sun-style/01, 02` for where the peach TEDi block meets the white NW block. Heights and
  roofs from the Bavarian LoD2 model (tile 684_5302) and the DOP20.
- **Masses** (the footprint cut along the model's walls; they tile it): the white NW block `DEBY_LOD2_4602689`
  (Sun Style, Kafka; eaves 12 m, ridge 17.3 m along the street, gables at both ends, `wallColour` white), the peach
  TEDi block `DEBY_LOD2_4602690` (eaves 10.6 m, ridge ~15.7 m running from the street front back to the hall, so a
  gable on Sudetenstraße; the model's 14.8 m side ridge to the NW is not drawn) and the store's hall behind it (flat,
  white, 4.6 m with its parapet). The seam meets wall 7 at u 9.37, where the model's wall lies on OSM's.
- **Front** (walls 6 and 7, u 0 at their SE ends): a flat grey canopy (z 3.3, 2.4 m deep, 0.35 m fascia) along the whole
  unit; the glazed stairwell strip with blue spandrels (`tedi-stair`, wall 6 u 1.8–3.9, from the canopy up to 10 m);
  the two blue TEDi boxes (`tedi-sign`, 1.1 × 0.87 m each) side by side on the canopy's front under it; the store's
  glazing (`tedi-front`) either side of the entrance (`shop-front`); the house door "26" near the seam (`shop-front`,
  blue frame not drawn); five goods racks (new prop `goods-rack`) on the pavement 3.4 m out, just past the canopy's
  edge so the play camera sees them; TEDi's box painted on the hall's flat roof (`roofSign`) for the top-down view.
- **Sprites:** Codex (four images), processed by `scripts/process-sprites.py` (sign, strip, glazing opaque and square;
  the rack keyed and cropped like the crates).
- **Guesses:** the strip's and boxes' spot and size, the canopy's height and depth (01 shows it slanted; the engine's
  canopy is flat), the bays' widths, the door's and the racks' spots, the roof sign (no photo of the roof), the roof
  colours (DOP20 medians), the hall's split along the model's roof edge, the peach (#afa187 is a shade sample). The
  model's front of the TEDi block stands ~2.7 m in front of OSM's wall; OSM's wall stays the solid. Not built: the
  orange lower wall parts at 01's right (no clean sample); the lower canopy over the junction to the white block
  (`DEBY_LOD2_105018834`, Sun Style's board under it) is left to B4-7.
- **Every other chunk unchanged:** all 2111 chunk meshes hash identical with and without the place except chunk 1661
  (the building's).

### B4-2 · Woolworth, Sudetenstraße 27 (#166, shop) — Size: S — status: implemented (partial: the letters' spot and size, the glazing's run to the NW, its bays and the entrance's spot, the roof sign and the brand red are guesses)
```
Goal: Low white store at the Marienburgweg corner with big red WOOLWORTH letters over a glass front.
Reference: docs/places/woolworth-am-stern.md; reference/woolworth-am-stern/01-street-front.png (key), 02, 04.
Spec (via #0b):
- POI "Woolworth" (#166 at 4138.3, 4716.7). Way 1385222318 (levels 1, flat, keep). Sign on the SW edge
  (4096.1, 4695.4) → (4140.3, 4723.9), E end: white band #fdfdfe, red letters #fe635f (sunlit; exact brand red
  needs reference). Glass strip under it. Car park in front stays drivable.
Acceptance criteria:
- [x] From the car park the band + letters match 01. pnpm test + typecheck green.
Size: S
```

**B4-2 as built** (`src/world/places/woolworth-am-stern.ts`, a new place for way 1385222318; no other place had it):
- **Sources.** `reference/woolworth-am-stern/01, 02, 04` + `SOURCES.md` on disk and used (01 for the front, 02 for the
  corner, 04 for the roof). Height and roof from the Bavarian LoD2 model (tile 684_5302, `DEBY_LOD2_4603010`, flat,
  4.46 m) and the DOP20 (white flat roof). The spec's "levels 1, keep" is replaced by the model's height: levels
  (4.46 − 0.6) / 3, so the engine's parapet tops out at 4.46 m.
- **Front** (wall 2, the SW car-park side, 52.6 m, u 0 at its NW end): white plaster (`facade: "plaster"`, white
  `wallColour`), the store's glazing (`woolworth-front`) in ~4 m bays from u 1 to the white corner pier (3 m), the entrance
  (`shop-front`) at u 44.6–47, the red WOOLWORTH channel letters (`woolworth-letters`, 0.92 m high, 6.5 m long,
  ending 4.2 m from the Marienburgweg corner) on the white band over the glazing (z 3.2–4.1); WOOLWORTH painted on the
  flat roof by the E end (`roofSign`, u 28–48) for the top-down camera. Nothing outside the footprint: the car park
  stays drivable.
- **Sprites:** Codex (two images), processed by `scripts/process-sprites.py` (letters keyed off magenta and cropped,
  aspect 7.0; glazing opaque and square).
- **Guesses:** the letters' spot and size along the band, the glazing's run to the NW (01 shows only its E part) and
  its bays, the entrance's spot, the corner pier's width, the roof sign (no photo of the roof), the brand red (drawn
  #d8232a-ish; 01's sunlit #fe635f). The play camera shows the 4.46 m front only as a thin strip above the car park (a
  real kerb tree stands in front of the letters, as in 01); the roof sign carries the place from above.
- **Every other chunk unchanged:** all 2111 chunk meshes hash identical with and without the place except chunk 1616
  (the building's).

### B4-3 · B&L Hairstyling, Sudetenstraße 28 (#134, shop) — Size: S — status: implemented (partial: the white/cream split, every bay's, pier's and sign's spot and size, the board's and ledge's heights, the steps, the roof pitch and the roof sign are guesses)
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
- [x] From the street the board + window panels match 01. pnpm test + typecheck green.
Size: S
```

**B4-3 as built** (`src/world/places/bl-hairstyling.ts`, a new place for way 119921782; no other place had it):
- **Sources.** `reference/bl-hairstyling/01–04` + `SOURCES.md` on disk and used (01 for the front, 03 for the white/cream
  split, 04 for which end the shops are at; 02 context only). Heights and roof from the Bavarian LoD2 model (tile
  684_5302: three gabled houses `DEBY_LOD2_4602788` / `4602787` / `4602786`, on wall 3 at u 0–16.6 / 16.6–35.2 /
  35.2–55, eaves 9.7–9.9 m, ridges 11.85–12.0 m, ridges along the street) and the DOP20 (brown tiles: sunlit SW planes
  #d2beb4, NE planes in shade #6a6155). Wall 3 (54.9 m) is the Sudetenstraße front, u 0 at its SE end by the Post block.
- **Correction to the spec:** Georgiadis is SE of B&L (left in 01, facing the front), not NW; the satellite pins agree.
  The "white part" is the two SE houses (no shops), not Georgiadis' unit: his window sits in the cream NW house.
- **Masses** (cut on the model's seam at wall 3 u 35.2, which runs on to wall 1): the white SE houses and the cream NW
  house with the shops, both at the model's 9.8 m eaves under one gable roof each (gables at the ends and on the seam).
  The model's houses are only 9.6 m deep while OSM's outline is 12.3–13.6 m (the aerial shows the back plane running on
  to OSM's back wall), so the roof is drawn over OSM's depth at 18°, which meets the model's 12 m ridge.
- **Front** (NW house): a white ground-floor surround under a thin dark-red ledge (`bands`, z 0–3.1); Georgiadis' glass
  door (`shop-front`), his "GE" window (`ge-window`) and grey board (`georgiadis-board`); B&L's two logo-panel windows
  (`bl-window`), a glazed bay (`bl-glass`), the door up two steps (`shop-front` + `stairs`) under the black
  B&L HAIRSTYLING board (`bl-board`, 3.3 × 0.93 m), two more glazed bays to the NW end; the board painted on the NW
  house's street-side roof plane (`roofSign`, 9 × 3 m, its top towards the street so it reads nearly level north-up).
  The roof is pitched, so the engine puts no vents on it (nothing sits on the roof sign).
- **Sprites:** Codex (five images), processed by `scripts/process-sprites.py` (all opaque, stretched square).
- **Guesses:** the white/cream split on the model's seam (03 shows it under the kerb tree), every bay's, pier's and
  sign's spot and size along the front, the board's and ledge's heights, the steps, the roof pitch (fitted to the
  model's ridge), the roof sign (no photo of the roof), the cream (01's #9e937f is shaded; drawn lighter). Not built:
  the solar panels on the middle house (DOP20), the two blank light boxes beside Georgiadis' board.
- **Every other chunk unchanged:** all 2111 chunk meshes hash identical with and without the place except chunk 1661
  (the building's).

### B4-4 · GG Radsport, Marienburgweg 25 (#116, shop) — Size: S — status: implemented (partial: the floor height, every bay's, the box's and the fascia's spot and size, the canopy's height, depth and run, the steps, and the bikes' and board's spots are guesses; the fascia hangs on the canopy's front, not on the wall)
```
Goal: Bike shop on the Marienburgweg side of the west complex: red fascia "GG Radsport", bikes on a rack,
green A-board, steps to the door.
Reference: docs/places/gg-radsport.md; reference/gg-radsport/01-street-front.png (key), 02, 03.
Spec (via #0b, inside B3-0):
- Street frame "Marienburgweg", POI "GG-Radsport" (#116 at 4174.6, 4715.9). Way 127872184, NW edge
  (4178.8, 4704.7) → (4149.3, 4748), u ≈ 12 m. Red fascia #8c2027 + white italic text; red window panel;
  dark canopy (shared with B4-5/B4-6). Props: bike rack + bikes, green A-board, blue wall box.
Acceptance criteria:
- [x] From Marienburgweg the unit matches 01. Pavement stays walkable. pnpm test + typecheck green.
      (Matches 01 in order and colour; the fascia hangs on the canopy's front, see below. Nothing new is solid.)
Size: S
```

**B4-4 as built** (`src/world/places/am-stern-west.ts`, wall 5 of B3-0's west block, u 0 at the N corner; no roof sign):
- **Sources.** `docs/places/gg-radsport.md`, `reference/gg-radsport/01–04` (01 for the front, 02 for the bikes and the
  A-board, 03 for the blue box), and `reference/aphrodite-aestetic/01`, `reference/nexial/01` for the canopy's run.
  Masses and heights unchanged from B3-0 (LoD2): along wall 5 the NE strip to u 4.2, the north block's NW end to u 20.2,
  the link to u 37.5, the Sudetenstraße block's end to u 52.4. GG's POI lies at u 11.6, in the north block's end.
- **Shared canopy (for B4-5 and B4-6 too):** one dark steel canopy (`canopy-glass` tinted #3e4248, a 0.18 m steel edge,
  no posts: the photos show cantilevered brackets) on wall 5 from u 7 to 51.5 at z 4.4, 1.6 m deep. Aphrodite and Nexial
  only add their fronts and signs under it (`MARIENBURG`, `MB_FLOOR`, `MB_CANOPY` in the file).
- **GG Radsport:** three dark-framed glazed bays (`gg-glass`, u 8.4–12.0) and the door bay (`gg-door`: the red
  "Verkauf & Reparatur" panel, the red "Eingang" sticker; u 12.0–13.3) from the raised floor (0.6 m) to 3.2 m; the red
  #8c2027 fascia with the white italic "GG Radsport" (`gg-fascia`, 4.9 × 0.7 m) over them; the blue wall box (a plain
  box, u 7.6, 1.05–1.75 m); four steps up to the floor at u 14.6–17.2 (one flight, shared with the house door Aphrodite's
  01 shows); three bikes in a stand (`bike-rack`, top-down, 3.6 m out) and the green A-board (`gg-aboard`, 4.6 m out).
- **Deviation:** in 01 the fascia sits on the wall under the canopy. The play camera looks almost straight down, so
  nothing under a 1.6 m canopy at 4.4 m shows from any spot; the fascia hangs on the canopy's front (z 3.7–4.4) instead,
  as PENNY's board does. The glazing and the door stay on the wall.
- **Sprites** (Codex, `process-sprites.py`): `gg-fascia`, `gg-glass`, `gg-door` (opaque, squared materials);
  `bike-rack`, `gg-aboard` (props, keyed off magenta). The row helper got an optional `z0` (the raised floor).
- **Guesses:** the floor's 0.6 m; every bay's, the box's and the fascia's spot and size (read off 01 against a 2.2 m
  door); the canopy's height, depth and run; the steps' spot, depth and count; the bikes' and the A-board's spots.
- **What the camera shows:** two map trees stand in front of the unit (as in 01), so from the play camera and from
  above the bikes, the board and most of the fascia are under their crowns; the canopy reads as a dark strip along the
  face and the blue box and the red fascia's edge show beside the trees. With the bikes and board moved into the open for
  a test they render the right size and way round.
- **Every other chunk unchanged:** all 2111 chunk meshes hash identical to HEAD except chunk 1660 (the west block's own).
- **Screenshots** (local scratchpad `b4-4/`): `play.png` (play camera from Marienburgweg), `overhead.png`,
  `overhead-close.png`, `props-test.png`.

### B4-5 · Aphrodite Aesthetic, Marienburgweg 25 (#157, shop) — Size: S — status: implemented (partial: the house door's, the glazing's, the doors' and the fascia's spots and sizes, the gold's hex, the railing's and the hedge's spot and size are guesses; the fascia hangs on the canopy's front, not on the wall)
```
Goal: Beauty studio with a dark fascia and gold script, full-height dark glazing, white wall, steps and hedge.
Reference: docs/places/aphrodite-aestetic.md; reference/aphrodite-aestetic/01-street-front.png (key), 02, 03.
Spec (via #0b, inside B3-0):
- POI "Aphrodite-aestetic" (exact; sign says "Aphrodite Aesthetic") at 4170, 4726.8. NW edge of 127872184,
  u ≈ 23 m. Fascia #191f27, gold text (hex needs reference); dark frames #1e2531; dark louvred canopy.
Acceptance criteria:
- [x] From Marienburgweg the unit matches 01. pnpm test + typecheck green.
      (Matches 01 in order and colour: house door and letterbox panel, white wall, dark glazing with two doors, railing
      and hedge; the fascia hangs on the canopy's front, see below. Nothing new is solid.)
Size: S
```

**B4-5 as built** (`src/world/places/am-stern-west.ts`, wall 5 of B3-0's west block next to B4-4, under B4-4's shared canopy; no roof sign):
- **Sources.** `docs/places/aphrodite-aestetic.md`, `reference/aphrodite-aestetic/01–04` (01 for the order and the
  front, 03 for the glazing's run and its doors, 02 for the hedge). The POI lies at u 23.2 on wall 5, in the link
  (u 20.2–37.5). Masses, heights, the canopy (`MB_CANOPY`, z 4.4, 1.6 m deep), the raised floor (`MB_FLOOR`, 0.6 m) and
  GG's steps (u 14.6–17.2) are reused unchanged; nothing of the building is duplicated.
- **Front:** the house entrance at the top of GG's steps (`mb-house-door`: glazed door under a top light, steel
  letterbox panel; u 17.4–19.4, z 0.6–3.2), white wall to u 20, then the studio's glazing u 20–26.6 in five 1.32 m bays
  (`aphrodite-glass`, `aphrodite-door` in bays 2 and 4) from the raised floor to 3.7 m.
- **Fascia on the canopy's front**, as B4-4's: anthracite #191f27 with the gold script "Aphrodite Aesthetic"
  (`aphrodite-fascia`, 6.8 × 0.62 m, z 3.78–4.4, 0.1 m past the glazing at each end). In 01 it is on the wall under the
  canopy, where the straight-down play camera cannot see it.
- **Railing and hedge:** a grey rail at 1.54–1.6 m on five thin posts, 1.8 m out, u 17.4–27.6; a hedge box 1.0 m high,
  2.0–2.9 m out, u 17.6–28.4 (plain `pylon` boxes along wall 5, never solid). Note: a `pylon`'s `h` is its top, not
  its height over `base`.
- **Sprites** (Codex, `process-sprites.py`): `aphrodite-fascia` (the gold strokes thickened so the script survives the
  512 px square), `aphrodite-glass`, `aphrodite-door`, `mb-house-door` (opaque, squared materials).
- **Guesses:** the house door's and letterbox panel's spot and size; the glazing's run, bay count, which bays are doors
  and its top; the fascia's size; the gold (#c9a96a, too small in the photos to sample); the railing's height, line and
  posts; the hedge's spot, depth and height. Not built: the small "ACB" sign and the "25" plate S of the glazing.
- **What the camera shows:** from the pavement in front, the canopy covers the glazing and the doors (the glass panes
  show them dimly); the hedge, the rail and the fascia's thin gold-on-dark strip on the canopy's edge read best from the
  far side of Marienburgweg. From above the canopy and the hedge run along the link's face.
- **Every other chunk unchanged:** all 2111 chunk meshes hash identical to HEAD except chunk 1660 (the west block's own).
- **Screenshots** (local scratchpad `b4-5/`): `play.png` (play camera from Marienburgweg's far side), `play-crop.png`,
  `overhead.png`.

### B4-6 · Nexial IT-Services (#114, shop) — Size: S — status: implemented (partial: the glazing's run, bays and door, the fascia's and the panel's spots and sizes, the window's spot, the rail's and hedge's run are guesses; the insurance fascia hangs on the canopy's front, not on the wall; Nexial's own door is not seen and not built)
```
Goal: IT service office at the Sudetenstraße end of the Marienburgweg face: white "nexial IT-SERVICES" panel
high on the wall, dark insurance-agency fascia below, parking in front.
Reference: docs/places/nexial.md; reference/nexial/01-street-front.png (key), 02.
Spec (via #0b, inside B3-0):
- POI "Nexial" at 4159, 4743.5. NW edge of 127872184, u ≈ 43 m (near the W corner): verify the face.
  Upper panel #b0bdcd with dark/teal text; lower fascia #5b7088 "Württembergische Versicherungsagentur
  Stricker & Reinhart". OSM says shop=hairdresser: wrong, do not add hairdresser props.
Acceptance criteria:
- [x] Both signs readable as in 01. pnpm test + typecheck green.
      (Both signs are there in 01's order and colours: the white nexial panel on the wall over the canopy, the slate
      fascia on the canopy's front. From the straight-down play camera both read only as thin strips, as B4-4's and
      B4-5's do; the textures themselves are legible. Nothing new is solid.)
Size: S
```

**B4-6 as built** (`src/world/places/am-stern-west.ts`, wall 5 of B3-0's west block S of B4-5, under B4-4's shared canopy; no roof sign):
- **Sources.** `docs/places/nexial.md`, `reference/nexial/01–02` (01 for both signs and the glazing, 02 for the order
  along the face), `reference/aphrodite-aestetic/03` (the white wall S of Aphrodite). 01 and 02 look N along the face:
  Aphrodite's glazing far off, white wall, then the insurance office's glazing under the canopy, the nexial panel high
  on the link's wall over its N half, a window S of it under the Sudetenstraße block. The face is verified: the POI
  lies at u 43.2 on wall 5, 5.5 m inside, in the Sudetenstraße block's end. Masses, heights, the canopy (`MB_CANOPY`),
  the raised floor (`MB_FLOOR`) are reused unchanged; nothing of the building is duplicated.
- **Text.** The fascia in 01 reads "Württembergische … Versicherungsbüro Stricker & Reichert" (the spec's "agentur …
  Reinhart" was a misread); the panel reads "nexial / IT-SERVICES | LEISTUNG UND VERANTWORTUNG".
- **Front:** the insurance glazing u 29.6–37.4 in six 1.3 m bays (`wv-glass` with a top light, `wv-door` in the 5th
  from N) from the raised floor to 3.7 m (as Aphrodite's); one more `wv-glass` as a window at u 39.6–40.9, z 1.5–2.8.
- **Signs:** the slate #5b7088 fascia with white text (`wv-fascia`, 8.0 × 0.46 m, 17.3:1) on the canopy's front at
  z 3.94–4.4, 0.1 m past the glazing at each end, as B4-4/B4-5 did; the white panel (`nexial-panel`, 3.3 × 0.7 m,
  4.7:1) on the wall at u 30.9–34.2, z 4.7–5.4, above the canopy and under the link's 5.7 m roof, as in 01.
- **Rail and hedge** run on from Aphrodite's: a rail at 1.54–1.6 m, 1.8 m out, u 27.6–37.6 on four more posts; the
  hedge 1.0 m high, 2.0–2.9 m out, u 28.4–41 in two boxes (plain `pylon`s, never solid).
- **Sprites** (Codex, `process-sprites.py`, cropped out of their magenta margin): `nexial-panel`, `wv-fascia`,
  `wv-glass`, `wv-door` (opaque, squared materials).
- **Guesses:** the glazing's run, bay count, the door's bay and its top; the fascia's size (the Codex board's aspect);
  the panel's spot and size (4.7:1 from Codex, 01 reads nearer 3.3:1) and height; the window's spot and size; the rail's
  and hedge's run. Not built: Nexial's own door (not seen), the vent grille and the small plates S of the glazing.
- **What the camera shows:** from Marienburgweg the canopy covers the glazing (seen dimly through the glass panes);
  the slate fascia is a thin blue-grey strip on the canopy's edge, the panel a thin white strip with the teal letters
  just behind the canopy's root; the rail and hedge run on along the face.
- **Every other chunk unchanged:** all 2111 chunk meshes hash identical to HEAD except chunk 1660 (the west block's own).
- **Screenshots** (local scratchpad `b4-6/`): `play.png`, `play-crop.png`, `play-across.png`, `play-across-crop.png`,
  `overhead.png`.

### B4-7 · Sun Style Bodystyling Studio, Sudetenstraße 24 (#169, shop) — Size: S — status: implemented (partial: the glass canopy's run, height and depth, every bay's, door's and sign's spot and size, the units' split, the porch's door, pier and board spots, the gold and the roof sign are guesses; the fascia and Kafka's panel sit on the canopy's front, the porch is drawn flat)
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
- [x] From Sudetenstraße the fascia + canopy match 01. pnpm test + typecheck green.
      (The glass canopy runs along the white block with the black/gold fascia on its front edge and Kafka's panel on
      it further NW, as in 01. From the straight-down play camera both read as thin strips on the canopy's edge, as
      B4-4–B4-6's do; the fascia painted on the roof carries the name for the top-down view.)
Size: S
```

**B4-7 as built** (`src/world/places/tedi-sudetenstrasse.ts`, B4-1's place for way 120402837, extended; no new
building or mass):
- **Sources.** `docs/places/sun-style.md`, `reference/sun-style/01, 02, 04` + `SOURCES.md` on disk and used (01 for
  everything, 02 for the viewing direction), `reference/tedi-am-stern/01` (door "26"), the Bavarian LoD2 model (tile
  684_5302: the white block's 0.4 m bay steps at u 15.15–18.95 and 25.62–29.4; the porch `DEBY_LOD2_105018834`).
- **Unit order.** 01 looks SW (02 looks SE with the peach block on its right), so left in 01 is SE: Sun Style is at
  the white block's SE end by the seam, Kafka NW of it. OSM's nodes have it the other way round (Kafka 10 m SE); the
  photo wins. The POIs stay where they are (Sun Style's lies at wall 7 u 29).
- **Porch** where the blocks meet (`105018834`, u 6.1–9.3, 2.4 m deep, a dark metal shed roof from 4.23 m at the
  wall to 2.62 m at the front): a flat canopy (top 2.95 m, 0.2 m fascia, #564a54) on a peach pier at its SE front
  corner (plain `pylon`), a door on the wall in it (`shop-front`), and Sun Style's black service board
  (`sunstyle-board`, 1.7 × 2.15 m) on the porch's front under the roof's edge, where 01 shows it. TEDi's canopy on
  wall 7 now ends at u 5.0 (was 9.17) and door "26" moved to u 3.4–4.9 (was 6.6–8.4, inside the porch), its glazing
  to one bay u 0.1–3.3: tedi/01 shows the door at the canopy's NW end with peach wall past it.
- **White block:** a glass canopy (`canopy-glass`, u 9.47–29.8, top 3.55 m, 2 m deep); Sun Style's white-framed
  glazing and glass door (`sunstyle-glass`, `sunstyle-door`, u 9.8–19.8, to 2.5 m) and Kafka's door and glazing
  (u 20–29.6); Sun Style's fascia (`sunstyle-fascia`, 4.4 × 1.0 m) hanging from the canopy's front edge at u 9.6–14;
  Kafka's grey panel (`kafka-sign`, 3.8 × 0.89 m, "VERSICHERUNGEN / FINANZIERUNGEN · KREDITE") standing on it at
  u 20.6–24.4; the two maroon-brown bay windows (`sunstyle-bay`, 0.4 m proud) from 3.9 m up under the eaves; the
  fascia painted on the street-side roof plane (u 11–20, 9 × 2.05 m, top towards the street).
- **Sprites** (Codex, `process-sprites.py`): the fascia, the board and Kafka's panel cut out of their magenta margin
  (opaque, squared), the glazed bay, the door bay and the bay cladding (opaque, squared).
- **Guesses:** the glass canopy's run, height and depth; every bay's, door's and sign's spot and size (read off 01
  against the model's bay steps); the units' split at u 19.9; the porch's door, pier and board spots and the flat
  porch roof's height; the gold (#d4a640; too small in 01 to sample); the board's text (Codex; 01's is unreadable);
  the roof sign (no photo of the roof). Not built: the third brown bay at u 34–38 (past OSM's wall end, not in a
  photo), the parking signs and the election poster.
- **What the camera shows:** from the pavement the glass canopy runs along the white block, the porch's dark roof sits
  lower between it and TEDi's grey canopy, the brown bays show on the wall towards the screen edge; the fascia and
  Kafka's panel are thin strips on the canopy's edge; the gold "Sun Style" reads large on the roof.
- **Every other chunk unchanged:** all 2111 chunk meshes hash identical to HEAD except chunk 1661 (the building's own).
- **Screenshots** (local scratchpad `b4-7/`): `play.png`, `play-crop.png`, `play-across.png`, `overhead.png`.

### B4-8 · Spielwaren Krömer, Sudetenstraße 20 (#170, shop) — Size: S — status: implemented (partial: the shop's run, the bays', door's and sign's spots and sizes, the canopy's height, depth and run, the stairwell strips' spots, the upper windows' spacing, the racks' spots, the roof sign and the roof colour are guesses; the other units' shop fronts not built)
```
Goal: Toy shop in a white block with blue stripes and yellow window lintels; white "Spielwaren Krömer" sign on a
glass canopy with blue struts, toys outside.
Reference: docs/places/spielwaren-kroemer.md; reference/spielwaren-kroemer/01-street-front.png (key, Sep 2023), 02, 04.
Spec (via #0b):
- Street frame "Sudetenstraße", POI "Spielwaren Krömer" (#170 at 4094.6, 4741.4). Way 120402849, NE edge
  (4117.4, 4755) → (4066.7, 4720.5), u ≈ 26 m. Wall #cdd1d4, stripes ≈ #59779d, lintels ≈ #b5a955 (new facade
  texture: ask first). White sign panel, blue text (hex needs reference). Goods props outside.
Acceptance criteria:
- [x] From Sudetenstraße the front matches 01. pnpm test + typecheck green.
Size: S
```

**B4-8 as built** (`src/world/places/spielwaren-kroemer.ts`, a new place for way 120402849):
- **Sources.** `reference/spielwaren-kroemer/01, 02, 04` + `SOURCES.md` and `docs/places/spielwaren-kroemer.md` on disk
  and used (01 for the shop front, 02 for the sign and the canopy's run). Heights and roofs from the Bavarian LoD2
  model (tile 684_5302) and the DOP20.
- **Masses** (cut on the model's seam: wall 3 u 2.77, wall 1 u 58.99): the main block `DEBY_LOD2_4602884` (eaves
  12.4 m, the mean of the model's 12.8 m front and 12.0 m back; gable roof along the street at 29.5°, which reaches the
  model's 16.48 m ridge over OSM's 14.7 m depth; gable at the NW end) and the short SE block `DEBY_LOD2_105018827`
  (eaves 12.2 m, 24.6° to its 15.55 m ridge, gables at both ends). White render, orange-brown tiles.
- **Front** (OSM splits it into walls 3, 4, 5; u 0 at each one's SE end): a glass canopy (`canopy-glass`, z 3.3, 2 m
  deep, thin blue edge for the struts) along all of walls 4 and 5; Krömer on wall 4 round the POI (u ≈ 17): a toy
  window (`kroemer-glass`, u 12.6–16.5), the glazed door (`kroemer-door`, 16.6–19.0), a second toy window (19.1–24.4);
  the white sign (`kroemer-sign`, blue "Spielwaren", red "Krömer", balloons; 4.4 × 1.22 m) on the canopy's front edge
  over the door, from 2.95 m up past the canopy; three toy racks (`goods-rack`) on the pavement 2.6 m out, just past
  the canopy's edge. Three blue stairwell strips (`kroemer-stripe`, wall 4 u 10.6 and 31, wall 5 u 4) from the canopy
  up under the eaves, each over a glazed entrance (`shop-front`); the upper floors' windows under their yellow lintels
  (`kroemer-window`, three rows every 3.4 m on walls 3–5, clear of the strips). The sign is also painted on the main
  block's street-side roof plane over the shop (`roofSign`) for the top-down view.
- **Sprites:** Codex (five images), processed by `scripts/process-sprites.py` (the sign cut from its magenta margin,
  the stripe's white margins cropped, all opaque and stretched square).
- **Guesses:** the shop's run along wall 4 and every bay's, door's and sign's spot and size; the canopy's height,
  depth and run (not on wall 3, where the model's front steps 2.6 m out); the stairwell strips' spots (one SE of the
  shop as in 01, two spaced along the front as in 02); the upper windows' spacing; the racks' spots (the map has grass
  where the photo shows pavement); the roof sign (no photo of the roof); the roof colour (between the DOP20's
  #cc9373 and #675243). The sign's hex is read off the photo, not sampled (too small). Not built: the other units'
  shop fronts (Arztpraxis, SC Smart Connect), the model's step out at the SE end of the front, the roof's dormers.
- **Every other chunk unchanged:** all 2111 chunk meshes hash identical with and without the place except one chunk
  (the building's).
- **Screenshots** (local scratchpad `b4-8/`): `play.png`, `overhead.png`.

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

### B5-1 · Gasthof Geiger, Tattenkofener Straße 1 (#181, food) — Size: S — status: implemented (partial: door spot, window columns, bracket sign, roof colour and roof board are guesses)
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
- [x] From the B11 the W facade matches 05 (white house, red roof, black script name, window surrounds).
- [ ] The weisswurst dropoff still triggers when the player stops at the house.
- [x] pnpm test + typecheck green.
As built (places-only batch, src/world/places/gasthof-geiger.ts):
- Job part out of scope (places-only batch): the weisswurst criterion is left unticked. No solid, outline, POI or
  src/sim change; the dressing is wall signs, a roof sign and three non-solid pylons.
- LoD2 DEBY_LOD2_4531992 (tile 684_5302): hipped roof, eaves 7.13 m, ridge 12.67 m (43.5° over its 11.5 m depth).
  Built as levels 7.13/3 with a hip at 41.3° over OSM's 12.6 m depth, which gives the model's ridge. Roof red-brown
  #b2785e (DOP20 sunlit W plane #c6b099; 2012 photo red-brown). White render.
- W front (walls 3 + 4, one line): 9 window columns on both floors in grey-green baroque surrounds (geiger-window), the
  black door with lantern and menu board (geiger-door) 22 m from the N end, over it the dark beam with "Gasthof Geiger"
  (geiger-sign, Codex lettering in Fraktur-like script), the wrought-iron bracket with a white/red blade out of the wall.
- "Gasthof Geiger" on a cream board on the W roof plane, reading W to E for the top-down camera (geiger-board).
- Guesses: door spot, window columns/sizes/heights, beam and lettering size, bracket sign, roof colour, roof board.
- Not built: the model's 3.8 m porch at the NW corner (outside OSM), chimneys, aerial, gravel car park N, beer garden,
  N/E/S facades (no reference).
- Checks: chunk hash differs only in the place's chunk (1518); pnpm -s check green; places.test.ts "dresses Gasthof Geiger".
Size: S
```

### B5-2 · Petruskirche, Egerlandstraße 39 (#231, church) — Size: S — status: implemented (partial: one ridge height, glass strips, NE-wall emblem/window spots, tower louvre/clock/windows/door sizes, cross, colours are guesses)
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
- [x] From the camera the church reads as a dark tent roof with a separate tall tower next to it (05/06).
- [ ] The save pad is visible (not under the trees) and still works.
- [x] pnpm test + typecheck green.
As built (places-only batch, src/world/places/petruskirche.ts, two entries: PETRUSKIRCHE + PETRUSKIRCHE_TOWER):
- Job part out of scope (places-only batch): the save-pad criterion is left unticked. No solid, outline, POI or
  src/sim change: both footprints keep OSM's outlines (tested); only storeys, roofs and non-solid parts change.
- LoD2 (tile 684_5304): church DEBY_LOD2_4533422 (function church), eaves 4.1–4.2 m on both long walls, ridge NW–SE
  rising from 12.52 m (NW gable) to 15.42 m (SE gable, a shallow prow). The engine has one ridge height: built as
  levels 4.2/3, roof slate #464548 at 53° over OSM's 14.4 m width with gables on walls 0 (NW) and 2 (SE) → ridge
  13.73 m. Tower DEBY_LOD2_4534328: eaves 27.67 m, gabled cap to 29.36 m, ridge NW–SE → levels 27.67/3, gables on
  walls 0/2 at 37.5° (ridge 29.4 m over OSM's 4.4 m walls). Peach plaster on both (#ffd4ae / #ffdcbe tint).
- Church: 7 stepped glass strips (petrus-glass, 1.2 m each, up to 0.5 m under the rake) in both gable ends; on the
  NE wall to Egerlandstraße the round white emblem with cross (petrus-emblem) under the eaves and a window N of it.
- Tower: on both gable faces the dark louvre under the cap (petrus-louvre), the clock painted on the wall under it
  (petrus-clock: red bars and hands, no dial), two small windows; the door at the foot of the NE face and a window
  halfway up; a dark cross (two non-solid pylons) on the ridge. Textures by Codex, scripts/process-sprites.py.
- Guesses: glass strips' count/sizes/heights and glazing on both gables (06 shows glass high in the NW gable, 02/05
  strips at the SE end), the emblem's and window's spots on the NE wall, louvre/clock/window sizes and heights on the
  tower, the door's face, the cross's size, the colours. One ridge height instead of the model's sloping ridge.
- Not built: mosaic, bronze portal, entrance front (no reference), the SE prow (OSM's outline runs ~4 m past it).
- In the play camera the pad at the NW corner path sits right by the church's roof edge (not changed here).
- Checks: chunk hash differs only in the place's chunk (991); pnpm -s check green; places.test.ts "dresses the
  Petruskirche…". Screenshots (local scratchpad b5-2/): play.png (tower SE face from between church and tower),
  play-nw.png (tower NW face), play-w.png (NW gable's glass strips), overhead.png (?compare straight-down).
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

### B5-4 · Metzgerei Länger, Amselweg 9 (#219, shop) — Size: S — status: implemented (partial: part spots and sizes, pilasters, wing roof, roof colours, roof board and forecourt props are guesses)
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
- [x] From the forecourt the front matches 01 (cow, crest, awning, green fascia). Forecourt walkable.
- [ ] The weisswurst pickup still triggers at the shop front.
- [x] pnpm test + typecheck green.
As built (places-only batch, src/world/places/metzgerei-laenger.ts):
- Job part out of scope (places-only batch): the weisswurst criterion is left unticked. No solid, outline, levels, POI or
  src/sim change; the dressing is masses (drawn only), wall signs, two canopies, roof sign, non-solid pylons and sprites.
- LoD2 (tile 684_5304): DEBY_LOD2_4533034 = hipped block, eaves 8.36 m, ridge 9.42 m, plus a lower shop house on its
  N/NW sides under a shallow gable (ridge 6.65 m square to the shop front, eaves 5.06/5.72 m); DEBY_LOD2_4533949 = the
  low wing on the E (4.3–4.9 m) and S (2.5–3.5 m). Built as four masses tiling OSM's outline (the model's cut lines
  carried out to OSM's walls, which sit up to 3 m further W): block 8.36 m hipped at 12.7° (OSM makes it 9.4 m deep;
  gives the model's ridge), shop house 5.4 m with gables on the shop front and its E end at 12°, E strip 4.6 m and S
  wing 3.2 m flat (guess: the model has a very low gable). Roofs red-brown #a06852 (block, shop), wing tan #b28c6e (DOP20).
- Shop front = wall 2 (faces NW, 13.76 m): slim dark green fascia canopy #2d3537 over the ground floor, red/white
  striped awning over the shop window (metz-awning, drawn in process-sprites.py), the open entrance with the pig board,
  menu and white house door (metz-door), dark menu boards (metz-boards); upstairs the black cow (metz-cow), two windows
  (metz-upwin) and the crest (metz-crest, after 05). Shop house walls plain white render (a plain band hides the facade
  grid); two windows on wall 1, one on wall 3. Block front = wall 4: three red-brown pilasters (metz-pilaster) and a
  red-brown band under the eaves, the second crest under the middle pilaster; render windows elsewhere.
- Forecourt: two benches (seat + backrest pylons) and two planters (cafe-planter) along walls 4 and 6. Roof board
  "Metzgerei Länger" with the cow (metz-board) on the S wing's flat roof, reading WNW–ESE from above.
- Guesses: every part's u/z, window count, the pilasters, wing roof form, roof colours, roof board, bench/planter
  spots. Not built: the paved forecourt colour (map ground), garage doors on the wing, the block's balcony, the AC unit,
  N/E/S details (no reference).
- Chunk hashes: with vs without the place only chunk 857 (the building's) differs. pnpm -s check green.
- Screenshots (local scratchpad `b5-4/`): `play.png` (forecourt, block front with benches), `play-front.png` +
  `crop-front.png` (shop front: awning, cow, windows, fascia), `overhead.png`, `overhead-close.png`.
Size: S
```

### B5-5 · Orterer Getränkemarkt, Banater Straße 3 (#195, shop) — Size: S — status: implemented (partial: front part spots and sizes, solar field extent, single roof pitch, sign/barrier spots and the sign's square top are guesses)
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
- [x] From the car park the hall matches 01 (one storey, solar roof, canopy logo, arch pylon).
- [ ] The gelting-1 pickup can be reached and triggers. Job part out of scope (places-only batch).
- [x] pnpm test + typecheck green.
As built (places-only batch, src/world/places/orterer-nord.ts):
- Job part out of scope (places-only batch): the pickup reachability (POI 14 m inside the hall, STOP_REACH 9) is not
  checked or fixed here; the gelting-1 criterion stays unticked. No solid, outline, levels, POI or src/sim change: the
  hall is drawn as one mass over OSM's outline (the map keeps levels 2), the rest are wall signs, a canopy, roof signs
  and non-solid pylons.
- LoD2 (tile 682_5306): DEBY_LOD2_4467576 = hipped (3200), eaves 6.78 m, ridge 11.03 m, ridge NE–SW parallel to the
  front, plus a 3.7 m flat lean-to at the W corner outside OSM's outline (not built). The model sits 3–4 m W of OSM.
  Drawn at eaves 6.78 m, hip 16.9° on every wall (gives the model's ridge over OSM's 27.9 m depth); the model's steeper
  hip ends (≈28°, 16 m ridge) are not possible with one pitch, so the ridge is short (guess/engine limit). Roof tiles
  #cc8467. Facade "industrial" (cladding) tinted white with a plain white ground floor band up to 3.6 m.
- Front = wall 2 (faces SE onto the car park, 32.25 m, u 0 at its SW end): two blue-framed windows with crates and
  posters (new texture orterer-window, Codex, after 01) at u 2.2–7.2 and 8.6–13.6, a small one at u 25.2–27.6; the
  entrance glazing with crates (orterer-arcade, from Am Stern) at u 15.4–21.4 between two white piers (orterer-pier),
  the glass canopy (canopy-glass) over it at 3.25 m, 1.8 m deep, and the round-topped Orterer logo (orterer-logo) above.
- Solar field: solar-field roof signs on the SE plane in three strips up the slope, narrowing at the hips.
- Street frame (Banater Straße, u NE along it): the arched sign (orterer-logo on a white board on two legs, board
  1.3–3.45 m) at u 5, n 7 in the planting strip between the car park's two ways in; a raised barrier (red housing,
  white boom with red bands) at each way in (u -7.4 and 7.9, n 6.2).
- Guesses: every front part's u/z and size, the small window, the canopy depth, the solar extent, the single pitch,
  sign and barrier spots, the sign's square top (the texture's arch on a white board). Not built: paving and planting
  strip (map ground), bushes, the lean-to, the NW/NE/SW sides (no reference).
- Chunk hashes: with vs without the place only chunk 722 (the building's) differs. pnpm -s check green.
- Screenshots (local scratchpad `b5-5/`): `play.png` (car park, barriers, sign), `play-front.png` (front, canopy,
  solar roof), `overhead.png`.
Size: S
```

### B5-6 · Kaufland, Bayerwaldstraße 2 (#180, supermarket) — Size: S — status: implemented (partial: which wall 02 shows, band sizes, the car-park band, the roof board, solar extent, one pitch per roof and colours are guesses)
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
- [x] From Blumenstraße the hall matches 02 (sign band with red K, solar roof).
- [ ] The BMW still spawns on a drivable aisle in view of the sign. Job part out of scope (places-only batch).
- [x] pnpm test + typecheck green.
As built (places-only batch, src/world/places/kaufland.ts):
- Job part out of scope (places-only batch): the BMW spawn is not checked here; that criterion stays unticked. No solid,
  outline, level, POI or src/sim change: the map keeps levels 1 and OSM's outline; the hall is drawn as 13 masses that
  tile the outline, the rest are wall signs and roof signs. No pylons, sprites or canopies, nothing on the car park.
- LoD2 (tile 682_5306, `DEBY_LOD2_4467611` + parts 105019004/105019005/108848885, lines up with OSM within ~1 m). In
  the hall frame (s SE along the SW wall from the W corner, t NE along Blumenstraße): mall shops s 0–28.2, three gables
  with ridges along s (eaves 9.2, ridge 11.84); flat link s 28.2–32.5 at 9.2; two gables with ridges along t
  s 32.5–55.7 (eaves 9.76, ridge 11.66); flat strip s 55.7–59.85 at 8.2; the Kaufland hall s 59.85–106.2, three
  gables along s (eaves 8.1, ridge 10.83). NE side: Deichmann wing (gable along t, eaves 8.34, ridge 11.07), the
  saw-tooth part (8.06, drawn flat), the low entrance strip (6.35, flat). One pitch per gable (17.6–18.6°) gives the
  model's ridges. Roof #c6c8c6, walls "industrial" tinted #e4e0d6 (guesses).
- Band (new texture kaufland-band, Codex, after 02: white board, red K logo, red "Kaufland", 3:1): on the Kaufland
  hall's SW wall (OSM wall 7, faces 228°, u 5.95–15.25, z 4.6–7.7) under the eave with the solar plane behind it,
  which is what 02 shows (the doc says "Blumenstraße side"; the eave and solar roof only fit the hall's SW side seen
  from the Blumenstraße/Thüringer-Wald-Straße end: guess). A second band faces the car park (OSM wall 12, 48°, guess,
  no photo) and the same board lies on the entrance strip's roof for the top-down camera (guess).
- Solar field: solar-field roof signs over the hall's three SW-facing planes (whole planes, the satellite 04 shows
  patches: guess) and over the SE-facing plane of the second middle gable.
- Not built: the glass rotunda at the E corner (outside OSM's outline), the mall shop signs (Ihle, Deichmann,
  Vinzenzmurr, Dönerworks, An Nhien), trolley bays, the charging station, the low wall along the car park (no
  reference / car park kept clear).
- Chunk hashes: with vs without the place only chunk 633 (the building's) differs. pnpm -s check green.
- Screenshots (local scratchpad `b5-6/`): `play.png` (SW band and solar roof), `play-ne.png` (car-park band),
  `play-carpark.png` (roof board), `overhead.png`.
Size: S
```

### Batch 6a: start area, nearest 10 (decision)
Same rules as batches 1–5: **exterior only** (Size S), everything plugs into **#0b** (wallSign / awning / sprite parts in the
street frame), no interiors (#0c not needed), no new ShopKind. Rows are in the Start area section and P2–P6. Photos:
reference/<slug>/ (gitignored by #0); docs: docs/places/<slug>.md. The first six sit in two OSM buildings right at the spawn:
way 127604891 (Sudetenstr. 17–19: unit 17 · Angel Nails · Mühlenbäck) and way 127604887 (Sudetenstr. 11–15: VR-Bank · Bodystreet ·
Stroblume · Dolce Gelato, NW→SE), both NE of Sudetenstraße (bearing 304°). Build B6a-1…B6a-5 as one pass so the signs line up.
Open questions for Alex: HoangAnh vs Deliqos (B6a-2; answered by photos 2026-10-25: HoangAnh is current), Autohaus name (B6a-8), drop Quelle (B6a-9).

### B6a-1 · Angel Nails, Sudetenstraße 19 (#154, shop) — Size: S — status: implemented (partial: box-sign and pillar depth, door/window widths, posters)
```
Goal: Pink nail studio right next to the spawn: pink fascia, pink pillar by the door, NW of the Mühlenbäck front.
Reference: docs/places/angel-nails.md; reference/angel-nails/02-street-side.png (key), 05-crop-sign.png, 01, 04.
Spec (via #0b):
- Street frame "Sudetenstraße", POI "Angel Nails" (#154 at 4000.2, 4648.4). Way 127604891, NE frontage, immediately NW of
  the Mühlenbäck sign (B2-1). Fascia wallSign pink #ec86a0 (~5 m) with white "Angel Nails"; pillar strip #9b4668 left of the door.
- Wall stays as the building (#b5b7b4 white/cream). No canopy of its own.
Acceptance criteria:
- [x] From the spawn the pink fascia is visible left of Mühlenbäck, matching 02. The player still spawns where it did
  (3991.6, 4651.0, unchanged; the parts are never solid).
- [x] pnpm test + typecheck green.
Size: S
```
As built (2026-10-25):
- **In the Mühlenbäck file** (`src/world/places/muehlenbaeck.ts`, B2-1's way 127604891): no second building. Wall 0 u 13.0–18.6
  keeps the unit; its generic `shop-front` became its own `angel-nails-front` (new sprite, Codex from 05: pink pillar left,
  white-framed glass door, window with a white price list and a face poster, a band of nail photos over them).
- **Box sign**: the existing `angel-nails-sign` (u 13.4–18.3, z 2.85–3.9) now sits on the front of a pink #ec86a0 box 0.3 m
  deep (a `pylon` with `base` 2.85, top `h` 3.9), so the straight-down play camera sees a pink strip left of the Mühlenbäck
  awning; the lettering reads from across the street. Depth is a **guess**.
- **Pillar**: a #d15f8c box (spec's shaded #9b4668 lifted like the wall's #b5b7b4 → cream) 0.56 × 0.2 m, 0–2.85 m, at
  u 13.0–13.56 left of the door. Its depth is a **guess**.
- **Sign heights for B6a-2…5**: Sudetenstraße 17–19 hangs its signs from `FRONT_Z` 2.85 m (bottom) up to 3.9 m (Angel Nails)
  / 4.2 m (Mühlenbäck); way 127604887 should use the same 2.85 m bottom so the row lines up. Wall 0 lies at street-frame
  u −21.97, n 7.14 (`WALL_U0`, `WALL_N` in the file).
- **Spawn**: the start spot is computed by the sim (`spotNear`), unaffected; it lies at street n ≈ 2.5 (on the carriageway
  edge, as before this item, not on the pavement; a sim matter, out of scope).
- Guesses: box-sign and pillar depths, the door's and window's widths, the posters' content (Street View too blurred).
- Chunk hashes: before/after only one chunk (the building's) differs. pnpm -s check green.
- Screenshots (local scratchpad `b6a-1/`): `before-spawn.png`, `play.png` (spawn), `play-crop.png`, `play-across.png` and
  `play-across-crop.png` (lettering and front from across the street), `overhead.png`, `overhead-crop.png`.

### B6a-2 · HoangAnh, Sudetenstraße 17 (#12, food) — Size: S — status: ref-done (partial: sign width and terrace extent by screenshot)
```
Unit 17 (NW end of way 127604891). Answered by photos (2026-10-25): Google Maps user photos reference/hoanganh/30–32 show the
white unit with gold 3D letters "HOÀNG ANH" and "NEUERÖFFNUNG" stickers, so HoangAnh is current; Deliqos (SV Aug 2022) is
the old state. Keep the POI name.
Goal: No. 17 reads as the HoangAnh restaurant: gold letters on white, red neon script, rattan chairs on the pavement.
Reference: docs/places/hoanganh.md; reference/hoanganh/30 (day, key), 31–32 (night).
Spec (via #0b): wallSign "HOÀNG ANH" in dark-gold letters (#5c543d range; no lighter) on the white wall above the windows,
plus a red script strip "Asiatische Küche" (#e01e37 darkened) to its right, on the B2-1 No. 17 strips (wall 0 u 0.3–12.9),
z ≈ 3.0–3.6 by eye; frames dark grey (#1a1b1f). Optional: 2–3 rattan table sprites on the pavement. No Deliqos dressing.
Acceptance criteria:
- [ ] From Sudetenstraße at the start, "HOÀNG ANH" reads above No. 17 like 30; the pavement stays walkable.
- [ ] Only the No. 17 part of way 127604891 changes (B2-1's other units untouched); pnpm test + typecheck green.
Size: S
```

### B6a-3 · Dolce Gelato, Sudetenstraße 15 (#47, food) — Size: S — status: implemented (partial: unit widths, awning and sign-box depth, glazing; no P sign or tree)
```
Goal: Ice-cream café with a red awning and white chairs at the SE end of the VR-Bank row.
Reference: docs/places/dolce-gelato.md; reference/dolce-gelato/01-street-front.png (key), 02, 04.
Spec (via #0b):
- Street frame "Sudetenstraße", POI "Dolce Gelato" (#47 at 3980.5, 4636.4). Way 127604887, NE frontage, SE end.
- White sign plate #d9d5da "Dolce Gelato" above a red awning #d46172 (~10 m). 4–6 white chairs + 2 small tables under it;
  blue P-sign sprite + street tree as in 01 (only if trees/signs are already supported; else skip).
Acceptance criteria:
- [x] Front matches 01; pavement stays walkable past the chairs.
- [x] pnpm test + typecheck green.
Size: S
```
As built (2026-10-25):
- **New building file** `src/world/places/sudetenstrasse-11-15.ts` (`SUDETENSTRASSE_11_15`) for the whole way 127604887, hung on
  POI "Dolce Gelato". Street front = wall 4 (36.33 m, u 0 at the NW end; its SE end is the Mühlenbäck row's NW corner) plus
  wall 5 (2.97 m jog to the NW corner). `UNITS` holds each unit's stretch of wall 4: VR Bank 0–7.2 (+ wall 5), Bodystreet
  7.2–17.3, Stroblume 17.3–27.0, Dolce Gelato 27.0–33.5, passage 33.5–36.33. B6a-4/B6a-5 add their own `Part` arrays next to
  `DOLCE_GELATO` and spread them into `parts`; `atWall(u, out)` puts street-frame parts (boxes, sprites) on wall 4.
- **LoD2** (tile 684_5302): four houses, `DEBY_LOD2_4602982` (white VR corner house, hipped NW), `…4602981` (Bodystreet) and
  `…4602922` (Stroblume + Dolce Gelato) under one gable roof along the street ending in a gable at the Mühlenbäck wall, and the
  hipped back wing `…4602983`. Eaves 9.3–9.4 m, ridges 11.2–11.3 m. Built as four masses at 9.35 m eaves, 16° (keeps the
  ridge on OSM's 13.1 m depth), gables at the cuts so the street ridge runs through. The model sits ~3 m NE of OSM's front
  (the DOP20 agrees with the model); its cuts (wall 4 u 7.2, 17.3) are carried square across OSM's outline, which stays the
  solid. Walls: VR house + back wing white, the rest beige (#e3d6b0-ish off 01/02); roofs terracotta (SE house, back
  wing) / grey-brown (VR, Bodystreet) after the DOP20. `levels` 3. Back wing's wall colour is a **guess** (no photo).
- **Dolce Gelato**: new `dolce-gelato-front` glazing (cone banner, door at the right), a raspberry awning (`awning` × #e2687a,
  sampled #d46172) at the row's 2.55 m, 1.4 m deep like the Mühlenbäck awnings (01 suggests ~2 m, but OSM's front already
  stands 3 m into the pavement), the white `dolce-gelato-sign` plate on a white box (`pylon` base 2.85, top 3.75, 0.3 m
  deep) so the play camera sees a white strip over the awning; lettering readable from across the street. Two
  `gelato-terrace` sprites (table + two chairs each, 4 chairs / 2 tables) at the awning's edge, ~1 m of pavement left.
  The orange disc under the plate in 01 is a Google Maps pin, not built.
- **Passage**: `passage-door` (recess with the wooden house door) at u 33.6–36.2.
- Guesses: Stroblume/Dolce boundary, passage width, awning and sign-box depth, sign size, the glazing's layout (01 too dark).
  Not built: the blue P sign and the street tree (no such parts).
- Chunk hashes: with vs without the place (HASH_SKIP) only chunk 1616 (the building's) differs. pnpm -s check green.
- Screenshots (local scratchpad `b6a-3/`): `play.png`, `play-crop.png`, `play-across.png` (lettering), `overhead.png`,
  `overhead-close.png`.

### B6a-4 · Stroblume, Sudetenstraße 15 (#155, shop) — Size: S — status: implemented (partial: sign-box size, table size and place, plain glazing; 0.75 m to the kerb, not 2 m)
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
- [x] Front matches 01 (awning, script, plants). pnpm test + typecheck green.
Size: S
```
As built (2026-10-25):
- **In the row file** `src/world/places/sudetenstrasse-11-15.ts`: a `STROBLUME` parts list (exported, like `DOLCE_GELATO`)
  spread into `parts` on wall 4, u 17.3–27.0 (`UNITS.stroblume`). No building or mass changes.
- **Awning**: `canopy` × `awning` texture in #e06564 (#d25f5e sampled, lifted like Dolce Gelato's), the row's 2.55 m top,
  1.4 m deep, u 17.4–26.9.
- **Script box**: the awning's sloping face and valance as a red box (`pylon` base 2.85, top `h` 3.75, 0.3 m deep, u 17.8–26.5,
  same heights as the Dolce Gelato plate), its front the new `stroblume-sign` (Codex from 01: white "Stroblume" script, flower
  logo and curly lines on the red fabric; process-sprites.py pads it with the fabric's red to the box's 8.7 × 0.9 m). The play
  camera sees a red strip over the awning; the lettering reads from across the street (0.6 m tall at first: the awning hid it).
- **Props**: two `stroblume-plants` sprites (new, Codex: a wooden table full of potted flowers from above, 2.2 and 1.6 m long) at
  u 20.0 and 22.8, and the `stroblume-heart` sign (new, red heart on a stand, upright on screen like Mühlenbäck's board) at
  u 24.6, all just past the awning's edge (1.75–1.85 m out) so the play camera sees them.
- **Clearance**: OSM's front stands ~3 m into the pavement, so only 2.9 m lie between wall and kerb (n 4); past the awning
  ~0.75 m is left (the props are never solid). The spec's ≥2 m only holds on the real, wider pavement.
- Guesses: box depth and height, the tables' size and spacing, the heart's place, the glazing (generic `shop-front`; 01 shows
  dark glass behind the plants). Bodystreet not dressed (no POI).
- Chunk hashes: before/after only chunk 1616 (the building's) differs. pnpm -s check green (249 tests).
- Screenshots (local scratchpad `b6a-4/`): `play.png`, `play-crop.png`, `play-across.png` + `play-across-crop.png` (script),
  `overhead.png`.

### B6a-5 · VR Bank München Land, Sudetenstraße 11 (#13, bank) — Size: S — status: implemented (partial: canopy depth, blue letter box, door/window widths; orange 0–2.85 m, not 3.5)
```
Goal: The bank at the NW corner of the row: orange ground floor, blue "VR Bank München Land" letters, grey canopy.
Reference: docs/places/vr-bank-zentrum.md; reference/vr-bank-zentrum/01-street-front.png (key), 02, 04.
Spec (via #0b):
- Street frame "Sudetenstraße", POI "VR-Bank" (#13 at 3957.8, 4620.3). Way 127604887, NE frontage, NW end (car park on its NW side).
- Ground-floor band orange #e2a470 (sun) / #d68756 (shade), 0–3.5 m, only on the bank part; upper wall stays white (#e1e4e7).
- Letters wallSign blue #5574d5 + square VR logo above a grey canopy strip #787c75.
- ATM position: needs reference (OSM atm=yes). Do not add one.
Acceptance criteria:
- [x] Front matches 01; the orange band does not bleed onto Bodystreet. pnpm test + typecheck green.
Size: S
```
As built (2026-10-25):
- **In the row file** `src/world/places/sudetenstrasse-11-15.ts`: a `VR_BANK` parts list (exported) spread into `parts`. No
  building or mass changes; Bodystreet (u 7.2–17.3) untouched. The bank's front is wall 5 (2.97 m, almost in line with
  wall 4) plus wall 4 u 0–7.2 (`UNITS.vrBank`): 10.2 m, about what 01 shows.
- **Orange ground floor** as two new wallSigns 0–2.85 m (the row's `FRONT_Z`; the spec's 3.5 m would run into the sign):
  `vr-bank-door` on wall 5 (orange pier, glazed entrance with side panel) and `vr-bank-front` on wall 4 u 0–7.2 (two wide
  white-framed windows with frosted film and small blue plates), Codex after 01. The orange ends at the LoD2 cut (u 7.2).
- **Canopy**: grey #787c75 slab on both walls, top at 2.85 m, 0.45 m deep (depth a **guess**; deeper hid the orange from
  the play camera).
- **Letters**: a blue #5574d5 box (`pylon` base 2.85, top `h` 3.75, 0.3 m deep, like the Dolce Gelato/Stroblume boxes) over
  01's 7–76 % of the front, sitting on the canopy, so the play camera sees a blue strip; the white-wall lettering (logo +
  "VR Bank München Land", new Codex texture) on its front as two wallSigns that meet at the wall 5/4 corner
  (`vr-bank-logo` on wall 5, `vr-bank-sign` on wall 4; process-sprites.py cuts one band in two). Out 0.05 m past the box:
  at 0.02 m the far half z-fought away. The box is a **guess** (the real letters are single letters on the wall).
- Not built: the ATM (position unknown), the street-name plate, the A-board, the blue P sign. Upper floors stay the
  house's white render.
- Chunk hashes: before/after only chunk 1616 (the building's) differs. pnpm -s check green (250 tests).
- Screenshots (local scratchpad `b6a-5/`): `play.png`, `play-crop.png`, `play-across.png` + `play-across-crop.png`
  (lettering), `overhead.png`.

### B6a-6 · KIND Augenoptik, Sudetenstraße 10 (#115, shop) — Size: S — status: implemented (partial: sign-box depth, glazing/shutter widths, side band length, A-board place, corner volume carried onto OSM's corner)
```
Goal: Optician on the corner opposite the VR-Bank: dark-blue "KIND" band wrapping the corner of a white block.
Reference: docs/places/optik-kind.md; reference/optik-kind/01-street-front.png (key), 02, 03, 04.
Spec (via #0b):
- Street frame "Sudetenstraße", POI "Optik Kind Geretsried-Zentrum II" (#115 at 3944.9, 4641.7). Way 538512734, SW side of
  Sudetenstraße, Sudetenstraße/Kirchweg corner. Blue band #305499 with white "KIND" ×3, wrapping the corner; wall #b4b7c1.
- Props: A-board sprite. Leave the NW part of the frontage free for the Bistro Malor terrace (B6a-7).
Acceptance criteria:
- [x] From the VR-Bank pavement the corner matches 01/03. pnpm test + typecheck green.
Size: S
```
As built (2026-10-25):
- **New file for the whole house** (`src/world/places/sudetenstrasse-10.ts`, `SUDETENSTRASSE_10`, POI KIND): no earlier place
  used way 538512734. Front = wall 1 (16.71 m, u 0 at the Kirchweg corner, running NW) + wall 0 (16.21 m, in line);
  Kirchweg side = wall 2 (corner at its u 22.33). `UNITS` per wall (`kind`: wall 1 u 0–7.9, wall 2 u 16.6–22.33;
  `bistroMalor`: wall 1 u 7.9–16.71 + all of wall 0) and an exported `atWall(edge, u, out)` (street-frame point and angle
  for any of walls 0–2), so B6a-7 adds a `BISTRO_MALOR` parts list next to `KIND` and spreads it into `parts`.
- **Masses from LoD2** (`DEBY_LOD2_4602674`): one gable roof along the street, eaves 12.1 m, ridge 16.2 m (levels 4, roof
  drawn at 20.6° over OSM's 21.5 m depth to keep the ridge), gables NW and SE; plus the model's flat-roofed corner volume
  (7.9 × 2.9 m at the eaves) as a second mass. OSM's outline is off the model (front ~2.5 m nearer the street, SE wall ~7 m
  out over the Kirchweg pavement): the corner volume is carried onto OSM's corner (a **guess** of placement). Tiles
  red-brown (DOP20); dormers and the SW plane's solar panels not drawn.
- **Band**: the white serif "KIND" on blue (new `kind-sign`, Codex, padded to 4:1) three times on a #3e64b2 box (`pylon`,
  base 2.85, top 3.75, 0.3 m deep, in line with the VR Bank row across): two boards on wall 1 (box from 0.3 m past the
  corner to u 7.9) and one on wall 2 (box u 17.8–22.33), so the play camera sees a blue L round the corner; lettering
  0.05 m in front of the box. Box depth and side band length are **guesses**.
- **Ground floor**: `kind-front` (two-pane window + glass door with side light, aluminium frames) on wall 1 u 0–7.9;
  `kind-side` (narrow + wide grey roller shutters, downpipe) on wall 2 u 16.6–22.33. Widths are **guesses** after 01.
- **A-board** (`kind-aboard` prop: poster "KIND 0 €" with a man in glasses) 1.6 m in front of the door, upright on
  screen. Place is a **guess**.
- Not built: the balconies over the shop (would hide the band from the play camera), the small door canopy.
- Chunk hashes: before/after only chunk 1615 (the building's) differs. pnpm -s check green (251 tests).
- Screenshots (local scratchpad `b6a-6/`): `play.png` + `play-crop.png`, `play-across.png` + `play-across-crop.png`
  (lettering), `overhead.png`.

### B6a-7 · Bistro Malor, Sudetenstraße 10 (#120, food) — Size: S — status: implemented (partial: terrace size/layout, door places, no terrace roof)
```
Goal: Bistro terrace beside the KIND corner: wood tables, rattan chairs, low hedges.
Reference: docs/places/bistro-malor.md; reference/bistro-malor/05-web-terrace.jpg (key, website), 06-web-logo.png, 07-crop-sv-terrace.png.
Spec (via #0b):
- Street frame "Sudetenstraße", POI "Bistro Malor" (#120 at 3929.9, 4632.5). Way 538512734 (shared with KIND), NW part, street side.
- Terrace part ~8×5 m: wood tables + brown rattan chairs, low hedge strip around it.
- Terrace roof: website shows a dark steel frame, Street View a dark-red roof: needs reference → build no roof yet.
- Restaurant facade sign: needs reference (logo #a82b1c / #464140 exists, but not seen on the building) → no wallSign.
Acceptance criteria:
- [x] Terrace next to the KIND corner, pavement walkable. pnpm test + typecheck green.
Size: S
```
As built (2026-10-25):
- **`BISTRO_MALOR` parts list** in `src/world/places/sudetenstrasse-10.ts`, spread into `parts` after `KIND`; building and
  masses unchanged. All wall parts on wall 1 inside `UNITS.bistroMalor` (u 7.9–16.71); wall 0 left plain.
- **Ground floor**: `malor-front` (white render, two pairs of tall glazed doors, downpipe; Codex after 05) on wall 1
  u 7.9–16.71, 0–2.85 m. Door places are a **guess**.
- **Sign**: none on the building, as the spec says (no photo shows lettering there; the web logo is not used).
- **Terrace** (wall 1 u 8.6–16.4, 5 m out): six `malor-terrace` sprites (oak table, cream runner, two rattan armchairs
  with tan cushions; Codex after 05) in two rows of three, white `malor-hedge` planters of laurel along the street side
  (gap in the middle) and at both ends, all square to the wall; a pale stone slab (`pylon` 0.04 m) under it because the
  map has a lawn in front of the house. Props are not solid; ≥3 m of pavement stays to the kerb. Size, table count,
  layout and hedge gap are **guesses**.
- Not built: the terrace roof (05 dark steel frame vs 07 dark-red roof: needs reference).
- Chunk hashes: before/after only chunk 1615 (the building's) differs. pnpm -s check green (252 tests).
- Screenshots (local scratchpad `b6a-7/`): `play.png`, `play-across.png` + `play-across-crop.png` (sign), `overhead.png`
  + `overhead-crop.png`.

Follow-up (6d research, 2026-10-25, docs only; this item stays as built): Google Maps user photo reference/bistro-malor/30 shows
the **facade sign**: cream board "BISTRO MALOR" (dark capitals, the O a dark-red ring, small "BISTRO · RESTAURANT · PIZZERIA"
line) left of the door, and the **terrace roof**: a large square **maroon parasol** (pyramid top, valance; = the dark-red roof in
07). Facade light grey-white, 3 storeys, French balconies. Possible small follow-up: wallSign + maroon parasol (see
docs/places/bistro-malor.md). Needs reference: none for these two.

### B6a-8 · Autohaus Billion, Sudetenstraße 25 (#178 "Audi;Seat;Škoda;Volkswagen", shop) — Size: S — status: implemented (partial: plate size/place, awning split, pylon/flag/car places, parallel parking)
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
- [x] From Sudetenstraße the front matches 01/02; forecourt cars do not block the road. pnpm test + typecheck green.
Size: S
```
As built (2026-10-25):
- **New file** `src/world/places/autohaus-billion.ts` (`AUTOHAUS_BILLION`, way 120402846, street front = wall 12, u 0 at
  the NW corner); one line in `index.ts`. POI name kept as "Audi;Seat;Škoda;Volkswagen". The name on the building is
  "Autohaus Billion" (OSM name, website, side sign in 05): not a guess; the POI rename stays Alex's call.
- **Masses** from the Bavarian LoD2 model (tile 684_5302), carried onto OSM's outline (the model sits ~2.5 m behind
  OSM's front): showroom block (`DEBY_LOD2_4602925`, s 27.8–56.6) gable along the street, eaves 8.1 m, ridge 10.2 m
  (15.4°), brown tiles; low NW showroom (`23835687` + `105019359`) gable eaves 4.25 m, ridge 6.0 m (12.8°), light grey
  with three solar strips on its SW plane (DOP20); its flat back part 4.1 m; workshop halls (`4603394` / `4603396`) flat
  5.25 m grey and 5.0 m white, cut at OSM's step (s 47.86, the model cuts at 45.4).
- **Front**: `billion-showroom` bays (glass between grey pillars, Codex after 01) 6 on the block (0–3.4 m), 5 on the NW
  showroom (0–3.0 m, a **guess**: 01 shows it only behind the pylon); three terracotta awnings (canopy + valance, top
  3.75 m, 1.3 m deep; split and depth **guesses**); white `billion-plate` "Autohaus Billion" on a 0.3 m white box at
  u 44.2–49.0, 4.4–5.2 m (size/place **guess**); the same plate on the block's SW roof plane for the top-down camera
  (**guess**, no roof photo).
- **Forecourt**: VW pylon (`vw-pylon`: roundel + "Service", 1.2 × 0.4 × 3.8 m) and three `vw-flag` flags on poles at the
  NW end (places **guesses**); five parked VW SUVs (`billion-car-0…3`: silver, navy, teal T-Roc, white; Codex) parallel to
  the front past the awnings. OSM's front is only 2.5–4.5 m from the pavement's back, so nose-in parking (01) does not
  fit: parallel is a **guess**. Props are never solid; all stay off the pavement (test).
- Not built: the blue-grey side sign (03, place on the front unclear), the small VW roundel at the SE end (02), the van.
- Chunk hashes (with vs `HASH_SKIP=120402846`): only chunk 1615 differs. pnpm -s check green (253 tests).
- Screenshots (local scratchpad `b6a-8/`): `play.png`, `play-nw.png` (pylon + flags), `overhead.png`.

### B6a-9 · Quelle (#11, shop) — Size: S — status: todo (needs reference; probably closed)
```
OSM node 370882637 (shop=electronics, no address) sits in a small house on Beethovenweg/Kirchweg. Directories list a
"Quelle-Agentur" (mail-order agency) at Beethovenweg 2; Quelle agencies ended with the 2009 insolvency. Street View: houses,
no sign. Nothing to build. Ask Alex whether to drop the POI. See docs/places/quelle-sudetenstrasse.md.
```

### B6a-10 · Gaststätte Isarwinkel, Richard-Wagner-Straße 14 (#177, food) — Size: S — status: implemented (partial: lettering/mural size and place, name box, awning/lean-to split, garden and pole places, terrace over synthetic building -159)
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
- [x] Front matches 01/02. pnpm test + typecheck green.
Size: S
```
As built (2026-10-25):
- **New file** `src/world/places/gaststaette-isarwinkel.ts` (`GASTSTAETTE_ISARWINKEL`, way 119894071, street front = wall 5,
  17.19 m, u 0 at the N end; plus `GASTSTAETTE_ISARWINKEL_TERRACE`, see below); two entries in `index.ts`.
- **Masses** from the Bavarian LoD2 model (tile 684_5302, `DEBY_LOD2_4602821`, within ~1 m of OSM here): the house
  (t 0–11 from the front) gable along the street, eaves 10.8 m, ridge 12.71 m (19.15°), grey (DOP20 #a3a7a4); the flat
  part behind its N half at 4.81 m; the SE wing gable along the street, eaves 7.8 m, ridge 8.96 m (13.25°), the model's
  8.6 m lean-to bits between wing and house folded into it. Walls pale yellow render (photos; the doc's #b89a86 is in shade).
- **Front**: terracotta tile lean-to (`roof-tiles`, u 0.3–6.0, top 3.7 m) over a red awning, a long red awning u 6.0–16.9
  (top 3.5 m, 2.7 m deep); "GASTSTÄTTE ISARWINKEL" (`isarwinkel-sign`, Codex, 11:1) on a 0.3 m yellow box over it at
  u 6.1–14.9, 3.9–4.7 m (painted flat in 01: the box is a **guess** for the play camera), and again on the W roof plane
  (**guess**, no roof photo); the Alpine mural (`isarwinkel-mural`, Codex) at u 10.3–15.5, 5.0–7.6 m. Sizes, heights and
  depths read off 02 at an angle: **guesses**.
- **Building -159**: the map's photo pass (photo.ts `findMissingBuildings`) took the awnings' red in the DOP20 for a shed
  and made a solid 3 m box over the whole front garden (street u -9…8.5, n 4.4–9.9, its W side on the back ~2 m of the
  pavement). Left solid with its outline; dressed only as a low walled terrace (0.15 m + 0.6 m parapet, paving roof) so
  the hedge (`malor-hedge`) and three grey shrub pots (`isarwinkel-planter`, Codex) stand on it. Dropping that false
  shed (and freeing the pavement) is an import change, outside this item: needs Alex / I-1.
- **Pole sign**: grey post with the white "Restaurant Isarwinkel" board (`isarwinkel-pole`, Codex, 2.1 × 0.7 m, 2.6–3.3 m)
  at the car park S of the house, behind the pavement; place and size **guesses**; brewery roundel left out (spec).
- Not built: lanterns, trellis screens, the N/E facades, the 2027 hotel wing.
- Chunk hashes (with vs `HASH_SKIP=119894071,-159`): only chunk 1658 differs. pnpm -s check green (254 tests).
- Screenshots (local scratchpad `b6a-10/`): `play.png`, `play-pots.png` (S end, pots), `overhead.png`.

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
**Decisions (Alex 2026-10-25: "mach einfach, so passt schon"):** miwomo stays as it is, with a note (B6b-1). The Mittelschule
keeps its current POI name, with a note on the merger (B6b-4). Bellini's POI is renamed "Hair & Style Bellini" as a name fix
inside B6b-5. Händelstraße 2 stays Ana's Waschservice, with ZER-O-WASH noted as a possible successor (B6b-8). **Apply the LoD2
heights now** (B6b-3, -4, -5, -8; `masses` where one footprint holds several LoD2 buildings). Multipolygon buildings are an extra
requirement of **I-1** (step 7), not a separate item.

### B6b-1 · miwomo / THOMA Reisemobile, Breslauer Weg 9 (#138, shop) — Size: S — status: todo (needs facade reference; name kept)
```
Massing already matches: way 127872177, engine levels 2 + flat roof #f5ece5 = LoD2 (flat, 7.9 m) + DOP (#f6ebe5). Nothing to
build. Street View (Nov 2022, text only): grey two-storey workshop with red trim behind trees, no sign. miwomo.de: the rental
closes at the end of 2026; THOMA Reisemobile (caravan repairs, same address) continues. Do not add a miwomo sign (never seen on
the building). Decision (Alex 2026-10-25): keep the POI "miwomo" as it is. Note: THOMA Reisemobile trades at the same address
and the rental closes at the end of 2026; look again then. See docs/places/miwomo.md.
```

### B6b-2 · Karl-Lederer-Grundschule, J.-S.-Bach-Straße 4 (#228, school) — Size: S (after I-1) — status: todo (needs facade reference; blocked by I-1 step 7)
```
Goal: The primary school exists in-game as a ring-shaped 3-storey-high block around a courtyard, with a light-grey flat roof.
Reference: docs/places/karl-lederer-grundschule.md; reference/karl-lederer-grundschule/01-dop20-ortho.jpg, 02 (outline),
03/04 (LoD2 massing).
Blocker: scripts/import-osm.ts only fetches way["building"], so OSM relation 2014408 (type=multipolygon, building=yes; outer
way 127604842, inner courtyard way 156041502) never becomes a building. The import fix is I-1 step 7 (Alex 2026-10-25), with
this relation as its acceptance check. Run this item after I-1.
Spec (via #0b, once the building exists):
- POI "Karl-Lederer-Grundschule Geretsried" (#228 at 3800.4, 4825.3, in the courtyard). levels 3 (LoD2: flat roofs 9.5–10.4 m,
  one low gable wing 9.7–10.3 m), roof colour #c0b8ab, flat.
- Walls, windows, entrance, the 2018 timber storey: needs reference. No wallColour, no signs.
Acceptance criteria:
- [ ] The ring block with its open courtyard stands where the DOP shows it; the POI is in the courtyard, not inside a wall.
- [ ] pnpm test + typecheck green.
Size: S
```

### B6b-3 · Friseurteam Haar Genau, Carl-Maria-von-Weber-Weg 34 (#54, shop) — Size: S — status: ref-done (partial: massing; facade needs reference)
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

### B6b-4 · Karl-Lederer-Mittelschule (OSM: Hauptschule), J.-S.-Bach-Straße (#186, school) — Size: S — status: ref-done (partial: massing; facade needs reference)
```
Goal: The Mittelschule gets its real height: a long ~13 m block with a lower N wing.
Reference: docs/places/karl-lederer-mittelschule.md; reference/karl-lederer-mittelschule/01-dop20-ortho.jpg, 03/04 (LoD2).
Spec (via #0b):
- POI "Karl-Lederer-Hauptschule Geretsried" (#186 at 3740.9, 4830.9). Way 127604843: levels 4 (LoD2 main roofs 12.8–14.1 m,
  very low gable → keep flat, roof #d3cfcd). N wing way 188651575: levels 3 (LoD2 9.6–11.1 m).
- Walls (Street View: "light multi-storey block through trees", no capture), entrance, sign: needs reference.
- Name: keep the current POI name (Alex 2026-10-25). Note: the school is being merged into the Adalbert-Stifter-Mittelschule
  by 2029–2031; look at the name again then.
Acceptance criteria:
- [ ] Only the two school ways change height. pnpm test + typecheck green.
Size: S
```

### B6b-5 · Hair & Style Bellini, Neuer Platz 22 (#159, shop) — Size: S — status: ref-done (partial: massing + name; facade needs reference)
```
Goal: The long Neuer Platz block (Bellini and its neighbours) gets its real height: 4 storeys under a brown gable roof.
Reference: docs/places/bellini.md; reference/bellini/01-dop20-ortho.jpg, 03/04 (LoD2), 06-web-logo.png (logo, reference only).
Spec (via #0b):
- POI "Bellini" (#159 at 3668.4, 4674.7). Way 127604892 (L-shaped, whole block): LoD2 splits it into 11 buildings
  (DEBY_LOD2_4602770…4602782; main eaves 12.2–13.6 m, ridges 14.4–16.0 m; most have a 3.5–3.9 m single-storey part).
  Use `masses` (as for Am Stern, BACKLOG #0b notes): rings = the OSM outline cut along the LoD2 walls; each 4-storey part
  levels 4, pitched, the DOP roof colours (#a29078); each single-storey part levels 1, flat. Bellini's own part is 4602775
  (eave 12.2 m) + its 3.9 m low part. This changes every tenant in the block; the plaza (W) stays open and walkable.
- **Name fix (Alex 2026-10-25):** the POI is called "Hair & Style Bellini". The name comes from OSM (build.ts: brand ?? name of
  node 12427142627), so add the smallest typed override (e.g. a POI_NAMES map by OSM id in build.ts, applied before pois.push)
  rather than editing public/geretsried.map.json by hand. Check no code looks the POI up as "Bellini" (none at 44fc414).
- Salon front: not seen; plaza (W) or car-park (E, address node Neuer Platz 22) side unknown → no wallSign. Logo: light-grey
  #d3cfcf "HAIR&STYLE" + purple #86639b script "Bellini".
- Not the same place as Ammos (B6b-6).
Acceptance criteria:
- [ ] The block is taller, the plaza stays open and walkable; masses tile the footprint (places.test).
- [ ] POI #159 shows "Hair & Style Bellini" (HUD name near it); no other POI name changed. pnpm test + typecheck green.
Size: S
```

### B6b-6 · Restaurant Ammos, Neuer Platz 9 (#58, food) — Size: S — status: ref-done (partial: sign position and terrace extent by screenshot)
```
Goal: Ammos' low building N of the Neuer Platz fountain gets its grey-green roof, gold "Ammos" board and fenced terrace.
Reference: docs/places/ammos.md; reference/ammos/01-dop20-ortho.jpg, 03/04 (LoD2), 30–31 (day, key), 32 (night entrance).
Spec (via #0b):
- POI "Restaurant Ammos" (#58 at 3655.2, 4645.4). Way 188651577: roof { colour: "#858d7e" } (engine has no DOP colour here);
  levels stay 2 (LoD2 eave 7.0 m, ridge 7.9 m).
- Plaza face (photos 30–32): white upper floor (engine off-white), dark shopfront band with white "PAULANER" letters + round
  Paulaner logo, gold/ochre board "Restaurant Ammos – Griechische Spezialitäten" (black script, darkened), dark-brown
  timber cladding (#302428) above a white glass double door. Edge + u: screenshot vs 30/31.
- Terrace (optional props): natural-wood picket fence (#a26927 darkened) with flower boxes, 2–4 blue Paulaner parasols
  (#4d5f87), wicker table sprites. Extent: screenshot vs 30 + DOP 01.
Acceptance criteria:
- [ ] Roof colour matches 01. pnpm test + typecheck green.
- [ ] From the plaza, the gold "Ammos" board and the dark PAULANER band read like 31; the plaza stays walkable.
Size: S
```

### B6b-7 · Pia's Hair & Beauty, J.-S.-Bach-Straße 11a (#161, shop) — Size: S — status: todo (needs facade reference)
```
Massing already matches: way 127604860, engine levels 2 + pitched + DOP roof colours = LoD2 (eave 6.8 m, ridge 10.0 m) + DOP
(red tiled roof #d8a384 with roof windows). Street View (text only): cream residential block, red roof, no sign. Nothing to
build until a photo shows the 11a entrance/sign. See docs/places/pias-hair-beauty.md.
```

### B6b-8 · Ana's Waschservice, Händelstraße 2 (#16, shop) — Size: S — status: ref-done (partial: massing; name kept, facade needs reference)
```
OSM node 370891567 (shop=laundry, no address) sits in way 127604869, whose outline carries the address node Händelstraße 2.
Old listings: "Ana's Wäscheservice", Händelstr. 2. zerowash.de (ZER-O-WASH laundry pickup service) also gives Händelstraße 2.
Decision (Alex 2026-10-25): keep the POI "Ana’s Waschservice"; ZER-O-WASH is noted as a possible successor (needs check: sign
or listing on site). No sign until a photo shows one. The massing is wrong: LoD2 = hipped roof, eave 20.4 m, ridge 21.9 m
(+ a 4.6 m low part); engine has levels 2. Do it now: #0b levels 7 on way 127604869, keep pitched, DOP roof #a39179. The
4.6 m low part is not modelled (one LoD2 building 4602766, so no masses). Acceptance: only way 127604869 gets taller;
pnpm test + typecheck green.
See docs/places/anas-waschservice.md.
```

### Batch 6c: start area 377–509 m (decision)
Same rules as 6a/6b: **exterior only** (Size S), everything through **#0b**, no interiors, no new ShopKind, NEVER invent
appearance. Sources: Street View (Feinkost Christos, Munzur, BRK + Isar-Apotheke fronts; Italy only distant), Google
satellite, **BVV DOP20 + LoD2** (CC BY 4.0, "© Bayerische Vermessungsverwaltung – www.geodaten.bayern.de"), business websites
(reference only), OSM. Research notes: docs/work/6c-prep.md. Backhupferl (#5) is a counter inside EDEKA Am Stern (B4-9), no item.
Privacy: passers-by in brk-kleidermarkt/01 + 03 (and the same 03 under isar-apotheke/) blurred by us.

### B6c-1 · Feinkost Christos + Munzur Kebap, Neuer Platz 7 / 3 (#160 shop, #57 food) — Size: S — status: ref-done (partial: front edge to confirm)
```
Goal: The low pavilion block on Neuer Platz gets its flat roof and the two shop signs the player passes on the plaza.
Reference: docs/places/feinkost-christos.md, docs/places/munzur-kebap.md; reference/feinkost-christos/01–03 (SV), 04, 10–12;
reference/munzur-kebap/01–03 (SV), 04, 10–11.
Spec (via #0b), one footprint for both: way 127604896 (building=retail, 403 m²).
- Roof: engine has levels 1 + pitched=true; OSM, LoD2 (4 flat parts 3.6–4.4 m) and SV all show a FLAT roof with a deep grey
  fascia → roof { pitched: false, colour #ece3de (DOP) }, levels 1 unchanged.
- Feinkost Christos (POI name stays: the window sign reads "Feinkost Christos"; web trade name "Olive Feinkost"): dark brown
  frames #42302c, grey fascia #868b90; wallSign = pale blue-white panel (#97a9ac) with dark-blue serif "Feinkost Christos",
  ~2.5 × 1.2 m, z 0.9–2.1, at the kiosk's plaza face. The plaza faces are edges 1 (5.9 m), 2 (12.4 m), 3 (8.1 m), all 112°:
  pick the one nearest POI (3621.0, 4676.6) → most likely edge 1; check in a screenshot.
- Munzur Kebap: glazed front in dark brown frames (#372c2e), white fascia (#d3d6df), beige corner pier (#998665); wallSign =
  black panel, yellow-green "MUNZUR" (~2.0 × 0.5 m) on edge 4 (16.5 m, faces 202°, car-park side) near its SE end (u ≈ 11–13),
  z 2.0–2.5. Letter colour is by eye → keep it simple (yellow-green on black).
- Optional sprites: 2 black planters in front of Feinkost; 1 white parasol in front of Munzur.
Acceptance criteria:
- [ ] Block renders flat-roofed, same height; only way 127604896 changes.
- [ ] Both signs readable from the play camera on the right faces (screenshot vs SV 01/02); places.test passes.
- [ ] pnpm test + typecheck green.
Size: S
```

### B6c-2 · Isar-Apotheke + BRK KleiderMarkt + Dr. Schmucker, J.-S.-Bach-Straße 13/13a (#18 pharmacy, #73 shop, #121 doctor) — Size: S — status: ref-done (Dr. Schmucker sign needs reference)
```
Goal: The J.-S.-Bach-Straße shop block gets its real 4-storey height and the Isar-Apotheke / BRK fronts.
Reference: docs/places/isar-apotheke.md, brk-kleidermarkt.md, dr-schmucker.md; reference/isar-apotheke/01–03 (SV), 12–14 (web
front, matches SV); reference/brk-kleidermarkt/01–03 (SV).
Spec (via #0b), way 127604883 (502 m²; street front = edges 3 (6.3 m), 4 (20.3 m), 5 (7.6 m), all facing 27°, SE → NW):
- levels 4 (SV: ground floor + 3 storeys; LoD2 4602812 eave 11.2 m), pitched, roof #bbaa9a. Rear annex (LoD2 low eave 5.2 m)
  optional via masses; if not done, note it.
- wallColour off-white; yellow-ochre panels under some windows are optional (skip if bands can't do patches).
- BRK (SE end, edge 3, u 0.5–6.0, z 2.6–3.1): two dark grey (#3f444c) panels "BRK KleiderMarkt" (red cross) + "Gutes aus 2.
  Hand", white letters; slim grey canopy above (out 0.4, z 3.2).
- Isar-Apotheke (edge 4 u ≈ 2–20 + edge 5): grey fascia panel with red caps "ISAR APOTHEKE" + blue wave logo, ~9 × 0.8 m at
  u ≈ 9–18, z 3.0–3.8; brick-red window bands with white text (Gesundheits- und Ernährungsberatung · Bestell-/Lieferservice ·
  Pharmazie | Arzneimittel · eig. Rezepturen | Gesundheitstests) as one strip z 2.4–2.8; projecting white "A" box (red A,
  0.7 × 0.9 m, out 0.6) at edge 4 u ≈ 19, z 2.6–3.5; thin red trim line on top of the shop band (Isar part only).
- Dr. Schmucker: nothing (sign illegible). findHospital() respawns at this POI: don't move/rename it.
- u values are from perspective photos (±1.5 m): check the BRK/Isar split in a screenshot before finishing.
Acceptance criteria:
- [ ] Block is 4 levels; no other building changes; the respawn at Dr. Schmucker still works.
- [ ] From the street (camera on J.-S.-Bach-Str.) the order reads BRK (left/SE) → Isar fascia → A sign → corner, like SV 03.
- [ ] places.test + pnpm test + typecheck green.
Size: S
```

### B6c-3 · Juchheim Cosmetics, Neuer Platz 2 (#17, shop) — Size: S — status: ref-done (partial: massing; sign name needs reference)
```
Massing only: way 127604877, LoD2 105018621 hipped, eave 9.6 m → #0b levels 3, pitched, roof #847464 (DOP). No sign, no
rename: the web lists "Isar Nails und Beauty" here (OSM name = product brand) → confirm the sign first.
Acceptance: only way 127604877 gets taller; pnpm test + typecheck green. See docs/places/juchheim-cosmetics.md.
```

### B6c-4 · Italy da Umile + Zirngibl Bestattungen, J.-S.-Bach-Straße 23/25 (#19 food, #97 shop) — Size: S — status: ref-done (partial: massing; signage needs reference)
```
Massing now, fronts later. Way 668422401: LoD2 4603126 gable eave 9.6 m (→ 3 storeys, matches the "3-storey cream building
with brown timber cladding" seen in SV), 4603127 gable with a 3.4 m low eave. #0b levels 3, pitched, roof #ac9c8c on the whole
footprint (masses only if the 4603127 low part can be cut along LoD2 walls).
Italy: seen only distant (reference/italy/05): salmon single-storey entrance pavilion with a cream arched pediment and dark script
"Italy", glazed terrace with a low awning, blue parasol, hedge → no tower/sign until a closer photo (colours by eye).
Zirngibl: satellite only → nothing. Don't use the OSM operator "Tara Carroll".
Acceptance: only way 668422401 changes; pnpm test + typecheck green. See docs/places/italy.md, zirngibl-bestattungen.md.
```

### B6c-5 · Aussegnungshalle, Waldfriedhof (#234, church) — Size: S — status: ref-done (partial: roof colour; walls/tower need reference)
```
Way 645297386: keep levels 2 (LoD2 mono-pitch, eave 3.9 m, ridge 9.0 m), pitched, roof colour #e19f6b: both DOP20 and Google
satellite show an orange roof with a PV array (the city photo's dark roof is treated as outdated). No mono-pitch roof in the
engine → gable stays (note). Bell tower (LoD2 4603558, 10.6 m, ~20 m E) is outside the OSM footprint → not built now.
Acceptance: only way 645297386 changes colour; save point still works; pnpm test + typecheck green.
See docs/places/aussegnungshalle.md.
```

### Batch 6d: start area 318–821 m (decision)
Same rules as 6a–6c: **exterior only** (Size S), everything through **#0b**, no interiors, no new ShopKind, NEVER invent
appearance. **Dark GTA style (V header):** fix accuracy only; new tints sit inside the existing dark palette (nothing lighter
than today's lightest ground/roof tone) and the average frame lightness at the six spots must not rise by more than ~3 %.
Sources: Street View (Sept 2023 unless noted), web photos (Christuskirche, Franz-Marc-Schule, Burger; Google Maps user photos for
Centrale, Ammos, HoangAnh, Bistro Malor; reference only),
**BVV DOP20 + LoD2** (CC BY 4.0, "© Bayerische Vermessungsverwaltung – www.geodaten.bayern.de"), OSM. Hex values: SV pixel
samples (walls in shade read bluish/grey, e.g. Lewke's white wall = #6c84a6; the docs give the perceived colour; for light walls
prefer a web daylight photo) or DOP20 roof quartiles. Research notes:
docs/work/6d-prep.md. Privacy: bystanders in schreibwaren-schroeter/01 blurred by us; 2026-10-25 also the web photos centrale-geretsried/31 (cropped
+ blurred: guests, a child, photographer's legs/bag) and 32, ammos/32, hoanganh/30 + 32, bistro-malor/30 (plates).
Fixes found: the Neuer Platz pavilion in centrale-geretsried/01 is **Feinkost Christos**, not Centrale (B6d-12); Fitness Forum kind food → gym (already I-1 step 3); Occasione is "Mode & **Lifestyle**" (B6d-9); the
"Laufbahnen" at the Franz-Marc-Schule are a **Verkehrsübungsplatz** (I-2 note, B6d-14); Carglass is **Sudetenstraße 50**.
No usable Street View: Matheis, DUO, Franz-Marc-Schule (web photo only), BSZ (hedge), J.-S.-Bach playground, both fitness
stations. B6d-1…11 = existing POIs; B6d-12…16 = new places that wait for I-1/I-2.

### B6d-1 · Carglass, Sudetenstraße 50 (#218, car_repair) — Size: S — status: implemented (partial: 2026-10-26, front = edge 3; side/back walls and the neighbour hall's use not seen, left plain)
```
Goal: The small Carglass kiosk on Sudetenstraße becomes a low red box with its grey "CARGLASS" fascia.
Reference: docs/places/carglass.md; reference/carglass/01, 03 (SV), 10–11 (DOP20).
Spec (via #0b):
- Way 772887800 (82 m², 12.5 × 6.6 m): levels 1 (LoD2 flat 3.6 m; engine has 2), roof { pitched: false, colour #cdc8c4 }
  (DOP), wallColour #813b3c (red, SV).
- wallSign "CARGLASS": red capitals on a dark grey fascia (#5f6060) with yellow/red arrow blocks at the left end, as a
  strip z 2.6–3.2 along the front. Front = edge 3 (6.6 m, faces 31°, nearest Sudetenstraße) or edge 2 (12.5 m, faces 121°):
  check in a screenshot against SV 03 before writing the entry.
- Way 772887798 (same lot, 159 m²): levels 1, pitched: false (LoD2 flat 3.1–3.6 m; engine 2 levels pitched). No sign (which
  business: needs reference).
- No bay door / no props (not seen).
Acceptance criteria:
- [ ] Both boxes are single-storey and flat; no other building changes.
- [ ] From Sudetenstraße the red box with the grey CARGLASS fascia reads like SV 03; places.test passes.
- [ ] pnpm test + typecheck green.
Size: S
```

**B6d-1 as built** (`src/world/places/carglass.ts`: `CARGLASS`, `CARGLASS_HALL`; `?at=carglass`):
- **Front = edge 3** (the 6.55 m NE end, faces 31°), not edge 2: in SV 03 the door-and-windows face is square to the road and
  about 1.8 × as wide as it is high (6.1–7.2 m by the fascia height); the DOP has the short end to the road. In game the
  door is at the SE end of that wall and the arrow blocks lead into "CARGLASS", as seen from the street in 01/03.
- Way 772887800: levels 1 (3.6 m = LoD2), flat #cdc8c4, facade `plaster` × #813b3c, a plain fascia band z 2.85–3.6 #5f6060
  (0.75 m, measured in 01) on every wall. Front: `carglass-front` (drawn in process-sprites.py from metres off 01: the
  double glass door on its step plate under a dark visor, the white notice, two dark-framed windows) z 0–2.85 and
  `carglass-sign` (Codex redraw of the fascia, cut to its lettering band) z 2.85–3.6.
- Way 772887798: levels 1, flat, nothing else (its use is unknown). Guessed: the fascia on the side and back walls; the
  openings to about ±0.3 m. Not built: the pole barrier and stand, any bay door.

### B6d-2 · Piatsa, Lausitzer Straße 12 (#79, food) — Size: S — status: ref-done (partial: sign illegible)
```
Goal: The long Piatsa / Vegas Casino building on Wallensteinstraße becomes the single-storey red-roofed restaurant from SV.
Reference: docs/places/piatsa.md; reference/piatsa/01–02 (SV), 10–11.
Spec (via #0b): way 189043196 (60.4 × 21.8 m): levels 1 (SV single storey; LoD2 main eave 3.0 m, ridge 8.1), pitched stays
(SV: red clay hip roof; engine gable), keep the map roof colours (DOP #a67763 red part, #e3dee1 light NW part).
- Optional: cream awning (#e9dcc6) as a plain wallSign strip on edge 4 (60.4 m, faces 51°, Wallensteinstraße side),
  z 2.3–2.7, out 0.6; u range from a screenshot vs SV 01. Green terrace screens (#536b45) at the right end: optional sprite.
- Piatsa = the red-roofed restaurant front with the cream awning and green screens (SV 01, edge 4). The Google listing
  thumbnail reference/piatsa/30 (white part with roller shutters) may be a different unit or a neighbour: not used.
- No sign: the pole sign text is not legible → needs reference (a photo of the Piatsa sign would also confirm the unit).
Acceptance criteria:
- [ ] Building is one storey with its pitched red roof; no other building changes.
- [ ] pnpm test + typecheck green; places.test passes.
Size: S
```

### B6d-3 · Arztpraxis Lewke, Adalbert-Stifter-Straße 43 (#98, doctor) — Size: S — status: implemented (2026-10-26)
```
Goal: The doctor's house shows its dark red "Arzt-Praxis" board.
Reference: docs/places/arztpraxis-lewke.md; reference/arztpraxis-lewke/01 (SV), 10–11.
Spec (via #0b): way 188590009: massing stays (SV: 2 full storeys + roof windows; levels 2, pitched). Roof colour #767460 (DOP)
or keep the map colour. wallColour engine off-white (white render; no lighter).
- wallSign: dark aubergine board (#2f1d29) with beige "Arzt-Praxis" and white "Dorothea Lewke" (white stethoscope icon between
  the words, small family pictogram; 3 tiny lines illegible → leave out), ≈ 1.8 × 0.9 m,
  z ≈ 1.8–2.7, on the street side (edges 2–4 face 230°) left of the ground-floor windows: edge + u from a screenshot vs SV 01.
- Do not move/rename the POI.
Acceptance criteria:
- [ ] Sign readable from the play camera on the street side; only this building changes.
- [ ] pnpm test + typecheck green; places.test passes.
Size: S
```

**B6d-3 as built** (`src/world/places/arztpraxis-lewke.ts`; `?at=arztpraxis-lewke`): the board (`lewke-sign`, Codex
redraw: beige "Arzt-Praxis", orange rule, white "Dorothea", stethoscope, "Lewke", family pictogram; the three small lines
left out) on wall 4 (the NW 5.03 m of the street wall), u 1.1–2.9 from the NW corner, z 1.75–2.65, measured in SV 01 with
the wall's perspective taken out. Massing and walls unchanged; the roof gets one colour, the DOP's #767460, because the
map's colours rendered it terracotta (01: dark grey). Guessed: the board's place to about ±0.5 m.

### B6d-4 · KFZ-Meisterbetrieb Gerd Matheis, Spreestraße 11 (#26, car_repair) — Size: S — status: ref-done (partial: massing; facade/sign need reference)
```
Massing only (no Street View: hedge on Dieselweg). Way 1319566946 (No. 11) stays levels 2 + pitched (LoD2 gable 7.5 / eave
4.7). Neighbour No. 13, way 1319566945: engine draws it flat, LoD2 = 3 gables (7.3/4.6, 6.1/3.0, 9.7/8.4) → #0b pitched: true,
colour stays #f6f4f7 (= DOP, not brightened); masses for the 3 gables optional. Workshop doors, sign: Alex's photo.
Address check (2026-10-25): no conflict. OSM node + way 1319566946 = Spreestraße 11 (spelling "Spreestraße"), neighbour
1319566945 = Spreestraße 13; all listings say Spreestraße 11. "Dieselweg" is only the street of the nearest SV pano.
Acceptance: only ways 1319566945/-946 change; pnpm test + typecheck green. See docs/places/kfz-matheis.md.
```

### B6d-5 · Fitness Forum & Squash, Breslauer Weg 103 (#128, food → gym) — Size: S — status: ref-done (partial: massing ok; entrance/sign need reference)
```
Nothing to build: way 188648201 is already right (SV Nov 2022 through trees: long 2-storey flat-roof block; LoD2 flat 7.4 m;
engine levels 2, flat #dbd5d0 ≈ DOP). The POI kind fix (food → gym) is I-1 step 3; do not duplicate it here. Entrance, sign,
beer garden: needs reference. See docs/places/fitness-forum-squash.md.
```

### B6d-6 · Franz-Marc-Schule, Robert-Schumann-Weg 5 (#189, school) — Size: S — status: ref-done (partial: web photo only)
```
No Street View. Massing already matches (web photos 20 + 30: white panel-clad 2-storey flat block, dark window bands, glazed
entrance where two wings meet; LoD2 flat 8.4 / 7.3 m, gym
gable 7.1 m). Optional: roof colour #a3a28f (DOP: PV) on way 128271980; shed way 822457546 (26 m², engine 2 levels pitched,
no LoD2) → levels 1 after a DOP check. Entrance side + school sign: needs reference.
Acceptance: only those ways change; pnpm test + typecheck green. See docs/places/franz-marc-schule.md.
```

### B6d-7 · Bäckerei Manfred Burger, Benzweg 2 (#106, bakery) — Size: S — status: ref-done (drive-in needs reference)
```
Goal: The Burger bakery becomes the 2-storey timber-and-white building with its pergola sign, as on Benzweg.
Reference: docs/places/baeckerei-burger.md; reference/baeckerei-burger/01–02 (SV), 20 (web, small), 10–11.
Spec (via #0b): way 191449964 (32.1 × 17.8 m):
- levels 2 (SV: 2 storeys; LoD2 eave 5.1), roof { pitched: true, colour #a27969 } (SV: shallow pitched, wide overhang; DOP
  red-brown tiles; the LoD2 "flat" is wrong).
- bands: z 0–3 white render (engine off-white, not lighter), z 3–6 timber boards #796255.
- wallSign "Bäckerei & Konditorei Manfred Burger" + "www.burger-baeckerei.de" (brown on cream, ≈ #958a81 in shade) on edge 0
  (32 m, faces 22°, Benzweg), z 2.2–2.9, out 0.4, at the W end (u ≈ 20–25 by eye): check in a screenshot.
- Optional sprite: pergola with benches in front of edge 0. Drive-in lane: needs reference (not seen).
Acceptance criteria:
- [ ] Building is 2 storeys with a pitched red-brown roof; timber upper band visible; no other building changes.
- [ ] Sign readable from Benzweg; pnpm test + typecheck green; places.test passes.
Size: S
```

### B6d-8 · Schreibwaren Schröter, Adalbert-Stifter-Straße 39 (#59, shop) — Size: S — status: implemented (partial: 2026-10-26, front = edge 4; the small lines under the logo, the side board and banner, goods outside not built)
```
Goal: Schröter's corner becomes the 3-storey cream block with the red shop wing, blue/white awning and "Schröter" sign.
Reference: docs/places/schreibwaren-schroeter.md; reference/schreibwaren-schroeter/01–02 (SV), 10–11.
Spec (via #0b), way 668663477 (414 m²), masses (LoD2 walls):
- main block (LoD2 4603829, 242 m²): levels 3 (eave 10.6), pitched; shop wing (4604182, 113 m²): levels 2 (eave 7.3), pitched.
  Roof colour #c6b9a8 (DOP). Engine today: levels 2, flat. No hip roof in the engine → gable.
- Shop wing street face (edge 4, 12.7 m, faces 231°, or edge 3, 12.0 m, 218°; screenshot vs SV 01): red ground floor
  #691718 (plain wallSign z 0–3 or a band if it can be limited to the wing), blue/white striped awning strip (#1e2661 + white)
  z 2.6–3.0, out 0.6; wallSign "Schröter" (black + red/black swoosh logo on white) ≈ 2.2 × 0.8 m, z 3.2–4.0. Upper floor cream
  #9f928a (shade sample; use the engine's cream, not lighter).
- Do B6d-9 (Occasione annex, same address) in the same PR.
Acceptance criteria:
- [ ] Block 3 storeys + 2-storey wing, masses tile the footprint (places.test); no other building changes.
- [ ] From Adalbert-Stifter-Straße: red shop front, awning, "Schröter" sign like SV 01. pnpm test + typecheck green.
Size: S
```

**B6d-8 as built** (`src/world/places/schreibwaren-schroeter.ts`; `?at=schreibwaren-schroeter`):
- **Front = edge 4** (the wing's 12.65 m street front, faces 231°): SV 01 shows the red shop front between the block's
  corner and the garden wall; edge 3 is the block's street end, which carries the big "OCCASIONE / Schröter" panel (02).
- Masses from LoD2 tile 684_5304: block `4603829` eaves 10.6 m, hip 7° (ridge 11.25), wing `4604182` eaves 7.3 m, hip 10°;
  OSM's outline cut along the party wall (E corner → the wing's NW corner; OSM's inner corner lies on that line). Roof
  #c6b9a8 on both, facade `render` × warm cream (230, 222, 206).
- Wing front: `schroeter-front` (drawn from metres off 01: red #6e1a1b to 3.4 m, white-framed window, door, window,
  window, door), two awnings (canopies with the drawn `schroeter-awning`: navy, pale stripe, white edge) u 0.1–4.0 and
  4.2–8.8 at 3.2 m, `schroeter-sign` (Codex) u 5.2–7.5, z 3.6–4.45. Block end: `schroeter-gable` (Codex) u 1.3–4.4,
  z 2.4–5.6. Guessed: the awnings' 0.8 m depth, openings to ±0.4 m, the panel's size.

### B6d-9 · Occasione Mode & Lifestyle, Adalbert-Stifter-Straße 39 (#217, shop) — Size: S — status: implemented (2026-10-26: annex + sign; POI name fixed in the importer)
```
Goal: The small clothes shop in front of Schröter's block becomes single-storey with its canopy sign; its name is fixed.
Reference: docs/places/occasione.md; reference/occasione/01 (SV July 2022), 02 (gable sign), 10–11.
Spec (via #0b): way 668663478 (77 m²): levels 1 (LoD2 flat 3.9; engine 2), roof { pitched: false, colour #7f7f6a } (DOP).
- wallSign on edge 1 (10.2 m, faces 315°, St.-Hubertus-Straße side) at the canopy fascia, z 2.6–3.4, out 0.6: grey-beige panel
  (#796e60), "OCCASIONE" dark serif with a red tick over the I + red underline, second line "Mode & Lifestyle". Canopy edge
  dark grey #54555d.
- Name fix: POI "Occasione Mode & Livestyle" → "Occasione Mode & Lifestyle" (both signs + web). Same small typed override by
  OSM id as the B6b-5 Bellini fix (POI from way 668663478); check no code looks it up by the old name.
Acceptance criteria:
- [x] Annex is one storey, flat; sign readable; HUD shows "Occasione Mode & Lifestyle"; no other POI name changed.
- [x] pnpm test + typecheck green; places.test passes.
Size: S
```

**B6d-9 as built** (`src/world/places/occasione.ts`; `?at=occasione`): Occasione is its **own OSM way** (668663478), not
a unit of Schröter's way, so it is its own place (no UNITS split). Levels 1.1 (3.3 m + parapet = LoD2 3.9 m), flat #7f7f6a.
Wall 1: `occasione-front` (drawn: white, two wide two-pane windows, glass door with transom at the SW end) from u 2.0 (the
first 2 m are behind a tree in 01: engine facade there), `occasione-sign` (Codex) u 7.95–9.95, z 2.65–3.4 over the door,
and the roof's overhang as a canopy at 3.9 m, 1.0 m deep (depth guessed), fascia 0.3 m #54555d. From the play camera the
canopy hides most of the board, as the overhang does in 01. The dressing is named "Occasione Mode & Lifestyle" and anchors on
the footprint's middle (the misspelt POI sits 0.3 m from it). **Name fix (2026-10-26, with V-1):** `NAME_FIXES` in
`src/map/build.ts` renames by OSM id (`placeName`: way 668663478 → "Occasione Mode & Lifestyle", ahead of brand and
name). After `pnpm map`, the only change in map.json is POI #217's name. Its slot stays, ground.png and trees.bin are
byte-identical, and no POI contains "Livestyle". The dressing now anchors on its POI. The HUD at `?at=occasione` shows
"Occasione Mode & Lifestyle". Tests: `build.test.ts` (fix by id only), `places.test.ts` (#217 is "Lifestyle").
`docs/poi-id-map.csv` is left as written: it records the I-2 mapping under the old names. B6b-5's Bellini rename can go
in the same `NAME_FIXES` map.

### B6d-10 · Christuskirche, Jeschkenstraße 125 (#233, church) — Size: S — status: ref-done (partial: turret needs reference)
```
Way 127872148 (L-shape, 501 m²): levels 2 stay (LoD2 eave 4.9: 6 m is closer than 3 m), pitched, roof colour #695b4b (DOP;
darker than today's #7a6a59), wallColour engine off-white (SV + web: white render, six round-arched windows, glazed porch).
No name sign (only a notice board) → no wallSign. White bell turret with cross: a `tower` part would fit, but position and
height need reference (LoD2 has no separate part) → leave out. Front = edge 3 (20.8 m, faces 30°).
Acceptance: only way 127872148 changes; pnpm test + typecheck green. See docs/places/christuskirche.md.
```

### B6d-11 · BSZ Direktmarketing GmbH, Wallensteinstraße 6b (#78, shop) — Size: S — status: ref-done (partial: roof; facade/sign need reference)
```
Roof fix only: way 191461638: roof { pitched: true, colour #a9a69f } (LoD2 gable 9.8 / eave 7.6; SV: shallow grey roof above
the hedge; DOP: PV on both slopes); levels 2 stay. Facade, loading doors, sign: hidden by a conifer hedge → needs reference.
Note: it is BSZ GmbH (direct marketing + logistics, B2B); OSM tags it shop=stationery. POI stays; OSM fix is Alex's call.
Acceptance: only way 191461638 changes; pnpm test + typecheck green. See docs/places/bsz-direktmarketing.md.
```

### B6d-12 · Centrale Geretsried + Café Bar DUO (hand-added POIs) — Size: S — status: todo (I-2 done 2026-10-26: POIs #369 Centrale Geretsried, #370 Café Bar DUO, both inside their buildings; Centrale sign + DUO need reference)
```
Depends on: I-2 step 3 (both POIs are hand-added there) and B6c-1 (Centrale's building 127604896 gets its flat roof there).
Correction (2026-10-25): the pavilion in centrale-geretsried/01 is **Feinkost Christos**. Centrale is the neighbouring terrace
unit in the same block (web photos 30–32: dark-red awning, yellow König Ludwig and cream parasols, a red Coca-Cola parasol,
grey wicker chairs, dark-framed glass front).
After I-2: check in a screenshot that the Centrale icon sits on Centrale's terrace unit (not on Feinkost Christos) and the
DUO icon on way 1385177375 (Sudetenstraße 47a), not in the road (I-2 "Done when"). No #0b change: Centrale massing = B6c-1; DUO
massing stays (levels 2, pitched, LoD2 eave 4.1). Optional after I-2: dark-red awning strip (#5c1418) + 2–3 darkened parasols.
Signs: Centrale (no name sign in 30–32) and DUO (no SV) need reference.
See docs/places/centrale-geretsried.md, cafe-bar-duo.md.
```

### B6d-13 · Playgrounds Breslauer Weg + J.-S.-Bach-Straße — Size: S — status: Breslauer Weg implemented 2026-10-26 (equipment + fences, see "B6d-13 as built" below the item); J.-S.-Bach-Straße todo (needs reference: equipment unknown; I-2 gives it the playground area #9e8d70, photo #a39274 darkened to the palette)
```
Depends on: I-2 step 1 (playground AreaKind, DOP centroid tint).
After I-2, check the two tints: Breslauer Weg (way 1271723892) lies under canopy → dark green (#44512e range, fine);
J.-S.-Bach-Straße (way 122032725) → sand (#a8896b range): keep it inside the dark palette (V rule; the patch is small).
Reference: docs/places/spielplatz-breslauer-weg.md; reference/spielplatz-breslauer-weg/40-alex-spielplatz.jpg (key, Alex
2026-10-26: whole layout from the street fence), 01–02 (SV), 10–11 (DOP20).
Optional later: Breslauer Weg fence (dark metal bars + green sign on the street side, brown wooden privacy fence at the back)
and sprites, left → right as seen from the street in 40: wooden A-frame hut + bench (back left), spring rider (middle),
wooden tower with yellow slide (middle right), seesaw with yellow beam (right), bench (front left), green bin on a pole;
ground = earth under brown beech leaves (no sand pit), many beech trunks. Exact metres not measured (no GPS).
J.-S.-Bach equipment unknown. See docs/places/spielplatz-*.md.
Acceptance criteria:
- [x] Breslauer Weg patch stays the dark canopy tint (#44512e range), not sand: 40 shows leaf-covered earth. (I-2: #424e35)
- [x] If sprites are added: their order matches 40 (A-frame left, tower + slide and seesaw right) and none sits on the road.
- [x] pnpm test + typecheck green.
```

**B6d-13 as built** (Breslauer Weg; `src/world/places/spielplatz-breslauer-weg.ts`, mechanism in `src/world/places/dressing.ts`
`GroundDressing`, drawn by `groundParts` in `src/render/scene/places.ts`; tests in `src/world/places/places.test.ts`,
`src/world/teleport.test.ts`):
- **Ground dressing:** a place dressing needs a building footprint; a playground is an area, and areas in map.json carry
  no OSM id. So a `GroundDressing` names an area kind and a map point inside it (`at`): `resolveGrounds` picks the area of
  that kind holding the point and hangs the street frame of `street` there, as `resolvePlaces` does at a POI. It has
  free-standing parts only (`FreePart` = sprite | pylon), never solid. Registry: `GROUNDS` in `places/index.ts`;
  `World.grounds`; the scene gives each one to the chunk of its box (`groundBox`). `?at=spielplatz-breslauer-weg` finds
  it (dressed areas are teleport targets like places).
- **Frame:** at (4303, 4561), u runs W along Breslauer Weg, n S into the playground (area 482, way 1271723892, u
  −16.4..16.0, n 2.6..45.5). The road and its default sidewalk reach n 5.85: the area's N 3 m lie under the sidewalk.
- **Parts** (left → right in photo 40 = E → W = rising u): A-frame hut (−7, 40), its bench (−3.5, 37.3), green spring
  rider (0.5, 31), tower with the yellow slide off its E side (tower at u 4.5, n 24), seesaw (11, 25); front bench (3, 14),
  green bin on a grey pole (7, 12.5). Fences as pylons: dark metal bars 1 m high on the sidewalk's back across the area
  (green sign box by the gate at u −3), brown wooden boards 1.8 m high just inside the back edge. Six Codex sprites
  (`spielplatz-*`, processed at the end of `scripts/process-sprites.py`; the hut's lower roof plane is darkened there).
- **Guessed:** every position (no GPS; read off where each thing meets the ground in 40, camera at the gate looking SSW),
  kept between the crown centres in `public/trees.bin`; sizes; the rider's shape. Not built: the gate (drawn as fence),
  the dog-bag dispenser, the E/W side fences.
- **Seen in game only near the player:** the whole playground is under tree crowns (true to the DOP), so from the play
  camera the equipment shows in the see-through circle round the player (renderer `FOCUS_M`), not from the street.

### B6d-14 · Verkehrsübungsplatz Franz-Marc-Schule (ex "Laufbahnen") — Size: S — status: implemented (I-2, 2026-10-26: the 5 ways are 4 m grey asphalt lanes round the lawn islands; optional white markings and signs left)
```
Depends on: I-2 step 1 (track AreaKind). The 5 track ways (258497399–402, 269909762, surface asphalt) are a children's traffic
training course in recreation_ground 258497403 "Verkehrsübungsplatz", not running tracks. I-2 already paints asphalt tracks
grey → right. After I-2: screenshot vs reference/verkehrsuebungsplatz-franz-marc-schule/10 (DOP20): grey lanes round 3 lawn
islands. Optional later: white lane/stop markings. See docs/places/verkehrsuebungsplatz-franz-marc-schule.md.
```

### B6d-15 · Fitness-Stations ways 574767212 + 497511384 (Stadtwald) — Size: S — status: todo (needs reference; I-2 done 2026-10-26: all 3 fitness stations are pitch areas in the pitch lawn tint, so 497511384's bark/sand look is still to do)
```
Depends on: I-2 step 1 (fitness_station → pitch). 574767212 is under canopy (DOP #262e23) → stays dark; 497511384 is a light
bark/sand patch (DOP #e0c5a4): don't use that raw hex (lighter than the lightest ground tone), pick the nearest muted
existing ground tint. Equipment: Alex's photo. See docs/places/fitness-station-*.md.
```

### B6d-16 · Champini Sport- & Bewegungskita, Jeschkenstraße 103 — Size: S — status: implemented (partial: 2026-10-26, N front built; the entrance banner not built: letter colours and subtitle illegible)
```
Depends on: I-1 (kindergarten kind gives the POI; I-2 step 2 dedupes it with grounds way 1271723889).
Goal: The Kita reads as the white building with lime-green bands from SV.
Spec (via #0b): way 524105770: massing stays (levels 2, flat, LoD2 6.5 m). bands: z 0–0.5 dark grey #2a2f33 (plain plinth),
z 2.6–3.2 lime green #8b954b (plain, between the window rows); wallColour engine off-white. Front = edge 1 (32 m, faces 19°,
Jeschkenstraße). Banner over the recessed lime-green entrance (E end): white banner, "CHAMPINI" in multicoloured letters
(subtitle illegible) → optional small wallSign "CHAMPINI"; letter colours are a guess, subtitle left out.
Acceptance: only way 524105770 changes; pnpm test + typecheck green; places.test passes. See docs/places/champini-kita.md.
```

**B6d-16 as built** (`src/world/places/champini-kita.ts`; `?at=champini`): on POI #337 (I-2's merged Champini). **Spec
correction:** SV 01/02 show the lime green not as a band between the floors but as patches at window height (ground
floor only between the three windows, upper floor from the first window to 3 m short of the W end), so no `bands`: the
whole N wall (edge 1, u 0 at the E end) is one texture, `champini-front`, drawn in process-sprites.py from metres measured
in 01 + 02 (the pano's position fitted to the two corners, which came out 31.95 m apart): white, dark plinth to 0.4 m,
the lime recessed entrance 3.3–7.5 m from the E end, the tall stair window, three double windows per floor, the lime
patches. Levels 5.9/3 (LoD2 6.5 m). Guessed: positions to about ±1 m (01 and 02 put the middle window 1.5 m apart). Not
built: the banner, window decorations, lamps, railings; the other walls are not seen (engine facade).

### B6d-17 · Fahrzeugtechnik Seitz, Breslauer Weg 75 (hand-added POI) — Size: S — status: implemented (partial: building dressing on way 128503556 built 2026-10-26, `src/world/places/fahrzeugtechnik-seitz.ts`; POI #371 added by I-2 2026-10-26 at the footprint's centre, the dressing anchors on it; the Orchidee stretch ~5 m W of OSM's outline not drawn; positions read off photo 40)
```
Depends on: I-2 step 3 (POI hand-added there: "Fahrzeugtechnik Seitz", car_repair, 47.859149, 11.490211 = map 4491.0, 4542.4).
Goal: The motorbike/car workshop on Breslauer Weg reads as the 2-storey flat block with the black "Fahrzeugtechnik SEITZ" sign.
Reference: docs/places/fahrzeugtechnik-seitz.md; reference/fahrzeugtechnik-seitz/40-alex-front.jpg (Alex 2026-10-26, key).
Spec (via #0b): building probably way 128503556 (312 m², S edge faces Breslauer Weg; the photo's front looks wider →
check against DOP20 first and say which way you used). Levels 2, flat (LoD2 9.1 m). Bands: grey ground storey #8b8f8f to
~3.3 m, white upper storey #cbcacf with grey roller shutters, brown fascia #73543f on the roof edge. wallSign "Fahrzeugtechnik
SEITZ" (black board, "technik" red) over the shop windows; small red "PKW SERVICE" panel; glass door under a small dark grey
canopy #3b3c43 left of the sign. Optional sprites on the right: white tent with motorbikes, tyre stack.
Not seen / unknown: the side and back walls, the yard layout. The "Kosmetikstudio Orchidee" unit left of Seitz: mention only.
Acceptance criteria:
- [ ] From Breslauer Weg the front matches 40 (sign centred over the windows, white upper storey, brown fascia).
- [ ] Only the chosen building way changes; pnpm test + typecheck green; places.test passes.
```

## Start area (everything within ~800 m of the start)

Start = Sudetenstraße 19 spawn at map (3997.4, 4648.0). Radius 800 m, map metres (project.ts). Source: public/geretsried.map.json pois
at HEAD c5af0a7, statuses from the priority list below. 64 POIs in the map are within 800 m: 41 todo, 23 already ref-done/partial/implemented (before 6a; after 6a: 33 todo, 31 done/partial/implemented).
Capture order: nearest first, ~10 per batch: 6a (done) → 6b (researched; no fronts seen) → 6c (done: B6c-1…5) → 6d → then 6e + all gyms, once I-1 has made them POIs.
Exterior only, same rules as batches 1–5 (NEVER invent appearance).

### 6a (captured 2026-10-25: B6a-1…B6a-10)
| # | Name | Kind | m from start | Status |
|---|---|---|---|---|
| 154 | Angel Nails | shop | 3 | implemented (partial) |
| 12 | HoangAnh | food | 6 | ref-done (partial: B6a-2; photos show HoangAnh, Deliqos was 2022) |
| 47 | Dolce Gelato | food | 20 | implemented (partial) |
| 155 | Stroblume | shop | 29 | implemented (partial) |
| 13 | VR-Bank | bank | 48 | implemented (partial) |
| 115 | Optik Kind Geretsried-Zentrum II | shop | 3944.9, 4641.7 | 47.858256, 11.482889 | 53 | implemented (partial) | B6a-6. Sudetenstraße 10, sign "KIND" |
| 120 | Bistro Malor | food | 69 | implemented (partial) |
| 178 | Audi;Seat;Škoda;Volkswagen | shop | 79 | implemented (partial) |
| 11 | Quelle | shop | 154 | todo (needs reference; probably closed) |
| 177 | Gaststätte Isarwinkel | food | 180 | implemented (partial) |

### 6b (researched 2026-10-25 from DOP20/LoD2/web: B6b-1…B6b-8; no shop fronts seen)
| # | Name | Kind | m from start | Status |
|---|---|---|---|---|
| 138 | miwomo | shop | 248 | todo (needs facade reference; name kept, rental closes end 2026) |
| 228 | Karl-Lederer-Grundschule Geretsried | school | 265 | todo (needs facade reference; building missing in-game: I-1 step 7) |
| 54 | Haar Genau Friseurteam | shop | 274 | ref-done (partial: massing; facade needs reference) |
| 186 | Karl-Lederer-Hauptschule Geretsried | school | 315 | ref-done (partial: massing; name kept, merger noted) |
| 159 | Bellini | shop | 330 | ref-done (partial: massing + rename to Hair & Style Bellini) |
| 152 | Flamingo Damenmode | shop | 341 | todo (needs reference; B4-10) |
| 58 | Restaurant Ammos | food | 342 | ref-done (partial: B6b-6; facade + terrace from web photos) |
| 158 | Fellomenal Hundesalon | shop | 343 | todo (needs reference, probably moved; B4-11) |
| 161 | Pia's Hair & Beauty | shop | 356 | todo (needs facade reference; massing ref-done) |
| 16 | Ana’s Waschservice | shop | 360 | ref-done (partial: massing; name kept, ZER-O-WASH possible successor) |

### 6c (captured/researched 2026-10-25: B6c-1…B6c-5)
| # | Name | Kind | m from start | Status |
|---|---|---|---|---|
| 160 | Feinkost Christos | shop | 377 | ref-done (partial: B6c-1; flat roof + sign, edge to confirm) |
| 73 | BRK KleiderMarkt | shop | 380 | ref-done (B6c-2) |
| 18 | Isar-Apotheke | pharmacy | 381 | ref-done (B6c-2) |
| 121 | Dr. Schmucker | doctor | 385 | todo (needs reference: sign illegible; height in B6c-2) |
| 57 | Munzur Kebap | food | 392 | ref-done (partial: B6c-1) |
| 17 | Juchheim Cosmetics | shop | 419 | ref-done (partial: massing B6c-3; sign name check) |
| 5 | Bäckerei Backhupferl | bakery | 438 | covered by EDEKA Am Stern (counter inside; B4-9) |
| 19 | Italy | food | 468 | ref-done (partial: massing B6c-4; signage needs reference) |
| 97 | Zirngibl Bestattungen GmbH | shop | 484 | todo (needs facade reference; massing in B6c-4) |
| 234 | Aussegnungshalle | church | 509 | ref-done (partial: roof B6c-5; walls/tower need reference) |

### 6d (captured/researched 2026-10-25: B6d-1…B6d-16)
| # | Name | Kind | m from start | Status |
|---|---|---|---|---|
| 218 | Carglass | car_repair | 552 | implemented (partial: B6d-1; front = edge 3) |
| 79 | Piatsa | food | 659 | ref-done (partial: B6d-2; sign illegible, unit from SV 01) |
| 98 | Arztpraxis Lewke | doctor | 664 | implemented (B6d-3) |
| 26 | KFZ-Meisterbetrieb Gerd Matheis | car_repair | 678 | todo (needs reference: no SV, hedge; massing in B6d-4) |
| 128 | Fitness Forum & Squash | food | 690 | ref-done (partial: B6d-5, massing ok; kind → gym in I-1 step 3; entrance/sign need reference) |
| 189 | Franz-Marc-Schule | school | 701 | ref-done (partial: B6d-6; no SV, 2 web photos; sign needs reference) |
| 106 | Bäckerei Manfred Burger | bakery | 720 | ref-done (B6d-7; drive-in needs reference) |
| 59 | Schreibwaren Schröter | shop | 726 | implemented (partial: B6d-8; front = edge 4) |
| 217 | Occasione Mode & Lifestyle | shop | 750 | implemented (B6d-9) |
| 233 | Christuskirche | church | 767 | ref-done (partial: B6d-10; turret needs reference) |
| 78 | BSZ Direktmarketing GmbH | shop | 783 | ref-done (partial: B6d-11 roof; facade/sign need reference, hedge) |

6d, new (added 2026-10-25 from the gap check; not POIs/areas yet: pending I-1/I-2). Captured with the rest of 6d (SV +
DOP20, B6d-12…16); the #id comes from docs/poi-id-map.csv once imported.
| # | Name | Kind | lat, lon | map x, y | m from start | Status |
|---|---|---|---|---|---|---|
| — | Spielplatz Breslauer Weg (way 1271723892, public) | playground area (I-2) | 47.85898, 11.487694 | 4303.2, 4561.2 | 318 | built (B6d-13, 2026-10-26: equipment + fences as a ground dressing, from Alex's photo) |
| — | Centrale Geretsried (ex Coffeeholic), Neuer Platz 5 | food (hand-added, I-2) | 47.8577969, 11.4785523 | 3621.4, 4692.7 | 379 | ref-done (partial: B6d-12; terrace from web photos, the 01 pavilion is Feinkost Christos; sign/name needs reference) |
| — | Fahrzeugtechnik Seitz, Breslauer Weg 75 (web; not in OSM; building prob. way 128503556) | car_repair (hand-added, I-2) | 47.859149, 11.490211 | 4491.0, 4542.4 | 505 | ref-done (B6d-17; front from Alex's photo 2026-10-26) |
| — | Café Bar DUO, Sudetenstraße 47a | bar (hand-added, I-2) | 47.8561907, 11.4897066 | 4453.4, 4871.3 | 508 | todo (needs reference: no SV; B6d-12; same block as Takt Tanz, no. 47) |
| — | Verkehrsübungsplatz Franz-Marc-Schule (was "Laufbahnen"; ways 258497399–402, 269909762, asphalt, in recreation_ground 258497403) | track area (I-2) | 47.8579, 11.4746 | 3330, 4680 | 660–690 | ref-done (B6d-14; layout from DOP20) |
| — | Spielplatz J.-S.-Bach-Straße (way 122032725, public) | playground area (I-2) | 47.858685, 11.474506 | 3319.6, 4594.0 | 680 | todo (needs reference: SV sees only trees; B6d-13) |
| — | Fitness-Station (way 574767212) near St 2369 | pitch area (I-2) | 47.862484, 11.475803 | 3416.3, 4171.5 | 751 | todo (needs reference: under canopy, no SV; B6d-15) |
| — | Fitness-Station (way 497511384, lit) near St 2369 | pitch area (I-2) | 47.861853, 11.474556 | 3323.3, 4241.7 | 787 | todo (needs reference: DOP20 only; B6d-15) |
| — | Champini Sport- & Bewegungskita, Jeschkenstraße 103 (way 524105770) | kindergarten (I-1) | 47.851222, 11.487208 | 4267.0, 5423.8 | 821 | implemented (partial: B6d-16; banner not built) |
Not added: Indian Palace, Sudetenstraße 47 (no sign of being open: only old directory entries); see I-2 step 3.

### Already done in the start area (no capture needed)
| # | Name | Kind | m from start | Status |
|---|---|---|---|---|
| 48 | Mühlenbäck | bakery | 8 | implemented (partial) |
| 168 | Rehmaus Apotheke | pharmacy | 50 | implemented |
| 170 | Spielwaren Krömer | shop | 4094.6, 4741.4 | 47.85736, 11.484897 | 134 | implemented (partial) | B4-8 |
| 56 | Cafe Waldmann | food | 148 | implemented |
| 166 | Woolworth | shop | 157 | implemented (partial) |
| 169 | Sun Style Bodystyling Studio | shop | 173 | implemented (partial) |
| 114 | Nexial | shop | 188 | implemented (partial) |
| 116 | GG-Radsport | shop | 190 | implemented (partial) |
| 157 | Aphrodite-aestetic | shop | 190 | implemented (partial) |
| 15 | TEDi | shop | 205 | implemented (partial) |
| 80 | Orterer Getränkemarkt | shop | 221 | implemented (partial) |
| 81 | Takko Fashion | shop | 223 | implemented (partial) |
| 82 | Denns BioMarkt | supermarket | 233 | implemented (partial) |
| 134 | B&L Hairstyling | shop | 253 | implemented (partial) |
| 65 | Rossmann | drugstore | 283 | implemented (partial) |
| 150 | Deutsche Post Filiale 571 | post | 4238.7, 4832.4 | 47.856541, 11.486828 | 303 | implemented (partial) | B2-2. Job "post": van spawns on Sudetenstraße (far kerb). Yellow Post board a guess (no photo) |
| 232 | Maria Hilf | church | 3831.3, 4907.8 | 47.855863, 11.481366 | 309 | implemented (partial) | save point (Jesus Saves); Johann-Sebastian-Bach-Straße |
| 77 | da Daniele | food | 329 | implemented (partial) |
| 67 | Ahorn Apotheke | pharmacy | 330 | implemented (partial) |
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

### I-1 · Import all missing places: start area 6e + every gym (whole town) — Size: L — status: implemented
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
     gym           leisure=fitness_centre, leisure=sports_centre (named) ONLY with sport=fitness (Tina´s, ClubVital),
                   amenity=dojo, hand-added studios. Other named sports centres (Hallenbad, Turnhallen, tennis): I-2.
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
7. Multipolygon buildings (Alex 2026-10-25, from B6b-2). scripts/import-osm.ts fetches only way["building"], so relation
   buildings (type=multipolygon + building=*) are dropped, e.g. the Karl-Lederer-Grundschule, relation 2014408 (outer way
   127604842, inner courtyard way 156041502). Fetch relation["building"](B) with `out geom` in a SEPARATE query with its own
   gitignored cache (data/buildings-rel.json), so data/raw.json and every existing way building stay byte-identical. Turn each
   relation into a building: outer ring(s) as the footprint, inner rings as holes (courtyards). If the building type cannot
   hold holes yet, add the smallest field that does (e.g. `holes`) and make scene.ts and collision respect it; the courtyard
   must be open ground. Skip a relation whose outer way is already a way building (no doubles). Print every relation building
   in the bbox: relation id, name, area, new / duplicate (e.g. Seniorendomizil 2979379).

Check list (the acceptance data): every row of the "6e: not in the map yet" table in docs/BACKLOG.md (except the two
skips) and every row of the "Gyms" table in docs/BACKLOG.md (same rows as gyms.csv; OSM ids there, lat/lon of the
non-OSM ones in step 4) must appear as a POI in public/geretsried.map.json with the
right name and position within ±10 m of the listed OSM element / lat-lon. "Right name" = what build.ts produces
(brand ?? name), e.g. clever fit may come out as its brand "Clever fit", DHL Packstation as "DHL": list such cases.

Done when:
- every check-list row is a POI (name, position ±10 m, kind as above) — print a table: row, found POI id, distance, kind;
- relation 2014408 is a building: the ring block stands where the DOP shows it, its courtyard (inner way 156041502) is open
  ground the player can walk into, and POI #228 (renumbered: see poi-id-map.csv) lies in the courtyard, not in a wall; the
  relation-building list is printed; the way-building count and ids are unchanged;
- no existing POI lost: all 234 old POIs still present (name + position ≤ 1 m); only #128's kind changed (food → gym);
- docs/poi-id-map.csv written; findHospital still picks Dr. Schmucker for the default start (or explain why not);
- dressed places render unchanged (places.test passes; Cafe Waldmann untouched);
- `pnpm check` passes, `pnpm build` passes, and the game starts at Sudetenstraße 19 and runs (open it, drive a bit).
Report: counts per new kind, the whole-town POI count before/after, the check-list table, any OSM POIs that changed.
```

**I-1 as built** (`scripts/import-osm.ts`, `src/map/build.ts`, `src/map/extra-pois.ts`, `src/map/types.ts`,
`scripts/poi-id-map.ts`, `docs/poi-id-map.csv`; renderer/collision: `src/render/scene/{scene,geometry,facade}.ts`,
`src/world/{world,geometry}.ts`, `src/map/photo.ts`, `src/sim/pickups.ts`, `src/render/overlay.ts`):
- **Fetch: a separate query after all** (`PLACES_MORE_QUERY` → `data/places-more.json`, gitignored). Re-fetching the old
  `PLACES_QUERY` on 2026-10-26 gave the same 273 elements as the cache (no OSM edit), so step 1 allowed one query; the
  separate one was chosen anyway: (a) its POIs are appended after the old ones, so **no id renumbers** (1–234 stay,
  new are 235–360) and `data/places.json` stays byte-identical; (b) the twin rule can then apply to the newer sources
  only, which keeps the three old same-name pairs (#1/#55 Landgasthof Lacherdinger, #88/#89 Auto Stapf, #192/#205
  Ratsstuben) that a general rule would have merged. Elements both queries return (16 pharmacies/doctors with
  `healthcare=*`) are dropped from the second by type/id. To refresh one cache alone: delete it, run `pnpm map`.
- **Kinds** (types.ts, `poiKind` exported from build.ts, order as step 2): `gym` (fitness_centre, dojo, sports_centre
  only with `fitness` in `sport`), `health` (dentist, veterinary, healthcare=*; never `doctor`), `kindergarten`,
  `care_home`, `bar`, `parcel_locker`, `office` (office=*, craft=*). Icons (overlay.ts): 🏋️ ⚕️ 🧸 🧓 🍸 📦 💼.
  SHOP_FRONTS + gym, bar; IMPORTANT unchanged. pickups.ts `NO_PICKUPS`: school, police, kindergarten, care_home,
  parcel_locker.
- **Twin rule** (`addPoi`): a newer place with the name of a POI within 50 m stays that one POI, in its slot and at its
  position, and takes the newcomer's kind if its own is food. Fired twice: #128 Fitness Forum & Squash (pub node →
  gym; it stays at the pub node, 26.6 m from the centre of way 188648201 but about 2 m outside that way's east wall, so
  within 10 m of the element itself) and the `office=company` node "Premio" (merged into the old shop POI "Premio",
  26 m away; kind stays shop).
- **Hand-added** (`src/map/extra-pois.ts`, `EXTRA_POIS`, `{ name, kind, lat, lon }`, appended last, same projection
  and twin rule): the 8 studios of step 4 (#353–#360). I-2 appends its restaurants there.
- **Building relations** (`BUILDINGS_REL_QUERY` → `data/buildings-rel.json`, gitignored; `relationBuildings` +
  `joinRings` in build.ts, appended after the way buildings): outer ways joined into rings, inner rings inside an
  outer become the new optional `Building.holes`. The importer prints every one: 2014408 Karl-Lederer-Grundschule
  2080 m² new, 1 courtyard; 2979379 Seniorendomizil Haus Elisabeth 1946 m² new, 1 courtyard; 7730164 and 7730165
  (unnamed, Graslitzer Straße 40a/42, 50 and 49 m², outline split over two ways) new; 9506009 Loxxess Pharma
  14141 m² new. None was a duplicate. The cache came from the overpass.openstreetmap.fr mirror (OSM base 2026-08-10;
  the main server answered 502): delete it and run `pnpm map` for a fresh copy. Courtyards: `inFootprint` (collision,
  facade), the photo footprint mask and roof sample skip them, scene.ts walls and parapets each courtyard (walls
  facing in) and roofs the outline joined to its holes (`bridgeHoles` + `triangulate(ring, true)`).
- **Map before → after:** POIs 234 → 360 (+118 OSM, +8 hand-added); per new kind gym 16 (15 new + #128), health 18,
  kindergarten 14, care_home 8, bar 3, parcel_locker 8, office 60; food 37 → 36 (#128). Buildings 5749 → 5754: the 5523
  way buildings and the 226 photo sheds are identical, the 5 relations are added. Trees 148251 → 148241 and one fewer
  `covered` road stretch (the new roofs' footprint and shadow). Pickup candidates 407 → 490 (518 without the new
  exclusions). Old POIs: all 234 at the same id and position; only #128's kind changed (`docs/poi-id-map.csv`,
  written by `node scripts/poi-id-map.ts <old map.json> <new map.json>`, which exits 1 if an old POI is lost).
- **Names as built** (brand ?? name): Clever fit, ClubVital, Tina´s Fitnesstreff Geretsried, Bodystreet,
  Selbstverteidigungsschule PT-Kubis, BaseFit Gesundheitszentrum, HUK-Coburg, Caritas (way 533111661, OSM name
  "Caritas Altenheim St. Hedwig"), every Packstation "DHL Packstation" (brand; names carry the number), LVM.
- **Check list** (all 65 rows: 49 of 6e, 16 gyms; distance to the OSM element's centre / listed lat-lon): 2 skipped
  (way 127872149, dada ATELIER), the other 63 found, 62 at ≤ 0.1 m, #128 as above. 6e: #237 Bodystreet gym; #340
  Sonnengarten, #313 Pflegeheim St. Ursula, #338 Caritas, #296 ambulantex, #352 Seniorendomizil Haus Elisabeth, #342
  Haus Elisabeth, Betreutes Wohnen care_home; #302 Rechtsanwalt Stevan Krnjaic, #301 Beautydate, #303 FMDienste, #236
  Versicherungmakler Kafka, #260 Taxiunternehmen Kottysch, #254 Starke Bedachungen, #246 Schlüsseldienst Geyer, #295
  Fuch & Fuchs, #298 Weidinger, #299 Vermas, #273 HUK-Coburg, #315 Fullhouse IT-Services, #336 CHT Geretsried, #261
  DMG MORI Spare Parts office; #304 PT-Kubis, #292 Athletik Delta, #353 Sportstudio Innings gym; #341 Caritas
  Kindergarten, #253 Kinderland Geretsried, #300 Erle Elebnis Lernen, #351 Blechkiste, #350 Kita Blechkiste
  kindergarten; #314 Classic ShishaBar, #247 M1 Lounge, #248 Vegas Casino bar; #238 Dr. Marta Thum, #293 Tierärztin
  C. Schedel, #294 Christopherus Hospitzverein, #297 Augentierarztpraxis Rogge, #305 Tierärztliche Praxis Buschmann,
  #267 Wirth Steffen, #274 TherapierBar, #252 Physio Geretsried health; #306 (node 12474160939), #244 (2820202651),
  #284 (11871707114) DHL Packstation; web: #354 BeaFit, #355 Lu Jong Yoga Studio, #356 Takt Tanz, #357 Carsten Schwarz
  Tanzstudio. Gyms: the above plus #128 Fitness Forum & Squash, #240 Tina´s, #235 ClubVital, #241 Clever fit, #358
  Muscle & Mind, #310 BaseFit, #359 Elements Yoga und Pilates, #360 Fitness-Studio imPuls.
- **Dropped by the rules** (for I-2): Sport Center Hahn (sports_centre, no sport), Turnhalle Mittelschule / Gymnasium
  (sport=multi), Interkommunales Hallenbad (swimming); 9 unnamed elements; and two whose centre lies just outside the
  bbox like any other place: **Städt. Kindergarten & Kinderkrippe (way 97695048, lat 47.90010 > north 47.9)**, an I-2
  check-list row, and Pfarrheim (way 242857616, lon 11.50501 > east 11.505).
- **Side effects:** Pflegeheim St. Ursula now has its POI (way centre), so its dressing's street frame anchors there
  (4 m along Sudetenstraße from the footprint mean); it has no parts, so nothing it draws moves (only `?at=` lands
  4 m over). Cafe Waldmann, findHospital (still Dr. Schmucker) and every other dressed place unchanged.
- **Checks:** `pnpm check` (311 tests; new: poiKind, twins, relations/joinRings, bridgeHoles, Karl-Lederer courtyard
  and hospital on the real map) and `pnpm build` pass. In game: the school's ring block lines up with the DOP40, its
  courtyard is open lawn with walls round it and the school POI in it; the Seniorendomizil courtyard likewise; the game
  starts on Sudetenstraße and drives.

### I-2 · Import leisure areas, schools, sport venues + verified web restaurants (whole town) — Size: L — status: implemented (2026-10-26; see "I-2 as built" below the item)
Run AFTER I-1 (needs its new kinds, extra-pois list, relation fetch and poi-id-map.csv). Alex 2026-10-25: "füge die alle
hinzu" (gap check: docs/work/gap-check-food-play-school.md + .csv, Overpass 2026-10-25, map bbox).
```
Goal: Playgrounds and running tracks show on the ground; kindergartens, the Feuerwehrschule, driving schools, the public
sports venues (Hallenbad, Eisstadion, Isarau Stadion, tennis centre) and 5 verified restaurants that OSM lacks become POIs.
School gyms and private garden pools stay out. No existing POI, area or building changes, except: none.

Context (read only, verified on the box clone at 44fc414; re-check line numbers at HEAD):
- scripts/import-osm.ts QUERY (roads/buildings/areas, cache data/raw.json) fetches areas only as ways:
  way["landuse"], way["natural"~"water|wood"], way["leisure"~"park|pitch"], way["amenity"="parking"]. No playground/track.
- src/map/build.ts areaKind() (line ~34) maps leisure park → "park", pitch → "pitch". src/map/types.ts AreaKind (line 16):
  water forest grass farmland residential industrial park pitch parking. Areas in map.json are {kind, pts}: no name/id.
  Today: 743 areas (grass 255, parking 160, forest 108, farmland 60, pitch 57, water 52, industrial 28, residential 20, park 3).
- src/render/scene/scene.ts AREA_LOOK (line ~77): [Material, TILE, tint, z-offset] per area kind (pitch = lawn tint
  [175,215,160]). src/map/photo.ts:472 masks pitch pixels; src/sim/pickups.ts:95 uses park/pitch/parking areas as pickup ground.
- After I-1: PLACES_QUERY already fetches nwr["leisure"="sports_centre"]["name"] and amenity kindergarten|childcare.
  I-1 step 2 sends ONLY sport=fitness sports centres to "gym" (Tina´s, ClubVital); everything else named is handled here.

Change:
1. Areas: fetch (separate query + own gitignored cache data/areas-more.json, so data/raw.json and every existing area stay
   byte-identical; same pattern as I-1 step 7):
     way["leisure"~"^(playground|track|fitness_station)$"](B);
     relation["leisure"~"^(playground|track)$"]["type"="multipolygon"](B);   out geom (outer ring(s) only)
   New AreaKinds (types.ts + areaKind() + AREA_LOOK, keep it minimal):
     playground      leisure=playground (ways + relations). NOT nodes (2 in bbox: skip).
     track           leisure=track (running/athletics/long-jump; relation 16929053 is the tartan track at Jahnstraße).
                     Note (6d, 2026-10-25): the 5 asphalt ways at the Franz-Marc-Schule (258497399–402, 269909762) are a
                     Verkehrsübungsplatz (children's traffic course, recreation_ground 258497403), not running tracks; still
                     track + asphalt grey (B6d-14).
     fitness_station → reuse "pitch" (small outdoor exercise patches, no new kind).
   Skip leisure=stadium as an AREA on purpose: its outline wraps the pitch/track areas that already render; painting it would
   cover them. Stadiums become POIs (step 2). Do NOT import leisure=swimming_pool at all: 19 in bbox, all unnamed, 18 are
   private garden pools (relation 21399402 is swimming_pool=personal); the one at the Hallenbad (way 1311996572) is covered
   by the Hallenbad building/POI.
   Look (no invented colours): colour = the `surface` tag where present (track: asphalt → paving grey like parking;
   tartan → red-brown; playground: sand/woodchips/grass/paving → nearest existing Material). Where `surface` is missing
   (most playgrounds), sample the DOP20 aerial (Bayerische Vermessungsverwaltung, CC BY 4.0) at the area's centroid and use
   that tint; print the sampled hex per area. Draw order: on top of grass/park/residential (small areas paint last).
   pickups.ts: playground is NOT pickup ground (no pickups in a Kita/playground); track may be (like pitch). Report the
   pickup candidate count before/after.
2. POIs. Add to PLACES_QUERY: nwr["amenity"~"^(college|driving_school|arts_centre)$"](B); nwr["leisure"="stadium"]["name"](B).
   Kinds (one new kind only; reuse the rest):
     sport (NEW)     public/club sports venues: leisure=stadium (named); leisure=sports_centre (named) whose sport is NOT
                     fitness, e.g. sport=swimming (Hallenbad), tennis. Needs a POI_STYLE icon+colour; add to SHOP_FRONTS: no;
                     IMPORTANT (labels): yes for stadium/swimming (big landmarks). Why one kind: pool, ice rink, stadium and
                     tennis hall all play the same in-game role (big public sports building); separate kinds add 3 icons for nothing.
     gym             unchanged from I-1 (fitness_centre, dojo, sports_centre with sport=fitness, hand-added studios).
     school          + amenity=college (Feuerwehrschule is a school campus; pickups already skip school).
     office          + amenity=driving_school (I-1's office kind: a small business with a sign, same role).
     civic           + amenity=arts_centre (like cinema/library: Kulturbühne Hinterhalt).
     kindergarten    unchanged from I-1.
   Skip (print each as "skipped: reason"):
     - leisure=sports_centre whose name starts with "Turnhalle" or whose building=sports_hall/centroid lies inside an
       amenity=school area (school gyms: Turnhalle Mittelschule way 188593099, Turnhalle Gymnasium way 188593876, and the
       unnamed Karl-Lederer hall way 127872149 from I-1).
     - unnamed sports centres (tennis halls ways 188632620/188632640, way 1086044529): dropped by the no-name rule.
     - unnamed amenity=school ways (12 in bbox, parts of existing campuses): dropped by the no-name rule.
   Dedupe (I-1 step 3 rule, extended): same site = centroids ≤ 50 m AND one name is a prefix of the other
   (e.g. "Champini" way 1271723889 + "Champini Sport- & Bewegungskita Geretsried" way 524105770 → keep the longer name).
3. Hand-added POIs (append to I-1's extra-pois list; verified open 2026-10-25, not in OSM; coordinates NOT guessed):
     name                          kind  lat, lon                 map x, y         m    address / source
     Centrale Geretsried           food  47.8577969, 11.4785523   3621.4, 4692.7   379  Neuer Platz 5 (Nominatim house).
                                                                                         Formerly "Coffeeholic Café/Bistro": same
                                                                                         address + phone, posts as Centrale May 2026
     Café Bar DUO                  bar   47.8561907, 11.4897066   4453.4, 4871.3   508  Sudetenstraße 47a (Nominatim building)
     Fahrzeugtechnik Seitz    car_repair  47.859149, 11.490211     4491.0, 4542.4   505  Breslauer Weg 75 (motorradseitz.de; Alex's
                                                                                         photo 2026-10-26; centroid of way 128503556,
                                                                                         the web geocode lands on the street)
     Asien Perle                   food  47.8511639, 11.4898048   4460.7, 5430.3   909  Jeschkenstraße 28 (listing pin; OSM has no
                                                                                         no. 28, DLRG 28a is 45 m N). Sign may read
                                                                                         "Perle des Ostens"
     Club57                        food  47.8526785, 11.4955387   4888.4, 5261.9  1082  Sudetenstraße 74 (listing pin, restaurantguru
                                                                                         + exa agree; no no. 74 in OSM)
     Restaurant Akropolis          food  47.887615, 11.439643      719.2, 1377.1  4631  Brunnenfeldweg 4, Gelting (official tourism
                                                                                         portal pin; OSM has no no. 4)
   x/y = same projection as OSM places (check: your projection of each lat/lon must land within 1 m of the x/y above).
   Not added (do NOT add): Indian Palace, Sudetenstr. 47 (only old directory entries, no recent reviews; DUO now at 47a);
   Boulevard Bistro, Jeschkenstr. 13 (newest reviews 2012, directories contradict each other); Yellow Chilli (it is in
   Königsdorf, outside Geretsried); Café Centrale = Centrale above (same place); Restaurant Ostasien (old name at Pho Viet's
   address, #22). Wirtshaus Alter Wirth (OSM node 692015044, lon 11.4238) and Servus Gelting ex Neu Wirt (OSM node
   692015054, lon 11.4228) are real and open but lie WEST of the map bbox (west 11.43): they stay out unless the bbox grows.
   Kulturbühne Hinterhalt comes from OSM (way 191174401, amenity=arts_centre → civic), not from this list.
4. IDs renumber again: extend docs/poi-id-map.csv (old = after I-1, new = after I-2), same rules as I-1 step 6.

Check list (acceptance data; positions ±10 m of the OSM element / lat-lon):
  Kindergartens (I-1 filter, NOT in I-1's check list; 9 sites): Champini Sport- & Bewegungskita Geretsried (way 524105770,
  Jeschkenstraße 103, one POI after dedupe), Kindergarten des Diakonischen Werkes (way 539822403, Steiner Ring 159),
  Kinderland Gartenberg (way 188240368, Adalbert-Stifter-Straße 7), Waldkindergarten Isartal e.V. (way 285710835),
  Johanniter Kinderhaus Zwergenland (node 11809512565, Johannisplatz 4a), Kindergarten Ascholding (way 189251625),
  Kindertagesstätte "Isarkinder" Ascholding (way 1069594154), Kindergarten Gelting (way 92101829),
  Städt. Kindergarten & Kinderkrippe (way 97695048, Sudetenstraße 102).
  school: Staatliche Feuerwehrschule Geretsried (way 107100808, Sudetenstraße 81).
  office: Fahrschule Leirich (node 6247244441), Fahschule Schattschneider (node 7513431851, OSM's spelling),
          Fahrschule kmh (way 320687022).
  sport: Interkommunales Hallenbad Geretsried (way 772881803), Heinz-Schneider-Eisstadion (way 172282411),
         Isarau Stadion (way 981957335), Sport Center Hahn (node 2716650515, tennis).
  civic: Kulturbühne Hinterhalt (way 191174401).
  hand-added: the 5 restaurants of step 3 + Fahrzeugtechnik Seitz (added 2026-10-26, B6d-17).
  NOT POIs: Turnhalle Mittelschule, Turnhalle Gymnasium (skipped), no swimming pools.
  Areas: playground = 20 (all leisure=playground ways in bbox on 2026-10-25, incl. way 1271723892 Breslauer Weg and
  way 122032725 J.-S.-Bach-Straße; OSM may have changed: print the list, explain any difference); track = 8 (ways 258497399,
  258497400, 258497401, 258497402, 269909762 at the Franz-Marc-Schule, 1236727141/1236727142 long-jump pits, relation
  16929053 tartan track); pitch = 57 + 3 fitness stations (ways 497511384, 574767212, 574767217) = 60. All other area
  counts unchanged.

Done when:
- every check-list row is a POI (print table: row, POI id, distance, kind) and the area counts above match (print per kind,
  before/after); no old POI lost (all names + positions ≤ 1 m, from poi-id-map.csv), no old area or building changed;
- in game (screenshots): the Breslauer Weg playground (map ≈ 4303, 4561, 318 m NE of the start) and the J.-S.-Bach-Straße
  playground (≈ 3320, 4594) show as their own ground patch, not lawn; the Franz-Marc Verkehrsübungsplatz lanes (≈ 3330, 4680) read as grey
  asphalt strips; the tartan track at Jahnstraße reads red-brown; the Hallenbad and Isarau Stadion carry a "sport" label;
  Café Bar DUO and Centrale Geretsried icons sit on their buildings (Sudetenstraße 47a, Neuer Platz 5), not in the road;
- findHospital still picks Dr. Schmucker; places.test passes; `pnpm check` + `pnpm build` pass; the game starts at
  Sudetenstraße 19 and runs (drive past the Breslauer Weg playground).
Report: POI count before/after per kind, area counts per kind before/after, sampled playground tints, skipped list,
pickup candidate count before/after.
```

**I-2 as built** (`scripts/import-osm.ts`, `src/map/{build,types,photo,extra-pois}.ts`, `scripts/poi-id-map.ts`,
`docs/poi-id-map.csv`; renderer/sim: `src/render/scene/scene.ts`, `src/render/overlay.ts`, `src/world/world.ts`,
`src/sim/pickups.ts`; tests in `src/map/{build,photo}.test.ts`, `src/world/places/places.test.ts`):
- **Fetch: two more queries, own caches** (both gitignored under `data/`): `PLACES_NEXT_QUERY` → `data/places-next.json`
  (college, driving_school, arts_centre, named stadiums; came from the overpass.openstreetmap.fr mirror, OSM base
  2026-08-10, the main server answered 502) and `AREAS_MORE_QUERY` → `data/areas-more.json` (playground/track/
  fitness_station ways, playground/track multipolygons, `out geom`; main server, base 2026-10-26). `data/raw.json` and
  the older caches are untouched. Named sports centres were in I-1's cache already: `buildMap` holds the sport ones back
  from I-1's batch and adds them first in I-2's batch (`MoreSources.next`), so I-1's ids do not shift for them.
- **POI kinds:** new `sport` (🏟️, blue, labelled like `civic`: in `IMPORTANT`, not in SHOP_FRONTS) = leisure=stadium, or a
  sports centre that is no gym; `sportSkip` drops school gyms (name starts with "Turnhalle", or building=sports_hall).
  college → school, driving_school → office, arts_centre → civic. The step 2 rule "centroid inside an amenity=school
  area" was **not** built: the importer has no school outlines, the two school gyms are caught by name anyway, and the
  Hallenbad (Adalbert-Stifter-Straße 22, next to the Schulzentrum) could have been dropped by it.
- **Twin rule extended** (`addPoi`): a newer place within 50 m whose name equals, starts with or is the start of a POI's
  name is that POI; it keeps its slot and position and takes the longer name. It fired once: "Champini" (way
  1271723889, I-1 #349) merged into #337 Champini Sport- & Bewegungskita Geretsried. **So I-1's #350–#360 are now
  #349–#359** (Kita Blechkiste #349, Blechkiste #350, Seniorendomizil #351, Sportstudio Innings #352 … imPuls #359);
  ids 1–348 are unchanged. `docs/poi-id-map.csv` now maps after-I-1 → after-I-2 (`poi-id-map.ts` matches a merged
  prefix twin too; old ids 1–234 are still the pre-I-1 ids, #128's pre-I-1 kind food is in "I-1 as built").
- **Hand-added** (`EXTRA_POIS_NEXT`, appended last): Centrale Geretsried #369, Café Bar DUO #370, Fahrzeugtechnik Seitz
  #371, Asien Perle #372, Club57 #373, Restaurant Akropolis #374; each projects within 0.1 m of the listed x/y.
- **POIs 360 → 374:** sport 0 → 4, school 9 → 10, office 60 → 63, civic 2 → 3, food 36 → 40, bar 3 → 4, car_repair
  14 → 15, kindergarten 14 → 13 (Champini); all other kinds unchanged. Old POIs: 359 at their name and position
  (≤ 1 m), the 360th merged as above; no old kind changed.
- **Areas 743 → 774:** playground 0 → 20 (exactly the 20 ways of the check list, incl. 1271723892 and 122032725), track
  0 → 8, pitch 57 → 60 (fitness stations 497511384, 574767212, 574767217); every other kind and every old area is
  unchanged. `Area` got two optional fields: `width` (a leisure=track way without area=yes is a line: the 5 Franz-Marc
  lanes, 4 m wide where OSM has no `width`, drawn as round-jointed strips) and `tint` (#rrggbb). The tartan
  relation 16929053 is its outer ring (the D-zones are tartan on the DOP too); its pitch paints on top (track lift
  0.0075 < pitch 0.01 < playground 0.0125).
- **Look:** surface asphalt/paved/concrete/paving_stones/sett → the car-park paving (Franz-Marc lanes, playground
  833472869 `surface=paved`); anything else takes `tint` from the DOP40 (the photo the importer already loads; DOP20 is
  not in the pipeline) drawn on the gravel texture (`Mode.detail`). The tint is the **median of the whole area** (a
  ring's infield left out), not one centroid pixel: centres fall on crowns, shadows or, for the running track, the
  lawn infield. `groundTint` darkens it to luma 143 at most (`GROUND_MAX_LUMA`, the paved ground tone: dark palette).
  Sampled photo → used: 94931931 #4e5c48, 122032725 #a39274 → #9e8d70, 169270686 #596646, 169271318 #68744f,
  177622024 #3a4032, 179341161 #92937c → #91927b, 496090149 #404b34, 539824773 #435439, 540027380 #505c49, 758742552
  #71755c, 803229236 #7f7f62, 1083632281 #4d573e, 1194996431 #536864, 1271723887 #6a7d55, 1271723888 #4f5c45,
  1271723892 #424e35, 1283274019 #636f56, 1486499368 #57624e, 1547525668 #ccc0a6 → #978e7b; long-jump 1236727141
  #41483f, 1236727142 #4e4c45; tartan 16929053 #bd856f → #b7816c. Of the six V spots only Rathaus (half 120 m) holds a
  new area, the paved playground 833472869 (paving, like the ground there).
- **Skipped (printed by the importer):** Turnhalle Mittelschule (way 188593099), Turnhalle Gymnasium (way 188593876):
  school gym; the 12 unnamed amenity=school ways: no name. The unnamed sports centres (Karl-Lederer hall 127872149, tennis
  halls 188632620/188632640, 1086044529) never reach the importer: both sports-centre queries ask for a name. No
  swimming pools, no stadium areas, no playground nodes.
- **Not a POI:** Städt. Kindergarten & Kinderkrippe (way 97695048): its centre (lat 47.90010) is north of the box like
  in I-1; the bbox was not changed.
- **Pickups:** track areas (polygons only) are pickup ground, playgrounds are not; candidates 479 → 496 (counted with no
  hidden mask; the new POIs' back yards and the 3 fitness-station pitches add most of them).
- **Unchanged:** buildings (all 5754, incl. photo sheds), roads, trees (148241), covered roads, props, buses;
  findHospital still Dr. Schmucker (game.test). Seitz's dressing now anchors on POI #371 (the footprint centre): its
  parts are wall-relative, so nothing it draws moves; places.test now asserts the POI lies in the footprint.
- **Checks:** `pnpm check` (317 tests) and `pnpm build` pass. In game: Breslauer Weg playground a dark olive patch under
  the beeches, J.-S.-Bach a sand patch, Franz-Marc grey lanes round three lawn islands, the tartan ring red-brown with the
  pitch on top, "🏟️ Isarau Stadion" labelled on its track, DUO's and Centrale's POIs inside their buildings, the game
  starts on Sudetenstraße and drives. The Hallenbad shows its 🏟️ name in the HUD and its dot on the minimap, but its map
  label was not caught on screen: the POI sits 26 m inside the 87 × 53 m hall, out of the close camera's view.

### G-1 · Gyms: add POIs (import change) — Size: M — status: superseded by I-1
Folded into I-1 (gym kind, #128 dedupe, hand-added studios). Do not run separately.

## Looks like Geretsried (V-items, added 2026-10-25)

Source: `docs/work/looks-like-geretsried.md` (ranked gaps, numbers, sources) · contact sheet
`reference/contact-sheets/looks-gap.png` (6 spots, game `?compare` vs DOP20). Alex 2026-10-25: "aktuell sieht es nicht wie
geretsried aus". Whole-town look items; they never touch a Place's own dressing (src/world/places/*). Check every item with
`pnpm compare <lat> <lon> 120 <name>` at the six spots in the doc (start 47.858199,11.483593 · Neuer Platz 47.8579,11.4786 ·
Rathaus 47.8746,11.4655 · Am Stern 47.8568,11.4894 · Gartenberg 47.8720,11.4730 · Isar 47.8810,11.4816 half 200) and put
before/after pairs in the PR. Line numbers are from f9ca49d; re-check at HEAD. Aerial credit: © Bayerische
Vermessungsverwaltung – www.geodaten.bayern.de, CC BY 4.0.

**Alex 2026-10-25: V items approved, but keep the dark GTA style.** Fix accuracy (what is where, which
hue family, shapes, positions), never brighten or desaturate the overall look. New tints come from / sit inside the
existing dark palette (no colour lighter than today's lightest ground/roof tone); the average frame lightness at the six
spots must not rise by more than ~3 %. V-4 and V-5 are won't do for that reason.

### V-1 · Roof tone: brown and grey-beige tiles stop turning terracotta — Size: S — status: implemented (2026-10-26; partial: some real orange roofs at Start and Gartenberg measure brown in DOP40 and stay brown; no DOP20 re-sample; see "V-1 as built")
```
Goal: The town's pitched roofs show their real mix (brick red, brown, anthracite) instead of ~all orange.
Evidence: src/render/scene/roof-tone.ts isWarm() = hue < 0.12 || > 0.95 with s >= 0.1, then hue -> <= 0.055 and
saturation x2.2 (0.35..0.58). 3215 of 3872 photo-coloured pitched roofs (83 %) come out terracotta; 1528 of them measure
hue 25-43 deg, sat < 0.25 (brown/grey-beige concrete or fibre-cement tiles, e.g. Neuer Platz blocks #746d5c, #7f705f,
#686454 -> painted orange; DOP20 shows dark brown). Terracotta pixel share per 240 m frame: game 10-24 %, DOP20 1.7-6 %.
Change: only real clay red stays terracotta (start point: hue < 0.07 AND s >= 0.18 measured; tune on the six frames);
low-saturation warm hues (0.07..0.12, or s < 0.18) grade to dark brown / dark grey-beige at the same or lower
lightness as today's terracotta output (dark GTA palette, no lighter roofs), never saturation > 0.3; greys stay anthracite. Keep it monotonic in lightness (lit/shaded planes). Optional: re-sample roof colours from DOP20
(by_dop20c, less haze) instead of DOP40 in scripts/photo-*.ts if the grade alone can't split them.
Done when:
- [x] roof-tone unit test: #746d5c, #7f705f, #686454 -> brown/anthracite (s <= 0.3); a clear clay red (e.g. #b0583c)
      still terracotta; flat roofs unchanged.
- [x] Count script (or test over map.json): pitched roofs graded terracotta drop from 3215 to <= ~1700.
- [x] compare pairs at Neuer Platz + Gartenberg: the long Stein blocks read brown, Gartenberg reads mixed red/grey/brown.
- [x] Dark style kept: mean roof lightness at the six spots <= before (+3 % max); no roof lighter than today's lightest.
- [x] Places with their own roof colour unchanged (pnpm test green, typecheck green).
```

**V-1 as built** (`src/render/scene/roof-tone.ts`, `roofColors` in `src/render/scene/scene.ts`; tests
`roof-tone.test.ts`, incl. two over `public/geretsried.map.json`):
- **One roof, one material.** `roofGrade(planes, pitched)` classes the whole roof from the mean of its planes' measured
  colours: `clay` (hue < 0.072 = 26°, s >= 0.25), `brown` (warm hue < 0.12, s >= 0.1), `grey`, or `flat`. Each plane
  then keeps its own lightness, but takes the roof's hue and saturation (`roofTone(rgb, grade)`). Per plane, 1018 roofs
  would have come out half terracotta, half brown (a shaded plane measures darker and greyer); this also ends the old
  half-orange, half-anthracite roofs. Flat roofs are unchanged (their own colour, as before; checked over the whole RGB
  grid).
- **Thresholds tuned on DOP20**, not guessed: 148 pitched roofs lying wholly inside the five town frames, their DOP20
  footprint median against the DOP40 plane colours. Roofs that are orange in DOP20 (hue < 27°, s >= 0.26): 29. The
  backlog's starting rule (hue < 0.07, s >= 0.18, on one plane) finds 20 of them plus 23 that are not orange. The
  per-roof rule finds 26 plus 8. Raising the hue limit to 27–28° adds no hits.
- **Grade:** clay is as before (hue <= 0.055, s x2.2 into 0.35–0.58, L 0.06 + 0.6 l). Brown: hue clamped to
  0.07–0.1, s x1.4 into 0.14–0.3, L 0.03 + 0.49 l into 0.15–0.36. That is darker than clay from the same measurement,
  also as mean RGB (a test sweeps it), because brown's green channel is higher. Grey: unchanged formula.
- **Numbers** (current map, 3874 photo-coloured pitched roofs): terracotta **3217 → 988**. Lightest pitched plane:
  mean RGB 108.0 → 105.3. Mean roof lightness at the spots (plane mean RGB, area-weighted): Start 95.7 → 85.4
  (−10.8 %), Neuer Platz 101.4 → 88.3 (−13.0 %), Rathaus 125.1 → 119.9 (−4.2 %), Am Stern 134.2 → 132.2 (−1.5 %),
  Gartenberg 97.2 → 88.6 (−8.8 %), Isar has no roofs. Whole `?compare` frame mean lightness: −2.2, −3.3, −1.5, −0.6,
  −2.3, 0 %. Terracotta pixel share per frame (HSV hue <= 28°, s >= 0.4), before → after (DOP20 with the same rule,
  which undercounts the hazy photo): Start 23.6 → 14.8 (3.4), Neuer Platz 18.4 → 1.9 (1.4), Rathaus 12.6 → 5.9 (0.7),
  Am Stern 8.8 → 7.4 (2.1), Gartenberg 17.8 → 8.7 (1.9).
- **Looks:** Neuer Platz's long Stein blocks are brown, with the one orange roof at the corner still terracotta, as
  in DOP20. Gartenberg is mixed terracotta, brown and anthracite.
- **Partial:** DOP40 measures some roofs that are orange in DOP20 as brown (row houses at Start, a few houses in north
  Gartenberg), so those stay brown. Re-sampling roof colours from DOP20 (`by_dop20c`) is not done. FALLBACK_ROOFS (no
  photo colour) are unchanged.

### V-2 · Building heights from Bavarian LoD2 for the whole town — Size: M — status: implemented (2026-10-26; partial: puls G is way 751779728 and stays at OSM's 5 storeys (LoD2 says 6 at 3 m each); 20 flat-roofed 7.5–9 m buildings get 3 storeys; the compare camera looks straight down, so the height shows in-game, not in `?compare`; see "V-2 as built")
```
Goal: The 4-8 storey Wohnblocks and the new centre stand tall; houses stay low. Today 4538 of 5749 buildings sit on the
2-storey default (OSM has building:levels on 159 of 5523).
Evidence (box check, 2 LoD2 tiles 684_5302 + 684_5304, 6453 buildings): of 543 matched non-Place buildings >= 150 m2,
120 have a ridge >= 12 m and 71 of those are drawn with 2 levels (6 m walls); 87 are >= 6 m too low. puls G
(way 980958027, Karl-Lederer-Platz, 7 storeys per Kraemmel) drawn 5; way 833483720 (27.5 m) drawn 2.
Change: new script scripts/lod2-heights.ts: download the CityGML tiles covering the bbox
(https://download1.bayernwolke.de/a/lod2/citygml/<E>_<N>.gml, E/N = even km in EPSG:25832, ~16 tiles; gitignored cache
data/lod2/), read each bldg:Building's GroundSurface + measuredHeight + roofType, match to OSM building ways by footprint
overlap (IoU >= 0.5, else centroid inside), and write data/lod2-levels.json {wayId: levels} with
levels = round(eaveHeight / 3) (eave = lowest roof-surface z minus ground; fall back to measuredHeight for flat roofs).
build.ts buildingLevels(): an OSM building:levels tag wins, then lod2-levels, then TYPICAL_LEVELS. Places untouched.
Credit line for LoD2 next to the DOP credit in the HUD/README.
Done when:
- [x] Of the 120 >= 12 m buildings above, <= 10 remain at 2 levels; houses (LoD2 < 9 m) stay 1-2 levels.
- [ ] puls G 7 levels; Neuer Platz blocks 3-4 levels; compare pairs at Rathaus + Neuer Platz show the height.
- [x] Königsberger Weg high-rise way 127872287 (LoD2 26.05 m, hip) gets 9 levels; its 3-storey neighbour blocks (LoD2
      ~11.2 m, gable) 3 levels. Photo check: reference/wohnblock-koenigsberger-weg/42 + 43 (Alex 2026-10-26).
      Done early 2026-10-26 as a place (`src/world/places/hochhaus-koenigsberger-weg.ts`): 9 storeys, eaves 25 m, hip 10°,
      beige with a dark grey base (storeys 1–2) and light-grey bands on storeys 6–8 (all walls; the photo has them on
      the corner bays only). V-2 must keep this override.
- [x] Re-import is deterministic (same json twice); README credits LoD2; pnpm test + typecheck green.
```

**V-2 as built** (`scripts/lod2-heights.ts`, `src/map/{lod2,utm,build}.ts`, `scripts/import-osm.ts`, `scripts/bbox.ts`
(the bbox, now shared), `data/lod2-levels.json`, HUD credit in `src/ui/Game.tsx`, README; tests `src/map/lod2.test.ts`,
`build.test.ts`):
- **Run:** `node scripts/lod2-heights.ts`, then `pnpm map`. The bbox needs **20 tiles** (E 680–686 × N 5300–5308),
  not 16: the box's south and north edges reach 70 m and 220 m into the 5300 and 5308 rows. 23317 LoD2 buildings,
  ~600 MB, cached in `data/lod2/` (gitignored, with `matches.json`: every match with its eave, height, roof type,
  overlap). `data/lod2-levels.json` is **kept in git** (100 KB, one way per line, `{ ways: {id: storeys}, relations:
  {id: storeys} }`, the 5 multipolygon buildings included), so `pnpm map` works without the tiles; when it is missing,
  `pnpm map` says so and uses OSM only. EPSG:25832 ↔ lat/lon is in `src/map/utm.ts` (no dependency); OSM and LoD2
  outlines line up within ~0.8 m.
- **Matching** (`matchLod2`): IoU ≥ 0.5 (sampled every 0.5 m), else the OSM centroid inside, **else (new) the LoD2
  building with the most roof inside the outline** when LoD2 roofs cover half of it (one OSM outline over several LoD2
  houses, e.g. way 127604892 at Neuer Platz, 2444 m²). Of 5528 OSM buildings: 3208 by overlap, 1885 by centroid, 61 by
  roofs, 374 none (sheds, garages, huts, and 15 `construction` outlines of the new builds LoD2 does not have yet).
- **The eave is not "lowest roof point" and not measuredHeight** (both tested, both wrong too often): it is the
  **main eave**, the median of the roof surfaces' lowest points weighted by their area seen from above (`mainEave`),
  taken over the roof surfaces whose middle lies **inside the OSM outline** (any LoD2 building's) when they cover half
  of it, else the matched building's. Why: the lowest point is a low annex's (way 127604869, the 7-storey hip-roofed
  tower at Neuer Platz, has a 4.6 m annex: lowest → 2 storeys, main → 7); measuredHeight is a stair tower's (way
  669533892: 36.1 m vs the main roof's 34.2 m); and where OSM splits one LoD2 block into several ways (1885 centroid
  matches), each part now gets its own roof's height instead of the block's. Storeys = round(eave / 3), a flat roof's
  0.6 m parapet (render/scene `PARAPET_M`) taken off first, at least 1 (`lod2Levels`).
- **OSM tag vs LoD2:** the tag wins, **except when it is 2 or more storeys under LoD2's** (`TAG_UNDER_LOD2`): of the
  149 tagged buildings LoD2 matches, 110 agree, 23 are one under, 10 one over, 3 two over, and 3 far under: the
  Sparkassengebäude (way 980958027, tag 5, flat roof 27.5 m → **9**), way 188048816 (tag 1, eave 7.8 m → 3) and
  Kaufland (a place, so its tag stays). The
  23 "one under" are mostly 2-storey houses with a high knee wall (eave ~8 m); their tags stay.
- **Places untouched:** the importer drops every dressing's `osmBuildingId` from the LoD2 levels, so a place keeps
  OSM's or the typical storeys, or its dressing's (dressMap still runs after). Königsberger Weg 127872287 stays 25/3
  (its LoD2 main eave is 25.27 m, round → 8, so the place's 9 storeys are the better number).
- **puls G:** the backlog's way 980958027 is OSM's "Sparkassengebäude"; OSM's **"PulsG" is way 751779728** (Karl-
  Lederer-Platz, 2185 m², tag 5). Its LoD2 main roof is 19.2 m (25.2 m with the top part): 19.2 / 3 → 6 storeys, one
  over the tag, so the tag's 5 stays. Kraemmel's 7 storeys are 2.75 m each; at the game's 3 m per storey 7 would draw
  it 2 m taller than it is. Not forced.
- **Numbers** (before → after; map before = HEAD): storeys over all 5754 buildings 1: 1011 → 2315, 2: 4529 → 2622,
  3: 24 → 598, 4: 177 → 149, 5: 3 → 27, 6: 0 → 19, 7: 0 → 7, 8: 0 → 3, 9: 0 → 1 (+ places' own). Box check (tiles
  684_5302 + 684_5304, non-place, ≥ 150 m², ridge ≥ 12 m): **overlap matches only (the backlog's set): 119, at 2
  storeys 5** (all gabled with a 6.2–7.4 m eave, so 2 is their eave); all matches: 222, at 2 storeys 143 → 9; ≥ 6 m
  under the ridge 171 → 29. Whole town (≥ 150 m², ridge ≥ 12 m): 351, at 2 storeys 252 → 21. Houses (LoD2 < 9 m,
  2959): 1 storey 1841, 2: 1097, **3: 20** (all flat roofs 8.1–8.9 m, commercial/industrial/"yes": 3 storeys draw
  9.6 m, 2 draw 6.6 m) and 1 at 4 (way 127718045, OSM tag 4). Way 833483720: 2 → 8 (main roof 24.9 m). Neuer Platz
  (90 m): 127604869 2 → 7 (hip, eave 20.5 m), 127604877 2 → 3, 128271919 2 → 4, 128271967 4, 127604892 2 → 4.
  Königsberger Weg neighbours 127872211 / 127872221 / 127872235 (gable, eave 8.3 m, ridge 11.2–11.3 m): 2 → 3. Rathaus
  (120 m): BGZ 187819151 4 → 6, 187005907 2 → 4; the apartments tagged by type (4) round the Rathaus drop to their
  LoD2 3 or 2 (eaves 8.6–9.9 m and 6 m).
- **Side effects:** trees 148241 → 147910 (taller buildings cast longer shadows, and the photo's tree reading skips
  shadowed pixels, `buildingHeight` in photo.ts); facades follow the storeys (`facadeFor`: from 3 storeys "block",
  big halls up to 2 "industrial"), so many 2 → 1 houses and 2 → 3 blocks change texture; the fallback roof (no photo
  colour) is pitched under 3 storeys, flat from 3.
- **Checks:** `pnpm check` (329 tests) and `pnpm build` pass; `node scripts/lod2-heights.ts` twice and `pnpm map` twice
  give byte-identical files. In game (before = HEAD, after = this): Neuer Platz tower (`?at=3624.8,4654.8`) goes from a
  2-storey house to a 7-storey block; next to the Sparkassengebäude a tall beige wall rises out of the frame; at
  Königsberger Weg the gabled neighbour's roof sits a storey higher. `?compare` at Rathaus and Neuer Platz looks the
  same before and after (straight down, no walls): there the change is only the trees.

### V-3 · Isar as a wild river: gravel bars + jade water — Size: M — status: todo
```
Goal: At the Isar the player sees gravel banks and a green-tinted river in the right place between dark woods, not a
blue canal in lawn. Dark GTA palette stays (Alex 2026-10-25).
Evidence: natural=shingle 44 ways, 15.4 ha in the bbox, not imported (QUERY has natural~"water|wood" only). Game water
median (22,87,124); DOP20 channel samples ~ (143-168,143-174,102-141). At 47.881,11.4816 the OSM channel lies ~60 m off
today's DOP20 channel (wild river; DOP pixels under the game's water are bright gravel (235,225,217)). Wikipedia: "eine der
letzten europaeischen Wildflusslandschaften"; NSG Isarauen (way 291496772).
Change: fetch way/relation natural=shingle (own gitignored cache data/areas-river.json so data/raw.json stays identical),
new AreaKind "gravel" drawn with the existing gravel texture in a muted grey-beige that is the lightest ground tone
but no lighter than today's road markings/kerbs, above grass, below water. River water tint for the Isar (waterway
width 40 + its riverbank areas): dark teal/jade (green >= blue) at the same or lower lightness as today's water, not pale
(small streams keep theirs). Channel position: where the OSM channel is > 30 m off the DOP20 channel, add a small
override file (data/isar-channel.json, traced from DOP20, credited, documented in README) instead of hand-editing raw
data; never invent a course without DOP20 evidence.
Done when:
- [ ] map.json has ~44 gravel areas (~15 ha); compare at the Isar spot (half 200): gravel banks where DOP20 has them.
- [ ] Isar water in the game screenshot has G >= B (greenish), lightness <= the old blue (+3 % max); streams unaffected.
- [ ] At 47.881,11.4816 the drawn channel lies within ~15 m of the DOP20 channel (override documented) or the offset is
      noted as an open point.
- [ ] No z-fighting gravel/water; pnpm test + typecheck green.
```

### V-4 · Ground palette: less, darker lawn; paved courtyards — Size: S — status: won't do – Alex 2026-10-25: keep dark GTA style
```
Goal: Between the blocks the ground reads like Geretsried: mottled darker gardens, paved yards and car spaces, not wall-to-
wall bright lawn.
Evidence (256 px frames, game vs DOP20): green pixel share 43-58 % vs 27-38 %, saturation ~0.5 vs ~0.23 (DOP haze lowers it,
but a ~2x gap stays). Courtyards on DOP20 at Neuer Platz/Am Stern are largely paved.
Change: lawn tint darker/less saturated (one constant in scene.ts AREA_LOOK / lawn material; target: frame green
saturation <= 0.38 at the 5 town spots); where photo.ts already samples the aerial, classify bright low-saturation
ground (no building, no road) as paving instead of lawn. Keep pitches/park as they are.
Done when:
- [ ] Before/after pairs at the 5 town spots in the PR; green share 30-45 %, saturation <= 0.38.
- [ ] Alex OK on the look (GTA 2 tone kept); pnpm test + typecheck green.
```

### V-5 · Road surface: lighter asphalt; sand-coloured Neue Mitte — Size: S — status: won't do – Alex 2026-10-25: keep dark GTA style
```
Goal: Streets read as the light grey Bavarian asphalt; Karl-Lederer-Platz + Egerlandstraße as sand-coloured asphalt with
the brook channels and 7 planting islands.
Evidence: game carriageway (61,80,76) at all 4 samples near the start; DOP20 same spots (200-216,192-204,178-192).
geretsried.de/stadtzentrum: "sandfarbenen Farbasphalt" between the two garage ramps, Bachlaeufe from the Auftaktbrunnen
(Egerlandstr./KLP) to the Rathaus, opened 28.07.2023; SZ: 7 islands (Feldahorn, Gleditschie, Kupfer-Felsenbirne,
Rot-Esche).
Change: road tint one step lighter/greyer (keep markings readable). Footway/pedestrian polygons of Karl-Lederer-Platz +
Egerlandstraße (OSM highway=pedestrian, 5 ways + 2 relations in bbox) get a sand tint. The brook channel and islands only
if the Rathaus place doesn't already draw them (check src/world/places/rathaus.ts); else skip.
Done when:
- [ ] Pair at the Rathaus spot: sand-coloured plaza, lighter streets; markings + zebras still clear at play zoom.
- [ ] Alex OK; pnpm test + typecheck green.
```

### V-6 · Parked cars on surface car parks — Size: M — status: todo
```
Goal: Car parks look used: rows of parked cars like on DOP20 (Am Stern EDEKA, start, Rathaus lots are full).
Evidence: 160 parking areas in map.json, all empty. OSM: amenity=parking 161 ways + 12 nodes; parking=surface 97,
street_side 33, underground 4 (skip), multi-storey 1 (skip).
Change: static parked-car sprites (existing car-0..7) on parking areas: fill along the long axis at 2.5 x 5 m bays,
occupancy ~60-80 % seeded per area (deterministic), not on the drive aisle (leave a 6 m strip), not on pickup spots
(src/sim/pickups.ts uses parking areas: keep those clear). Solid for collisions or skip collisions: decide by perf.
Done when:
- [ ] Am Stern pair: EDEKA lot ~3/4 full; no car on roads/buildings; pickups still reachable.
- [ ] Frame time at the start spot within 5 % of before; pnpm test + typecheck green.
```

### V-7 · Trees: more conifers in town, darker forest — Size: S — status: todo (mix needs a DOP20 count first)
```
Goal: The town keeps its "built into the Wolfratshauser Forst" look: tall dark spruce/pine between the blocks, dark
mixed woods, no star/palm-looking crowns.
Evidence: town crowns CROWNS = [0,0,0,1,2,3,6,6] (1 of 8 conifer); FOREST_TREES = [0,1,1,1,6]; tree-1 (spruce) and
tree-5 (thuja) read star/palm-like at play zoom; Isar woods read yellow-green vs dark green DOP20. Wikipedia: works
"mit Buschwerk getarnt" in the forest; the fir in the coat of arms = the conifer forest. 148 276 crowns in trees.bin.
Step 1 (reference, no code): count conifer vs broadleaf crowns on DOP20 in 4 sample squares (Neuer Platz, start,
Gartenberg, Isar wood), 50 crowns each; write the ratio into docs/work/looks-like-geretsried.md.
Step 2: set CROWNS/FOREST_TREES to that ratio; darken forest tint; make the conifer crown read round-conical (darker
centre, no long star spikes) via sprite tint/scale only (no new art without Codex).
Done when:
- [ ] Ratio from step 1 documented with the 4 squares; town mix matches it within 1 sprite slot.
- [ ] Pairs at Neuer Platz + Isar: crowns darker, nothing reads as a palm; pnpm test + typecheck green.
```

### V-8 · Railway: Industriegleis + city freight line — Size: M — status: todo
```
Goal: The old works railway shows: tracks through Gewerbegebiet Nord and Sued with level crossings and buffer stops.
Evidence: 0 rails in game; OSM railway=rail 14 ways, 5.4 km in bbox (named "Industriegleis" ways 92449865, 278787684,
278787690, 1348095243; Sued group 250762133-137, 264115244/5), 14 level_crossing, 8 buffer_stop, 10 switch.
Wikipedia: "Die Werkbahnen und Betonstrassen bestimmen noch heute das Stadtbild"; private freight line to
Wolfratshausen owned by the city. railway=proposed (S7) and abandoned: do NOT draw.
Change: fetch way["railway"="rail"] (own cache data/rail.json); draw as ballast band (gravel, 3 m) + two steel rails
(1.435 m gauge) + sleepers texture, under roads at level crossings (road drawn over), buffer stop props at the 8 nodes.
Drivable over (no collision), no trains.
Done when:
- [ ] 14 rail ways in map.json; compare at 47.8805,11.4730 and 47.8535,11.5010 shows tracks where DOP20 has them.
- [ ] Level crossings render road over rail, no z-fighting; pnpm test + typecheck green.
```

### V-9 · Hedges, fences and walls — Size: M — status: todo
```
Goal: Gardens and lots get their edges: dark green hedges, fences, walls.
Evidence: OSM barrier=hedge 47 ways 1.65 km, fence 35 ways 7.9 km, wall 19 ways 1.96 km, retaining_wall 3 (0.1 km); DOP20
Gartenberg/start show many more hedge lines than OSM has (OSM only, no tracing).
Change: fetch way["barrier"~"^(hedge|fence|wall|retaining_wall)$"] (own cache). Hedge: 1.0 m wide, 1.6 m high dark green
box with leaf texture; fence: thin 1.2 m see-through line (no top fill); wall: 0.3 m x 1.5 m mid/dark grey from the existing palette. Solid for player
and cars (like buildings) except where a highway crosses (gap 4 m). Never on a Place footprint.
Done when:
- [ ] 101 barrier ways in map.json; pairs at start + Gartenberg show them; nothing blocks a road or a Place door.
- [ ] pnpm test (invariant: no barrier segment intersects a road polygon) + typecheck green.
```

### V-10 · Land cover: scrub, wetland, grassland, cemetery, allotments, construction, farmyard — Size: M — status: todo
```
Goal: The edges of town look Upper-Bavarian: scrub, moor meadows, the forest cemetery with graves, allotment gardens.
Evidence: not imported: natural=scrub 63 (38.9 ha), wetland 28 (66.1 ha, e.g. Babenstubener Moore), grassland 58
(9.7 ha); landuse=construction 13 (7.4 ha), allotments 1 (4.1 ha), quarry 1. landuse=cemetery -> "grass" (Waldfriedhof
8.1 ha, way 104959902, renders as empty lawn); farmyard 19 (17.3 ha) -> "farmland" (field texture on yards).
Change: fetch natural scrub|wetland|grassland (own cache); new kinds: scrub (bush sprites tree-4/7 dense on rough grass),
wetland (darker olive grass, small dark water specks), cemetery (paths grid + grave stones props under existing
crowns), allotments (small plots + sheds already in buildings), construction (dark bare earth). All new tints from the
existing dark palette, none lighter than today's grass. farmyard -> paving, not farmland.
grassland -> grass.
Done when:
- [ ] Area counts as above in map.json; compare at Waldfriedhof (47.8627,11.4831) shows grave rows, not lawn.
- [ ] Scrub/wetland visible at the Isar/Babenstuben edges; frame lightness there <= before (+3 % max).
- [ ] pnpm test + typecheck green.
```

### V-11 · Street furniture: benches, bins, recycling islands, bike racks — Size: M — status: implemented (2026-10-26; partial: OSM maps no furniture within 300 m of Neuer Platz, so that pair shows no change; the Wertstoffhof node and one covered rack lie inside buildings and are left out; the 8 unlabelled container ways in the Wertstoffhof yard draw as glass/paper/cans rows; see "V-11 as built")
```
Goal: Streets and plazas get the small stuff players notice: benches, bins, the Wertstoffinseln, bike racks.
Evidence: props today = 92 bus_stop + 7 glass (only recycling:glass_bottles=yes). OSM: bench 166, waste_basket 80,
recycling 62 (50 nodes + 12 ways), bicycle_parking 26, shelter 6, drinking_water 1. Street lamps are tagged once only:
don't derive from OSM.
Change: EXTRA_QUERY adds these nodes (ways: centroid); props kinds bench, bin, recycling (reuse glass sprite as a row of
3 containers: glass/paper/can), bike_rack (bike-rack.webp exists). Snap to the nearest footway edge, face the path.
Reference (Alex 2026-10-26): reference/wohnblock-koenigsberger-weg/41 — a grey perforated-metal bin/bike shed with 3–4
green 1100 L bins and a red-white bollard on a block footpath (docs/places/wohnblock-koenigsberger-weg.md).
Done when:
- [x] props counts ~ bench 166, bin 80, recycling 62, bike_rack 26; none inside a building or on a carriageway.
- [ ] Pairs at Rathaus + Neuer Platz show them; pnpm test + typecheck green. (Rathaus yes; Neuer Platz has none in OSM.)
```

**V-11 as built** (`scripts/import-osm.ts`, `src/map/{types,build}.ts`, new `src/world/furniture.ts`, rendering in
`src/render/scene/{street,scene,mesh}.ts`, sprites via `scripts/process-sprites.py`; tests `src/world/furniture.test.ts`):
- **Fetch:** its own query and gitignored cache, `FURNITURE_QUERY` → `data/furniture.json`
  (`nwr[amenity~bench|waste_basket|recycling|bicycle_parking]`, `out center`; main server, OSM base 2026-10-26).
  EXTRA_QUERY and `data/extra.json` are unchanged; its 7 glass banks are dropped from the new cache by type/id. The new
  props come after every older one. POIs, areas, buildings, roads, `ground.png` and `trees.bin` are byte-identical,
  and so are the bus stops. Two `pnpm map` runs give the same json.
- **Props** (`Prop.kind` bench | bin | recycling | bike_rack; the old `glass` kind became `recycling`). On the map:
  **bench 166, bin 80, recycling 61, bike_rack 28** (26 nodes and 2 ways; bus_stop 92 unchanged). The 62nd recycling
  point, Ehgartner GmbH (way 128266486), is a firm's building (`recycling_type=centre` with `building=yes`). The
  importer prints it as skipped. A recycling point's `holds` comes from its recycling:* tags. Glass becomes three
  bottle banks (white/green/brown), then paper, cans, clothes, and `green` (green_waste: the 35 Stadt Geretsried bins
  on the Friedhof). With no material tagged, it is the backlog's glass/paper/cans row. Bike racks keep `covered` and
  `capacity`: one rack per 6 bikes, at most 4.
- **Placement** (`placeFurniture`, pure, at load, never solid like the bus shelters): each piece snaps to the nearest
  path edge within `SNAP_M` = 10 m and faces the path. That edge is a footway's or track's side, beside a service
  road, or a street's sidewalk back: outside it, or for small things just inside it. It slides ±4 m along the edge,
  then tries the far side and the next 2 paths. Else it takes its OSM spot or the nearest free spot within 8 m. Every
  spot has to be clear of buildings, water, carriageways (class width + 0.3 m kerb, plus the street profiles' lanes and
  parking), footways, the shelters with their bins, signal poles, lamps, the places' own sprites and pylons, and the
  furniture placed before it. Props inside a ground-dressed area (the Breslauer Weg playground) are left to it.
  **Placed in game: bench 166, bin 80, recycling 60, bike_rack 27.** Left out: the Wertstoffhof node (6 containers,
  inside its building) and covered rack node 4902742912 (inside an industrial building). Moved: median 0.8 m, max
  14.1 m. A test samples 9 points of every footprint: none is in a building, in water or on a carriageway.
- **Look:** bench = `spielplatz-bench`, bin = `spielplatz-bin` on a post, glass = `prop-glass` (three tones). Paper and
  cans are `prop-glass` hue-turned (`Mode.hue`) to blue and orange-yellow. Bike racks are `bike-rack.webp`, the bikes
  pointing away from the path. A covered rack gets a flat grey (#434648, the perforated sheds of reference 41) roof on
  4 posts at 2.2 m. Two new Codex sprites, darkened for the palette: `bin-1100` (the green 1100 L bin of reference
  41, for green_waste) and `clothes-container`.
- **Pairs** (game before/after, furniture off vs on): Rathaus `?compare=47.8746,11.4655,120`, and at half 40 the bins on
  posts and the bike rack by the Rathaus corner show. Frame lightness −0.03 % / −0.04 %. Neuer Platz is identical (no
  OSM furniture within 300 m). The Wertstoffinsel at 3037.7, 2528.8 shows its green/blue/yellow row. Several rows
  (the start-area glass bank, the Friedhof bins) stand under tree crowns and show only in-game when the crown fades.
- **Checks:** `pnpm check` (347 tests) and `pnpm build` pass.

### V-12 · High-voltage lines — Size: S — status: todo
```
Goal: The power lines across the forest show from above: pylons and wires (and their cleared strips are already in the
aerial-derived crowns' gaps).
Evidence: OSM power=line 5 ways, 14.0 km in bbox ("Kochel - Foehrenwald", "Geretsried - Schoenmuehl", "Foehrenwald -
Hoellriegelskreuth", ...), minor_line 3 (1.9 km), power=tower 54, substations 21.
Change: fetch way power=line|minor_line + node power=tower (own cache). Pylon = lattice prop (square 6-8 m base) at tower
nodes; 3 thin dark wires between consecutive towers drawn at height with shadow. No collision for wires; pylons solid.
Done when:
- [ ] 54 pylons placed at OSM towers; wires follow the 5 lines; compare at a crossing spot shows pylons on DOP20 spots.
- [ ] pnpm test + typecheck green.
```

### V-13 · Landmarks of the town's history (references first) — Size: M — status: todo (needs reference)
```
Goal: The places that make Geretsried Geretsried: the 1722 Nikolauskapelle, the bunkers of the explosives works, the
Kunstmeile figures, the Rathaus brook.
List (coords/ids in docs/work/looks-like-geretsried.md, "Zusaetzliche Wahrzeichen", L1-L23): Nikolauskapelle
(way 822460728, octagon + onion tower, Denkmal D-1-73-126-1), Kohlebunker Isardamm 20 (Lechner, Denkmal D-1-73-126-24),
Blauer Bunker (node 466518495), Versoehnungskirche Richard-Wagner-Str. 3 (hexagon modules, D-1-73-126-25, ~210 m from
start), Gorilla (node 11089456182), Wassertraegerinnen + brook (node 8123619978), Dialog, Stele Stadt Geretsried,
Waldfriedhof memorials, Loeschkette fountain, Schloss Ascholding, St. Anna, DITIB, Badehaus.
Step 1 (scout, no code): Street View / photos per landmark into reference/<slug>/ (dark-mode contact sheet), LoD2 heights
from the tile, then a B-item per landmark in the usual Place format.
Done when:
- [ ] Each landmark has reference photos or is marked "needs reference"; one B-item each; no look invented.
```

## Feels like GTA 2 (F-items, added 2026-10-26)

Source: PC Games Retro "GTA 2 | RETRO | Eine Stadt voller Schmutz" (https://www.youtube.com/watch?v=U3AJUDceBi4, 21 min,
~15 min of gameplay), read frame by frame (one every 10 s) plus the transcript. Our game: `pnpm dev`, start spot, EDEKA and
Rathaus, 1280×800, 2026-10-26. Side-by-side shots (GTA 2 left, ours right) in `reference/gta2-feel/` (gitignored, local only).
Alex 2026-10-26: "our goal is that our game feels more like GTA 2 but in Geretsried".

**What already matches GTA 2 (don't touch):** HUD layout (respect meters top left, money + hearts + multiplier + weapon top
right, cop heads top centre), district names on entry, busted/wasted, wanted levels with police on foot from 2 heads, Jesus
Saves, spray shops, payphone jobs, gang respect, chain-reaction explosions, camera scale (a car is ~1/9 of the screen
height in both games).

**What does not, ranked by payoff per hour.** The town is built; the gap is *life on screen* and *feedback*, not buildings.

### F-1 · Camera: wider lens so walls lean like GTA 2 — Size: S (~30 min) — status: todo
**Goal:** in GTA 2 every building shows tall walls towards the screen edge; that parallax *is* the GTA 2 look. Ours shows
almost only roofs, so the town reads like a map.
**Reference:** `reference/gta2-feel/1-camera-walls.jpg` (left: the high-rise wall fills ~1/5 of the screen width;
right: our 3-storey blocks show a thin strip of wall).
**Spec:** `src/render/camera.ts`: `FOV` 26° → 45°, keep `ON_FOOT_HALF` / `CAR_HALF` / `MAX_HALF` so the ground area stays
the same (`heightFor` already derives height from FOCAL). A 9 m building at the edge then leans ~5 m instead of ~2 m.
Raise `NEAR` if close roofs clip. Update the README camera paragraph ("about 2.5 m").
**Acceptance criteria:**
- [ ] Same spot, before/after at start + Neuer Platz: walls of 3+ storey blocks visible on all four screen edges
- [ ] Ground coverage unchanged (a car is still ~1/9 of the screen height); no roof clipping at top speed
- [ ] `src/render/camera.test.ts` updated; `pnpm check` green

### F-2 · Density: always a crowd and traffic in view — Size: M (~half a day) — status: todo
**Goal:** GTA 2 never shows an empty street: 8–15 pedestrians and 3–6 moving cars on every screen, people in groups on
the pavement. That is what makes running people over, chases and gunfights happen by themselves.
**Reference:** `reference/gta2-feel/2-density.jpg` (left: 14 people on one pavement; right: EDEKA, nobody),
`reference/gta2-feel/3-palette.jpg`. Measured 2026-10-26 at EDEKA via `__gta.game`: 120 walkers and 105 traffic cars for the
whole town, **2 walkers and 0 cars within 30 m** of the player.
**Spec:** GTA 2 keeps people and cars only near the camera. Spawn walkers and traffic in a ring just outside the view
(1.2–2× the view half) and despawn what falls behind (> 2.5×), keeping targets around the player: ~40 walkers, ~18 moving
cars (scale with the view, so it rises when the car camera opens up). More walkers on shop streets (POIs within 50 m), fewer in
Wohngebiete. Keep the town-wide totals as the cap for performance. Parked cars stay as they are.
**Acceptance criteria:**
- [ ] 10 random teleports (`__gta.teleport`) to shop streets: ≥ 8 walkers and ≥ 3 moving cars in view in at least 8 of 10
- [ ] Frame time at the start spot not worse than +2 ms; traffic tests (`traffic.test.ts`, signals) still green
- [ ] Busting/wasting/police still spawn correctly (existing tests)

### F-3 · Score popups: big numbers where money is made — Size: S (~1 h) — status: todo
**Goal:** GTA 2 rewards every hit with a huge outlined number at the spot ("300", "1000", "600 → 1200" for the multiplier).
Ours adds money top right only, so near misses, drifts and kills feel like nothing happened.
**Reference:** `reference/gta2-feel/6-feedback.jpg` (left: "300" over a blown-up police car; right: the only big text we have is
BUSTED), `reference/gta2-feel/gta2-kill-frenzy.jpg` ("30" counting down across the screen).
**Spec:** on every award from `src/sim/score.ts` (and kills, wrecks, job pay), a popup at the world point: chunky italic digits,
~72 px, dark outline, rises ~1 m and fades over 1.2 s, colour by multiplier (×1 white, ×2 yellow, ×3 orange, ×4 red). Drawn in
the 2D overlay (`src/render/overlay.ts`) with `project()`. Stack, don't overlap: offset later ones upward.
**Acceptance criteria:**
- [ ] Near miss, drift, kill and car wreck each show a number at the right spot, readable while driving at top speed
- [ ] Multiplier visible in colour; popups never cover the player sprite for more than 0.3 s
- [ ] Unit test for the popup list (spawn, age, removal); `pnpm check` green

### F-4 · Street paint and overhead wires — Size: M (~half a day) — status: todo
**Goal:** GTA 2 streets are busy to look at: a solid line along every kerb, painted words before each junction ("SLOW"), wide
zebras, and power/phone wires crossing the screen high up that move with parallax. Ours: plain asphalt with a dashed centre
and edge lines only on main roads.
**Reference:** `reference/gta2-feel/5-street-dressing.jpg` (left: SLOW, zebras on all four arms, wires over the junction; right:
Rathaus, plain asphalt), `reference/gta2-feel/gta2-junction.jpg`, `reference/gta2-feel/gta2-dusk-wires.jpg`.
**Spec (stay German, real Geretsried):**
- solid white edge line on every street, not only main roads (`src/render/scene/street.ts`)
- painted words on approaches, white, ~5 m long, read from the driver's side: "STOP" before stop signs, "BUS" at bus stops,
  "30" at Tempo-30 zones (OSM `maxspeed=30`), "LANGSAM" before school zones
- overhead wires: 2–3 dark lines between street-lamp poles across junctions and along residential streets at 7–9 m, drawn
  as thin 3D lines so they slide against the ground when the camera moves (link V-12 for the real high-voltage lines)
**Acceptance criteria:**
- [ ] Start spot, Neuer Platz, Rathaus: every street has edge lines; at least one painted word per signalled junction
- [ ] Wires show visible parallax while driving; never cover HUD text
- [ ] Street tests green; no z-fighting with stop lines and zebras

### F-5 · Retro pixel look (grit without brightening) — Size: S (~1–2 h) — status: todo
**Goal:** GTA 2 is chunky 640×480 pixels with dirty, noisy textures; ours is smooth and clean like a modern map, so it looks
"too nice". Alex 2026-10-25 rule stays: **no brighter, no desaturated look**; this item only adds pixels and grime.
**Reference:** `reference/gta2-feel/3-palette.jpg` (left: grimy pavement tiles, fence, stained asphalt; right: clean, smooth),
`reference/gta2-feel/1-camera-walls.jpg`.
**Spec:** render the 3D scene into a framebuffer at 1/2 the canvas size (CSS pixels, so ~640 px high on a laptop) and upscale with
NEAREST; HUD stays sharp at full resolution. `?retro=0` turns it off. Add a grime decal layer: oil stains in lanes, cracks
and dark patches at kerbs and junctions, tyre marks that stay where a car drifts or brakes hard (GTA 2 shows black skid marks
in `gta2-junction.jpg`; we have none).
**Acceptance criteria:**
- [ ] Pixels visibly chunky; text in signs still readable at the play camera
- [ ] Average frame lightness at the six V-spots within ±3 % of before (the V rule)
- [ ] Skid marks appear on handbrake turns and fade after ~30 s; FPS not lower than before

### Later (after F-1…F-5)
- **F-6 · Dusk mode** (M): GTA 2 PC had a day/dusk switch; dusk looks "dirtier, neon-soaked, more dangerous" (video 05:45).
  Darker ambient, lamp light pools (we already have lamps every 38 m), car headlights, shop signs glowing.
  Reference: `reference/gta2-feel/4-dusk.jpg`, `gta2-dusk-wires.jpg`.
- **F-7 · Mission talk** (S): the boss's face bottom left with typewriter text, keywords in colour; car names in the yellow
  "tape" banner at the top (SHARK, FURORE GT). Ours is a plain yellow box. Reference: `reference/gta2-feel/7-mission-text.jpg`.
- **F-8 · Kill frenzies** (M): hidden icon starts a timed challenge ("Töte 40 Leute in 120 Sekunden", "30 Leute auf der
  Strecke! Multiplikator ×2"), big centre text, counter on screen. Needs F-2 first.
- **F-9 · Minimap off by default** (S): GTA 2 has no minimap, only the arrow. Our aerial-photo minimap pulls the eye off the
  street. Decide: hide (Tab shows it) or keep. **Needs Alex.**
- **Decision for Alex:** GTA 2's palette is greyer and less saturated than ours (terracotta roofs, bright lawns). The
  2026-10-25 rule forbids desaturating. Keep the rule, or allow a GTA 2 grade?

## Priority list (all 234 POIs)

> V items (Looks like Geretsried, above): approved by Alex 2026-10-25 — keep the dark GTA style; V-4 and V-5 won't do.

Order: P1 batch → gameplay places → landmarks/anchors → services → food → generic shops. Within a tier, nearest to the start (Sudetenstraße 19) first. Duplicate names are separate OSM objects; `#` = row id in `pois.csv`.

### P1 — Batch 1 (scouted; prompts above: B1-1…B1-5) ⭐ · batch 2 = the ref-done rows in P2 (prompts B2-1…B2-5) · batch 3 = Am Stern (B3-0…B3-7), rows in P3–P6 · batch 4 = Am Stern small shops (B4-1…B4-11) · batch 5 = job places (B5-1…B5-6), rows in P2 · batch 6a = start area nearest 10 (B6a-1…B6a-10) · batch 6b = start area next 8 (B6b-1…B6b-8, massing only) · batch 6d = start area 318–821 m (B6d-1…B6d-16; 12–16 wait for I-1/I-2)
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
| 181 | Gasthof Geiger | food | 2844.9, 4388 | 47.860538, 11.468142 | 1182 | implemented (partial) | B5-1. Tattenkofener Str. 1. "weisswurst" dropoff (Rathaus job, not a gang job). Roof should be red-brown tile |
| 187 | Polizeiinspektion Geretsried | police | 4772.3, 5626.6 | 47.849399, 11.493982 | 1248 | implemented (partial) | B2-5. Jeschkenstraße 31; POI correct. ⚠ "stein-1" taxi drop-off likely unreachable (no car pose within 9 m): verify in game |
| 231 | Petruskirche | church | 2883.8, 2925.2 | 47.873693, 11.468663 | 2052 | implemented (partial) | B5-2. Egerlandstraße 39. Save point; bell tower = way 188048958 (engine 2 levels, too low). Mosaic/portal need reference |
| 46 | Bäckerei Mühlenbäck | bakery | 2849.3, 2775.7 | 47.875038, 11.468201 | 2196 | todo | B5-3. needs reference (satellite only). "brezn" pickup (home phone) |
| 219 | Metzgerei Länger | shop | 2659, 2499.5 | 47.877521, 11.465649 | 2531 | implemented (partial) | B5-4. Amselweg 9. "weisswurst" pickup (Rathaus job, not a gang job) |
| 195 | Orterer Getränkemarkt | shop | 2306.5, 2063.1 | 47.881446, 11.460923 | 3089 | implemented (partial) | B5-5. Banater Str. 3. "gelting-1" pickup; ⚠ point 14 m inside the hall (STOP_REACH 9): likely unreachable. Engine roof flat/2 lv wrong (1 storey, pitched + solar) |
| 180 | Kaufland | supermarket | 2244.3, 1880.5 | 47.883088, 11.460089 | 3276 | implemented (partial: which wall 02 shows, band sizes, the car-park band, the roof board, solar extent, one pitch per roof and colours are guesses) | B5-6. Bayerwaldstraße 2. "kaufland" destroy-BMW (Rathaus job, not a gang job); entrance needs reference |
| 220 | Huber GmbH, Karosserie-Lack-Center | car_repair | 2353.1, 1757.6 | 47.884194, 11.461548 | 3326 | todo | spray shop |
| 89 | Auto Stapf | car_repair | 234.3, 1574.7 | 47.885838, 11.433141 | 4859 | todo | spray shop |
| 211 | Biometzgerei Pichler Großhandel | shop | 240.9, 1498.7 | 47.886522, 11.43323 | 4902 | todo | gang job drop |

### P3 — landmarks & big anchors (nearest to start first)
| # | Name | Kind | x, y (m) | lat, lon | m from start | Status | Note |
|---|---|---|---|---|---|---|---|
| 13 | VR-Bank | bank | 3957.8, 4620.3 | 47.858449, 11.483062 | 49 | implemented (partial) | B6a-5. Sudetenstraße 11, sign "VR Bank München Land" |
| 82 | Denns BioMarkt | supermarket | 4208, 4747.7 | 47.857303, 11.486417 | 233 | implemented (partial) | B3-2; NW unit of the west block; node vs sign ≈ 27 m apart, door needs reference |
| 228 | Karl-Lederer-Grundschule Geretsried | school | 3800.4, 4825.3 | 47.856605, 11.480952 | 265 | todo (needs facade reference) | B6b-2. Relation building missing in-game (I-1 step 7); LoD2 ~10 m |
| 186 | Karl-Lederer-Hauptschule Geretsried | school | 3740.9, 4830.9 | 47.856555, 11.480154 | 315 | ref-done (partial) | B6b-4. Now Karl-Lederer-Mittelschule; merger by 2029–2031 (name kept); LoD2 ~13 m |
| 204 | EDEKA | supermarket | 4429.1, 4804.1 | 47.856796, 11.489381 | 459 | implemented (partial) | B3-1; EDEKA Heininger & Dietz, Breslauer Weg 113; flat hall, yellow band, porthole upper wall |
| 234 | Aussegnungshalle | church | 3894.5, 4149.6 | 47.862682, 11.482214 | 509 | ref-done (partial) | B6c-5. Roof orange + PV (#e19f6b); mono-pitch not modelled; bell tower outside footprint |
| 189 | Franz-Marc-Schule | school | 3315.3, 4811.1 | 47.856733, 11.474448 | 702 | ref-done (partial) | B6d-6. No SV; web photo: 2-storey flat block; massing ok |
| 233 | Christuskirche | church | 4193.1, 5389.8 | 47.851528, 11.486217 | 767 | ref-done (partial) | B6d-10. Baptist church; roof colour; turret needs reference |
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
| 67 | Ahorn Apotheke | pharmacy | 4276.7, 4823.1 | 47.856625, 11.487338 | 329 | implemented (partial) | B3-6; W corner of the Penny block, red A, pylon |
| 18 | Isar-Apotheke | pharmacy | 3683.2, 4864 | 47.856257, 11.479381 | 382 | ref-done | B6c-2. J.-S.-Bach-Str. 13a; block → levels 4 |
| 121 | Dr. Schmucker | doctor | 3685.7, 4874.6 | 47.856162, 11.479414 | 386 | todo (needs reference) | B6c-2 (height only). Sign illegible; findHospital respawn point |
| 5 | Bäckerei Backhupferl | bakery | 4408.8, 4798.6 | 47.856845, 11.489109 | 438 | todo | needs reference: counter inside EDEKA, no photo (B4-9) |
| 98 | Arztpraxis Lewke | doctor | 3695.3, 4056.5 | 47.863519, 11.479543 | 664 | implemented | B6d-3. "Arzt-Praxis" board |
| 106 | Bäckerei Manfred Burger | bakery | 4384.4, 5254.9 | 47.852742, 11.488782 | 720 | ref-done | B6d-7. 2 storeys, pitched (LoD2 "flat" is wrong) |
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
| 12 | HoangAnh | food | 3992.7, 4644.1 | 47.858235, 11.48353 | 6 | ref-done (partial) | B6a-2. Sudetenstraße 17. Web photos: gold "HOÀNG ANH" letters, NEUERÖFFNUNG; Deliqos was the 2022 SV state |
| 47 | Dolce Gelato | food | 3980.5, 4636.4 | 47.858304, 11.483367 | 21 | implemented (partial) | B6a-3. Sudetenstraße 15 |
| 120 | Bistro Malor | food | 3929.9, 4632.5 | 47.858339, 11.482688 | 70 | implemented (partial) | B6a-7. Sudetenstraße 10, terrace by the KIND corner; facade sign needs reference |
| 177 | Gaststätte Isarwinkel | food | 3890.5, 4793.3 | 47.856893, 11.48216 | 181 | implemented (partial) | B6a-10. Richard-Wagner-Straße 14 (not Sudetenstraße); pole brewery logo needs reference |
| 77 | da Daniele | food | 4280.4, 4816.7 | 47.856682, 11.487388 | 329 | implemented (partial) | B3-7; crimson fascia; terrace not seen (needs reference) |
| 58 | Restaurant Ammos | food | 3655.2, 4645.4 | 47.858223, 11.479005 | 343 | ref-done (partial) | B6b-6. Neuer Platz 9; roof #858d7e; gold Ammos board, PAULANER band, picket-fence terrace (web) |
| 57 | Munzur Kebap | food | 3607.4, 4689.2 | 47.857829, 11.478365 | 393 | ref-done (partial) | B6c-1. Munzur Kebap & Imbiss, Neuer Platz 3; same footprint as #160 |
| 19 | Italy | food | 3545.7, 4770.4 | 47.857099, 11.477537 | 468 | ref-done (partial) | B6c-4. "Italy da Umile"; massing only, signage needs reference |
| 79 | Piatsa | food | 4646.3, 4763.3 | 47.857163, 11.492293 | 659 | ref-done (partial) | B6d-2. 1 storey; sign illegible |
| 128 | Fitness Forum & Squash | food | 4677.2, 4528.4 | 47.859275, 11.492707 | 690 | ref-done (partial) | B6d-5 (massing ok). WRONG KIND: is a gym (Breslauer Weg 103); food only because OSM node 9955217554 is amenity=pub. Fix in I-1 |
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
| 154 | Angel Nails | shop | 4000.2, 4648.4 | 47.858196, 11.483631 | 2 | implemented (partial) | B6a-1. Sudetenstraße 19, NW-adjacent to Mühlenbäck (3 m from the spawn) |
| 155 | Stroblume | shop | 3973.7, 4631.2 | 47.858351, 11.483276 | 29 | implemented (partial) | B6a-4. Sudetenstraße 15 |
| 115 | Optik Kind Geretsried-Zentrum II | shop | 3944.9, 4641.7 | 47.858256, 11.482889 | 53 | implemented (partial) | B6a-6. Sudetenstraße 10, sign "KIND" |
| 178 | Audi;Seat;Škoda;Volkswagen | shop | 4071.5, 4676.3 | 47.857945, 11.484587 | 79 | implemented (partial) | B6a-8. = Autohaus Billion, Sudetenstraße 25 (POI shows the OSM brand list). Ask Alex about the name |
| 170 | Spielwaren Krömer | shop | 4094.6, 4741.4 | 47.85736, 11.484897 | 134 | implemented (partial) | B4-8 |
| 11 | Quelle | shop | 3919.9, 4780.6 | 47.857007, 11.482554 | 154 | todo (needs reference; probably closed) | B6a-9. Quelle-Agentur, Beethovenweg 2 (directory listing); probably closed. Ask Alex: drop? |
| 166 | Woolworth | shop | 4138.3, 4716.7 | 47.857582, 11.485482 | 156 | implemented (partial) | B4-2 |
| 169 | Sun Style Bodystyling Studio | shop | 4125.7, 4764.7 | 47.85715, 11.485313 | 173 | implemented (partial) | B4-7 |
| 114 | Nexial | shop | 4159, 4743.5 | 47.857341, 11.48576 | 187 | implemented (partial) | B4-6, inside B3-0; OSM shop tag wrong (IT services) |
| 116 | GG-Radsport | shop | 4174.6, 4715.9 | 47.857589, 11.485969 | 189 | implemented (partial) | B4-4, inside B3-0 |
| 157 | Aphrodite-aestetic | shop | 4170, 4726.8 | 47.857491, 11.485907 | 189 | implemented (partial) | B4-5, inside B3-0 |
| 15 | TEDi | shop | 4151.2, 4783.6 | 47.85698, 11.485655 | 205 | implemented (partial) | B4-1 |
| 80 | Orterer Getränkemarkt | shop | 4184.1, 4765.8 | 47.85714, 11.486096 | 220 | implemented (partial) | B3-5; S corner + arcade; not the job's Orterer (#195) |
| 81 | Takko Fashion | shop | 4195.3, 4751.3 | 47.857271, 11.486247 | 223 | implemented (partial) | B3-4; middle unit of the west block |
| 138 | miwomo | shop | 4126.5, 4435.7 | 47.860109, 11.485324 | 248 | todo (needs facade reference) | B6b-1. Breslauer Weg 9; rental closes end 2026, THOMA Reisemobile stays (name kept, Alex 2026-10-25) |
| 134 | B&L Hairstyling | shop | 4196.7, 4804.3 | 47.856794, 11.486265 | 253 | implemented (partial) | B4-3 |
| 54 | Haar Genau Friseurteam | shop | 3734.1, 4574 | 47.858865, 11.480063 | 274 | ref-done (partial) | B6b-3. C.-M.-v.-Weber-Weg 34; LoD2 16.2 m → levels 5 |
| 159 | Bellini | shop | 3668.4, 4674.7 | 47.857959, 11.479182 | 331 | ref-done (partial) | B6b-5. Hair & Style Bellini, Neuer Platz 22 (not Ammos); LoD2 → masses (4 storeys); rename to "Hair & Style Bellini" |
| 152 | Flamingo Damenmode | shop | 4258.4, 4867.9 | 47.856222, 11.487093 | 341 | todo | needs reference: no photo (B4-10) |
| 158 | Fellomenal Hundesalon | shop | 4252.8, 4876.4 | 47.856145, 11.487017 | 342 | todo | needs reference; probably moved to Deisenhofen (B4-11) |
| 161 | Pia's Hair & Beauty | shop | 3756.8, 4910.1 | 47.855842, 11.480368 | 356 | todo (needs facade reference) | B6b-7. J.-S.-Bach-Str. 11a; massing already right |
| 16 | Ana’s Waschservice | shop | 3638.9, 4610.8 | 47.858534, 11.478787 | 361 | ref-done (partial) | B6b-8. Händelstraße 2; name kept, ZER-O-WASH possible successor; LoD2 20.4 m → levels 7 |
| 160 | Feinkost Christos | shop | 3621, 4676.6 | 47.857942, 11.478547 | 378 | ref-done (partial) | B6c-1. Window sign "Feinkost Christos" (web: Olive Feinkost), Neuer Platz 7; engine roof pitched → flat |
| 73 | BRK KleiderMarkt | shop | 3691.5, 4872.7 | 47.856179, 11.479492 | 380 | ref-done | B6c-2. J.-S.-Bach-Str. 13, SE end of the block |
| 17 | Juchheim Cosmetics | shop | 3582.7, 4710.5 | 47.857637, 11.478033 | 420 | ref-done (partial) | B6c-3. Massing only; web shows "Isar Nails und Beauty" → sign check |
| 97 | Zirngibl Bestattungen GmbH | shop | 3524.7, 4750.8 | 47.857275, 11.477256 | 484 | todo (needs facade reference) | B6c-4 (height only). OSM operator unverified |
| 218 | Carglass | car_repair | 4444.2, 4972.1 | 47.855285, 11.489584 | 552 | implemented (partial) | B6d-1. Address Sudetenstraße 50 (OSM has none); red kiosk, 1 level |
| 26 | KFZ-Meisterbetrieb Gerd Matheis | car_repair | 4268.3, 5270 | 47.852606, 11.487225 | 678 | todo | B6d-4 massing only; needs reference (no SV); address Spreestraße 11 checked, no conflict |
| 59 | Schreibwaren Schröter | shop | 3655.5, 4007.1 | 47.863963, 11.479009 | 727 | implemented (partial) | B6d-8. 3-storey block + red shop wing, masses |
| 217 | Occasione Mode & Lifestyle | shop | 3644.3, 3986.2 | 47.864151, 11.478859 | 750 | implemented | B6d-9. Name fixed from OSM's "Livestyle" (signs + web) |
| 78 | BSZ Direktmarketing GmbH | shop | 4744.3, 4883.4 | 47.856083, 11.493607 | 783 | ref-done (partial) | B6d-11. Roof → gable + PV; B2B firm (BSZ GmbH), not a shop |
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
