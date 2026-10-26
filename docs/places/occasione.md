# Occasione Mode & Lifestyle (Adalbert-Stifter-Straße 39) — `occasione`

| Field | Value |
|---|---|
| POI | #217 "Occasione Mode & **Livestyle**", kind `shop` (OSM shop=clothes on way 668663478). **Name fix: "Lifestyle"** (both signs and the web) |
| Map x, y | 3644.3, 3986.2 m (750 m from the start) |
| lat, lon | 47.864151, 11.478859 |
| Official | "Occasione Mode & Lifestyle", A.-Stifter-Str. 39 (OSM: tel. +49 8171 348675, Mo–Fr 10–18, Sa 10–13) |
| OSM building | way **668663478** (77 m², 10 × 8 m), single-storey annex in front of Schröter's 3-storey block. Front = edge 1 (10.2 m, faces 315°, St.-Hubertus-Straße) |
| LoD2 | 4604132 flat 3.9 m |
| Engine | levels 2, roof null → too tall |
| Status | **ref-done**: front + sign seen (SV July 2022, gable sign Sept 2023) |

## Images (reference/occasione/)
| File | What | Source |
|---|---|---|
| 01-street-front.png | Shop with wide flat canopy, sign, goods outside; cream block behind | Street View, July 2022 |
| 02-side.png | Gable wall sign "OCCASIONE Mode & Lifestyle" above the Schröter logo (same image as schreibwaren-schroeter/02) | SV, Sept 2023 |
| 10 / 11 | DOP20 ortho / with OSM outline | BVV, CC BY 4.0 |

## Look spec (only what's seen)
| Element | Seen | Hex |
|---|---|---|
| Shop | **single storey**, glass shopfront under a **wide flat canopy** | canopy edge SV `#54555d` |
| Sign | grey-beige panel: **"OCCASIONE"** dark serif, red tick over the I, red underline; 2nd line **"Mode & Lifestyle"** (end hidden by a pin in 01, full on the gable sign) | SV `#796e60` |
| Roof | flat, dark | DOP `#7c7a66` / `#7f7f6a` / `#8a846f` |
| Block behind (Schröter's) | 3 storeys, cream render | SV `#8d8988` (shade) |
| Goods | purple sofa, clothes rail, plants outside | — |

Hex note (SV shade bias): the cream block behind (`#8d8988`) and the canopy (`#908f80` shade vs `#a39d93` sun) show how much shade darkens light surfaces. Use the engine's cream/off-white for light walls.

## Engine terms
- #0b on 668663478: `levels: 1`, `roof: { pitched: false, colour: '#7f7f6a' }`.
- wallSign "OCCASIONE / Mode & Lifestyle" on edge 1 at the canopy fascia, z 2.6–3.4, `out` 0.6.
- POI name "Occasione Mode & Livestyle" → "Occasione Mode & Lifestyle": same small typed override by OSM id as the B6b-5
  Bellini name fix (POI from way 668663478); check no code looks the POI up by the old name.

Credits: DOP20 / LoD2 © Bayerische Vermessungsverwaltung – www.geodaten.bayern.de (CC BY 4.0); © OpenStreetMap contributors (ODbL). Street View and website images: reference only, never shipped.
