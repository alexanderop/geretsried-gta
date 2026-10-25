import type { PlaceDressing } from "./dressing.ts"

/**
 * Pfarrkirche Maria Hilf, Johann-Sebastian-Bach-Straße: the save point
 * ("Jesus Saves", sim/shops.ts). A white church of the 1960s under a grey
 * tent roof: the Bavarian LoD2 building model (2026) has its planes rising
 * at about 39.5° from every wall to one apex 19 m up, the eaves 9.4 m over
 * the south and east walls and 4.6 m over the west and north ones, a gabled
 * porch on the SE wall (the gable front with the rose window over the door
 * and its flat dark canopy, as the parish's photos show it) and the square
 * bell tower at the SW corner, 29.8 m to its eaves with a 6 m pyramid of
 * dark slate and the cross on top. Where the big nave window and the side
 * door sit on the south wall is a guess (docs/places/maria-hilf.md).
 */
const WHITE = [245, 245, 243, 255] as const
/** The walls' height on the south and east (three storeys); the low ones are roof.eaves. */
const LEVELS = 3

export const MARIA_HILF: PlaceDressing = {
  poi: "Maria Hilf",
  street: "Johann-Sebastian-Bach-Straße",
  osmBuildingId: 127604845,
  levels: LEVELS,
  // Window-less white render, the tint taking the neutral plaster to about #e6e6e4.
  facade: "plaster",
  wallColour: WHITE,
  // The grey tent roof: every wall's plane at 39.5° (LoD2), the west and north walls (7, 8, 0, 1) with their eaves at
  // 4.6 m, so the apex lies towards the SE as in the model; the SE wall (4) is the porch's gable front.
  roof: { colour: [150, 148, 140, 255], hip: 39.5, eaves: [{ edges: [7, 8, 0, 1], z: 4.6 }], gables: [4] },
  parts: [
    // The bell tower in the SW corner, square to the south wall (wall 6 runs from the corner, u = 0, east): white
    // render, 29.8 m to its eaves, a dark slate pyramid 6 m high, the cross; two louvred sound openings per face.
    {
      kind: "tower",
      edge: 6,
      rect: [0.5, 6.6, 0.05, 6.25],
      h: 29.8,
      roofH: 6,
      colours: { wall: [232, 232, 230, 255], roof: [66, 82, 88, 255], finial: [58, 58, 56, 255] },
      faces: ([0, 1, 2, 3] as const).map((side) => ({ texture: "church-belfry", side, u0: 0, u1: side % 2 === 0 ? 6.1 : 6.2, z0: 20.5, z1: 29.5 }) as const),
    },
    // The gable front on the porch (wall 4, 10.6 m from its S end): the doors under a flat dark canopy and the rose window.
    { kind: "wallSign", texture: "church-door", edge: 4, u0: 4.0, u1: 6.6, z0: 0, z1: 3.2 },
    { kind: "canopy", edge: 4, u0: 3.1, u1: 7.5, z: 3.6, depth: 1.6, colour: [52, 62, 57, 255] },
    { kind: "wallSign", texture: "church-rose", edge: 4, u0: 3.6, u1: 7.0, z0: 5.6, z1: 9.0 },
    // The south wall to the street: the big gridded nave window next to the tower (where Street View sees it, clear of
    // the kerb tree), then a side door under its canopy.
    { kind: "wallSign", texture: "church-window", edge: 6, u0: 7.5, u1: 11.5, z0: 1.8, z1: 7.8 },
    { kind: "wallSign", texture: "church-door", edge: 6, u0: 12.6, u1: 14.8, z0: 0, z1: 2.9 },
    { kind: "canopy", edge: 6, u0: 12.2, u1: 15.2, z: 3.2, depth: 1.3, colour: [52, 62, 57, 255] },
  ],
}
