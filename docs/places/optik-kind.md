# KIND Augenoptik (Optik Kind Geretsried-Zentrum II), Sudetenstraße 10 — `optik-kind`

| Field | Value |
|---|---|
| POI | #115 "Optik Kind Geretsried-Zentrum II", kind `shop` (OSM node 9018462446, shop=optician, operator KIND GmbH & Co. KG, Mo–Fr 09–13 + 14–18) |
| Map x, y | 3944.9, 4641.7 m (53 m from start) |
| lat, lon | 47.858256, 11.482889 |
| Official | Sudetenstraße 10 (OSM, kind.com). Outside sign reads only **"KIND"**; Google indoor pano is named "KIND Augenoptik Geretsried" |
| OSM building | way **538512734** (6 corners, 742 m², bbox x 3913–3953, y 4626–4663), Sudetenstraße 10, SW side, W corner of Sudetenstraße/Kirchweg (Optik Kind + Bistro Malor) |
| Engine | levels 2, pitched; DOP tints `#b0aea6` / `#9b8c7d` / `#c4baae` / `#cab5a1` |
| Street frame | **Sudetenstraße** (tertiary, 8 m), street bearing 304°; kerb point (3953.8, 4628.5), 16.0 m; shop is SW of the street (n bearing 214°). Kirchweg 12.8 m on the E side |
| Position | Ground floor of a modern white block with dark balconies, at the **Sudetenstraße/Kirchweg corner**; KIND sign wraps the corner. Opposite the VR-Bank (03) |
| Status | **ref-done** |

## Images
| File | What | Source |
|---|---|---|
| reference/optik-kind/01-street-front.png | Key: dark-blue "KIND" fascia band (three repeats, wraps the corner), glass corner shop, grey shutter, A-board; 30-zone signs left | Google Street View (date not stated by the capture; the Bodystreet pano in stroblume/02 carries a © 2023 Google watermark) |
| reference/optik-kind/02-street-side.png | Looking along Sudetenstraße: KIND sign edge left, wide street | Google Street View (date not stated by the capture; the Bodystreet pano in stroblume/02 carries a © 2023 Google watermark) |
| reference/optik-kind/03-street-other.png | View from the shop: VR-Bank opposite, bus | Google Street View |
| reference/optik-kind/04-satellite.png | Shared wide satellite of the start block (zoom 20); pins VR Bank, Bodystreet, Stroblume, Dolce Gelato, HoangAnh, Aktionshaus M&A | Google Maps satellite |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Fascia | dark-blue band with white serif "KIND", repeated 3× around the corner | `#305499` |
| Wall | white render, ground floor partly grey shutter panel | `#b4b7c1` (shaded) |
| Front | tall glass windows/door at the corner | — |
| Upper floors | 3+ storeys of flats with dark grey glass/metal balconies (engine 2) | — |
| Props | A-board with an advert poster on the pavement | — |

## Engine terms
- Corner wallSign band (blue, ~0.8 m high) wrapping the NE + SE edges of way 538512734 at the Sudetenstraße/Kirchweg corner.
- Leave room on the NW part for Bistro Malor's terrace (B6a-7).
- facade.ts: POI inside → `shop`.

## In-game
- No hooks. Kind `shop` is not IMPORTANT → **no map label** (overlay.ts: the HUD names it when near).

## Sources
- OSM node 9018462446; https://www.kind.com/de-de/fachgeschaefte/Geretsried-Zentrum-II/
- reference/optik-kind/SOURCES.md
