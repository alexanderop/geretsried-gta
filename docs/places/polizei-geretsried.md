# Polizeiinspektion Geretsried (Jeschkenstraße 31) — `polizei-geretsried`

| Field | Value |
|---|---|
| POI | #187 "Polizeiinspektion Geretsried", kind `police` |
| Map x, y | 4772.3, 5626.6 m (1248 m from start) |
| lat, lon | 47.849399, 11.493982 |
| Official | Polizeiinspektion Geretsried, **Jeschkenstraße 31**, 82538 Geretsried (BayernPortal, polizei.bayern.de); open 24/7 (OSM) |
| OSM building | way **127717998**: amenity=police, name "Polizeiinspektion Geretsried", **addr Jeschkenstraße 31**. Rectangle **31.8 × 16.7 m**, long axis N–S (179°/359°), 530 m² |
| Engine | levels **2** (default); **flat**; DOP roof `#8e9086` (grey) |
| Street frame | **Jeschkenstraße** (tertiary, 8 m), N of the building: closest point (4783.6, 5573.7), 54 m; street bearing 104°, n bearing 192°. Service lanes run along both long sides (E lane 4 m at 11.2 m; W footway at 11.4 m) |
| Status | **ref-done (partial)**: entrance side "likely W", see below |

## Coordinate check (the "no. 22 / Fahrzeugzentrum" worry)
- The game POI (4772.3, 5626.6) lies **inside** way 127717998, which OSM tags as the police station at Jeschkenstraße 31. Nominatim for "Jeschkenstraße 31, Geretsried" returns the same way (centroid map 4772.2, 5622.7: 3.9 m away).
- In 04, Google's own "Polizeiinspektion Geretsried" pin sits on the **solar-panel building** that matches this footprint (N–S rectangle between two lanes, narrow building strip 191451341 to the E, big hall further E).
- **Verdict: the game coordinate and building are correct.** The "no. 22 / Fahrzeugzentrum" label comes from Google snapping the pin/Street View link to an address, not from the map data. No change needed.

## Images
| File | What | Source |
|---|---|---|
| reference/polizei-geretsried/05-web-dienstgebaeude.jpg | **Key**: the whole station, gable + long side, entrance stairs/ramp with canopy, POLIZEI sign, roof | Bayerische Polizei official page (© Bayerische Polizei, date not stated) |
| reference/polizei-geretsried/01-street-front.png | N gable through trees, car park, blue PARKPLATZ sign | Street View, **Sep 2023** |
| reference/polizei-geretsried/02-street-side.png | Car park entry, signs, trees | same |
| reference/polizei-geretsried/03-street-other.png | Paved path, white building | same |
| reference/polizei-geretsried/04-satellite.png | Roof fully covered by **solar panels** | Google Maps satellite, aerial only |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Walls | smooth **white render**, 2 full storeys + a low basement with small windows; flat pilaster strips at the gable corners and either side of the window column | sunlit `#f3f3f0`; gable in shade `#7d8ca5` |
| Plinth | grey render band ~1 m | `#606674` (shade) |
| Windows | **tall** white-framed windows with small-pane grids on the gable (2 stacked, centre); a regular row of tall windows on the long side | — |
| Roof | low roof under a large **dark solar canopy** overhanging all sides on **steel brackets**; from above fully covered by panels (04) | underside `#0e0e12`; panels from above `#464c5d` |
| Signs | small blue square **POLIZEI** sign with the star next to the house number on the gable (05); blue POLIZEI + PARKPLATZ street signs at the car-park entry (01/02) | blue `#203171` |
| Entrance | on the **long side**: concrete stairs + ramp with steel railings, under a flat metal canopy on posts, near the far end (05) | — |
| Grounds | lawn, bike stands, block-paved path, fence/wall around | — |
| Which long side has the entrance | **likely W** (05 shows a path + trees and no neighbour; the E side has the strip building 191451341 only 5.7 m away) → **verify** | — |

## Engine terms
- **Keep** footprint 127717998 and levels 2. Roof: engine flat grey `#8e9086` (DOP predates the panels or sees them as grey). For the top-down read, a **dark solar-panel roof texture** (`#464c5d`) matches 04: per-building roof override via #0b (ask first: needs a panel texture or just the colour).
- facade.ts: `police` is deliberately not a shop front; 530 m² < 800 and 2 levels → the engine draws the **"house"** (Bavarian house) facade. A white-render tint `#f3f3f0` with tall windows would be closer; ask whether to add a `civic`-style facade or just a tint.
- Entrance stairs + canopy = a small box + flat on the (likely W) long side; the POLIZEI sign = a small wall-sign texture on the N gable.
- No interior; the station is not enterable in GTA 2 either.

## In-game
- **Gang job "stein-1"** (Steinböcke, Stein phone): "Hol das Taxi am Rathaus und bring es uns zur Polizeiinspektion. Frech, oder?" → `steal(TAXI, rathaus, named("Polizeiinspektion Geretsried"))`, 240 s, $2500.
- ⚠ **Possible bug (not verified in the running game):** the drop-off needs the player (in the taxi) within `STOP_REACH` = 9 m of the POI. The POI is at the middle of the building; the long walls are 8.3–8.4 m away and the car is 2 m wide (`carOutline`), so a car centre can get no closer than ~9.3 m. A brute-force check of car poses against the map footprints found **no** car position within 9 m. Verify by playing stein-1; if confirmed, the fix is in code (e.g. a drop-off point at the kerb or a bigger reach), which is out of scope for this read-only backlog.
- pickups.ts skips police POIs for weapon/health pickups. Police cars are generic traffic; nothing spawns at the station.
- Exact name used by town-jobs.ts; never rename.
