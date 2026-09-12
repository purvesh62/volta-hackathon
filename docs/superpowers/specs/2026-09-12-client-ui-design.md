# Client UI — HRM Work Order Re-triage Dashboard

Date: 2026-09-12. Status: approved.

## Purpose

Hackathon UI for a (hypothetical) HRM department to browse OPEN work orders sorted by the
model's `NEW_STATUS`, see how it differs from `OLD_STATUS`, and read why (`NEW_DESCRIPTION`).
Read-only. No DB — `data/processed/final.csv` (4,361 rows, 23 cols, ~2 MB) is the source.

## Stack

Next.js 15 (App Router, TypeScript), Tailwind, shadcn/ui, `@tanstack/react-table`,
`papaparse`, `react-leaflet` + `leaflet`. Lives in `client/`. Node 22.

## Data

`src/lib/types.ts`
```ts
type Tier = "Low" | "Medium" | "High";
const TIER_ORDER: Record<Tier, number> = { Low: 0, Medium: 1, High: 2 };
interface WorkOrder {
  id: string; workType: string; assetType: string; assetGroup: string;
  address: string; district: string; streetClass: string; cause: string;
  dateInitiated: string | null;   // ISO date
  ageDays: number | null;
  oldStatus: Tier; newStatus: Tier; changed: boolean;
  newDescription: string;
  lat: number; lng: number;
}
```

`src/lib/geo.ts` — `mercatorToLatLng(x, y)` (EPSG:3857 → WGS84).

`src/lib/data.ts` — `server-only`. `loadWorkOrders(): Promise<WorkOrder[]>`:
- path = `process.env.FINAL_CSV ?? path.resolve(process.cwd(), "../data/processed/final.csv")`
- `fs.readFile` → papaparse (header, skipEmptyLines) → map rows to `WorkOrder`
- `PRIORITY`/`OLD_STATUS` `Critical` → `High`; blank tier → `Low`
- `DATE_INITIATED` `MM/DD/YYYY hh:mm:ss AM` → ISO; unparsable → null
- wrapped in React `cache()`; page is `dynamic = "force-dynamic"` so rerunning the pipeline
  and reloading shows new data
- missing file → throws `CsvMissingError`; page catches and renders "Run the pipeline" notice

## UI

`app/page.tsx` (server) → `loadWorkOrders()` → `<Dashboard rows={rows} />` (client).

`Dashboard` owns filter state and derives `filtered`:
- `q` — substring match on id / address / workType (case-insensitive)
- `assetType` — all | TRN_SECTRAV | TRN_STREET | AST_TREE
- `newStatus` — all | High | Medium | Low
- `changedOnly` — boolean

Children:
- `SummaryCards` (over `filtered`): total; High / Medium / Low by newStatus; changed
  count with breakdown text (e.g. "45 Low→High · 9 Low→Medium · 4 Medium→High").
- `Toolbar`: search input, two selects, changed-only switch, result count.
- `Tabs` Table | Map (shadcn Tabs).
- `WoTable` (TanStack): columns — id, workType, address, district, assetType,
  `oldStatus` badge, `newStatus` badge (row tinted when changed), dateInitiated, ageDays.
  Default sort: newStatus desc (custom `tierSort` via `TIER_ORDER`), then `changed` desc.
  Column headers toggle sort. Row click toggles expanded row showing `newDescription`.
  Pagination 50/page with prev/next + page x of y.
- `WoMap`: `next/dynamic(..., { ssr: false })`. Leaflet `CircleMarker` per filtered row,
  colour by newStatus (High red, Medium amber, Low slate); `Popup` with id, workType, address,
  `old → new`. Fit bounds to Halifax on mount. OSM tiles.
- `StatusBadge`: colour-coded tier badge (shared by table/cards/map popup).

## Error handling

- CSV missing → notice with the command to regenerate.
- Bad row (missing id or coords) → skipped, counted, logged once server-side.

## Testing

Vitest: `geo.test.ts` (known Halifax point round-trips within 1e-4°), `data.test.ts`
(parse fixture CSV of 3 rows: tier mapping, Critical→High, date parse, changed flag,
skips row without coords). UI checked manually via `npm run dev`.

## Out of scope

DB, auth, editing/persisting status, deploy config, tree-inventory overlay.
