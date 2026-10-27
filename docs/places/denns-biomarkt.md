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
| Entrance (Foto Alex 2026-10-27) | **Not on Sudetenstraße.** The door is on the **end wall at the NE end of the passage arcade**: the short SW-facing edge **(4203.3, 4746) → (4210.6, 4751)**, ≈ 8.8 m, of way 127872184, where the outline steps out towards the car park. The OSM node (4208, 4747.7) sits ≈ 1 m behind that wall. Seen in 40 looking NE along the passage; the match to that edge is from the outline and the view direction (sun behind the camera), not measured |
| Status | **ref-done**: Sudetenstraße side = sign + windows (01/02); entrance = passage end wall (40). Exact door width/spot within the end wall is read off one photo |

## Images
| File | What | Source |
|---|---|---|
| reference/denns-biomarkt/01-street-front.png | Key: green "denns BioMarkt" on a white band, glazed front with posters, TAKKO at the right | Street View, Sudetenstraße |
| reference/denns-biomarkt/02-street-side.png | Frontage at an angle; ground floor + 4 balcony storeys; grey striped canopy at the far NW end | same |
| reference/denns-biomarkt/03-street-other.png | Street context (TEDi across Sudetenstraße) | same |
| reference/denns-biomarkt/04-satellite.png | Two parallel terracotta blocks joined by a single-storey flat roof with skylights | Google Maps satellite |
| reference/denns-biomarkt/40-alex-durchgang.jpg | **Key for the entrance:** passage arcade (Orterer, Takko) leading to denns' end wall with the door; bike hoops, trolley shelter, car park (sunny) | Foto Alex Opalic, 2026-10-27 (plates blurred) |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Sign | green lowercase "denns" + "BioMarkt" letters directly on the white fascia band | green `#8bd448` (sunlit), band `#d9dedf` |
| Shop front | full glazing with posters, dark frames | — |
| Canopy | grey striped (louvred) flat canopy at the far NW end of the frontage | — |
| Block above | white render, continuous balconies with grey rails; **ground floor + 4 balcony storeys** (≈ 5 storeys vs engine 2) | wall `#fcfcfe` |
| Entrance door (40) | central **glass sliding door** in a full-height glass front under the white fascia, posters and green "Bio" stickers on the glass, a round grey "Bio" disc over the door; grey square pillar at the right end; small house-number plate on the fascia | glass dark |
| End-wall fascia (40) | white fascia band with green **"denns BioMarkt"** (the "o" of Bio with the Bio-logo accent), the width of the end wall | letters `#60ac1b`, fascia `#e2e0e1` (sunny, phone) |
| In front of the door (40) | two round light-green **"Bio Markt" discs on a post**, a rack of shopping baskets, bread/menu A-boards, a **row of silver bike hoops** (≈ 4) along the planting strip | discs `#9bd291` |
| Above the entrance (40) | end building, **ground + 2 storeys**: grey balcony slabs with glass/grey rails, grey concrete pillars, a **red band** (window blinds or panels) along the top storey under a wide flat eave | red `#421114` (in the eave's shade) |
| Passage side (40) | low dark flat canopy on legs (bike/trolley shelter) at the planting strip; a **glass shelter with shopping trolleys** at the car-park edge; grass/shrub planting strip with kerb | — |

## Engine terms
- One OSM outline covers the Sudetenstraße block, the north block and the single-storey link (satellite). A levels override to 5 would fill the courtyard: **split the footprint or ask first** (B3-0).
- Wall-sign strip on the SW frontage, NW third: white band + green "denns BioMarkt". Glass strip under it. Thin grey canopy at the NW end.
- Roof-readable sign: optional green "denns" decal near the SW roof edge (B3-0).
- Door: glass front + green "denns BioMarkt" fascia on the passage end wall (4203.3, 4746) → (4210.6, 4751) (40). Sudetenstraße keeps sign + windows.
- facade.ts: POI inside the building → `shop`.

## In-game
- No job, spray or save hook. Map label: yes (supermarket is IMPORTANT), but overlay.ts draws labels in POI order and **later labels yield** to overlapping earlier ones: Rossmann (#65), PENNY (#66) and Ahorn (#67) come before Denns (#82), all within ≈ 90 m, so the Denns label is often hidden when zoomed out.
