# Orterer Getränkemarkt, Sudetenstraße 29a — `orterer-am-stern`

| Field | Value |
|---|---|
| POI | #80 "Orterer Getränkemarkt", kind `shop` (OSM node 3634202112, shop=beverages, addr Sudetenstraße 29a, website orterer.de). **Not** #195 (2306.5, 2063.1), the other Orterer |
| Map x, y | 4184.1, 4765.8 m (220 m from start) |
| lat, lon | 47.85714, 11.486096 |
| Official | Sudetenstr. 29a, Mo–Sa 08:00–20:00 (kaufda, meinprospekt listings) |
| OSM building | way **127872184** (west complex), at its **S corner (4185.3, 4772.5)**; SE edge (4185.3, 4772.5) → (4203.3, 4746) runs along the passage to the car park. Synthetic building **-156** (49 m², level 1, x 4186–4196, y 4762–4775) sits beside it in the passage |
| Engine | levels 2, pitched terracotta (west complex); -156 flat `#e8b38e` |
| Street frame | **Sudetenstraße** (tertiary, 8 m): kerb point (4175.2, 4779.6), 16.4 m; street bearing 303°, n bearing 33°. Mozartweg joins Sudetenstraße at (4173.7, 4778.6), right opposite |
| Status | **ref-done (partial)**: poster text on the glazing still unreadable (**needs reference**). Passage seen in denns/40 (2026-10-27): along the arcade it is **open paving**; the only things in the passage are bike hoops, a low dark canopy at the planting strip and a glass trolley shelter by the car park. None of them is a building: the synthetic -156 was parked cars in the aerial and is removed (`src/map/ground-fixes.ts`, 2026-10-27) |

## Images
| File | What | Source |
|---|---|---|
| reference/orterer-am-stern/01-street-front.png | Key: round Orterer logo on the corner pier at the passage, crates, poster, blue "1880" box | Street View, Sudetenstraße |
| reference/orterer-am-stern/02-street-side.png | = takko/01 | same |
| reference/orterer-am-stern/03-street-other.png | = takko/03: arcade with grey pillars, crates | same |
| reference/orterer-am-stern/04-satellite.png | SE end of the west complex, small roof in the passage | Google Maps satellite |
| reference/denns-biomarkt/40-alex-durchgang.jpg | Passage side (wall 1) looking NE: Orterer board with "29a" over the arcade's S end, grey square pillars, Takko racks, denns at the end | Foto Alex Opalic, 2026-10-27 |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Logo | **round logo** on the white corner pier: red rays + "Orterer" wordmark (also a smaller logo above the arcade) | red `#d65c68` |
| Arcade | open ground-floor passage/arcade with **grey square pillars** at the SE corner; drink crates stacked under it | — |
| Shop front | glazing with a bottle poster | — |
| Blue box | blue box with "1880" lettering by the corner (purpose unknown) | — |
| Block | white balcony block above (as Denns) | `#fcfcfe` |
| Passage board (denns/40) | **round-topped white board** on the white wall over the arcade's S end (passage side): red diagonal stripes with a white half-sun in the arch, **blue "Orterer"** wordmark, red line, blue "Getränke-Märkte"; small "29a" plate under it | board `#eae3d7`, blue `#205f9c`, red stripes `#741c31` (thin stripes, sample dark) |
| Arcade (denns/40) | grey **square pillars** ≈ 4–5 m apart on the passage side, white render wall above, light soffit; glazing set back. Under the first bay: a cart of blue screen-wash canisters + "-25 % / -30 %" posters; under the next: Takko's clothes racks | pillars `#7f838c`, wall `#b7b3b2` |
| Paving (denns/40) | grey concrete pavers, drainage channel along the planting strip | `#aba095` |

## Engine terms
- Wall-sign: round logo on the S-corner pier (both faces if #0b allows corner signs), small logo over the arcade.
- Arcade = open ground floor at the S corner: pillars as solid posts, rest walkable; crates as a prop sprite row. Keep the passage to the car park open (it is how the car park connects on foot).
- facade.ts: POI 3 m from the outline → `shop`.

## In-game
- `town-jobs.ts` matches `p.name === "Orterer Getränkemarkt" && p.y < 3000` → that is **#195**, not this store (y 4765.8). **Never** move this POI north of y 3000 or the job target changes.
- Kind `shop` → no map label; the HUD names it when the player is near.
