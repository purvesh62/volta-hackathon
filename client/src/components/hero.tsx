import { TIERS, type WorkOrder } from "@/lib/types";
import { TIER_HEX } from "./status-badge";

function dist(rows: WorkOrder[], key: "oldStatus" | "newStatus") {
  const n = Math.max(rows.length, 1);
  return TIERS.map((t) => ({ t, n: rows.filter((r) => r[key] === t).length })).map((d) => ({ ...d, pct: (d.n / n) * 100 }));
}

function Bar({ label, parts }: { label: string; parts: { t: string; n: number; pct: number }[] }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr] items-center gap-3">
      <span className="text-sm text-white/70">{label}</span>
      <div className="flex h-3 overflow-hidden rounded-sm bg-white/10">
        {parts.map((p) => (
          <div key={p.t} title={`${p.t}: ${p.n.toLocaleString()}`} style={{ width: `${p.pct}%`, background: TIER_HEX[p.t as keyof typeof TIER_HEX] }} />
        ))}
      </div>
    </div>
  );
}

/** Navy band: title, what this is, and the one picture that matters — how priority mass moved. */
export function Hero({ rows }: { rows: WorkOrder[] }) {
  const changed = rows.filter((r) => r.changed).length;
  const oldD = dist(rows, "oldStatus"), newD = dist(rows, "newStatus");
  return (
    <section className="bg-ink text-white">
      <div className="mx-auto grid w-full max-w-[1400px] gap-8 px-6 py-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div className="space-y-3">
          <p className="text-sm text-white/60">Halifax Regional Municipality · Cityworks</p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">Open work orders, re-prioritised</h1>
          <p className="max-w-[60ch] text-base leading-relaxed text-white/75">
            {rows.length.toLocaleString()} open street, sidewalk and tree work orders, scored against {(95_801).toLocaleString()} closed ones.
            The model only ever raises priority — {changed.toLocaleString()} moved up, the rest keep what they had. Open a row to see why.
          </p>
        </div>
        <div className="space-y-3 rounded-lg bg-white/5 p-5 ring-1 ring-white/10">
          <Bar label="Before" parts={oldD} />
          <Bar label="After" parts={newD} />
          <div className="flex flex-wrap gap-x-5 gap-y-1 pt-1 text-xs text-white/70">
            {newD.map((d) => (
              <span key={d.t} className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: TIER_HEX[d.t] }} />
                {d.t} <span className="num text-white">{d.n.toLocaleString()}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
