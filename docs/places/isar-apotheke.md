# Isar-Apotheke (J.-S.-Bach-Straße 13a) — `isar-apotheke`

| Field | Value |
|---|---|
| POI | #18 "Isar-Apotheke", kind `pharmacy` (OSM node 370894683, 7.5 m outside the footprint) |
| Map x, y | 3683.2, 4864.0 m (382 m from the start) |
| lat, lon | 47.856257, 11.479381 |
| Official | Isar-Apotheke, Hans Lieb e.K., Johann-Sebastian-Bach-Straße 13a, tel. 08171 31499, Mo–Fr 8–19, Sa 8–13 (isar-apo-geretsried.de). The corner house plate reads "13a" (02) |
| OSM building | way **127604883** (shared with BRK #73 and Dr. Schmucker #121) |
| Engine | levels 2, pitched → too low (ground floor + 3 storeys seen) |
| LoD2 | 4602812 gable, ridge 13.4 m, eave 11.2 m (184 m²); 4602813 gable, ridge 14.0 m, lowest eave 5.2 m (386 m²; the low eave is most likely the flat-roofed rear annex seen on the satellite) |
| DOP roof | `#8c8978` / `#bbaa9a` / `#c5b4a4` |
| Street frame | Johann-Sebastian-Bach-Straße; front edges 3 / 4 / 5 (face 27°). The pharmacy fills **edge 4 from ~u 2 m to the NW corner and edge 5** |
| Status | **ref-done** (front seen in SV and on the website photo) |

## Images (reference/isar-apotheke/)
| File | What | Source |
|---|---|---|
| 01-street-front.png | Middle of the front: fascia, doors, projecting A sign | Street View |
| 02-side-corner.png | NW corner: "eig. Rezepturen \| Gesundheitstests" window, roller-shuttered window, side wall with AC unit | SV |
| 03-context.png | Whole block (same file as brk-kleidermarkt/03) | SV |
| 04-satellite.png | Block from above | Google satellite |
| 10 / 11 | DOP20 ortho / with OSM outline | BVV, CC BY 4.0 |
| 12 / 13 / 14 | Website front photo, banner, logo (reference only) | isar-apo-geretsried.de |

## Look spec (only what's seen; SV matches the website photo)
| Element | Seen | Hex (SV sample, shade) |
|---|---|---|
| Building | off-white render, white windows, yellow-ochre panels under windows, ground floor + 3 storeys, low-pitched roof with snow-guard rail; side wall plain with an AC unit | wall `#88909d`, yellow `#93856b` |
| Shop band | light stone/render ground floor; a **thin red trim line** along its top edge, stepping down at the corner | — |
| Fascia | **grey panel** with **red capital letters "ISAR APOTHEKE"**, a **blue wave logo** between ISAR and APOTHEKE | panel `#676872` (shade) |
| Window bands (L → R, SE → NW) | red bands with white text: "Gesundheits- und Ernährungsberatung" · "Bestell-/Lieferservice" · small band over door 1 · opening-hours band over door 2 · "Pharmazie \| Arzneimittel" · "eig. Rezepturen \| Gesundheitstests" | red `#57383d` (shade; reads brick red) |
| Doors | two glass doors in light-grey/cream frames | `#71746f` |
| Projecting sign | white box with the red Apotheke "A" and "ISAR APOTHEKE", red edge, between "Pharmazie" and "eig. Rezepturen" | — |
| Front | a low ramp/step with **steel handrails** along the doors, terracotta planters, bicycles; corner window has a beige roller shutter | — |

## Engine terms
- #0b on 127604883: **levels 4**, pitched, roof colour `#bbaa9a`. The rear annex (LoD2 eave 5.2 m) would need `masses`
  cut along the LoD2 walls → optional; if skipped the whole footprint is 4 levels (note it).
- wallSign "ISAR APOTHEKE" (red caps + blue logo on grey, ~9 × 0.8 m) on **edge 4**, u ≈ 9–18, z 3.0–3.8.
- wallSign strip of the red window bands, z 2.4–2.8, along edge 4 u ≈ 2–20 and edge 5.
- Projecting "A" sign: a small box/sprite (0.7 × 0.9 m) `out` 0.6 m at edge 4 u ≈ 19, z 2.6–3.5.
- `bands`: red plain trim line z 3.9–4.0 (Isar part only, if bands can be limited; otherwise skip).
- Railing sprite in front of the doors (optional).
- u positions are estimated from the perspective photos (±1.5 m) → check against a screenshot.

Credits: DOP20 / LoD2 © Bayerische Vermessungsverwaltung – www.geodaten.bayern.de (CC BY 4.0); © OpenStreetMap contributors (ODbL). Street View / satellite / website images: reference only, never shipped.
