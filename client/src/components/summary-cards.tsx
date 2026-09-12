import { TIERS, type WorkOrder } from "@/lib/types";
import { TIER_HEX } from "./status-badge";

function count<T extends string>(rows: WorkOrder[], key: (r: WorkOrder) => T) {
  const m = new Map<T, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + 1);
  return m;
}

/** One ledger strip for the rows in view — divided, not five identical cards. */
export function SummaryCards({ rows }: { rows: WorkOrder[] }) {
  const byNew = count(rows, (r) => r.newStatus);
  const changed = rows.filter((r) => r.changed);
  const transitions = [...count(changed, (r) => `${r.oldStatus} → ${r.newStatus}`)]
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${n} ${k}`)
    .join(", ");

  const cells = [
    { title: "In view", value: rows.length, sub: "work orders", color: undefined },
    ...[...TIERS].reverse().map((t) => ({
      title: t, value: byNew.get(t) ?? 0,
      sub: rows.length ? `${Math.round(((byNew.get(t) ?? 0) / rows.length) * 100)}% of view` : "—",
      color: TIER_HEX[t],
    })),
    { title: "Moved up", value: changed.length, sub: transitions || "none in view", color: undefined },
  ];
  return (
    <div className="grid overflow-hidden rounded-lg border bg-card sm:grid-cols-3 lg:grid-cols-5">
      {cells.map((c, i) => (
        <div key={c.title} className={"px-5 py-4 " + (i ? "border-t sm:border-t-0 sm:border-l" : "")}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {c.color && <span className="size-2 rounded-full" style={{ background: c.color }} />}
            {c.title}
          </div>
          <div className="num mt-1 text-3xl font-semibold tracking-tight">{c.value.toLocaleString()}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground" title={c.sub}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
