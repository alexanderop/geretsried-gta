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
| Status | **ref-done (partial)**: the poster on the glazing (capture notes: "Dauerpreis") is unreadable at this resolution; what -156 is (shelter? kiosk?) **needs reference** |

## Images
| File | What | Source |
|---|---|---|
| reference/orterer-am-stern/01-street-front.png | Key: round Orterer logo on the corner pier at the passage, crates, poster, blue "1880" box | Street View, Sudetenstraße |
| reference/orterer-am-stern/02-street-side.png | = takko/01 | same |
| reference/orterer-am-stern/03-street-other.png | = takko/03: arcade with grey pillars, crates | same |
| reference/orterer-am-stern/04-satellite.png | SE end of the west complex, small roof in the passage | Google Maps satellite |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Logo | **round logo** on the white corner pier: red rays + "Orterer" wordmark (also a smaller logo above the arcade) | red `#d65c68` |
| Arcade | open ground-floor passage/arcade with **grey square pillars** at the SE corner; drink crates stacked under it | — |
| Shop front | glazing with a bottle poster | — |
| Blue box | blue box with "1880" lettering by the corner (purpose unknown) | — |
| Block | white balcony block above (as Denns) | `#fcfcfe` |

## Engine terms
- Wall-sign: round logo on the S-corner pier (both faces if #0b allows corner signs), small logo over the arcade.
- Arcade = open ground floor at the S corner: pillars as solid posts, rest walkable; crates as a prop sprite row. Keep the passage to the car park open (it is how the car park connects on foot).
- facade.ts: POI 3 m from the outline → `shop`.

## In-game
- `town-jobs.ts` matches `p.name === "Orterer Getränkemarkt" && p.y < 3000` → that is **#195**, not this store (y 4765.8). **Never** move this POI north of y 3000 or the job target changes.
- Kind `shop` → no map label; the HUD names it when the player is near.
