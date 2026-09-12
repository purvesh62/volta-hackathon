import { describe, expect, it } from "vitest";
import { durationHours, planDispatch, priorityOf, type DispatchOptions } from "./dispatch";
import type { WorkOrder } from "./types";

let n = 0;
function wo(p: Partial<WorkOrder>): WorkOrder {
  n++;
  return {
    id: String(n), workType: "Pothole", assetType: "TRN_STREET", assetGroup: "", address: `${n} Main St`, district: "1",
    streetClass: "", cause: "", dateInitiated: null, ageDays: 0, oldStatus: "Low", newStatus: "Low", changed: false,
    newDescription: "", lat: 44.65, lng: -63.6, ...p,
  };
}
const DEPOT = { lat: 44.65, lng: -63.6 };
const OPTS: DispatchOptions = { teams: 1, shiftHours: 8, depot: DEPOT };

describe("priorityOf / durationHours", () => {
  it("raised-to-High is Critical (4h)", () => {
    const r = wo({ oldStatus: "Medium", newStatus: "High", changed: true });
    expect(priorityOf(r)).toBe("Critical");
    expect(durationHours(r)).toBe(4);
  });
  it("High 3h, Medium 2h, Low 1h", () => {
    expect(durationHours(wo({ newStatus: "High" }))).toBe(3);
    expect(durationHours(wo({ newStatus: "Medium" }))).toBe(2);
    expect(durationHours(wo({ newStatus: "Low" }))).toBe(1);
  });
});

describe("planDispatch", () => {
  it("higher priority stops first, even if farther", () => {
    const low = wo({ newStatus: "Low", lat: 44.651, lng: -63.6 }); // ~100 m
    const high = wo({ newStatus: "High", lat: 44.70, lng: -63.6 }); // ~5 km
    const plan = planDispatch([low, high], OPTS);
    expect(plan.teams[0].stops.map((s) => s.wo.id)).toEqual([high.id, low.id]);
  });

  it("within a band, picks nearest to current position", () => {
    const far = wo({ newStatus: "Medium", lat: 44.75, lng: -63.6 });
    const near = wo({ newStatus: "Medium", lat: 44.66, lng: -63.6 });
    const plan = planDispatch([far, near], OPTS);
    expect(plan.teams[0].stops.map((s) => s.wo.id)).toEqual([near.id, far.id]);
  });

  it("respects shift hours and reports unassigned", () => {
    const rows = [wo({ newStatus: "High" }), wo({ newStatus: "High" }), wo({ newStatus: "High" })]; // 3h each
    const plan = planDispatch(rows, OPTS);
    expect(plan.teams[0].stops).toHaveLength(2);
    expect(plan.teams[0].totalHours).toBeLessThanOrEqual(8);
    expect(plan.unassigned.High).toBe(1);
  });

  it("falls to lower band when higher does not fit", () => {
    const rows = [wo({ newStatus: "High" }), wo({ newStatus: "High" }), wo({ newStatus: "High" }), wo({ newStatus: "Low" })];
    const plan = planDispatch(rows, OPTS);
    expect(plan.teams[0].stops.map((s) => s.wo.newStatus)).toEqual(["High", "High", "Low"]);
  });

  it("splits work across teams without duplicates", () => {
    const rows = Array.from({ length: 6 }, (_, i) => wo({ newStatus: "Medium", lat: 44.65 + i * 0.01 }));
    const plan = planDispatch(rows, { ...OPTS, teams: 2 });
    const ids = plan.teams.flatMap((t) => t.stops.map((s) => s.wo.id));
    expect(plan.teams).toHaveLength(2);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(6);
  });

  it("stops carry arrive/depart in hours from shift start and travel minutes", () => {
    const a = wo({ newStatus: "Low", lat: 44.65, lng: -63.6 }); // at depot
    const plan = planDispatch([a], OPTS);
    const s = plan.teams[0].stops[0];
    expect(s.travelMin).toBe(0);
    expect(s.arrive).toBe(0);
    expect(s.depart).toBe(1);
  });

  it("ties within band broken by age desc", () => {
    const young = wo({ newStatus: "Low", ageDays: 10 });
    const old = wo({ newStatus: "Low", ageDays: 1000 });
    const plan = planDispatch([young, old], OPTS);
    expect(plan.teams[0].stops[0].wo.id).toBe(old.id);
  });
});
