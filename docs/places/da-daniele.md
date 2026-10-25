# Bar Café da Daniele, Sudetenstraße 39 — `da-daniele`

| Field | Value |
|---|---|
| POI | #77 "da Daniele", kind `food` (OSM node 3450934542, amenity=cafe, addr Sudetenstraße 39) |
| Map x, y | 4280.4, 4816.7 m (329 m from start) |
| lat, lon | 47.856682, 11.487388 |
| Official | Bar Café da Daniele, Daniele Sangermano, Sudetenstraße 39 (bar-cafe-da-daniele.de; mentions an outdoor area). OSM hours Mo–Fr 07:00–22:00, Sa 07:30–22:00 |
| OSM building | way **822461881** (Penny block), **NW car-park facade** (4270.7, 4827.3) → (4298.3, 4784.2), bearing 33°. Unit order NE → SW: PENNY · **da Daniele** · Schlüsseldienst Geyer (also no. 39, OSM node 3450946413) · Ahorn Apotheke |
| Engine | levels 2, pitched terracotta `#d9a180` |
| Street frame | Car-park aisle (service, 4 m) in front: (4271.1, 4810.3), 11.3 m, bearing 34°. **Sudetenstraße**: (4266.1, 4838.2), 25.8 m; street bearing 304° |
| Status | **ref-done** (front clear; outdoor seating **needs reference**) |

## Images
| File | What | Source |
|---|---|---|
| reference/da-daniele/01-street-front.png | Key: crimson fascia, grey script sign above, parking bays in front (= ahorn/02) | Street View, car park |
| reference/da-daniele/02-street-side.png | Looking NE: free-standing **Penny canopy** on posts with trolleys, da Daniele next to it | same |
| reference/da-daniele/03-street-other.png | Pylon at the car-park entrance (= rossmann/03) | same |
| reference/da-daniele/04-satellite.png | Penny block from above (= ahorn/04) | Google Maps satellite |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Fascia | **crimson board** "Bar Café [cup logo] da Daniele" in white over the glazing | `#8d384f` |
| Wall sign | grey script "da Daniele Bar·Café" with cup logo on the white wall above the fascia | grey |
| Shop front | glazing under the fascia | — |
| In front | perpendicular parking bays right at the facade, **red/white barrier posts**, a "2 Std." parking-time sign | — |
| Terrace | **not seen** in 01–03; the website mentions an outdoor area → **needs reference** (do not add tables) | — |

## Engine terms
- Wall-sign strip (crimson) + small grey script sign above, on the NW facade between the Penny canopy and Ahorn.
- Barrier-post sprites (red/white) along the bay row in front; parking stays drivable.
- facade.ts: POI inside → `shop` (food is a SHOP_FRONTS kind).

## In-game
- No hooks. Kind `food` is not IMPORTANT → no map label; the HUD names it when near.
