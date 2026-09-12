import { describe, expect, it } from "vitest";
import { mercatorToLatLng } from "./geo";

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
