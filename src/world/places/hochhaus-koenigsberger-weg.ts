import type { Rgba } from "#/render/scene/mesh.ts"
import type { PlaceDressing, WallBand } from "./dressing.ts"

/**
 * The nine-storey high-rise on Königsberger Weg in Stein, south of Breslauer Weg: way 127872287 (building=yes, no
 * name, no levels; OSM's default of 2 storeys is wrong), 271 m² in a stepped, Z-shaped outline. No POI marks it, so the
 * place hangs on the footprint's middle and on Königsberger Weg. House numbers are left out on purpose (private homes).
 *
 * The Bavarian LoD2 model (2026) has a hip roof and a height of 26.05 m; the photos show a very low one. The walls
 * therefore stand 25 m to the eaves (the model's 26.05 m is the ridge) and the roof is hipped at 10°, which in this
 * outline rises about a meter to the ridge. 25 m is nine storeys of 2.78 m.
 *
 * Alex's photos 42 (the high-rise from the garage side) and 43 (Königsberger Weg towards it), 2026-10-26, overcast
 * (reference/wohnblock-koenigsberger-weg/, docs/places/wohnblock-koenigsberger-weg.md): counted from the bottom, the
 * bottom two storeys are dark grey plaster; storeys 3 to 9 beige, with three wide light-grey bands over the windows of
 * storeys 6, 7 and 8, beige strips between them and one beige storey above; a dark brown eave board under a low hip
 * roof. Bands here run round all walls, so the grey is on every face, not only the corner bays 42 shows it on.
 * Guesses: the exact heights of the bands and the strips between them (read off 42 against the window rows), the roof's
 * colour (only the eave board is seen), the pitch, and the hexes. The wall colours multiply the "render" texture
 * (mean #cbcdce, so a colour of 224 shows as about 178): they are chosen so the result lands on the docs' photo samples
 * (beige #a39685, dark grey #615d54) nudged towards the photo's hue, with the light-grey bands a little lighter than
 * the beige as in 42, all under the town's white plaster. The "block" texture is already tan and turned the grey
 * bands brown, so the plainer render is used.
 * Left out: the orange-brown balcony edges on one corner, the downpipes, the yellow garage in front (a separate
 * building), and the neighbouring three-storey blocks (V-2 sets their storeys).
 */
const BEIGE: Rgba = [224, 204, 164, 255]
const DARK_GREY: Rgba = [128, 122, 110, 255]
const LIGHT_GREY: Rgba = [234, 236, 241, 255]
/** The dark brown of the eave board in 42; the roof planes are a shade lighter. */
const ROOF: Rgba = [86, 68, 58, 255]

/** The eaves and the hip roof's pitch; the LoD2 ridge at 26.05 m. */
const EAVES = 25
const PITCH = 10
const STOREY = EAVES / 9

/** The grey bands over the windows of storeys 6, 7 and 8, a strip of beige between; the bottom two storeys dark grey. */
const grey = (storey: number): WallBand => ({ z0: (storey - 1) * STOREY + 0.5, z1: storey * STOREY + 0.1, colour: LIGHT_GREY })

export const HOCHHAUS_KOENIGSBERGER_WEG: PlaceDressing = {
  poi: "Hochhaus Königsberger Weg",
  street: "Königsberger Weg",
  osmBuildingId: 127872287,
  levels: EAVES / 3,
  facade: "render",
  wallColour: BEIGE,
  bands: [{ z0: 0, z1: 2 * STOREY, colour: DARK_GREY }, grey(6), grey(7), grey(8)],
  roof: { colour: ROOF, hip: PITCH },
  parts: [],
}
