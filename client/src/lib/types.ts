export type Tier = "Low" | "Medium" | "High";
export const TIERS: Tier[] = ["Low", "Medium", "High"];
export const TIER_ORDER: Record<Tier, number> = { Low: 0, Medium: 1, High: 2 };

export type AssetType = "TRN_SECTRAV" | "TRN_STREET" | "AST_TREE";
export const ASSET_TYPES: AssetType[] = ["TRN_SECTRAV", "TRN_STREET", "AST_TREE"];

export interface WorkOrder {
  id: string;
  workType: string;
  assetType: AssetType;
  assetGroup: string;
  address: string;
  district: string;
  streetClass: string;
  cause: string;
  dateInitiated: string | null; // ISO yyyy-mm-dd
  ageDays: number | null;
  oldStatus: Tier;
  newStatus: Tier;
  changed: boolean;
  newDescription: string;
  lat: number;
  lng: number;
}
