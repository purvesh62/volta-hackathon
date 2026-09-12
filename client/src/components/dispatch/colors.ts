import type { Priority } from "@/lib/dispatch";
import { TIER_HEX } from "@/components/status-badge";

export const TEAM_HEX = ["#0e7c86", "#7c3aed", "#0369a1", "#b45309", "#15803d", "#be185d", "#4d7c0f", "#6d28d9", "#0f766e", "#9f1239"];
export const teamHex = (i: number) => TEAM_HEX[i % TEAM_HEX.length];

export const PRIORITY_HEX: Record<Priority, string> = { Critical: "#7a0c18", ...TIER_HEX };

const SHIFT_START = 8; // 08:00
export function clock(hoursFromStart: number): string {
  const m = Math.round((SHIFT_START + hoursFromStart) * 60);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
