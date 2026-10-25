# Angel Nails, Sudetenstraße 19 — `angel-nails`

| Field | Value |
|---|---|
| POI | #154 "Angel Nails", kind `shop` (OSM node 12211219347, shop=beauty, beauty=nails, Mo–Fr 09:00–18:30, Sa 09:00–16:00) |
| Map x, y | 4000.2, 4648.4 m (**3 m from start**) |
| lat, lon | 47.858196, 11.483631 |
| Official | Sudetenstraße 19 (OSM; same house number as Mühlenbäck) |
| OSM building | way **127604891** (7 corners, 566 m², bbox x 3985–4027, y 4630–4662), the start building (Sudetenstraße 17–19: unit 17, Angel Nails, Mühlenbäck) |
| Engine | levels 2, pitched; DOP wall tints `#cab4a3` / `#84735e` / `#897b6c` |
| Street frame | **Sudetenstraße** (tertiary, 8 m), street bearing 304°; kerb point (3994.9, 4656.3), 9.5 m; shop is NE of the street (n bearing 34°) |
| Position | NE frontage, **between the white unit 17 (NW) and Mühlenbäck (SE)**: directly NW-adjacent to the Mühlenbäck shop front, i.e. right next to the spawn |
| Status | **ref-done** |

## Images
| File | What | Source |
|---|---|---|
| reference/angel-nails/01-street-front.png | Context: Mühlenbäck and the unit SE of it; Angel Nails is just off the left edge | Google Street View (date not stated by the capture; the Bodystreet pano in stroblume/02 carries a © 2023 Google watermark) |
| reference/angel-nails/02-street-side.png | Key: looking along the frontage; pink "…l Nails" fascia left of Mühlenbäck (a Google pin covers "Angel") | Google Street View (date not stated by the capture; the Bodystreet pano in stroblume/02 carries a © 2023 Google watermark) |
| reference/angel-nails/05-crop-sign.png | 3× crop of 02: fascia, pink pillar, door, window | crop of 02 |
| reference/angel-nails/04-satellite.png | Shared wide satellite of the start block (zoom 20); pins VR Bank, Bodystreet, Stroblume, Dolce Gelato, HoangAnh, Aktionshaus M&A | Google Maps satellite |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Fascia | pink box sign with white "…l Nails" lettering, a face photo at its left end; the left half is hidden by a Maps pin (name from OSM) | `#ec86a0` |
| Pillar | pink vertical strip left of the door, full ground-floor height, with vertical lettering (unreadable) | `#9b4668` (shaded) |
| Front | white-framed glass door left, one wide window right with a white price list and a face poster | — |
| Wall | white/cream render over the shop, same as the Mühlenbäck building | `#b5b7b4` (shaded) |
| Upper floors | 2 more storeys with roller-shutter windows (engine 2) | — |
| Canopy | none of its own; Mühlenbäck's cream striped awning starts right of it | — |

## Engine terms
- One wallSign (pink, ~5 m) at fascia height on the NE edge of way 127604891, immediately NW of the Mühlenbäck sign (B2-1); a thin pink pillar strip left of the door.
- facade.ts: POI inside → `shop`.
- Must not overlap the spawn: Angel Nails is 3 m from the start point, check the player spawns on the pavement, not in the wall sign.

## In-game
- No hooks. Kind `shop` is not IMPORTANT → **no map label** (overlay.ts: the HUD names it when near).

## Sources
- OSM node 12211219347 (Overpass 2026-10-25)
- reference/angel-nails/SOURCES.md
