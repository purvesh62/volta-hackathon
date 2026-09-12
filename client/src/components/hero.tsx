import Link from "next/link";
import { TIERS, type WorkOrder } from "@/lib/types";
import { TIER_HEX } from "./status-badge";

const NAVY = "#1b3a5c";

function dist(rows: WorkOrder[], key: "oldStatus" | "newStatus") {
  const n = Math.max(rows.length, 1);
  return TIERS.map((t) => ({ t, n: rows.filter((r) => r[key] === t).length })).map((d) => ({ ...d, pct: (d.n / n) * 100 }));
}

function Bar({ label, parts }: { label: string; parts: { t: string; n: number; pct: number }[] }) {
  return (
    <div className="grid grid-cols-[3.5rem_1fr] items-center gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex h-3 overflow-hidden rounded-sm bg-muted">
        {parts.map((p) => (
          <div key={p.t} title={`${p.t}: ${p.n.toLocaleString()}`} style={{ width: `${p.pct}%`, background: TIER_HEX[p.t as keyof typeof TIER_HEX] }} />
        ))}
      </div>
    </div>
  );
}

/** HRM Open Data–style logo disc: navy circle with a steel-blue diagonal. */
function Logo() {
  return (
    <svg viewBox="0 0 48 48" className="size-14 shrink-0" aria-hidden>
      <circle cx="24" cy="24" r="24" fill={NAVY} />
      <path d="M6 34 L30 4 A24 24 0 0 1 42 12 L14 42 A24 24 0 0 1 6 34Z" fill="#3f6b8e" />
    </svg>
  );
}

/** Header in the style of the HRM Open Data dataset page: white card, navy type, publisher line, Summary. */
export function Hero({ rows }: { rows: WorkOrder[] }) {
  const changed = rows.filter((r) => r.changed).length;
  const oldD = dist(rows, "oldStatus"), newD = dist(rows, "newStatus");
  return (
    <header className="border-b bg-white">
      <div className="h-1.5" style={{ background: NAVY }} />
      <div className="mx-auto grid w-full max-w-[1400px] gap-8 px-6 py-8 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: NAVY }}>Cityworks Work Orders - re-prioritised</h1>
          <div className="mt-4 flex items-center gap-4">
            <Logo />
            <div className="leading-snug">
              <div className="text-lg font-semibold" style={{ color: NAVY }}>HRM Open Data</div>
              <div className="text-base" style={{ color: NAVY }}>Halifax Regional Municipality</div>
            </div>
          </div>
          <h2 className="mt-6 text-xl font-semibold" style={{ color: NAVY }}>Summary</h2>
          <p className="mt-2 max-w-[70ch] text-base leading-relaxed text-foreground/85">
            Open work orders from Cityworks, the municipality&apos;s work order management system, limited to right-of-way
            maintenance carried out by Public Works: streets, sidewalks and trees. Each of the {rows.length.toLocaleString()} open
            orders is scored against {(95_801).toLocaleString()} closed ones and given a suggested priority that is never lower than
            today&apos;s — {changed.toLocaleString()} moved up. Open a row to read why.
          </p>
          <Link href="/dispatch" className="mt-4 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-white hover:opacity-90" style={{ background: NAVY }}>
            Plan today&apos;s tree crews →
          </Link>
        </div>
        <div className="rounded-lg border bg-background p-5">
          <div className="mb-3 text-sm font-semibold" style={{ color: NAVY }}>Priority mix, before and after</div>
          <div className="space-y-3">
            <Bar label="Before" parts={oldD} />
            <Bar label="After" parts={newD} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            {newD.map((d) => (
              <span key={d.t} className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: TIER_HEX[d.t] }} />
                {d.t} <span className="num text-foreground">{d.n.toLocaleString()}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
