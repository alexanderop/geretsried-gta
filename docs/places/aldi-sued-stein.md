# Aldi Süd Stein (Sudetenstraße 68 / Bunsenweg) — `aldi-sued-stein`

| Field | Value |
|---|---|
| POI | #225 "Aldi Süd", kind `supermarket` (the one with y > 5000; a second "Aldi Süd" #129 sits at 2745, 2707.3 in the north) |
| Map x, y | 4707.8, 5200.0 m (899 m from start) |
| lat, lon | 47.853235, 11.493118 |
| Official / OSM | way **1385213575**: name "Aldi Süd", **addr Sudetenstraße 68**, building=supermarket, levels 1, `roof:shape=flat` (**wrong**: photos + aerial show a pitched roof), website filialen.aldi-sued.de/bayern/geretsried/sudetenstrasse-68. The Street View captures were taken from **Bunsenweg** |
| Packstation | DHL Packstation 196 "ALDI Markt", Sudetenstr. 68 (DP finder), map (4720.8, 5209.7): at the store's E side |
| Footprint | 1414 m², 50.8 × 30.6 m, 11 nodes, long axis 34°/214° (parallel to Bunsenweg); a small step/notch at the S corner |
| Engine | levels **1**; **flat**; DOP roof `#939389` (single grey) |
| Street frame | **Bunsenweg** (residential, 6.5 m), SE of the store: closest point (4743.8, 5224.2), 43.4 m; street bearing 34°, n bearing 304°. Sudetenstraße is 66 m NE (car park between). An unnamed service aisle (4 m) runs in the car park parallel to Bunsenweg, 24 m E of the POI |
| Status | **implemented (partial)** (B2-4, `src/world/places/aldi-sued-stein.ts`): roof settled by the Bavarian LoD2 model `DEBY_LOD2_4667297` and the DOP20: a gable roof along the long axis (eaves 5.6 m, ridge 10.7 m, 22°) with **two cross gables** ending at the ESE car-park wall (OSM wall 8) and a small gabled annex in the SSW corner; a glass canopy along wall 8, the trolley shelter by wall 6 and two blue bays in front of the SSW gable from the DOP20. Still guesses: which gable carries the logo (the SSW one here), where the doors are, the canopy being glass. Left out: porch posts, the Packstation |

## Images
| File | What | Source |
|---|---|---|
| reference/aldi-sued-stein/01-street-front.png | Gable with ALDI SÜD logo, covered porch with trolley bay, car park | Street View from Bunsenweg, **Sep 2023** |
| reference/aldi-sued-stein/02-street-side.png | Long side, blue disabled bays, green poster board, porch | same |
| reference/aldi-sued-stein/03-street-other.png | Store + Bunsenweg | same |
| reference/aldi-sued-stein/04-satellite.png | Dark pitched roof (ridge along the long axis) with a lighter cross-gable/hip at the S end; Packstation + ALDI pins at the S/SE corner | Google Maps satellite, aerial only |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Walls | white render, single storey | `#ffffff` (sunlit, clipped) |
| Gable | **grey vertical cladding**, triangular, above the porch | `#a6a9a1` |
| Logo | ALDI SÜD logo on a **navy panel** in the gable | navy `#303d6f` |
| Roof | **dark grey, pitched**, overhanging eaves | SV `#7a787d`; aerial dark half `#474a5c`, lit half `#7f7a82` |
| Porch | **covered entrance porch** under the gable, square white posts; trolley bay under it; glass entrance with a small blue ALDI sign | soffit `#918a7b` |
| Car park | open asphalt, white bay lines, **blue disabled bays** (02), lamp posts, a big green poster board on the long side (02) | — |
| Exact facade of the entrance (which wall/corner of the footprint) | from 04 the pins sit at the S/SE corner; 01 gable faces the Bunsenweg car park → likely the **SE end**, verify | — |

## Engine terms
- **Keep** footprint 1385213575 and levels 1. **Roof: engine flat (OSM `roof:shape=flat` + DOP grey)** vs pitched dark grey in reality → per-building roof override `{pitched: true}` with the aerial dark grey (`#474a5c` shade side, `#7f7a82` lit side) via #0b (ask first: the aerial shows a ridge + cross-gable the engine's generic pitched roof may not reproduce).
- Gable + navy logo panel as a wall-sign on the entrance end; porch = thin flat roof on 4 post sprites in front of the entrance (not solid except posts), with a trolley sprite row.
- Blue disabled-bay paint in the car park: ground decals only where 02 shows them.
- facade.ts: supermarket → `shop` facade already.

## In-game
- **Gang job "gartenberg-1"** (Krachlederne, Gartenberg phone): "Die Steinböcke haben einen VW Bus am Aldi in Stein. Fackel ihn ab!" → `destroy(VW_BUS, pois.find(p => p.name === "Aldi Süd" && p.y > 5000))`, 150 s, $2000.
- The VW Bus is parked by `jobCar()` at the kerb of `roadAt(poi, 80)`: the **unnamed car-park service aisle** at (4728.2, 5213.5) beats Bunsenweg (22.4 m vs 40.2 m past the edge). Don't make that aisle solid; porch posts must stay out of it.
- Name "Aldi Süd" + `y > 5000` select this store: never rename, never move it north of y 5000.
