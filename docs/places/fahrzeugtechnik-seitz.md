# Fahrzeugtechnik Seitz, Breslauer Weg 75 — `fahrzeugtechnik-seitz`

| Field | Value |
|---|---|
| POI | **none yet**: not in OSM at all (no shop/craft node, no address on the building) → hand-add in **I-2 step 3** ("Fahrzeugtechnik Seitz", `car_repair`; motorbikes + cars) |
| Official | **"Fahrzeugtechnik Manfred Seitz"**, Breslauer Weg 75, 82538 Geretsried, tel. 08171 32316, motorradseitz.de: repairs of all makes, tuning, dyno, TÜV, Meisterbetrieb |
| lat, lon | web geocode 47.858962, 11.49028 (lands on the street) → put the POI on the building centroid **47.859149, 11.490211** |
| Map x, y | geocode 4496.1, 4563.2; building centroid **4491.0, 4542.4** (≈ 505 m from the start) |
| OSM building | **probably** way **128503556** (building=yes, 312 m², ≈ 17.6 × 17.8 m, centroid 4492.4, 4543.8): 21 m from the geocode, its S edge (edge 3, 4498.1, 4555.6 → 4480.7, 4552.9, faces Breslauer Weg ≈ 10–15 m away). Neighbours: way 188648190 behind it (N), the terraced row 189043189 across the street. The photo's front looks wider than 17.6 m (the Orchidee unit sits left of Seitz) → **check the footprint against DOP20** before building |
| LoD2 | flat roof, measuredHeight **9.1 m**, 452 m² (centroid 47.859111, 11.490201) → 2 storeys, matches the photo |
| Engine | levels 2, flat |
| Status | **ref-done** (front from Alex's photo; POI pending I-2) |

## Images (reference/fahrzeugtechnik-seitz/)
| File | What | Source |
|---|---|---|
| 40-alex-front.jpg | **Key:** street front from Breslauer Weg: 2-storey flat-roof block, sign, shop windows, tent with motorbikes | Foto Alex Opalic, 2026-10-26 (plates blurred) |

## Look spec (only what's seen in 40)
| Element | Seen | Hex (sampled, sunny) |
|---|---|---|
| Upper storey | white plaster, 4–5 windows with **grey roller shutters** (half down) | `#cbcacf` |
| Ground storey | **grey plaster** band, large shop windows with dark frames | `#8b8f8f` |
| Roof edge | flat roof, **brown fascia** (wide overhang board) along the whole front | `#73543f` |
| Main sign | black board over the ground floor: **"Fahrzeug"** white, **"technik"** red, **"SEITZ"** white, a white car logo left and a motorbike logo right | board `#222328` |
| Window signs | red "PKW SERVICE" panel; white "Alle Fabrikate! Meisterbetrieb" lettering on the blinds; a small "Benelli" logo | — |
| Entrance | glass double door left of the sign under a small **dark grey hipped canopy** | canopy `#3b3c43` |
| Left unit | white sign **"Kosmetikstudio Orchidee"** (purple letters, purple flower) — a second business in the same block | — |
| Right side | white **party tent** on a steel frame with motorbikes for sale, red-white chain on posts, a stack of tyres; car park / yard behind with parked cars | tent `#acada7` |
| Street | street lamp (tall, curved arm) at the right corner; grass strip + paved pavement in front | — |

## Engine terms
- Massing: levels 2, flat (LoD2 9.1 m); facade = edge facing Breslauer Weg (S edge of 128503556 if that's the building).
- Bands: grey ground storey `#8b8f8f` to ~3.3 m, white upper storey `#cbcacf`, brown fascia `#73543f` on top.
- wallSign "Fahrzeugtechnik SEITZ" (white/red/white on black) centred over the shop windows; small "PKW SERVICE" red panel.
- Optional sprites: tent + motorbikes, tyre stack (yard on the right). Spray-shop or garage job hook: only if Alex wants it.
- Kosmetikstudio Orchidee: not a POI either; mention only.

Credits: LoD2 © Bayerische Vermessungsverwaltung – www.geodaten.bayern.de (CC BY 4.0); © OpenStreetMap contributors (ODbL). Photos: reference only, never shipped.
