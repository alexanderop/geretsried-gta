# Wohnblöcke Königsberger Weg (Stein) — `wohnblock-koenigsberger-weg`

Residential streetscape reference (no POI, no Place): what the 1960s/70s blocks south of Breslauer Weg look like, for V-1
(roof tone), V-2 (heights), V-9 (fences/hedges), V-11 (bins/sheds) and the start-area streets. House numbers are left out on
purpose (private homes).

| Field | Value |
|---|---|
| Street | Königsberger Weg, OSM way 32933715 (residential loop between Marienburgweg and Sudetenstraße) |
| Area | ≈ 47.8572–47.8582, 11.4865–11.4895 (map ≈ 4290–4420, 4660–4760), 300–420 m from the start |
| High-rise | OSM way **127872287** (building=yes, no levels tag) at map 4338.4, 4760.7 (≈ 359 m from the start); LoD2 **26.05 m**, hip roof, 271 m² → **9 storeys** counted in 42 |
| Blocks | LoD2 ≈ 11.1–11.6 m, gable (3 storeys + roof) for the long blocks along the street (e.g. 47.857887, 11.488011) |
| Status | **ref-done** (Alex's photos 40–43); which block is in 40/41 exactly is not pinned (no GPS) |

## Images (reference/wohnblock-koenigsberger-weg/)
| File | What | Source |
|---|---|---|
| 40-alex-hof-spielplatz.jpg | Courtyard: big beech, lawn with a small playground (metal climbing frame + slide, seesaw), yellow 3-storey block with red roof + solar panels, white/pale-green 3-storey block, brown wooden garden sheds | Foto Alex Opalic, 2026-10-26 |
| 41-alex-weg-muellhaus.jpg | Paved footpath between two light 3–4-storey blocks: grey perforated-metal bin/bike shed, green 1100 L bins, red-white bollard, hedges | same (bin labels blurred) |
| 42-alex-hochhaus.jpg | **Key for the high-rise**: 9 storeys, beige with light-grey bands, dark grey bottom two storeys, dark roof eave; yellow garage in front; green bins | same (plates blurred) |
| 43-alex-strasse.jpg | Königsberger Weg towards the high-rise: 3-storey light blocks with red roofs (left), balcony blocks (right), parked cars, lawn strips | same (plates blurred) |

## Look spec (only what's seen; overcast, phone exposure)
| Element | Seen | Hex |
|---|---|---|
| High-rise walls | beige plaster | `#a39685` |
| High-rise bands | wide **light-grey bands** across the upper corner bays (alternating with beige) | `#a08f7c` (grey reads warm in the sample; looks pale grey in the photo) |
| High-rise base | **dark grey** plaster on the bottom two storeys | `#615d54` |
| High-rise roof | low hip roof, dark eave board; orange-brown balcony edges on one side | — |
| Long blocks | 3 storeys + pitched **red tile roofs**, pale yellow / white / pale green plaster | yellow `#e9c497`, white `#c9ccd3`, green `#a4a892`; roof `#674b2d` (shade) |
| Path blocks (41) | light beige-grey plaster, 3–4 storeys, small windows on the gable ends | `#bbb3b1` |
| Bin/bike shed | grey **perforated metal** box with a flat roof | `#434648` |
| Ground | grey concrete paving stones (paths), lawn with leaves, low kerb | paving `#87827c` |
| Garage (42) | yellow plaster box with a brown tile roof and a vent grille | `#85785c` |

## Engine terms
- High-rise 127872287: today on the default levels → V-2 should give it **9 levels** (LoD2 26 m); walls beige `#a39685`,
  base band dark grey `#615d54` on levels 1–2 — only as part of V-2/V-1 (no Place of its own unless Alex wants one).
- Long blocks: 3 levels + pitched red-tile roof (V-1: real clay red here, keep terracotta).
- Bin sheds + 1100 L bins: good V-11 props (grey perforated box, 3–4 green bins).
- Dark style: these hexes are photo samples; V rule says no colour lighter than today's lightest tone.

Credits: LoD2 © Bayerische Vermessungsverwaltung – www.geodaten.bayern.de (CC BY 4.0); © OpenStreetMap contributors (ODbL). Photos: reference only, never shipped.
