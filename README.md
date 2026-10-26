# Geretsried Theft Auto (POC)

Top-down GTA 2-style game set in the real town of Geretsried, built from OpenStreetMap data.

```sh
pnpm install
pnpm dev          # http://localhost:5190
```

**Controls:** WASD / arrows walk and drive · Shift sprint · Space handbrake (on foot: fire) · F get in / out (works on moving traffic too) ·
Ctrl fire · Q / E (or [ / ]) previous / next weapon · G horn · H help · F next to a bus at its stop rides along.

## How the map is made

```
Overpass API ──► data/raw.json ──► scripts/import-osm.ts ──► public/geretsried.map.json
```

- `pnpm map:fetch` downloads every road, building, river and land-use way in the bbox (`BBOX` in `scripts/import-osm.ts`).
- `src/map/build.ts` projects lat/lon to meters (origin = north-west corner, y south) and keeps a compact JSON (~1.6 MB).
- `pnpm map` rebuilds from the cached `data/raw.json` without hitting Overpass.
- The bus lines come from OSM's `route=bus` relations through the bbox, with their ways and stops, cached in
  `data/routes.json` (by `pnpm map:fetch`, or when missing). `src/map/bus.ts` turns them into
  `buses` in the map JSON (see **Buses** below).
- Places come from three queries with their own caches: `data/places.json` (shops, a fixed amenity list, traffic lights),
  `data/places-more.json` (gyms, dojos, health care, kindergartens, care homes, bars, parcel lockers, offices,
  craft, named sports centres) and `data/places-next.json` (colleges, driving schools, arts centres, stadiums). Each
  one's POIs come after the one before, so the older POI ids stay; a place already on the map within 50 m under its
  name (or a name one starts with the other) stays one POI. Playgrounds, tracks and fitness stations come from
  `data/areas-more.json`; their ground colour is read from the aerial photo unless OSM says they are paved. Places OSM lacks are listed by hand in `src/map/extra-pois.ts`. Multipolygon
  buildings (a ring round a courtyard, `holes` in the map JSON) come from `data/buildings-rel.json`. Delete one cache
  and run `pnpm map` to refresh only it; docs/poi-id-map.csv maps POI ids across an import that renumbers them.

### The picture: WebGL2, GTA 2 style

The town is drawn in 3D with a small in-repo WebGL2 layer (`src/render/gl/`, no dependencies), like GTA 2:

- **Camera** (`src/render/camera.ts`): GTA 2 close, straight down through a wide 45° lens: about 40 m
  across a 16:10 screen on foot (30 m up), 50 m in a standing car, 90 m at top speed. It trails the
  player and eases its look-ahead (0.55 s of travel) into the driving direction. A 9 m house leans out
  about 5 m at the screen edge, so every block shows tall walls towards the edges like GTA 2. Near the
  few towers (the high-rises, Maria Hilf's and Petruskirche's bell towers) it climbs to stay 12 m above
  the tallest top in view, so no roof clips the lens. At this zoom a ground meter is
  about 70 device pixels, so ground tiles cover at most 6 m of their 512 px. `?compare=` uses an
  orthographic view of the same square instead.
- **Retro pixels and grime**: the town is drawn at half the CSS size and scaled up with
  `image-rendering: pixelated` (`src/ui/Game.tsx`), so it shows GTA 2's chunky pixels while the HUD,
  markers and score popups stay sharp; `?retro=0` draws it at full resolution, `?compare=` always does.
  The streets get dirt (`src/render/scene/grime.ts`): oil stains in the middle of the lanes, cracks along
  the kerbs and a worn dark patch in each junction, drawn with the ground (their alpha dithers in) under
  the shadows. Darker only and sparse: the average frame lightness at the six V spots moved under 1 %.
  A slide, a handbrake turn or a hard stop over 6 m/s leaves two black tyre marks from the rear wheels
  (`src/sim/skids.ts`) that fade out over 30 s.
- **Teleport** (`src/world/teleport.ts`): `?at=edeka`, `?at=fahrzeugtechnik-seitz` (a dressed place or POI by
  name, umlauts spelled out, a prefix is enough), `?at=47.859149,11.490211` (lat,lon) or `?at=4491,4542` (map meters)
  starts you there, on free ground in front of the building. In the console: `__gta.teleport("rathaus")`,
  `__gta.spots()` lists every name.
- **Chunks** (`src/render/scene/scene.ts`): every 128 m chunk is built once into a static vertex buffer
  (about 1 ms, 60 KB) as it comes near the view: lawn and paving (the photo's paved mask, given a one
  pixel hard edge in the shader), land use and water, streets as polygons from the OSM centre lines
  (sidewalk slabs, kerb, asphalt, a dashed centre line on main roads and solid edge lines on them and
  every residential street, cut out at junctions), buildings extruded from their footprints (storeys × 3 m), tree crowns at the photo's
  positions, and shadows. Ground layers lie a few centimetres apart, so the depth test layers them.
- **Facades** (`src/render/scene/facade.ts`): a shop front where a shop is inside or at the wall,
  corrugated metal for halls over 800 m² of up to two storeys, an apartment block from three storeys, a
  Bavarian house otherwise. Texture coordinates are in meters, so windows keep their size; walls facing
  the sun are lit.
- **Roofs**: the footprint at eave height in the two plane colours the photo measured, split along the
  ridge, with clay tile (pitched) or gravel (flat) detail. The DOP40 medians are hazy (median lightness
  0.56, saturation 0.2 over 14k planes), so `roof-tone.ts` grades them: clay becomes saturated
  terracotta or brown, grey tile anthracite, flat roofs light grey gravel, keeping each plane's hue and
  the lit/shaded difference. Pitched roofs get a dark eave line; flat roofs a parapet with a light
  coping and a few vents and air-conditioning boxes.
- **Passes**: opaque (alpha-to-coverage for tree crowns), shadows (each pixel darkened once through the
  stencil), then cars, people and traffic lights as sprites at their height, so buildings hide them.
  Shop labels, the player ring, the minimap and the HUD are 2D on top.

Storeys come from OSM where it has them; otherwise from the building type (`buildingLevels` in
`src/map/build.ts`: garages one, apartments four, the rest two).

**Place dressing** (`src/world/places/`): what makes one real building recognisable is data, one file per
place listed in `index.ts`, keyed by the exact POI name and the street it faces. The OSM footprint
(`osmBuildingId`) stays the building and the solid and takes the overrides: storeys (applied when the
map loads, and baked by `pnpm map`), a facade texture, a wall colour, horizontal wall bands (textured or
plain, like a timber fascia), the roof colour and pitch, and `roof.hip`: a real hipped roof at that pitch, a plane
rising from every wall with hips, valleys and a ridge per wing (`src/render/scene/hip-roof.ts`), instead of the flat
roof at the eaves. Parts are drawn on top and never solid
(`src/render/scene/places.ts`): signs, ground-floor arcades and balcony stacks on a wall of the footprint, square towers
with a pyramid roof (kept inside the footprint by a test, square to the street or to one wall), prop sprites on poles, door canopies
(plain, or with an awning's fabric on top), cross gables (a gabled roof from one wall into the building, hidden where it runs
under the building's own roof, its gable at the wall: the Aldi). With `roof.hip`, `roof.eaves` gives some walls their own eave height and
`roof.gables` ends the roof in a gable at others; the walls' tops then follow the roof (Maria Hilf). Pflegeheim St. Ursula
(`st-ursula.ts`) is the first entry: four storeys, its ochre and cream facade and the brown fascia.
`facade: "render"` is the block's windows on a neutral off-white render (`scripts/facade-render.py`), so
`wallColour` gives a building any render colour instead of darkening the yellow plaster; `facade: "plaster"` is the
same render without windows.

The photo tiles (`pnpm photo`, `scripts/photo-tiles.ts`, `public/photo/`) are no longer drawn; only their
overview is, as the minimap.

### What else comes from the aerial photo

The map, the collision data and the minimap come from OSM plus `pnpm map`, which also reads the DOP40 orthophoto
(`scripts/dop40.ts`: 42 WMS tiles at 1 m/px, cached in `data/dop40/`) inside the OSM geometry
(`src/map/photo.ts`):

- **Roofs**: one median colour per roof plane, stored per building as `roof.colors`, plus `roof.pitched`.
  Every eave owns the part of the roof nearest to it (`src/map/roof.ts`), so long blocks split along
  the ridge, each wing of an L or T gets its own ridge, and short wing ends stay gables. Flat roofs
  keep one colour. The photo leans, so a plane's footprint also catches part of its neighbour: the
  roof's pixels are split into a lit and a shaded tone, and a plane holding clearly more of one tone
  than the roof as a whole gets that tone. Leaves are left out; a plane mostly under a tree takes the
  roof's colour. The renderer paints the planes in those colours and adds tile detail from a texture.
- **Missing sheds and garages**: compact, nearly rectangular patches of roof tile (12–600 m²) away from
  streets, pitches and mapped buildings become one-storey buildings. White flat roofs are not added:
  at 1 m they cannot be told from vans, trailers and bright paving.
- **Shadows**: their direction and length (`SHADOW_DIR`, `SHADOW_PER_M`) were measured in the photo,
  so buildings, trees and cars cast them the way the photo shows (towards the north-east).
- **Trees**: green-and-dark (or green-and-rough) pixels outside forests, fields and building shadows,
  covered with round crowns, biggest first → `public/trees.bin` (~150k crowns, 5 bytes each). Each
  crown gets one of three tones so they vary.
- **Paved ground**: grey pixels (yards, driveways, parking) plus OSM parking lots, cleaned into hard
  shapes (closing fills cars, opening drops specks; green islands in paving under 12 m² are paved
  over, larger ones squared into straight planting strips), as the alpha of `public/ground.png` (2 m/px). The
  renderer gives the mask a hard edge and fills it with smooth light paving.
- Parked cars are not solid: the ones in the photo cannot be told apart at 1 m per pixel, and an
  invisible obstacle is worse than driving through a picture of a car.

Tree crowns over the asphalt of a street are left out, so roads stay readable.

## Playing it (GTA 2 style)

- **HUD** (`src/ui/Hud.tsx`, DOM over the canvas): money top right, lives, health as five hearts, armour as
  a blue shield, the score multiplier, the weapon slot (icon and rounds) under them, wanted level as up to four cop heads at the top centre, the
  job clock and the street name as you turn into it under them (clear of the car in the middle), the car's name as you get in (`src/sim/vehicles.ts`: VW Golf, BMW
  5er, Taxi, Audi A3, Mercedes G, Polizei, VW Bus, Post-Transporter; the Linienbus you ride, not drive), BUSTED / WASTED banners, the
  mission text and clock. H toggles the controls help.
- **Money** (`src/sim/score.ts`): a near miss (passing a car at over 50 km/h with centres 3.4–4.6 m
  apart) pays $50, a drift (sliding over a third sideways at speed) $20 every half second, a kill $10 (an
  officer $50), a car blown up $100. Awards within 5 s of each other build a multiplier up to ×4.
- **Score popups** (`src/render/popups.ts`): every payout puts its number up big like GTA 2: 72 px chunky
  italic digits with a dark outline, rising a meter and fading over 1.2 s, white at ×1, yellow ×2, orange ×3,
  red ×4. Kills and wrecks show on their spot (lifted above the player if it would land on them); near
  misses, drifts and job pay ride just above the player, so they stay readable at top speed. A new one
  stacks above those still standing.
- **Wanted level** (`src/sim/wanted.ts`): ramming cars, knocking people down, entering a junction on red
  and taking a car in front of the police add heat; each whole point is a cop head and one police car.
  Heat cools only after 8 s out of police sight.
- **Police** (`src/sim/police.ts`): they turn up just out of view, drive the shortest street route to
  you (A* over the street graph, `src/world/route.ts`), go straight at you once close, back out of dead
  ends and bump you. From two cop heads the officers get out near you and come on foot with pistols;
  from three they also shoot from the cars at close range (`tactics` in `src/sim/wanted.ts`). Killing
  an officer is a whole cop head; killing anyone, or shooting where the police can see, adds heat too.
  On foot and not fighting back (no shot or punch for 1.5 s), an officer at your side (or a police car
  stopped against you) for 2 s is **BUSTED**; on foot the officers get out at any level to arrest you, and
  police cars push past you instead of driving over you. Shooting back keeps them at a distance:
  half your money, your guns and a life gone, back at Sudetenstraße 19. Losing the last life starts over.
- **Damage** (`src/sim/damage.ts`): one model for the player, pedestrians, police and cars (hp, armour,
  what hit last, fire). Walls, cars and police cars hurt your car; under 35 hp it smokes, under 25 it
  burns, burns down in about four seconds and explodes into a wreck, with you in it if you stayed.
  At 0 hp you are **WASTED**: a life, your guns, your armour and a quarter of your money gone; you wake
  three seconds later at the doctor's nearest home (GTA 2's hospital; Geretsried has practices).
- **Weapons** (`src/sim/weapons.ts`, data; `src/sim/combat.ts`, what they do): fists, pistol,
  submachine gun, shotgun (seven pellets fanned over 24°, 14 m), molotov (thrown up to 18 m, breaks
  into a pool of fire for 6 s), rocket launcher (a rocket that explodes on the first wall, car or person)
  and flamethrower (a 7.5 m cone that sets people alight and cooks cars). Bullets are rays that walls
  stop (`src/sim/hitscan.ts`); cars take a third of a bullet's damage. Explosions do 160 at the centre
  falling off to nothing at 6.5 m, knock people down and throw them back, and shove cars; a car's own
  explosion is bigger (220, 7.5 m), so the next car in a row catches fire and goes up too, GTA 2's
  chain reactions. Shots and bangs send people near running and screaming; every seventh person is
  tough and comes at you with his fists when you hit him. No gore: people fall over, the dead lie
  there for 20 s and fade.
- **Pickups** (`src/sim/pickups.ts`): 40 spots from the map alone (behind shops, away from the street
  they face; in parks and on pitches; on parking lots), 90 m apart, never under a tree crown, the same
  every game, the nearest one to the start a pistol. Walk over one to take it; it is back after 60 s.
- **Payphone jobs** (`src/sim/mission.ts` the job state machine, `src/sim/town-jobs.ts` Geretsried's phones
  and jobs): yellow booths at Sudetenstraße 19, at the bus stop by the Rathaus and one on each gang's turf.
  A phone with work rings (a bell you hear within 70 m, "☎ Telefon klingelt!" in the HUD, the booth
  shakes) and the arrow points at the nearest ringing one; walk up to it on foot to take the job. Three
  kinds, all at real places: fetch and deliver against the clock (Brezn from the Mühlenbäck across town to
  the Rehmaus Apotheke), steal a particular car and drive it somewhere (the Mercedes G in front of the
  Rathaus to the Werkstatt Wilhelm), and blow one up (the Post-Transporter at Filiale 571). A phone's
  jobs come one after the other; busted or wasted, the job is off and the phone rings again once you come
  back. A glowing marker lies at the next stop, a red one under the car the job is about.
- **Save points** (`src/sim/shops.ts`, `src/sim/save.ts`): GTA 2's "Jesus Saves" at the Maria Hilf church
  (and the Petruskirche in Gartenberg): walk onto the glowing cross for $500 and the game is saved to
  localStorage (money, lives, guns, jobs done, gang respect; wrapped in try/catch, so a blocked storage
  only says so). The next game carries on from there, standing at the church.
- **Spray shops**: real car repair shops (Huber's Karosserie-Lack-Center, Werkstatt Wilhelm, Auto Stapf)
  have a glowing spray-can pad; drive onto it for $300 and the car gets a new colour (the sprite's hue
  turned in the shader) and the wanted level drops to zero, so the police lose you.
- **Cafe Waldmann** (`src/world/cafe.ts` the layout, `src/render/scene/cafe.ts` the geometry): OSM has only its node at
  Sudetenstraße 3, so the pavilion from the photos is laid out on the lawn in front of the block, in meters along the
  street: the optician under a red and white awning at its left end, the cafe at its right with a glass front, a dark
  fascia and the script sign on the roof, a terrace under purple umbrellas and the memorial obelisk. Walk in through the
  glass door at the right: the roof fades away completely, so you see the room from above. The layout follows a sketch
  of the real one: the cake counter across the right-hand room (two displays, the espresso machine on the back counter,
  the woman behind it), and through a green-framed doorway the dining room with purple benches, six walnut tables in two
  rows with chairs, and the WC at the back. The walls and furniture are solid (`World.cafe`). Guests
  (`src/sim/guests.ts`) come up the path from the sidewalk, buy a slice at the counter, carry it to a free chair and eat
  it, sometimes use the WC, and walk out to carry on along Sudetenstraße (no free chair: they take it away); a shot sends
  them running out. They are ordinary walkers with a `visit`, so bullets and cars treat them like anyone. Step onto the
  pink heart in front of the display for a slice of cake
  (Schwarzwälder Kirschtorte, Käsekuchen, … from the real menu): $15, full health.
- **Gangs** (`src/sim/gangs.ts`): three gangs with their turf round the OSM places Gartenberg (the
  Gartenberger Krachlederne, green), Stein (the Steiner Steinböcke, blue) and Gelting (the Geltinger
  Bauernmafia, orange, placed between Gelting's town signs, its node lies outside the map); the town
  splits between the nearest. Every fourth pedestrian on a turf wears its colours (tinted, a ring of
  colour at their feet). GTA 2's respect meters sit top left (-100 … 100). Each gang's phone gives a job
  for it: +25 with them, -15 with their rival; killing one of theirs costs 4 (their rival likes it). At
  -25 or less, members near you on their turf come at you with their fists; from 40 up they let a punch go.
- **Hidden packages** (`placePackages` in `src/sim/pickups.ts`): ten spinning parcels tucked behind shops
  and in parks, 350 m apart, $1000 each, counted in the save.
- **Buses** (`src/map/bus.ts` the routes, `src/sim/transit.ts` the lines on the street graph): every bus line
  through the map from OSM's `route=bus` relations, 15 of them, MVV regional buses run by the RVO, Geldhauser and
  deuCon. The **370** (RVO) runs Wolfratshausen (S) – Buchberg – Kirchplatz – Fasanenweg – Schulzentrum –
  Sudetenstraße – Am Stern – Feuerwehrschule – Geretsried, Stein, and back; the 371 (Geldhauser/RVO) ends at
  the Schulzentrum and leaves east for Deisenhofen; the 310 is the town line Erikaweg – Steiner Ring Süd; the
  376, 378 and the school buses 370V, 373V, 377V and 379V come up from Wolfratshausen and Gelting, the 372, 374,
  379 and X970 along the B11, and Wolfratshausen's 301 and 302 just touch the north-west corner at Waldram. A relation's ways are chained in member order (roundabouts driven round from entry to exit), walked
  node by node along the game's streets (a step between nodes that are not neighbours, a member OSM left out,
  is bridged by the shortest way round, at most 500 m) and cut to the map. Of a line's many relations it drives
  the plain pattern (fewest "=>" in the name) with the most stops, and the one that comes back. Platforms
  become ordered, named stops on that path. In the game each line gets one bus per 4 km of its loop (at most
  three), spread round it; a bus is ordinary NPC traffic (`Npc.bus`: same lights, collisions and damage, 12 m,
  the red-and-white RVO livery), but it follows its line instead of turning at random, stands 7 s at each stop
  and at the end of a run carries on with the way back (off the map's edge, it comes back in where that starts).
  **Riding**: F next to a standing bus gets you in; it keeps its route, the camera follows, you cannot steer, and
  the HUD shows the line number, where it goes and the next stop. F while it drives gets you off at the next
  stop (F again takes that back); F while it stands gets you off at once, on the door side. You are put off at
  the last stop in the map, unless you got in there.
- **Bus shelters** (`streetProps` in `src/render/scene/street.ts`): like the real one on Sudetenstraße in front
  of St. Ursula, drawn as geometry for a camera looking down: a long anthracite flat roof with a thin light edge
  on thin dark posts, glass at the back and one end, a back-lit ad panel closing the other, a bench, an orange bin
  on its post, and the green H pole with its blue timetable at the kerb where the bus halts. One at each OSM bus
  stop (and each platform of a line that has none), at the back of the sidewalk.
- **Bottle banks** at OSM's glass recycling points.
- **Sound** (`src/ui/audio.ts`, WebAudio, no files): an engine hum pitched by speed, a two-tone horn (G),
  a German two-tone siren that swells as police cars close in, and gunshots, explosions, flames,
  breaking bottles, punches and cartoon screams from filtered noise and swept tones, quieter with distance. It starts with the first key press.

## What is in the town

- **Shops and places**: every named `shop=*` and the important `amenity=*` from OSM (EDEKA, Penny, Aldi, Lidl, Kaufland, Netto, Rossmann, fuel, police, …) as map labels, minimap dots and a HUD hint.
- **Traffic lights**: the 27 real `highway=traffic_signals` nodes, grouped into junctions with a 46 s cycle (`src/sim/signals.ts`).
  Every lane a light controls gets a white stop line 2.5 m before it (6 m at a junction, where the
  crossing comes first) and a German signal (`src/render/scene/street.ts`): a pole on the right-hand kerb
  standing up in 3D, a mast arm over the lane and the head hanging from it, lit red, amber or green on its
  face and as a glowing dot seen from above. A zebra lies just past each line, with push-button posts at
  both kerbs, and at the zebra and marked crossings OSM maps. NPC cars stop with their bumper behind the
  line; a test drives 60 s of traffic and fails on any car crossing a line at red. Main roads have street
  lamps every 38 m.
- **Street paint and overhead lines** (`src/render/scene/road-paint.ts`): GTA 2's busy streets, in German.
  Words in tall white capitals on the lanes, read by the driver coming up to them: STOP before every stop
  line at the lights, BUS where the bus waits at each stop, 30 12 m into each residential street off a main
  road (the Wohngebiete are Tempo-30 zones; the map has no `maxspeed`, so this is where a zone sign would
  stand), LANGSAM on both lanes 25 m either side of each school and kindergarten (in two rows, LANG first).
  The letters are drawn once into material layers after the texture files (`textures.ts`). Power and phone
  lines hang on poles every 34 m along the residential streets, two dark lines at 8.1 and 8.3 m from pole
  to pole and across each junction, never over a house; being real 3D at that height they lean out from
  the camera and slide against the ground as you drive, with a faint shadow below.
- **Petrol stations** (`src/sim/stations.ts`, `src/render/scene/canopy.ts`): at the four real `amenity=fuel`
  places, a flat sheet-metal canopy at 5 m on pillars (OSM's `building=roof` where mapped, otherwise one
  laid out between the station and its street, clear of buildings) with a coloured band round its edge and
  no walls, so you drive underneath; it fades to see-through while you are under it. Pump islands under
  it, the price sign at the street, an air and water post, and the kiosk gets a shop front. Pump islands
  explode like GTA 2's: shoot or ram one (over 7 m/s) and it catches, burns for a moment and goes up with
  a car-sized blast and a pool of burning petrol, setting off the next island and the cars beside it.
- **Rehmaus Apotheke** (`src/world/places/rehmaus-apotheke.ts`), Sudetenstraße 14, the first courier job's
  drop-off: three storeys in light grey-blue render, a ground-floor arcade of round arches on white pillars
  along its front, "REHMAUS APOTHEKE" in red serif capitals over the pharmacy's four arches (readable when
  the front leans in at the screen edge), and the red pharmacy "A" on its post on the green in front.
- **Sparkasse** (`src/world/places/sparkasse-stein.ts`), the Stein branch at the corner of Händelstraße and
  Johann-Sebastian-Bach-Straße: four storeys, the bank's grey ground floor under two white storeys and a grey
  top storey, tall bank windows with red bands and the red "Sparkasse" with its S logo on the Händelstraße
  face and the corner face, a stack of grey metal balconies at the N end, solar panels along the ridge, and
  the red Sparkasse flag on its pole and a yield sign at the corner.
- **Rathaus Geretsried** (`src/world/places/rathaus.ts`), Karl-Lederer-Platz 1, the hub of the Mercedes G and Taxi
  jobs: an L of two storeys in cream render with ochre window surrounds, teal and white striped shutters and ochre
  pilasters at the corners, under a red-brown hipped roof; in the middle of its plaza front the square clock tower
  rises 3 m over the ridges to a dark shingled pyramid, the clock over "RATHAUS" on its face to the plaza and the
  arched door with grey and white chevron leaves at its foot.
- **Maria Hilf** (`src/world/places/maria-hilf.ts`), the parish church on Johann-Sebastian-Bach-Straße and the "Jesus
  Saves" save point: white render under a grey tent roof whose planes rise from every wall to one apex 18.5 m up, low
  eaves (4.6 m) on the west and north, the porch's gable front to the forecourt in the SE with the round rose window
  over the doors and their flat dark canopy, the big gridded nave window and a side door on the street side, and the
  square white bell tower in the SW corner, 30 m to its eaves with two louvred sound openings on each face, a dark
  slate pyramid and the cross. Heights and roof come from the Bavarian LoD2 building model (© Bayerische
  Vermessungsverwaltung, CC BY 4.0).
- **Mühlenbäck** (`src/world/places/muehlenbaeck.ts`), Sudetenstraße 19, where the game starts: a cream block of three
  storeys under a red-brown hipped roof that ends in a gable at the NW, with its row of shop fronts under a grey fascia
  along the street: HoangAnh's glazing at No. 17, the pink "Angel Nails" board, the bakery with its white "Mühlenbäck"
  board and red round logo over a cream awning and its sidewalk board, a shop with a plain red board and one under a
  long red awning. The three houses and their roofs follow the Bavarian LoD2 model; the shop widths and sign artwork are
  guesses.
- **Deutsche Post Filiale 571** (`src/world/places/post-filiale-571.ts`), Sudetenstraße 34, the place of the job that
  blows up the Post van: an L of white render, three storeys under a brown hipped roof that ends in a gable at the NW,
  with a glass canopy on steel along its shop row on Sudetenstraße; over the newsagent that hosts the Post counter a
  yellow "Deutsche Post" board and the sign band Merkur · LOTTO Bayern · GerLTZ · SZ over AZ, and a yellow letter box and
  a brown bin on the sidewalk by the passage. Storeys and roof follow the Bavarian LoD2 model; the shop widths, the
  canopy's depth and the Post board are guesses.
- **Automobilwerkstatt Wilhelm** (`src/world/places/werkstatt-wilhelm.ts`), Wallensteinstraße 4, the spray shop and the
  Mercedes G job's drop-off: a long, low workshop hall of dark slate-blue metal cladding under a flat light-brown roof,
  4.8 m high as in the Bavarian LoD2 model; on its long NW wall towards the car park the navy "AUTO MOBIL robert
  wilhelm" board with the orange round logo and the EINGANG arrow at the NE end, then a frosted window band in white
  frames with a big "4" on the glass. The band's length, where the sign sits and the logo's orange are guesses.
- **Aldi Süd Stein** (`src/world/places/aldi-sued-stein.ts`), Sudetenstraße 68, where the Steinböcke's VW Bus waits for the
  Krachlederne's job: a white store 5.6 m to its eaves under a dark grey gable roof along its length (not the flat roof
  OSM tags), two cross gables in grey cladding ending at the car-park wall, the ALDI SÜD logo on its navy panel in the
  south one over the entrance, a glass canopy along that front, the trolley shelter's light roof by the corner and two
  blue disabled bays in front. Roof, gables and heights follow the Bavarian LoD2 model and the DOP20 aerial; which gable
  carries the logo, where the doors are and that the canopy is glass are guesses. A new generic part, `gable`, puts a
  cross gable on any wall.
- **Pedestrians**: walk footpaths and the sidewalks along streets (`src/sim/pedestrians.ts`), dodge fast cars, fall over when hit; NPC cars brake for them.
- **Crowd** (`fillCrowd` in `src/sim/game.ts`): like GTA 2, people and moving traffic live only round the camera, so
  every screen has a crowd: about 40 people (on a shop street, a POI within 50 m; 60 % of that in the Wohngebiete) and
  up to 26 cars at the walking view, more as the car camera opens up, capped at the old town-wide 120 people and 70
  cars. Four times a second, new ones come in heading towards you from a ring just out of sight (1.05–1.4 views out
  for people, 1.05–1.7 for cars, a view being the screen's centre to its corner on the ground, `game.view`), and those
  past 1.7 / 2.1 views, or out of sight and on their way out, go. People often walk in twos to fours. After a teleport
  the whole circle is filled at once. Parked cars, buses, cafe guests and cars parking or pulling out keep their own
  rules. Measured 2026-10-26 at ten shop streets 10 s after `__gta.teleport`: 12–32 people and 1–6 moving cars on
  screen, 3 or more cars at eight of ten.

`pnpm map:fetch` downloads every cache: `data/raw.json` (ways), `data/places.json` (shops, lights), `data/places-more.json`
(gyms, health, offices, …), `data/places-next.json` (schools, driving schools, stadiums), `data/areas-more.json`
(playgrounds, tracks), `data/buildings-rel.json` (multipolygon buildings), `data/extra.json` and `data/routes.json`.

## Sprites

Painted by Codex (`codex-images` skill), then keyed, sliced and made seamless by
`python3 scripts/process-sprites.py <codex-dir> [<newer-dir> ...]` into `public/sprites/`.
Trees were prompted with a real aerial photo of Sudetenstraße as reference
(DOP40 © Bayerische Vermessungsverwaltung, CC BY 4.0). The GTA 2 style facades, road, sidewalk, lawn and
clay tiles were painted seamless; the script only resizes them to 512 px and turns the roof tiles (and the
flat-roof gravel) into grey detail that the renderer multiplies with the photo's roof colour.

The combat sheets (weapon icons for the HUD, pickups on glowing pads, muzzle flash, tracer, the explosion's
flash and fireball, smoke, fire, a burnt-out wreck and a scorch mark) are not on a grid: the script cuts
each sprite out by its blob of opaque pixels (`save_blobs`).

The game starts at Sudetenstraße 19 (`START` in `src/sim/game.ts`).

## Layout

| Path | What |
|---|---|
| `src/map/` | Map schema (Effect `Schema`), projection, OSM → map builder, loader |
| `src/world/` | Spatial grid, building collision, "which street am I on", road junction graph |
| `src/sim/` | Car physics, NPC traffic on the road graph, the 60 Hz game step |
| `src/render/` | WebGL2 renderer (`gl/`), 3D chunk and sprite geometry (`scene/`, pure), camera, 2D overlay and minimap |
| `src/ui/` | React shell, HUD, keyboard |

## Checks

`pnpm check` — typecheck (TS 7), oxlint, Vitest (projection, builder, photo reading on synthetic images, triangulation, road and marking geometry, facade choice, the camera, car handling, a 20 s drive that must never clip a building, traffic that stays on roads).

## License of the map data

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the Open Database License (ODbL). `public/geretsried.map.json` is a derived database and stays under the ODbL.

The ground tiles in `public/photo/` are the DOP40 orthophoto, © [Bayerische Vermessungsverwaltung](https://geodaten.bayern.de/opengeodata/)
(www.geodaten.bayern.de), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), **modified**: cut into tiles,
sharpened, contrast and saturation raised, re-encoded as WebP. Roof colours, tree crowns (`public/trees.bin`)
and the paved-ground mask (`public/ground.png`) are derived from the same photo.
