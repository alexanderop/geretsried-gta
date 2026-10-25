# VR Bank München Land, Sudetenstraße 11 — `vr-bank-zentrum`

| Field | Value |
|---|---|
| POI | #13 "VR-Bank", kind `bank` (OSM node 370882654, amenity=bank, atm=yes; Mo 09–12, Tu 09–12 + 14–16, We 09–12, Th 09–12 + 14–18, Fr 09–12) |
| Map x, y | 3957.8, 4620.3 m (48 m from start) |
| lat, lon | 47.858449, 11.483062 |
| Official | Sudetenstraße 11 (OSM). Sign reads "VR Bank München Land" |
| OSM building | way **127604887** (8 corners, 668 m², bbox x 3953–3993, y 4598–4641), Sudetenstraße 11–15 (VR-Bank, Bodystreet, Stroblume, Dolce Gelato, NW→SE) |
| Engine | levels 2, pitched; DOP wall tints `#987c64` / `#cfb8a0` / `#b99782` |
| Street frame | **Sudetenstraße** (tertiary, 8 m), street bearing 304°; kerb point (3952.8, 4627.8), 9.0 m; NE of the street. Service road / car park on the NW side (7.6 m) |
| Position | **NW end** of way 127604887 (corner unit; the car park is on its left in 01) |
| Status | **ref-done** |

## Images
| File | What | Source |
|---|---|---|
| reference/vr-bank-zentrum/01-street-front.png | Key: white upper floors, orange ground floor, blue logo + "VR Bank München Land" letters, grey canopy strip, street-name sign "Sudetenstraße" | Google Street View (date not stated by the capture; the Bodystreet pano in stroblume/02 carries a © 2023 Google watermark) |
| reference/vr-bank-zentrum/02-street-side.png | Wider: corner unit, car park left, Bodystreet right | Google Street View (date not stated by the capture; the Bodystreet pano in stroblume/02 carries a © 2023 Google watermark) |
| reference/vr-bank-zentrum/04-satellite.png | Shared wide satellite of the start block (zoom 20); pins VR Bank, Bodystreet, Stroblume, Dolce Gelato, HoangAnh, Aktionshaus M&A | Google Maps satellite |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Ground floor | orange render band around door and windows (the whole ground floor) | `#d68756` (shade) / `#e2a470` (sun) |
| Letters | blue "VR Bank München Land" individual letters + square blue/orange VR logo, above the canopy | `#5574d5` |
| Upper floors | white render, roller-shutter windows | `#e1e4e7` |
| Canopy | thin grey metal canopy strip over the whole front | `#787c75` |
| Front | glass door on the left (NW), two wide white-framed windows with frosted panels and small blue signs | — |
| Street | blue P sign, street-name plate "Sudetenstraße" on a pole at the right corner, an A-board | — |

## Engine terms
- Per-building tint is NOT whole-building: ground-floor orange only on the VR-Bank part (NW end). Use a wallSign/band part (orange, 0–3.5 m) + letters wallSign (blue) + canopy strip on the NE edge, NW end of way 127604887.
- ATM: OSM atm=yes, position on the facade needs reference.
- facade.ts: POI inside → `bank`.

## In-game
- No job hooks. Kind `bank` is not IMPORTANT → no map label.

## Sources
- OSM node 370882654 (Overpass 2026-10-25)
- reference/vr-bank-zentrum/SOURCES.md
