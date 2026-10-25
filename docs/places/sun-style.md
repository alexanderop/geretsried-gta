# Sun Style Bodystyling Studio, Sudetenstraße 24 — `sun-style`

| Field | Value |
|---|---|
| POI | #169 "Sun Style Bodystyling Studio", kind `shop` (OSM node 13180330668, shop=beauty, beauty=tanning, addr Sudetenstraße 24) |
| Map x, y | 4125.7, 4764.7 m (173 m from start) |
| lat, lon | 47.85715, 11.485313 |
| Official | Sudetenstraße 24; Mo–Fr 10–21, Su 11–19 (OSM); operator Friedrich Walter; website https://www.sunstyle.de/ |
| OSM building | way **120402837** (shared with TEDi #15). N corner (4120.7, 4759.6) is 5 m from the node |
| Engine | levels 2, pitched, DOP roof `#fbf4f5` / `#776d5d` |
| Street frame | **Sudetenstraße**: a 4 m service lane named Sudetenstraße runs right in front (2–9 m); main carriageway kerb further NE. NE frontage bearing 303° |
| Position | **NW end** of the NE frontage by node position. In 01 the peach building is left and the Kafka sign right, which fits a view from Sudetenstraße (left = SE). But OSM puts the Kafka node (370882638, same address) ~10 m **SE** of Sun Style, so the unit order **needs verification** on site / another pano |
| Status | **ref-done** |

## Images
| File | What | Source |
|---|---|---|
| reference/sun-style/01-street-front.png | Key: black/gold "Sun Style" fascia on the glass canopy, glazed entrance, Kafka sign right, peach building with brown awning left | Street View, **Sep 2023** |
| reference/sun-style/02-street-side.png | Same row, other angle | same |
| reference/sun-style/04-satellite.png | Roofs + pins (identical file to spielwaren-kroemer/04) | Google Maps satellite |

01 also shows an election poster on a stand at the kerb: temporary street content, **do not model**.

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Sign | black fascia on the edge of the glass canopy: gold "Sun Style" + sun logo, small "Bodystyling Studio" | fascia `#363540`; gold is small → **needs reference** |
| Entrance | glazed entrance + door at the **left end of the white building** | — |
| Building | **white** render, bay windows clad brown/maroon on the upper floors | bay cladding `#4b3f4a` |
| Canopy | glass canopy over the ground floor (continues over Kafka) | — |
| Left neighbour | cream/orange building with a brown awning and goods racks; a black "Sun Style" service-list board stands in front of it. Likely TEDi's part of the same outline (verify) | — |
| Kafka | "VERSICHERUNGEN · FINANZIERUNGEN · KREDITE" sign to the right | — |
| Kerb | parking sign "Mo–Sa 8–19 h", "2 Std." | — |

Note: the parent's note put the sign on the cream/orange building; the photo shows it on the white building.

## Engine terms
- Wall colour differs inside one outline (white NW end, peach SE part with TEDi) → per-part colour, #0b.
- Black fascia strip on the glass canopy, NW end of the NE frontage; Kafka sign next to it (optional).
- facade.ts: POI 2–3 m from the outline → `shop`.

## In-game
- No hooks; no map label (kind `shop`).
