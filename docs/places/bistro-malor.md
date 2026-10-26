# Bistro Malor (restaurant/bistro/bar), Sudetenstraße 10 — `bistro-malor`

| Field | Value |
|---|---|
| POI | #120 "Bistro Malor", kind `food` (OSM node 9161424552, amenity=restaurant, cuisine pizza;burger;bistro) |
| Map x, y | 3929.9, 4632.5 m (69 m from start) |
| lat, lon | 47.858339, 11.482688 |
| Official | **Open**: bistro-malor.de (© 2026, menu PDF 2025): Sudetenstr. 10, 82538 Geretsried, +49 8171 911707; Mo–Sa 11:00–21:30, Su closed (site; OSM hours differ). Owner per Impressum: Amel Ramadanovic |
| OSM building | way **538512734** (6 corners, 742 m², bbox x 3913–3953, y 4626–4663), Sudetenstraße 10, SW side, W corner of Sudetenstraße/Kirchweg (Optik Kind + Bistro Malor). Same house as Optik Kind |
| Engine | levels 2, pitched; DOP tints `#b0aea6` / `#9b8c7d` / `#c4baae` / `#cab5a1` |
| Street frame | **Sudetenstraße** (tertiary, 8 m), street bearing 304°; kerb point (3939.0, 4618.6), 16.6 m; SW of the street |
| Position | NW part of way 538512734, **next to the KIND corner**: its terrace sits beside the KIND sign (website photo shows the KIND band behind the terrace; SV shows a terrace roof just past the KIND corner) |
| Status | **ref-done**: terrace, logo, **facade sign and terrace roof seen** (Google user photo 30, 2026-10-25). B6a-7 is implemented; the new facts are a follow-up under B6a-7 |

## Images
| File | What | Source |
|---|---|---|
| reference/bistro-malor/05-web-terrace.jpg | Key (web): terrace under a dark steel frame, wood tables with white runners, brown rattan chairs with tan cushions, white facade with tall glazed doors, the "KIND" band visible behind; no people | bistro-malor.de /de/restaurant/ (img_6189), date not stated |
| reference/bistro-malor/06-web-logo.png | Logo: dark-grey "B" block + red "ISTRO MALOR" wordmark | bistro-malor.de theme logo |
| reference/bistro-malor/07-crop-sv-terrace.png | 3× crop of optik-kind/01: past the KIND corner, a dark-red terrace roof/awning, hedges, a motorbike | crop of Street View (date not stated) |
| reference/bistro-malor/30-web-gmaps-facade-awning.jpg | Facade: light grey-white 3-storey house with French balconies; **cream board "BISTRO MALOR"** left of the door (dark letters, **dark-red ring "O"** logo; small line "BISTRO · RESTAURANT · PIZZERIA"), **large square maroon parasol** (pyramid top, valance) over the front terrace, motorbikes on the kerb. People and plates blurred (uploader + us) | Google Maps user photo, spring, date not shown |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Logo (web) | dark-grey "B" block + red "ISTRO MALOR" (website logo; **not** what hangs on the facade) | red `#a82b1c`, grey `#464140` |
| Facade sign | **cream/light-grey board "BISTRO MALOR"**: dark grey capitals, the **O as a dark-red ring with a red dot**, small line "BISTRO · RESTAURANT · PIZZERIA" below; left of the ground-floor door, ≈ 2.8 × 0.8 m by eye | board `#969799` (shade, reads cream) |
| Terrace | paved terrace with wood tables (white runners, flower vase) and brown rattan armchairs with tan cushions | — |
| Terrace roof | **large square maroon parasol** (pyramid top with valance) over the front terrace (30, matches the dark-red roof in SV 07). The dark steel frame in 05 is older or another part | web `#5d3f59` (shade) |
| Facade | white / light grey render, 3 storeys, French balconies with dark railings; tall glazed double doors | web `#9aa3b4` (shade, reads white → engine off-white) |
| Planting | low hedges/boxes around the terrace | — |

## Engine terms
- Terrace part (~8×5 m) on the NW part of way 538512734, street side (SW of Sudetenstraße): table + chair sprites, low hedge strip.
- Follow-up (photo 30; B6a-7 is implemented, so this is a new small change, see the follow-up note under B6a-7): wallSign "BISTRO MALOR" (dark letters, dark-red ring O, cream board darkened) left of the door on wall 1; maroon square parasol (or a dark-red canopy) over the terrace. u and size: screenshot vs 30.
- facade.ts: POI inside → `food`.

## In-game
- No hooks. Kind `food` is not IMPORTANT → **no map label** (overlay.ts: the HUD names it when near).

## Sources
- https://bistro-malor.de/ (hours), /de/kontakt/ (address), /de/impressum/, /de/restaurant/ (photos)
- OSM node 9161424552
- reference/bistro-malor/SOURCES.md
