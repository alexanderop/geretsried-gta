# EDEKA Heininger & Dietz, Breslauer Weg 113 — `edeka-am-stern`

| Field | Value |
|---|---|
| POI | #204 "EDEKA", kind `supermarket` (the one at 4429.1, 4804.1; other "EDEKA" POIs: #100 at 2694, 2835.7 and #221 at 5538.2, 1079.8) |
| Map x, y | 4429.1, 4804.1 m (459 m from start) |
| lat, lon | 47.856796, 11.489381 |
| Official | **"EDEKA Heininger & Dietz"**, Breslauer Weg 113, free parking (edeka.de/maerkte/034616). Operator: founded 2007 by Klaus Heininger, now run by Marco Dietz; ≈ 1,400 m² sales floor, 25 m fresh counter, bakery in the store. OSM opening hours Mo–Sa 08:00–20:00 |
| OSM building | way **189042651**: building=retail, levels 1, roof:levels 0, name "EDEKA Heininger", addr Breslauer Weg 113. 1858 m², **56 × 33 m**, 4 corners: N (4423.9, 4772), E (4459.8, 4814.9), S (4434.4, 4836.2), W (4398.4, 4793.3). Long axis 140°/320°. Also contains POI "Bäckerei Backhupferl" (4408.8, 4798.6) |
| Engine | levels **1**, **flat**, DOP roof `#dcdcde` (matches the light-grey flat roof in 04) |
| Street frame | **Breslauer Weg** (residential, 6.5 m) along the **NW short side**: kerb point (4407.1, 4775.8), 35.8 m from the POI; street bearing 52°, n bearing 142°. Car-park aisles (service, 4 m) are closer: 24 m (SW/E). Sudetenstraße is 116 m away; this store is **across Breslauer Weg from the rest of Am Stern**, not in the same block |
| Car park | engine `parking` area x 4362–4436, y 4797–4873, **SW of the store** (04: "Parkplatz Edeka" pin). The capture notes also mention parking on the W side |
| Status | **ref-done** |

## Images
| File | What | Source |
|---|---|---|
| reference/edeka-am-stern/01-street-front.png | Key: corner at the Breslauer Weg end of the SW front, fascia, logo, Fleischwaren board, entrance | Street View, **Sep 2023** |
| reference/edeka-am-stern/02-street-side.png | Long low hall along the street, yellow band, pylon | same |
| reference/edeka-am-stern/03-street-other.png | SW front from the car park | same |
| reference/edeka-am-stern/04-satellite.png | Light-grey flat roof, darker strip on the SW edge, car park SW | Google Maps satellite |
| reference/edeka-am-stern/40-alex-ecke-pylon.jpg | **Key for the corner + pylon:** grey corner with house number "113", yellow roof sign box with the E logo, "Heininger & Dietz" fascia along the canopy, glass front; yellow pylon at the car-park entrance; looking into the car park from the street (overcast) | Foto Alex Opalic, 2026-10-26 (plates + 1 person blurred) |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Roof edge / fascia | white | `#cacfd2` |
| Upper wall | **dark blue-grey panels with round "porthole" windows** above the canopy band | `#48595c` |
| Shop-front band | **yellow band** with the blue EDEKA logo and "Heininger & Dietz" lettering (partly behind a tree) | yellow clipped in sun (`#ffffb8`); **40 (overcast, phone exposure): band `#5b4900`, blue `#062348`, blue bottom stripe**. 40 is unclipped but under-exposed: a dark shade of the yellow, not the brand hex. **Decision (Alex 2026-10-26: dunkles Ocker behalten): use the dark photo ochre ~`#5b4900` (pylon `#6e5901`) for band, roof box and pylon, not brand yellow** — fits the dark palette |
| Fleischwaren board | blue board reading "Fleischwaren", opening-hours board under it | `#4060c8` |
| Entrance | glazed entrance at the **W corner (Breslauer Weg end) of the SW front** | glass dark |
| Shop front | glazing along the SW front; pallets of seasonal goods in front | — |
| Pylon | **yellow pylon** reading "Heininger & Dietz" (vertical lettering) at the **car-park entrance from the street**, right of the entry lane, next to a blue "P" board ("Privatparkplatz – 120 Min. pro Tag", fee "min. 30 Euro") and a "Feuerwehrzufahrt" sign; in front: a row of advertising boards on rails and a **gabion wall** (stone basket) at the car-park edge (40) | `#6e5901` (40, overcast) |
| Corner (40) | **grey plaster corner** with house number "113", **white plaster pillar** next to it, then the glass front under a dark canopy | grey `#464a4d`, white `#9b958c` (shade), canopy `#17181b` |
| Roof sign box (40) | **yellow box sign on the roof edge at the corner**: yellow panels, blue bottom stripe, square logo with blue "E" and "EDEKA"; the "Heininger & Dietz" fascia runs along the canopy edge of the long side | as the band |
| Car park surface (40) | grey concrete paving | `#7e7d84` |
| NW side (Breslauer Weg) | reflective glass, **no sign** (capture notes) | — |
| Roof | flat, light grey, darker strip along the SW edge (04) | engine `#dcdcde` is fine |
| Yellow cabinet near the entrance (03) | yellow box/door, purpose **not identified** (do not label it Packstation) | — |
| Bakery Backhupferl / "Hahn im Korb" | OSM bakery POI inside, a "Hahn im Korb" food pin inside in 04; no sign seen → **needs reference** | — |
| Height | single tall hall + clerestory/panel band; storey count not clear | — |

## Engine terms
- Keep footprint 189042651, flat roof `#dcdcde`. Levels 1 is a low box; the hall reads taller (panel band above the canopy). A height bump to "1.5" only if #0b supports a height override: **ask first**.
- Shop facade on the **SW long edge (S → W corner, bearing 320°)**: glass strip at ground level, canopy band, yellow sign band with the blue logo near the W corner, dark-blue-grey upper band with round windows. "Fleischwaren" blue board + hours board at the W corner. NW short side: glass, no sign.
- Sprites: yellow pylon at the **car-park entrance from the street**, right of the entry lane, with the P board + Feuerwehrzufahrt sign beside it and the ad boards + gabion wall in front (40; exact metres not measured: the photo has no GPS).
- Roof board: 40 shows it — a yellow box sign with a blue bottom stripe and the square E logo on the roof edge at the corner (not a painted roof logo).
- Top-down read: a big light-grey flat roof; put a **roof-readable "EDEKA" sign** (yellow on the roof edge or a painted roof logo) so players spot it from above (see B3-0).
- facade.ts: the POI is inside the building → `shop` facade already.

## In-game
- No job, spray or save hook uses this EDEKA (#204). The map label shows it (supermarket is an IMPORTANT kind).
- Pickups can spawn on `parking` areas → the SW car park can hold pickups; keep it drivable.
