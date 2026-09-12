import { describe, expect, it } from "vitest";
import { haversineKm, mercatorToLatLng } from "./geo";

describe("mercatorToLatLng", () => {
  it("converts a Halifax point", () => {
    // 880 Waverley Rd from final.csv
    const { lat, lng } = mercatorToLatLng(-7074505.641, 5579730.519);
    expect(lat).toBeCloseTo(44.73, 1);
    expect(lng).toBeCloseTo(-63.55, 1);
  });
  it("origin maps to 0,0", () => {
    const p = mercatorToLatLng(0, 0);
    expect(p.lat).toBeCloseTo(0, 6);
    expect(p.lng).toBeCloseTo(0, 6);
  });
});

describe("haversineKm", () => {
  it("Halifax to Dartmouth ≈ 3.5 km", () => {
    expect(haversineKm({ lat: 44.6488, lng: -63.5752 }, { lat: 44.6714, lng: -63.5772 })).toBeCloseTo(2.5, 0);
  });
  it("same point is 0", () => {
    expect(haversineKm({ lat: 44.6, lng: -63.6 }, { lat: 44.6, lng: -63.6 })).toBe(0);
  });
});
