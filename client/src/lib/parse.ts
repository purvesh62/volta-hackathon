import Papa from "papaparse";
import { mercatorToLatLng } from "./geo";
import { ASSET_TYPES, type AssetType, type Tier, type WorkOrder } from "./types";

type Raw = Record<string, string>;

const DAY_MS = 86_400_000;

function tier(v: string | undefined): Tier {
  if (v === "High" || v === "Critical") return "High";
  if (v === "Medium") return "Medium";
  return "Low";
}

/** "12/14/2018 12:00:00 PM" -> "2018-12-14"; anything else -> null */
function isoDate(v: string | undefined): string | null {
  const m = v?.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[1]}-${m[2]}` : null;
}

function toRow(r: Raw, today: Date): WorkOrder | null {
  const x = Number(r.X_COORDINATE), y = Number(r.Y_COORDINATE);
  if (!r.WORK_ORDER_ID || !r.X_COORDINATE || !r.Y_COORDINATE || Number.isNaN(x) || Number.isNaN(y)) return null;
  const assetType = ASSET_TYPES.includes(r.ASSET_TYPE as AssetType) ? (r.ASSET_TYPE as AssetType) : "TRN_SECTRAV";
  const dateInitiated = isoDate(r.DATE_INITIATED);
  const oldStatus = tier(r.OLD_STATUS), newStatus = tier(r.NEW_STATUS);
  return {
    id: r.WORK_ORDER_ID,
    workType: r.DESCRIPTION ?? "",
    assetType,
    assetGroup: r.ASSET_GROUP ?? "",
    address: r.ADDRESS ?? "",
    district: r.DISTRICT ?? "",
    streetClass: r.STREET_CLASSIFICATION ?? "",
    cause: r.WORK_ORDER_CAUSE ?? "",
    dateInitiated,
    ageDays: dateInitiated
      ? Math.floor((today.getTime() - new Date(dateInitiated + "T00:00:00Z").getTime()) / DAY_MS)
      : null,
    oldStatus,
    newStatus,
    changed: oldStatus !== newStatus,
    newDescription: r.NEW_DESCRIPTION ?? "",
    ...mercatorToLatLng(x, y),
  };
}

export function parseWorkOrders(csv: string, today = new Date()): { rows: WorkOrder[]; skipped: number } {
  const { data } = Papa.parse<Raw>(csv, { header: true, skipEmptyLines: true });
  const rows: WorkOrder[] = [];
  let skipped = 0;
  for (const r of data) {
    const w = toRow(r, today);
    if (w) rows.push(w); else skipped++;
  }
  return { rows, skipped };
}
