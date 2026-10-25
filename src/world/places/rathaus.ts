import type { PlaceDressing } from "./dressing.ts"

/**
 * Rathaus Geretsried, Karl-Lederer-Platz 1: the job hub (the Mercedes G and
 * Taxi jobs start here, the payphone is at the bus stop). An L of two
 * storeys (OSM has no `building:levels`; the engine would make the 1066 m²
 * hall corrugated metal) in cream render with ochre window surrounds and
 * teal and white striped shutters (facade-rathaus), ochre pilasters at the
 * outer corners, and a red-brown hipped roof over both wings. The square
 * clock tower with "RATHAUS" under the clock stands in the middle of the
 * front on the plaza (walls 6 and 5, 36.8 m from the S corner to the N one),
 * its arched door with the chevron leaves at its foot. Which wall carries
 * the tower, its size and its height need a photo (docs/places/rathaus.md):
 * Commons shows it mid-front, the doc and the DOP40 put that front on the
 * plaza side. The red-brick plaza is not laid: the aerial shows light paving
 * there and the photosphere that shows the brick is not on disk.
 */
const OCHRE = [219, 178, 103, 255] as const
const CREAM = [233, 222, 205, 255] as const
/** The walls' height: two storeys. */
const EAVES = 6
/** An ochre pilaster 0.6 m wide at one end of wall `edge` (`at` its length for the far end). */
const pilaster = (edge: number, at: number) => ({ kind: "wallSign", texture: "rathaus-quoins", edge, u0: Math.max(0, at - 0.6), u1: Math.max(0.6, at), z0: 0, z1: EAVES }) as const

export const RATHAUS: PlaceDressing = {
  poi: "Rathaus Geretsried",
  street: "Karl-Lederer-Platz",
  osmBuildingId: 92735882,
  levels: 2,
  facade: "rathaus",
  // The painted render is the cream (#e9decd lit), without the random tint other buildings get.
  wallColour: [255, 255, 255, 255],
  // The tiles' red-brown from the photos (the DOP40's #a68670 is hazy), hipped at 42°: the ridges about 7 m over the eaves.
  roof: { colour: [147, 84, 52, 255], hip: 42 },
  parts: [
    // The outer corners, both walls of each (walls run from their left end seen from outside: point i + 1 is u = 0).
    pilaster(8, 0),
    pilaster(0, 15.62),
    pilaster(0, 0),
    pilaster(1, 33.99),
    pilaster(2, 0),
    pilaster(3, 3.77),
    pilaster(4, 0),
    pilaster(5, 30.44),
    pilaster(6, 0),
    pilaster(7, 33.14),
    // The tower in the middle of the plaza front (wall 6 is its S 6.4 m, so the middle is wall 5's u 12), square to
    // wall 5 and just inside it: 16 m to the cornice, 3 m over the ridges, a dark shingled pyramid with its finial.
    {
      kind: "tower",
      edge: 5,
      rect: [9.5, 14.5, 0.35, 5.35],
      h: 16,
      roofH: 4.5,
      colours: { wall: CREAM, roof: [90, 80, 65, 255], trim: OCHRE, finial: [70, 66, 58, 255] },
      // The clock over "RATHAUS" on the face to the plaza, above the eaves where the roof no longer hides it.
      faces: [{ texture: "rathaus-tower", side: 0, u0: 0.55, u1: 4.45, z0: 10.4, z1: 15.3 }],
    },
    // The tower's foot in the front wall: its quoins either side and the arched door between them.
    pilaster(5, 10.1),
    pilaster(5, 14.5),
    { kind: "wallSign", texture: "rathaus-door", edge: 5, u0: 10.7, u1: 13.3, z0: 0, z1: 3.25, out: 0.08 },
  ],
}
