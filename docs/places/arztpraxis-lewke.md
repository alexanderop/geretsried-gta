# Arztpraxis Lewke (Adalbert-Stifter-Straße 43) — `arztpraxis-lewke`

| Field | Value |
|---|---|
| POI | #98 "Arztpraxis Lewke", kind `doctor` (OSM node 6261802825, operator Dorothea Lewke) |
| Map x, y | 3695.3, 4056.5 m (664 m from the start) |
| lat, lon | 47.863519, 11.479543 |
| Official | Dorothea Lewke, Allgemeinmedizin, Adalbert-Stifter-Str. 43; arztpraxis-lewke.de; OSM tel. +49 8171 9978818 |
| OSM building | way **188590009** (241 m², 23.1 × 11 m). Street edges 2/3/4 face 230° (Adalbert-Stifter-Straße) |
| LoD2 | 107585793 gable ridge 8.8 m, eave 2.9 (340 m², includes a joined neighbour part, so 2.9 is the low eave) |
| Engine | levels 2, pitched, roof `#8f8778` ≈ DOP |
| Status | **ref-done**: SV Sept 2023 shows **2 full storeys** + roof windows, so levels 2 stays (prep proposal "1 level" dropped) |

## Images (reference/arztpraxis-lewke/)
| File | What | Source |
|---|---|---|
| 01-street-front.png | White 2-storey house, grey roof, entrance canopy, dark red "Arzt-Praxis" board | Street View, Sept 2023 |
| 02-side.png | Street looking N, gable at the right edge (context) | SV, Sept 2023 |
| 10 / 11 | DOP20 ortho / with OSM outline | BVV, CC BY 4.0 |

## Look spec (only what's seen)
| Element | Seen | Hex |
|---|---|---|
| Walls | **white render**, 2 storeys | SV `#6c89a8` (shade, reads white) |
| Roof | dark grey pitched, roof windows, chimney | SV `#878b81`; DOP `#767460` / `#9a9185` / `#c6b8a3` |
| Entrance | small glass canopy over the door; small red plate by the door | — |
| Sign | **dark aubergine/red board** with a thin orange rule: line 1 **"Arzt-Praxis" in beige/ochre**; line 2 white "D… Lewke" (first name too blurred; OSM operator = Dorothea Lewke) with a **white stethoscope** icon between the words and a small white family pictogram under "Lewke"; 3 small white lines bottom-left illegible. ≈ 1.8 × 0.9 m by eye vs. the windows | SV `#2f1d29` (re-sampled 2026-10-25: `#2e1a25`–`#2f1d29`) |
| Garden | fence and hedge in front | — |

Hex note (SV shade bias): Street View samples of light walls in shade read bluish and dark (this house: a white wall samples `#6c84a6`–`#6c89a8`). Treat them as "engine off-white", never as the wall colour; prefer a daylight web photo for light walls when one exists.

## Engine terms
- #0b on 188590009: levels 2 and pitched stay; roof colour `#767460` (DOP, darker of the two) or keep the map colour.
- wallSign on dark board `#2f1d29`: beige "Arzt-Praxis" + white "Dorothea Lewke" with a white stethoscope icon (as the sign; the first name from OSM), ≈ 1.8 × 0.9 m, z ≈ 1.8–2.7, on the street side (edges 2–4,
  facing 230°) left of the ground-floor windows; **which edge and u: screenshot check**.
- Do not move or rename the POI (the hospital/doctor lookup uses doctor POIs).

Credits: DOP20 / LoD2 © Bayerische Vermessungsverwaltung – www.geodaten.bayern.de (CC BY 4.0); © OpenStreetMap contributors (ODbL). Street View and website images: reference only, never shipped.
