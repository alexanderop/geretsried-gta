# TEDi, Sudetenstraße 26 — `tedi-am-stern`

| Field | Value |
|---|---|
| POI | #15 "TEDi", kind `shop` (OSM node 370882660, shop=variety_store, brand TEDi) |
| Map x, y | 4151.2, 4783.6 m (205 m from start) |
| lat, lon | 47.85698, 11.485655 |
| Official | Sudetenstraße 26 (openalfa), Mo–Sa 09:00–20:00 (OSM). Door number "26" is visible in 01 |
| OSM building | way **120402837** (9 corners, 1014 m², bbox x 4113–4161, y 4760–4814). Shared with Sun Style (#169, B4-7) and Versicherungsmakler Kafka (Sudetenstr. 24) |
| Engine | levels 2, pitched, DOP roof `#fbf4f5` / `#776d5d` |
| Street frame | **Sudetenstraße** (tertiary, 8 m): kerb point (4160.9, 4769.7), 17.0 m from the node; street bearing 305°, n bearing 215° (shop is SW of the street) |
| Position | NE frontage (Sudetenstraße side, edges bearing 303°), **SE part**; the TEDi signs sit at the left (SE) end of the shop front in 01 |
| Status | **ref-done** |

## Images
| File | What | Source |
|---|---|---|
| reference/tedi-am-stern/01-street-front.png | Key: two blue TEDi boxes over the entrance, grey slanted canopy, goods racks | Street View, Sudetenstraße |
| reference/tedi-am-stern/02-street-side.png | Looking NW along Sudetenstraße: same building, canopy, racks | same |
| reference/tedi-am-stern/04-satellite.png | Roofs; pins Sun Style, Kafka, Fußpflege & Kosmetik, B&L, Georgiadis | Google Maps satellite |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Sign | **two blue boxes** with white "TEDi" lettering, side by side above the entrance (on/at the canopy) | `#2955a1` |
| Stair strip | blue vertical glazed strip above the entrance, full height | dark in shade, blue not sampleable → use sign blue |
| Wall | cream / peach render | `#afa187` (shaded) |
| Canopy | grey slanted canopy along the whole shop front | `#575f62` |
| Windows | blue-framed upper windows; orange-ish lower wall parts at the right | orange **needs reference** (no clean sample) |
| Goods | racks / tables of goods outside the entrance | — |
| Height | ground + at least 3 window rows seen in 02 (top cut) — engine 2 | — |

## Engine terms
- Wall-sign pair (two square boxes) at the SE end of the NE frontage, over the entrance; grey canopy strip (~3 m) along the frontage.
- Prop: goods racks on the pavement in front of the entrance.
- facade.ts: POI inside → `shop`.

## In-game
- No hooks. Kind `shop` is not IMPORTANT → **no map label** (overlay.ts: the HUD names it when near).
