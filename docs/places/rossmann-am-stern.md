# Rossmann, Sudetenstraße 33 — `rossmann-am-stern`

| Field | Value |
|---|---|
| POI | #65 "Rossmann", kind `drugstore` (OSM node 2971507475, shop=chemist, addr Sudetenstraße 33). Another "Rossmann" is #36 (2757.2, 2716.4) |
| Map x, y | 4251.4, 4773.7 m (283 m from start) |
| lat, lon | 47.857069, 11.486999 |
| Official | Sudetenstr. 33, Mo–Sa 08:00–20:00 (rossmann.de) |
| OSM building | way **293545707**: building=apartments, Sudetenstr. 33, **levels 4**, 1066 m², 5 nodes. Long axis 123° (parallel to Sudetenstraße). **SW long facade** (4226.4, 4761.5) → (4247.7, 4775.3) → (4271.2, 4790.4), ≈ 53 m, faces the Am Stern car park; the POI sits near the bend at (4247.7, 4775.3), i.e. mid-facade |
| Engine | levels 4, pitched, DOP roof `#ecb791` / `#9d7863` |
| Street frame | Car-park aisle (service, 4 m) right in front: (4246.4, 4781.0), 8.8 m, bearing 304°. **Sudetenstraße** (tertiary, 8 m): (4226.5, 4812.7), 46.3 m SW across the car park; street bearing 303°, n bearing 33° |
| Status | **ref-done** (sign and block clear; storey count differs from the engine) |

## Images
| File | What | Source |
|---|---|---|
| reference/rossmann-am-stern/01-street-front.png | Key: the block across the car park, red ROSSMANN lettering on the white ground floor | Street View, Sudetenstraße |
| reference/rossmann-am-stern/02-street-side.png | Same block from further SE | same |
| reference/rossmann-am-stern/03-street-other.png | Red pylon with ROSSMANN panel at the car-park entrance (= da-daniele/03) | same |
| reference/rossmann-am-stern/04-satellite.png | Terracotta roofs, car park | Google Maps satellite |
| reference/penny-sudetenstrasse/02-street-side.png | Same block from the car-park entrance (Aug 2022) | batch 1 |
| reference/rossmann-am-stern/40-alex-parkplatz.jpg | **Key for the car-park front:** block from the W end of the car park looking SE: logo discs, ROSSMANN, galleries, eave; Penny block ahead (sunny) | Foto Alex Opalic, 2026-10-27 (plates + people blurred) |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Sign | red "ROSSMANN" letters on the white ground-floor wall, mid-facade; the **O is the red round logo** (40) | `#d6666b` (sunlit); 40: `#b85e66` |
| Logo discs (40) | **red round Rossmann logo discs** on the ground-floor wall: one at the NW end (high, under the first gallery), one at the SE end | `#de2842` |
| EV sign (40) | blue "Ladestation" sign at the NW end of the front (OSM charging_station node 6356242273 at (4230.4, 4764.6)) | `#6480b3` |
| Ground floor | white/light-grey wall with shop glazing; in 40 a run of **recessed bays between white square pillars**, glazing set back | `#cedae2`; 40: `#e4e3df` |
| Upper floors | **2 balcony storeys** (40: continuous **galleries** with grey panel parapets, grey posts, dark window bands; grey downpipes) | parapet `#9fa3a6` |
| Eave (40) | wide overhang with exposed rafters | soffit `#4f4a49` |
| Roof | **terracotta pitched roof with chimneys** | DOP `#ecb791` / `#9d7863` fits |
| Height | ground + 2 = **3 storeys** vs engine levels 4 | — |
| Entrance door | **needs reference** (glazing visible, door not resolved; 40 is too far away) | — |
| Car park (40) | bays in grey concrete pavers, asphalt aisles, a planting island with shrubs + young trees, tall grey lamp posts with two lamps on a T-arm | pavers `#ada299`, asphalt `#a29894` |

## Engine terms
- Keep footprint 293545707. Levels 4 → 3 would match the photos; **ask first** (B3-0 has the block heights together).
- Wall-sign strip "ROSSMANN" (red on white) on the SW (car-park) facade, centred near (4247.7, 4775.3); glass strip under it.
- Pylon panel: ROSSMANN is the 2nd panel of the red Am Stern pylon (B3-0).
- facade.ts: POI inside → `shop`.

## In-game
- No hooks. Map label yes (drugstore is IMPORTANT); it is the first of the Am Stern POIs in list order, so its label wins over PENNY/Ahorn/Denns when they overlap.
- Pickups may spawn on the Am Stern car park (`parking` area x 4197–4287, y 4752–4824) right in front of it.
