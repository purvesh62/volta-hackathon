import { haversineKm, type LatLng } from "./geo";
import type { WorkOrder } from "./types";

export type Priority = "Critical" | "High" | "Medium" | "Low";
export const PRIORITIES: Priority[] = ["Critical", "High", "Medium", "Low"];
export const DURATION_HOURS: Record<Priority, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };

const ROAD_FACTOR = 1.3; // straight-line -> road distance
const SPEED_KMH = 30;

export interface DispatchOptions { teams: number; shiftHours: number; depot: LatLng }
export interface Stop { wo: WorkOrder; priority: Priority; travelMin: number; arrive: number; depart: number }
export interface TeamPlan { id: number; stops: Stop[]; totalHours: number; km: number }
export interface DispatchPlan { teams: TeamPlan[]; unassigned: Record<Priority, number> }

/** Model raised it to High -> treat as Critical. */
export function priorityOf(r: WorkOrder): Priority {
  return r.changed && r.newStatus === "High" ? "Critical" : r.newStatus;
}
export const durationHours = (r: WorkOrder) => DURATION_HOURS[priorityOf(r)];

/**
 * Greedy round-robin: each team, on its turn, takes the nearest job from the highest
 * priority band that still has a job fitting in its remaining shift. No return leg.
 */
export function planDispatch(rows: WorkOrder[], opts: DispatchOptions): DispatchPlan {
  const bands: Record<Priority, WorkOrder[]> = { Critical: [], High: [], Medium: [], Low: [] };
  for (const r of rows) bands[priorityOf(r)].push(r);
  for (const p of PRIORITIES) bands[p].sort((a, b) => (b.ageDays ?? 0) - (a.ageDays ?? 0));

  const teams: TeamPlan[] = Array.from({ length: Math.max(1, opts.teams) }, (_, i) => ({ id: i + 1, stops: [], totalHours: 0, km: 0 }));
  const pos = teams.map(() => opts.depot);
  const active = new Set(teams.map((_, i) => i));

  while (active.size) {
    for (const i of [...active]) {
      const t = teams[i], left = opts.shiftHours - t.totalHours;
      let pick: { p: Priority; idx: number; km: number; hrs: number } | undefined;
      for (const p of PRIORITIES) {
        const dur = DURATION_HOURS[p];
        if (dur > left) continue;
        for (let idx = 0; idx < bands[p].length; idx++) {
          const km = haversineKm(pos[i], bands[p][idx]);
          const hrs = (km * ROAD_FACTOR) / SPEED_KMH;
          if (hrs + dur > left) continue;
          if (!pick || km < pick.km - 1e-9) pick = { p, idx, km, hrs }; // nearest; ties keep older row
        }
        if (pick) break;
      }
      if (!pick) { active.delete(i); continue; }
      const { p, idx, km, hrs } = pick;
      const [r] = bands[p].splice(idx, 1);
      const arrive = t.totalHours + hrs, depart = arrive + DURATION_HOURS[p];
      t.stops.push({ wo: r, priority: p, travelMin: Math.round(hrs * 60), arrive, depart });
      t.totalHours = depart;
      t.km += km * ROAD_FACTOR;
      pos[i] = r;
    }
  }
  const unassigned = Object.fromEntries(PRIORITIES.map((p) => [p, bands[p].length])) as Record<Priority, number>;
  return { teams, unassigned };
}
