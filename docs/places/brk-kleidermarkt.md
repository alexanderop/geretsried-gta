# BRK KleiderMarkt (J.-S.-Bach-Straße 13) — `brk-kleidermarkt`

| Field | Value |
|---|---|
| POI | #73 "BRK KleiderMarkt", kind `shop` (OSM node 3203730734) |
| Map x, y | 3691.5, 4872.7 m (380 m from the start) |
| lat, lon | 47.856179, 11.479492 |
| Official | BRK Kleidermarkt (second-hand), Johann-Sebastian-Bach-Straße 13, tel. 08171 649300. Hours: BRK site Mo–Fr 9:30–13, Th also to 18 (OSM hours probably outdated) |
| OSM building | way **127604883** (502 m²), shared with Isar-Apotheke (#18) and Dr. Schmucker (#121) |
| Engine | levels 2, pitched → **too low**: SV shows **ground floor + 3 storeys** under a low-pitched roof; LoD2 4602812 ridge 13.4 / eave 11.2 m |
| Street frame | Johann-Sebastian-Bach-Straße. Street front = edges **3** (6.3 m), **4** (20.3 m), **5** (7.6 m), all facing 27°, running SE → NW. BRK is the **SE end** (SV 01–03) |
| Status | **ref-done** (front seen) |

## Images (reference/brk-kleidermarkt/)
| File | What | Source |
|---|---|---|
| 01-street-front.png | BRK unit, VZ 136 "Kinder" sign in front (**two passers-by blurred by us**) | Street View |
| 02-side.png | BRK unit + the start of the Isar-Apotheke front | SV |
| 03-context.png | The whole block from across the street (passers-by blurred) | SV |
| 04-satellite.png | Block from above (Google labels) | Google satellite |
| 10 / 11 | DOP20 ortho / with OSM outline | BVV, CC BY 4.0 |

## Look spec (only what's seen)
| Element | Seen | Hex (SV sample, shade) |
|---|---|---|
| Building | off-white render block, white window frames, **yellow-ochre panels under some windows**, ground floor of shops, low-pitched roof with snow-guard rail | wall `#88909d` (shade; reads off-white), yellow `#93856b` |
| BRK unit | 2 shop bays: **dark grey fascia panels** — left **"BRK KleiderMarkt"** with the red BRK cross, right **"Gutes aus 2. Hand"** in white; a slim grey metal canopy above both; red/white strip along the window bottoms (sticker band) | fascia `#3f444c` |
| Street furniture | VZ 136 (Kinder) on a grey pole at the kerb in front of BRK; the Apotheke red "A" A-board on the pavement; lamp with curved arm (03) | — |
| Red trim | a thin red line runs along the top of the Isar part of the shop band (not over BRK) | — |

## Engine terms
- Building: see isar-apotheke.md (levels 4 for 127604883, LoD2 annex note).
- wallSign "BRK KleiderMarkt" + "Gutes aus 2. Hand" (white on dark grey, two panels ~2.6 × 0.5 m each) on **edge 3**, u 0.5–6.0,
  z 2.6–3.1; a 0.4 m grey canopy flat above at z 3.2 (`out` 0.4).
- Prop: VZ 136 sign sprite at the kerb in front (needs the sign type from S-1, else skip).
- "BRK at edge 3" is read from the photo order (BRK left = SE): **confirm in a screenshot**.

Credits: DOP20 / LoD2 © Bayerische Vermessungsverwaltung – www.geodaten.bayern.de (CC BY 4.0); © OpenStreetMap contributors (ODbL). Street View / satellite / website images: reference only, never shipped.
