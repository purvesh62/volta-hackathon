import type { TeamPlan } from "@/lib/dispatch";
import { clock, PRIORITY_HEX, teamHex } from "./colors";

/** One card per crew: header strip in the crew colour, then the ordered run sheet. */
export function TeamList({ teams, selected, onSelect }: { teams: TeamPlan[]; selected: number | null; onSelect: (id: number | null) => void }) {
  return (
    <div className="space-y-3">
      {teams.map((t, i) => {
        const hex = teamHex(i), open = selected === null || selected === t.id;
        return (
          <div key={t.id} className={"overflow-hidden rounded-lg border bg-card transition-opacity " + (open ? "" : "opacity-50")}>
            <button type="button" onClick={() => onSelect(selected === t.id ? null : t.id)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50">
              <span className="size-3 rounded-full" style={{ background: hex }} />
              <span className="font-medium">Crew {t.id}</span>
              <span className="num ml-auto text-xs text-muted-foreground">
                {t.stops.length} stops · {t.totalHours.toFixed(1)} h · {t.km.toFixed(0)} km
              </span>
            </button>
            {open && (
              <ol className="divide-y border-t">
                {t.stops.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">Nothing reachable within shift.</li>}
                {t.stops.map((s, n) => (
                  <li key={s.wo.id} className="grid grid-cols-[1.5rem_3.3rem_1fr_auto] items-baseline gap-2 px-4 py-2 text-sm">
                    <span className="num text-xs font-semibold text-muted-foreground">{n + 1}</span>
                    <span className="num text-xs text-muted-foreground">{clock(s.arrive)}</span>
                    <span className="min-w-0">
                      <span className="block truncate">{s.wo.workType}</span>
                      <span className="block truncate text-xs text-muted-foreground">#{s.wo.id} · {s.wo.address}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: PRIORITY_HEX[s.priority] }}>
                      <span className="size-1.5 rounded-full bg-current" />
                      {s.priority} · {s.depart - s.arrive} h{s.travelMin ? ` · ${s.travelMin} min drive` : ""}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        );
      })}
    </div>
  );
}
