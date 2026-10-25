# Deutsche Post Filiale 571 (Sudetenstraße 34) — `post-filiale-571`

| Field | Value |
|---|---|
| POI | #150 "Deutsche Post Filiale 571", kind `post` |
| Map x, y | 4238.7, 4832.4 m (303 m from start) |
| lat, lon | 47.856541, 11.486828 |
| Official | Deutsche Post finder (2026-10-25): **Postfiliale, "Schreibwaren und Geschenkartikeln", Sudetenstr. 34, region 571, "Geretsried 2"**, geo 47.8565471, 11.4867911 (= map 4235.9, 4831.7, 2.8 m from the POI). Also a **Postfachanlage** (PO boxes) and a **Briefkasten** at no. 34. Mo–Fr 09:00–17:30, Sa 09:00–13:00 |
| Host shop | Newsagent "GerLTZ — Geretsrieder Lotto · Tabak · Zeitschriften"; LOTTO Bayern Annahmestelle "Beck", Sudetenstraße 34 |
| History | Merkur 11.10.2016: the Post at Sudetenstr. 34 (opened 1 Jul 2015) closed on 12 Oct 2016 and moved to PicksRaus-Markt, Sudetenstr. 27. The 2026 finder lists 571 at no. 34 again, so it came back later (date unknown) |
| OSM building | way **119921780** (building=apartments, no level/roof tags): L-shape, 959 m², bbox 51.5 × 37.2 m, long arm along Sudetenstraße |
| Engine | levels **4** (apartments default); pitched; DOP roof `#897a6a` / `#ccb9af` |
| Street frame | **Sudetenstraße** (tertiary, 8 m). Closest centreline point (4244.1, 4823.9), 10.0 m; street bearing 302°, n bearing 212° (shop is SW of the street). An unnamed service lane (4 m) runs SW through the building passage seen in 02 |
| Status | **implemented (partial)** (B2-2, `src/world/places/post-filiale-571.ts`): 3 storeys and the roof from the Bavarian LoD2 model (tile 686_5302: three gabled houses, eaves 10.0–10.8 m, about 22°). Guesses: shop widths, canopy depth, and the yellow Post board (still no photo of one) |

## Images
| File | What | Source |
|---|---|---|
| reference/post-filiale-571/01-street-front.png | GerLTZ front, door "36/34", canopy, signs | Street View, **Aug 2022** |
| reference/post-filiale-571/02-street-side.png | Yellow Post letter box + brown bin at the kerb, "sonnenklar" shop, passage | same |
| reference/post-filiale-571/03-street-other.png | Long block, continuous glass canopy | same |
| reference/post-filiale-571/04-satellite.png | Roofs: red-brown pitched blocks | Google Maps satellite, aerial only |

## Look spec (only what's seen)
| Element | Seen | Hex (sampled) |
|---|---|---|
| Walls | white/very light grey render; at least 3 storeys (ground + 2 window rows in 03); grey window surrounds; a stone-grey pilaster strip at the shop/passage join | wall in shade `#afb2b8`; pilaster `#94928b` |
| Canopy | continuous **glass canopy on steel brackets** over the whole shop row | `#727a7a` (glass, seen from below) |
| Sign band (left → right, 01) | navy "Geretsrieder Merkur" + yellow/red "MEHR ZEITUNG" · yellow **LOTTO Bayern** (red clover) · white strip "GerLTZ Geretsrieder Lotto · Tabak · Zeitschriften" · green "Süddeutsche Zeitung" over red "Abendzeitung" · white "sonnenklar" (next shop) | navy `#0c3169`, LOTTO yellow (shade) `#ad8e29`, SZ green `#0f665a`, AZ red `#b5232b` |
| Shop front | glass door + glass side door "36/34", postcard spinner racks, brown wooden bin | — |
| Kerb | **yellow Deutsche Post letter box** + brown bin at the kerb (02); the finder lists a Briefkasten at no. 34 | Post yellow: not sampled (in shade) |
| **Deutsche Post / DHL partner sign** | **not visible in 2022; no current photo found on the web → needs reference** | — |
| Storey count above 3, roof form from the street | not in frame → **needs reference** (aerial shows pitched red-brown) | — |

## Engine terms
- **Keep** footprint 119921780. Engine says 4 levels; the photos show at least 3: **don't override until confirmed** (needs reference).
- Shop front is on the Sudetenstraße (NE) edge. The glass canopy can be a thin translucent flat at ~3 m along that edge (exterior, drive-under like a petrol canopy is NOT needed — pavement only).
- Sign strip: paint the seen sign band (Merkur / LOTTO / GerLTZ / SZ+AZ). A yellow Post sign would be **a liberty** — ask first; the safe Post cue is the **yellow letter-box sprite** at the kerb (seen).
- facade.ts: `post` is a shop-front kind → building already gets the `shop` facade.

## In-game
- **Job "post"** (home phone, after "mercedes"): "Der Post-Transporter an der Filiale 571 hat Beweise geladen. Spreng ihn, schnell!" → `destroy(POST_VAN, named("Deutsche Post Filiale 571"))`, 90 s, $3000.
- The van is parked by `jobCar()` at the right-hand kerb of `roadAt(poi, 80)`. Here that is **Sudetenstraße** (6.0 m past its edge vs 7.5 m for the service lane), so the van stands on Sudetenstraße in front of the shop. Dressing must keep that kerb lane free.
- Exact name "Deutsche Post Filiale 571" is used by `named()`; never rename.
- PENNY Am Stern / Rossmann block is directly across Sudetenstraße.
