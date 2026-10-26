# Schreibwaren Schröter (Adalbert-Stifter-Straße 39) — `schreibwaren-schroeter`

| Field | Value |
|---|---|
| POI | #59 "Schreibwaren Schröter", kind `shop` (OSM node 2599419104, shop=stationery) |
| Map x, y | 3655.5, 4007.1 m (727 m from the start) |
| lat, lon | 47.863963, 11.479009 |
| Official | "Schröter Bürobedarf", Adalbert-Stifter-Str. 39; listed open |
| OSM building | way **668663477** (414 m²). Shop front = edge 4 (12.7 m, faces 231°) or edge 3 (12.0 m, faces 218°) |
| LoD2 | 4603829 hip, ridge 11.3, eave 10.6 (242 m², the 3-storey block); 4604182 hip 10.2 / 7.3 (113 m², the shop wing) |
| Engine | levels 2, **flat** → too low, wrong roof |
| Status | **ref-done**: shop front + sign seen (SV Sept 2023) |

## Images (reference/schreibwaren-schroeter/)
| File | What | Source |
|---|---|---|
| 01-street-front.png | Red ground floor, blue/white awning, cream upper floor, "Schröter" signs (bystanders blurred) | Street View, Sept 2023 |
| 02-side.png | 3-storey cream block with "OCCASIONE Mode & Lifestyle" + "Schröter" gable sign (same image as occasione/02) | SV, Sept 2023 |
| 10 / 11 | DOP20 ortho / with OSM outline | BVV, CC BY 4.0 |

## Look spec (only what's seen)
| Element | Seen | Hex |
|---|---|---|
| Ground floor (shop) | **red-painted facade**, red window/door frames | SV `#691718` |
| Awning | **blue/white striped** | blue SV `#1e2661` |
| Upper floor | cream render, ribbon windows | SV `#9f928a` |
| Roof | low tiled roof with timber eaves | eaves SV `#77736e`; roof DOP `#c6b9a8` / `#cbc0b1` / `#d2c6b8` |
| Main sign | white panel **"Schröter"** with a red/black swoosh logo above the shop; small lines below illegible | SV `#7c8097` (shade, reads white) |
| Other signs | white board "Schröter" at the left; red/white banner "Schröter" on the wall at the right | — |
| Goods | umbrella and postcard racks outside | — |
| Main block | 3 storeys, cream (see occasione) | — |

Hex note (SV shade bias): light surfaces sampled in shade read bluish/dark (white sign panel `#7c8097`, cream upper floor `#9f9289`). Use them as dark-style tones, not true colour; the red ground floor and navy awning are reliable.

## Engine terms
- #0b on 668663477 with **masses**: main block (LoD2 4603829) `levels: 3`, pitched; shop wing (4604182) `levels: 2`, pitched.
  Roof colour `#c6b9a8` (DOP; = today's map tone family, not lighter). No hip roof in the engine: gable.
- Shop wing street face (edge 4 or 3, **screenshot check**): red ground band z 0–3 `#691718` via a plain wallSign; awning strip
  blue/white z 2.6–3.0, `out` 0.6; wallSign "Schröter" (black + red swoosh on white) ≈ 2.2 × 0.8 m above it, z 3.2–4.0.
- Do the Occasione annex (#217) in the same PR: `occasione.md`.

Credits: DOP20 / LoD2 © Bayerische Vermessungsverwaltung – www.geodaten.bayern.de (CC BY 4.0); © OpenStreetMap contributors (ODbL). Street View and website images: reference only, never shipped.
