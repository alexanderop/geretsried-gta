# denns BioMarkt, Sudetenstraße 29 C — `denns-biomarkt`

| Field | Value |
|---|---|
| POI | #82 "Denns BioMarkt", kind `supermarket` (OSM node 3634202114, addr Sudetenstraße 29c, operator Dennree) |
| Map x, y | 4208, 4747.7 m (233 m from start) |
| lat, lon | 47.857303, 11.486417 |
| Official | denns BioMarkt, Sudetenstr. 29 C (biomarkt.de); cheese counter and bakery (supermarktcheck) |
| OSM building | way **127872184** ("west complex", building=yes, levels 2, 2458 m², 7 nodes). Shared with Takko (29b), Orterer (29a), Nexial, GG-Radsport, Aphrodite-aestetic. **Sudetenstraße frontage = SW edge (4149.3, 4748) → (4185.3, 4772.5)**, 43.5 m, bearing 124° |
| Engine | levels **2**, pitched, DOP roof `#cda887` / `#bd8269` (terracotta) |
| Street frame | **Sudetenstraße** (tertiary, 8 m): kerb point (4183.9, 4785.2), 44.5 m from the node; street bearing 303°, n bearing 33° |
| Unit order on the frontage (photos) | NW → SE: **Denns · Takko · Orterer** (Orterer at the SE corner by the passage). 01 shows TAKKO right of denns; takko/02 confirms looking NW |
| Status | **ref-done (partial)**: the sign is on the Sudetenstraße frontage, but the OSM node and the Google pin sit ≈ 27 m deeper (north block); the store may run deep under the single-storey link. Entrance door position **needs reference** |

## Images
| File | What | Source |
|---|---|---|
| reference/denns-biomarkt/01-street-front.png | Key: green "denns BioMarkt" on a white band, glazed front with posters, TAKKO at the right | Street View, Sudetenstraße |
| reference/denns-biomarkt/02-street-side.png | Frontage at an angle; ground floor + 4 balcony storeys; grey striped canopy at the far NW end | same |
| reference/denns-biomarkt/03-street-other.png | Street context (TEDi across Sudetenstraße) | same |
| reference/denns-biomarkt/04-satellite.png | Two parallel terracotta blocks joined by a single-storey flat roof with skylights | Google Maps satellite |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Sign | green lowercase "denns" + "BioMarkt" letters directly on the white fascia band | green `#8bd448` (sunlit), band `#d9dedf` |
| Shop front | full glazing with posters, dark frames | — |
| Canopy | grey striped (louvred) flat canopy at the far NW end of the frontage | — |
| Block above | white render, continuous balconies with grey rails; **ground floor + 4 balcony storeys** (≈ 5 storeys vs engine 2) | wall `#fcfcfe` |
| Entrance door | **needs reference** | — |

## Engine terms
- One OSM outline covers the Sudetenstraße block, the north block and the single-storey link (satellite). A levels override to 5 would fill the courtyard: **split the footprint or ask first** (B3-0).
- Wall-sign strip on the SW frontage, NW third: white band + green "denns BioMarkt". Glass strip under it. Thin grey canopy at the NW end.
- Roof-readable sign: optional green "denns" decal near the SW roof edge (B3-0).
- facade.ts: POI inside the building → `shop`.

## In-game
- No job, spray or save hook. Map label: yes (supermarket is IMPORTANT), but overlay.ts draws labels in POI order and **later labels yield** to overlapping earlier ones: Rossmann (#65), PENNY (#66) and Ahorn (#67) come before Denns (#82), all within ≈ 90 m, so the Denns label is often hidden when zoomed out.
