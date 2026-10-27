/**
 * Ground the aerial photo reads wrong, set by hand from photos taken on the spot: inside each polygon (map meters,
 * x, y, … open) the photo's ground class is replaced by `ground`, so no tree crowns grow there, and sheds the photo
 * finds there are dropped (their ids stay as they were, places refer to them).
 */
export type GroundFix = { readonly ground: "paved" | "lawn"; readonly pts: ReadonlyArray<number> }

export const GROUND_FIXES: ReadonlyArray<GroundFix> = [
  // The passage along the Am Stern west block's SE end (way 127872184, wall 1) from Sudetenstraße to denns' door. The
  // DOP has it in the block's shadow with a row of parked cars: it read as lawn, trees and a shed (-156). Alex's photo
  // (reference/denns-biomarkt/40-alex-durchgang.jpg, 2026-10-27) shows open paving from the arcade to the car park and one
  // planting strip of low shrubs about 6 m out, from near Sudetenstraße to just short of denns' end wall. In the street
  // frame of Sudetenstraße there (place AM_STERN_WEST): paving u 3.3–9.3 by n 9.5–16 and u 3.3–16 by n 16–44.5, the
  // strip u 9.6–11.6 by n 15.5–39.5 (the ground mask widens it to about 3 m). The lawn patch at the Sudetenstraße end
  // (u 13.5, n 12) is not in the photo and stays.
  { ground: "paved", pts: [4184.5, 4774.2, 4189.6, 4777.5, 4193.1, 4772, 4188, 4768.8] },
  { ground: "paved", pts: [4188, 4768.8, 4198.7, 4775.6, 4214.1, 4751.6, 4203.4, 4744.8] },
  { ground: "lawn", pts: [4193, 4772.6, 4194.7, 4773.7, 4207.7, 4753.5, 4206, 4752.4] },
]
