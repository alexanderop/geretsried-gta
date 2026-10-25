# Sparkasse (Stein branch, Händelstraße) — `sparkasse-stein`

| Field | Value |
|---|---|
| POI | #20 "Sparkasse", kind `bank` (OSM node 370894691, no address tags) |
| Map x, y | 3550.6, 4719.7 m (453 m from start) |
| lat, lon | 47.857555, 11.477603 |
| Address | Street View pano label "1 Händelstraße". The OSM node has no address; Nominatim gives Händelstraße. Corner of Händelstraße / Johann-Sebastian-Bach-Straße |
| OSM building | way **128271967** contains the node: 451 m², 38.1 × 11.8 m, long axis bearing 21° (NNE), 6 nodes. No levels or roof tags → engine default 2 levels |
| Engine roof colours (DOP40) | `#daab8b` (sunlit face) / `#897666` (shade face), pitched |
| Street frame | **Händelstraße** (residential, 6.5 m), kerb point (3558.5, 4725.9), 10.0 m. Street bearing 218°; n bearing 308° (NW). The long SE edge (3552.6,4721.6 → 3566.1,4686.0, 38.1 m) faces Händelstraße. Johann-Sebastian-Bach-Straße is 13.8 m away at the S corner (corner with the yield sign + flagpole). |
| Status | **implemented** (B1-2, `src/world/places/sparkasse-stein.ts`; podium and solar layout still need a photo) |

## Images
| File | What | Source |
|---|---|---|
| reference/sparkasse-stein/01-street-front.png | Händelstraße facade: grey bank base, "Sparkasse", windows with red bands | Street View "1 Händelstraße", **Jul 2022** |
| reference/sparkasse-stein/02-street-side.png | corner: second "Sparkasse" lettering, yield sign, red flag on pole, entrance steps | same |
| reference/sparkasse-stein/03-street-other.png | long view along Händelstraße, balconies | same |
| reference/sparkasse-stein/04-satellite.png | brown roof with solar panels | Google Maps satellite, cropped to the aerial only (Maps UI removed) |

## Look spec
| Element | Seen | Hex (sampled) |
|---|---|---|
| Bank base (ground floor) | smooth grey render. At the corner it projects forward as a single-storey podium | `#c0bcb5` |
| **Sign** | **"Sparkasse"** in red lowercase-style Sparkasse lettering (capital S), on the base, on **both** the Händelstraße face and the corner face | `#f67465` (sunlit) |
| Bank windows | tall narrow windows, each with a red horizontal band and a small Sparkasse logo; black wall lamps between them | band `#ff544a` |
| Upper floors | 2 storeys of white render, grey window surrounds, roller shutters | `#fbfcfd` |
| Top storey | grey render band under the eaves, with windows | ~`#75757b` |
| Eaves | exposed timber rafters, pitched roof | — |
| Balconies | grey metal, at the N end (Händelstraße side), one with a red awning | `#526471` / `#75757b` |
| Roof | brown tiles with **solar panels** (satellite) | DOP `#daab8b` / `#897666` |
| Flag | red Sparkasse flag on a pole at the corner | — |

- **Storeys:** 4 (grey base + 2 white + grey top storey) under a pitched roof, so the default of 2 is too low.
- **Needs reference:**
  - The exact extent of the single-storey podium. It may fall outside polygon 128271967, or another polygon may cover it; the neighbours are 127604877 at 21.9 m and 127604892 at 21.3 m.
  - The layout of the solar panels on the roof.

## Engine terms
- **Keep OSM footprint** 128271967, with height = 4 storeys plus a pitched roof.
- Paint "Sparkasse" as a wall-texture strip on the grey ground floor of the SE (Händelstraße) face and on the S corner face.
- Add the red window bands as texture, and the flagpole and yield sign as sprites.
- From the top-down camera the roof dominates. Solar panels on brown tiles are real, so a roof texture with panels is faithful. A roof-painted "Sparkasse" label would be a liberty; ask first.
- Street frame: Händelstraße, u at 218°, n at 308°.

## In-game
- No gameplay hooks (generic `bank`). A possible future heist target, but that needs design approval.
