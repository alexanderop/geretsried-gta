# Dolce Gelato (ice-cream café), Sudetenstraße 15 — `dolce-gelato`

| Field | Value |
|---|---|
| POI | #47 "Dolce Gelato", kind `food` (OSM node 1912662383, amenity=ice_cream, Mo–Su 11:00–21:00, outdoor_seating) |
| Map x, y | 3980.5, 4636.4 m (20 m from start) |
| lat, lon | 47.858304, 11.483367 |
| Official | Sudetenstraße 15 (OSM) |
| OSM building | way **127604887** (8 corners, 668 m², bbox x 3953–3993, y 4598–4641), Sudetenstraße 11–15 (VR-Bank, Bodystreet, Stroblume, Dolce Gelato, NW→SE) |
| Engine | levels 2, pitched; DOP wall tints `#987c64` / `#cfb8a0` / `#b99782` |
| Street frame | **Sudetenstraße** (tertiary, 8 m), street bearing 304°; kerb point (3975.8, 4643.3), 8.4 m; NE of the street |
| Position | **SE end** of way 127604887, next to the white unit 17 across a recessed passage/doorway |
| Status | **ref-done** |

## Images
| File | What | Source |
|---|---|---|
| reference/dolce-gelato/01-street-front.png | Key: white "Dolce Gelato" plate with a small orange pin, red awning, terrace chairs; parking sign and street tree in front | Google Street View (date not stated by the capture; the Bodystreet pano in stroblume/02 carries a © 2023 Google watermark) |
| reference/dolce-gelato/02-street-side.png | Looking NW: same red awning in the row, Deliqos unit right | Google Street View (date not stated by the capture; the Bodystreet pano in stroblume/02 carries a © 2023 Google watermark) |
| reference/dolce-gelato/04-satellite.png | Shared wide satellite of the start block (zoom 20); pins VR Bank, Bodystreet, Stroblume, Dolce Gelato, HoangAnh, Aktionshaus M&A | Google Maps satellite |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Sign | white plate with dark "Dolce Gelato" lettering on the wall above the awning, SE end | `#d9d5da` |
| Awning | red/raspberry fabric awning over the whole front | `#d46172` |
| Wall | beige/olive render (shaded) | `#938e80` |
| Terrace | white plastic chairs and small tables under the awning; ice-cream banner on the window | — |
| Street | blue P sign + street tree on the pavement in front (01) | — |
| Next door | recessed open passage with a wooden door, then the white unit 17 (hoanganh) | — |

## Engine terms
- wallSign plate (~3 m) + awning strip (~10 m, red) on the NE edge, SE end of way 127604887.
- Props: 4–6 white chairs + 2 tables under the awning (pavement stays walkable), parking-sign sprite.
- facade.ts: POI inside → `food`.

## In-game
- No hooks. Kind `food` is not IMPORTANT → **no map label** (overlay.ts: the HUD names it when near).

## Sources
- OSM node 1912662383 (Overpass 2026-10-25)
- reference/dolce-gelato/SOURCES.md
