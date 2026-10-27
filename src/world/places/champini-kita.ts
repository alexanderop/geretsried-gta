import type { PlaceDressing } from "./dressing.ts"

/**
 * Champini Sport- & Bewegungskita, Jeschkenstraße 103 (B6d-16): the kindergarten S of Jeschkenstraße, a white
 * two-storey flat-roofed block (way 524105770, 32 × 14.5 m). Its POI is the one I-1/I-2 made from the kindergarten
 * (merged with the grounds way 1271723889). The Bavarian LoD2 model (`107585788`) has it flat at 6.5 m: 5.9 m of wall
 * and the 0.6 m parapet. The street front is wall 1 (32 m, faces 19°), u 0 at its E end.
 *
 * Street View (Aug 2022): 01 (looking S, the E and middle part) and 02 (looking SW, the W part) show white render, a dark
 * plinth (#2a2f33), three double windows on each floor, a tall stair window, the recessed lime-green entrance near the E
 * end, and lime-green (#8b954b) patches at window height (not one band between the floors): on the ground floor only
 * between the three windows, on the upper floor from the first window on to 3 m short of the W end. The front is one
 * texture drawn from those measurements (scripts/process-sprites.py, `champini-front`): metres along the wall from both
 * photos with the pano's position fitted to the two corners (the corners came out 31.95 m apart), heights from the
 * nearest wall (54 px/m). The roof stays the map's (≈ DOP).
 *
 * Guesses: positions to about ±1 m (01 and 02 put the middle window 1.5 m apart; their mean is used), the recess's
 * width (4.2 m, seen far and at a slant). Not built: the white banner over the entrance ("CHAMPINI" in letters of
 * several colours, the colours and the subtitle not legible), the window decorations, the lamps between the
 * ground-floor windows, the railings and the bus stop. The other walls are not seen: the engine's facade.
 */
export const CHAMPINI_KITA: PlaceDressing = {
  poi: "Champini Sport- & Bewegungskita Geretsried",
  street: "Jeschkenstraße",
  osmBuildingId: 524105770,
  levels: 5.9 / 3,
  parts: [{ kind: "wallSign", texture: "champini-front", edge: 1, u0: 0, u1: 32, z0: 0, z1: 6.5 }],
}
