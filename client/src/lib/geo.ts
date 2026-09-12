const R = 6378137; // EPSG:3857 sphere radius (m)

/** Web Mercator (EPSG:3857) metres -> WGS84 degrees. */
export function mercatorToLatLng(x: number, y: number): { lat: number; lng: number } {
  const lng = (x / R) * (180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI);
  return { lat, lng };
}
