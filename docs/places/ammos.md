# Restaurant Ammos (Greek), Neuer Platz 9 — `ammos`

| Field | Value |
|---|---|
| POI | #58 "Restaurant Ammos", kind `food` (OSM node 2599419102, amenity=restaurant) |
| Map x, y | 3655.2, 4645.4 m (342 m from start) |
| lat, lon | 47.858223, 11.479005 |
| Official | Greek restaurant, **Neuer Platz 9** (ammos-geretsried.de earlier in this research: Tue–Sat 11:30–14:30 + 17–23, Sun 11:30–21:30, Mon closed; the site answered 500 on the re-check, 2026-10-25). A user photosphere "Restaurant 'Ammos'" (interior, Oct 2025) exists in Street View: interior, not used |
| OSM building | way **188651577** (building=yes, ~345 m², ~30×22 m); address node Neuer Platz 9 sits on its outline |
| LoD2 | DEBY_LOD2_4602860: **shallow gable, eave 7.0 m, ridge 7.9 m**, 311 m² |
| Engine | levels 2, roof without DOP colour (matches the LoD2 height) |
| Street frame | **Künnekeweg** (residential, 6.5 m), bearing 109°; kerb point (3660.4, 4630.7), 15.6 m; a service lane passes 7.7 m W |
| Position | Low building N of the Neuer Platz fountain, between Künnekeweg (N) and the plaza; green/garden area on its S side (01) |
| Status | **ref-done (partial)**: facade, sign and terrace seen (Google user photos 30–32, 2026-10-25); exact terrace extent and sign position need a screenshot check |

## Images
| File | What | Source |
|---|---|---|
| reference/ammos/01-dop20-ortho.jpg | Top-down orthophoto: roof colour, shape, yard | BVV DOP20, CC BY 4.0 |
| reference/ammos/02-dop20-osm-outline.jpg | 01 with the OSM outline (red) and the POI node (yellow) | 01 + OSM |
| reference/ammos/03-lod2-street-side.png | LoD2 3D massing seen from Künnekeweg (N) (heights are real; walls are untextured) | BVV LoD2, CC BY 4.0 |
| reference/ammos/04-lod2-back.png | LoD2 massing from the opposite side | BVV LoD2, CC BY 4.0 |
| reference/ammos/30-web-gmaps-terrace-fence.jpg | Day: terrace behind a natural-wood picket fence, blue Paulaner parasols (furled), dark "PAULANER" fascia, white upper floor | Google Maps user photo, spring, date not shown |
| reference/ammos/31-web-gmaps-terrace-fence-close.jpg | Day, closer: fascia with white "PAULANER" letters + round Paulaner logo, gold "Ammos" board, white globe lamp posts, picket fence with flower boxes | Google Maps user photo, date not shown |
| reference/ammos/32-web-gmaps-entrance-night.jpg | Night: gold board **"Restaurant Ammos – Griechische Spezialitäten"** (black script), Paulaner logo above, **dark-brown horizontal timber cladding**, **white glass double door** with transom, wall lanterns, wine barrel. People behind the glass blurred | Google Maps user photo, date not shown |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Massing | low building, shallow gable, 7.0–7.9 m (LoD2) ≈ 2 storeys | — |
| Roof | grey-green roof (DOP) | `#858d7e` (`#7a8072`–`#95a18b`) |
| Upper floor | white render with plain window rows | web `#eaeff2` (31, sunlit: too light, use engine off-white) |
| Ground floor | dark shopfront band; beige stone/travertine cladding at the entrance; **dark-brown horizontal timber cladding** above the door | timber `#302428` (32, night) |
| Fascia | dark band with white **"PAULANER"** letters + round blue/white/red Paulaner logo | — |
| Sign | **gold/ochre board "Restaurant Ammos – Griechische Spezialitäten"**, "Ammos" in large black script | — |
| Entrance | **white glass double door** with a glazed transom, two wall lanterns, wine barrel | — |
| Terrace | in front of the facade on the plaza side: **natural-wood picket fence** with hanging flower boxes, **blue Paulaner parasols**, dark wicker chairs and wood tables, white globe lamp posts | fence `#a26927` (sunlit, darken), parasol `#4d5f87` (shade) |
| Surroundings | trees and planting along the S side towards the plaza (DOP, 30) | — |

Hex note: web daylight photos (30, 31) are the better colour source here; the night photo (32) gives shapes, not colours.

## Engine terms
- Optional now: #0b `roof: { colour: "#858d7e" }` on way 188651577 (engine has no roof colour there). Levels stay 2.
- wallSign "Restaurant Ammos" (black script on a gold/ochre board, darkened for the dark style) + optional "PAULANER" fascia strip (white letters on dark) on the plaza face; which edge and u: screenshot vs 30/31.
- Optional props: picket-fence strip (natural wood, darkened) round the terrace, 2–4 blue parasols, wicker table sprites. Terrace extent: screenshot vs 30 + DOP.
- facade.ts: POI inside → `food`.

## In-game
- No hooks. Kind `food` is not IMPORTANT → **no map label** (overlay.ts: the HUD names it when near).

## Sources
- https://www.ammos-geretsried.de/ (500 on 2026-10-25)
- OSM node 2599419102, way 188651577, address node 2330656369 (OSM API 2026-10-25)
- BVV DOP20 WMS + LoD2 tile 684_5302 (CC BY 4.0)
- reference/ammos/SOURCES.md (incl. the Google Maps user photos 30–32)
