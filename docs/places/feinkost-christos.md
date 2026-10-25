# Feinkost Christos (Neuer Platz 7) — `feinkost-christos`

| Field | Value |
|---|---|
| POI | #160 "Feinkost Christos", kind `shop` (OSM node 12430667625, shop=greengrocer) |
| Map x, y | 3621.0, 4676.6 m (378 m from the start) |
| lat, lon | 47.857942, 11.478547 |
| Official | Web name **"Olive Feinkost"** (Christos Voudouris), Neuer Platz 7, 82538 Geretsried, tel. 08171 80307, Mo–Fr 8–18, Sa 8–14. The **window sign says "Feinkost Christos"** (SV 01–03), so the POI name stays |
| OSM building | way **127604896** (building=retail, levels 1, roof flat; 403 m², 11 edges). Same footprint as Munzur Kebap (#57) and the HUK-Coburg / grill pavilions |
| Engine | levels 1, **pitched = true** → wrong: SV shows a **flat roof** behind a deep grey fascia; LoD2 4 flat parts 3.6–4.4 m |
| Street frame | Neuer Platz (the plaza side). Edges facing 112° (1: 5.9 m, 2: 12.4 m, 3: 8.1 m) look onto the plaza; edge 0 (12.9 m) faces 22° |
| Status | **ref-done (partial)**: front seen; which footprint edge carries the kiosk front needs a screenshot check |

## Images (reference/feinkost-christos/)
| File | What | Source |
|---|---|---|
| 01-street-front.png | Kiosk front from the plaza, HUK-Coburg pavilion behind right | Street View (date not on the capture) |
| 02-side.png | Kiosk + neighbouring grill restaurant terrace, plaza, residential block | SV |
| 03-context.png | Neuer Platz plaza: fountain ring, black round pool, P sign, benches | SV |
| 04-satellite.png | Complex from above (Google POI labels) | Google satellite |
| 10 / 11 | DOP20 ortho / with OSM outline | BVV, CC BY 4.0 |
| 12-web-olive-feinkost-logo.png | Logo (reference only) | olivefeinkost.de |

## Look spec (only what's seen)
| Element | Seen (01–03) | Hex (SV sample) |
|---|---|---|
| Body | single-storey kiosk, **dark brown timber/metal window frames**, large glazing, dark brown base panel | frame `#42302c`, base `#372e2b` |
| Roof edge | **flat roof**, deep plain grey fascia (≈ 0.8–1 m) overhanging the front | `#868b90` |
| Sign | **light blue-white panel inside the left window: "Feinkost Christos"** in dark blue serif + list "…griechische und italienische Spezialitäten · Obst und Gemüse · Weine und Spirituosen · Partyservice" | panel `#97a9ac` |
| Other windows | yellow-framed posters; one with a blue/white stripe band (Greek flag colours) at the bottom right | — |
| Upper window band | blurred in SV (Google blur) → **needs reference** | — |
| Surroundings | plaza paving (light grey slabs), black metal raised planters with plants in front, a red/white post, two trees | — |
| Neighbour | the grill restaurant (Google: "Centrale Geretsried") with yellow parasols + orange awning to the left; not a POI here | — |

## Engine terms
- #0b: `roof: { pitched: false }` on 127604896 (this also fixes #57 Munzur and the pavilions on the same footprint);
  levels 1 stays. Roof colour from DOP: `#ece3de`.
- wallSign "Feinkost Christos" (blue serif on pale blue-white, `#97a9ac` panel) on the plaza edge, u ≈ first 3 m of the kiosk
  front, z 0.9–2.2 (it sits behind glass; a flat sign at the window works). **Which edge (1/2/3) is the kiosk** must be
  checked in a screenshot before writing the entry.
- Optional sprites: two black planters (1.2 × 0.6 m) in front.

Credits: DOP20 / LoD2 © Bayerische Vermessungsverwaltung – www.geodaten.bayern.de (CC BY 4.0); © OpenStreetMap contributors (ODbL). Street View / satellite / website images: reference only, never shipped.
