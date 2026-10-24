const EARTH_RADIUS_M = 6_371_000
const RAD = Math.PI / 180

export type LatLon = { readonly lat: number; readonly lon: number }

/** Bounding box in degrees. `north`/`west` become the map's (0, 0). */
export type Bbox = { readonly south: number; readonly west: number; readonly north: number; readonly east: number }

/**
 * Equirectangular projection around the bbox's north-west corner.
 * A town is a few km wide, so the error stays under a meter.
 */
export const makeProjection = (bbox: Bbox) => {
  const cosLat = Math.cos(((bbox.north + bbox.south) / 2) * RAD)
  const x = (lon: number) => (lon - bbox.west) * RAD * EARTH_RADIUS_M * cosLat
  const y = (lat: number) => (bbox.north - lat) * RAD * EARTH_RADIUS_M
  return {
    width: x(bbox.east),
    height: y(bbox.south),
    toMeters: (p: LatLon): readonly [number, number] => [x(p.lon), y(p.lat)],
    toLatLon: (mx: number, my: number): LatLon => ({
      lat: bbox.north - my / (RAD * EARTH_RADIUS_M),
      lon: bbox.west + mx / (RAD * EARTH_RADIUS_M * cosLat),
    }),
  }
}
