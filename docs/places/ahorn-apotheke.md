# Ahorn Apotheke, Sudetenstraße 41 — `ahorn-apotheke`

| Field | Value |
|---|---|
| POI | #67 "Ahorn Apotheke", kind `pharmacy` (OSM node 2971507477, addr Sudetenstraße 41) |
| Map x, y | 4276.7, 4823.1 m (329 m from start) |
| lat, lon | 47.856625, 11.487338 |
| Official | Sudetenstr. 41, owner Carola Schoßig (ahorn-apotheke-geretsried.de). OSM hours Mo–Fr 08:00–18:30, Sa 08:00–14:00 |
| OSM building | way **822461881** (Penny block). The pharmacy is the **W corner unit**: corner (4270.7, 4827.3), between the Sudetenstraße end face (4286.4, 4837.3) → (4270.7, 4827.3), 18.6 m, bearing 302°, and the NW car-park facade (bearing 33°) |
| Engine | levels 2, pitched terracotta `#d9a180` |
| Street frame | **Sudetenstraße** (tertiary, 8 m): kerb point (4266.5, 4838.4), 18.4 m; street bearing 304°, n bearing 34°. Car-park entrance lane (service) at (4266.1, 4817.6), 11.9 m, bearing 214° |
| Status | **ref-done** |

## Images
| File | What | Source |
|---|---|---|
| reference/ahorn-apotheke/01-street-front.png | Key: glass corner, light-green lettering, red "A" projecting sign, pylon | Street View, Sudetenstraße |
| reference/ahorn-apotheke/02-street-side.png | NW facade: da Daniele, Ahorn lettering, pylon (= da-daniele/01) | same, car park |
| reference/ahorn-apotheke/03-street-other.png | Whole Penny block along Sudetenstraße, Penny canopy at the far end | same |
| reference/ahorn-apotheke/04-satellite.png | Penny block + round plaza (= da-daniele/04) | Google Maps satellite |
| reference/penny-sudetenstrasse/01-street-front.png | Corner glass front, green "AHORN APOTHEKE" + maple-leaf emblem, PENNY board above (Aug 2022) | batch 1 |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Shop front | full-height **glass corner** facing Sudetenstraße and the car park, white lower band | — |
| Lettering | light-green "Ahorn Apotheke" on the white fascia (NW facade) and at the corner; maple-leaf emblem (01 batch 1) | green panel `#609c2b` / `#669c36` |
| Pharmacy sign | **red pharmacy "A"** projecting sign on the wall near the corner | red (not sampled cleanly) |
| Pylon panel | green "Ahorn Apotheke" panel with red A, 3rd panel of the red pylon | `#669c36` |
| Block | white balcony block, ground + 4 balcony storeys | `#aab1bc` (shade) |

## Engine terms
- Corner unit: glass strip on both faces of the W corner; wall-sign strip (green on white) on the NW facade next to da Daniele and on the Sudetenstraße end face; a small red "A" sign sprite sticking out at the corner.
- Pylon at the car-park entrance right beside this corner (B3-0).
- facade.ts: POI inside → `shop`.

## In-game
- No hooks. Map label yes (pharmacy is IMPORTANT); PENNY (#66) is earlier in list order and ≈ 22 m away, so one of the two labels yields when zoomed out.
- Post Filiale 571 (#150, the Post van job) is across Sudetenstraße at (4238.7, 4832.4); its van parks on Sudetenstraße. Keep the pylon and corner props off the carriageway.
