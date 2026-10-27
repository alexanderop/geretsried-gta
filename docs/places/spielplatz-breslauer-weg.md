# Spielplatz Breslauer Weg — `spielplatz-breslauer-weg`

| Field | Value |
|---|---|
| Area | OSM way **1271723892** leisure=playground, access=yes (1368 m², 43 × 33 m) → `playground` area (I-2), tint #424e35 |
| Map x, y | 4303.2, 4561.2 m (318 m from the start) |
| lat, lon | 47.85898, 11.487694 |
| Engine | `playground` area + ground dressing `src/world/places/spielplatz-breslauer-weg.ts` (B6d-13) |
| Status | **built** 2026-10-26 (B6d-13): equipment and fences from Alex's photo 40; ref: SV Sept 2023 + photo 40 |

## Images (reference/spielplatz-breslauer-weg/)
| File | What | Source |
|---|---|---|
| 01-street-front.png | Dark metal fence with gate + green sign, bench, light-yellow slide between beech trees | Street View, Sept 2023 |
| 02-side.png | Along Breslauer Weg: bench, yellow slide, wooden play frame, dark grey fence | SV, Sept 2023 |
| 10 / 11 | DOP20 ortho / with OSM outline (all canopy) | BVV, CC BY 4.0 |
| 40-alex-spielplatz.jpg | **Key:** whole playground from the street fence (green sign "Spielplatz „Breslauer W…“" bottom right): beeches, leaf-covered ground, all equipment | Foto Alex Opalic, 2026-10-26 |

## Look spec (only what's seen)
| Element | Seen | Hex |
|---|---|---|
| From above | **entirely under tree canopy** | DOP `#313e2b` / `#44512e` / `#4c5a44` |
| Edge | dark metal fence with a small gate and a green sign | — |
| Equipment (40, left → right from the street) | wooden **A-frame** play hut (back left) with a wooden bench in front; **spring rider** (green figure) in the middle; **wooden play tower** with roof panel and **yellow slide** (middle right); **seesaw** (yellow beam, black tyre seats) right; a **wooden bench** in the front left; **green litter bin** on a pole (right); dog-bag dispenser (back left) | seesaw yellow `#6c450a` (shade) |
| Surface | earth/bark under a thick layer of **brown beech leaves** (October), no sand pit seen | leaves `#7f675a` |
| Edges (40) | street side: dark metal bar fence with the green sign; back: **wooden privacy fence** (brown boards) with a white house + red roof behind | — |
| Trees | many tall **beech** trunks (grey-green bark) spread across the whole area | — |

## Engine terms
- I-2 samples the DOP at the centroid → this one gets the dark canopy tint (`#44512e` range, built #424e35): fits the dark style.
- Ground dressing (`GroundDressing`, B6d-13): the `playground` area holding (4303, 4561), parts in Breslauer Weg's street frame there (u runs W, n S; the sidewalk's back is n 5.85). Never solid.
- Sprites (top-down, Codex): `spielplatz-hut` (A-frame, ridge along the view from the gate), `spielplatz-bench` ×2, `spielplatz-rider`, `spielplatz-tower` (tower + yellow slide), `spielplatz-seesaw`, `spielplatz-bin` (on a grey pole). Order left → right as in 40 = E → W.
- Fences as pylon boxes: dark metal bars 1 m (#34383c) on the sidewalk's back with the green sign box by the gate; brown boards 1.8 m (#70563e) inside the back edge.
- Guessed: all metres (no GPS), sizes, the rider's shape. Not built: gate (drawn as fence), dog-bag dispenser, E/W side fences.
- Under the canopy the equipment shows only in the see-through circle round the player.

Credits: DOP20 / LoD2 © Bayerische Vermessungsverwaltung – www.geodaten.bayern.de (CC BY 4.0); © OpenStreetMap contributors (ODbL). Street View and website images: reference only, never shipped.
