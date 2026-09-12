import type { AssetType, Tier, WorkOrder } from "./types";

export interface Filters {
  q: string;
  assetType: AssetType | "all";
  newStatus: Tier | "all";
  changedOnly: boolean;
}

export const DEFAULT_FILTERS: Filters = { q: "", assetType: "all", newStatus: "all", changedOnly: false };

export function applyFilters(rows: WorkOrder[], f: Filters): WorkOrder[] {
  const q = f.q.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.assetType !== "all" && r.assetType !== f.assetType) return false;
    if (f.newStatus !== "all" && r.newStatus !== f.newStatus) return false;
    if (f.changedOnly && !r.changed) return false;
    if (q && !(r.id.toLowerCase().includes(q) || r.address.toLowerCase().includes(q) || r.workType.toLowerCase().includes(q))) return false;
    return true;
  });
}
