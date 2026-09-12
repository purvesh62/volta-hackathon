"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRIORITIES, planDispatch, type DispatchOptions } from "@/lib/dispatch";
import type { WorkOrder } from "@/lib/types";
import { PRIORITY_HEX } from "./colors";
import { TeamList } from "./team-list";

const DispatchMap = dynamic(() => import("./dispatch-map"), { ssr: false, loading: () => <div className="h-[72vh] animate-pulse rounded-md bg-muted" /> });

// HRM Turner Drive operations depot (Dartmouth)
const DEFAULT_OPTS: DispatchOptions = { teams: 3, shiftHours: 8, depot: { lat: 44.6903, lng: -63.5623 } };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">{label}{children}</label>;
}

export function DispatchPlanner({ rows }: { rows: WorkOrder[] }) {
  const [draft, setDraft] = useState(DEFAULT_OPTS);
  const [opts, setOpts] = useState(DEFAULT_OPTS);
  const [selected, setSelected] = useState<number | null>(null);
  const plan = useMemo(() => planDispatch(rows, opts), [rows, opts]);
  const assigned = plan.teams.reduce((n, t) => n + t.stops.length, 0);
  const num = (k: "teams" | "shiftHours", min: number, max: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft({ ...draft, [k]: Math.min(max, Math.max(min, Number(e.target.value) || min)) });
  const coord = (k: "lat" | "lng") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft({ ...draft, depot: { ...draft.depot, [k]: Number(e.target.value) || draft.depot[k] } });

  return (
    <div className="space-y-4">
      <form className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4" onSubmit={(e) => { e.preventDefault(); setOpts(draft); setSelected(null); }}>
        <Field label="Crews"><Input type="number" min={1} max={10} value={draft.teams} onChange={num("teams", 1, 10)} className="w-20" /></Field>
        <Field label="Shift hours"><Input type="number" min={1} max={24} step={0.5} value={draft.shiftHours} onChange={num("shiftHours", 1, 24)} className="w-24" /></Field>
        <Field label="Depot lat"><Input type="number" step="any" value={draft.depot.lat} onChange={coord("lat")} className="w-32" /></Field>
        <Field label="Depot lng"><Input type="number" step="any" value={draft.depot.lng} onChange={coord("lng")} className="w-32" /></Field>
        <Button type="submit">Plan dispatch</Button>
        <div className="ml-auto flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span><span className="num font-semibold text-foreground">{assigned}</span> scheduled today</span>
          {PRIORITIES.map((p) => (
            <span key={p} className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: PRIORITY_HEX[p] }} />
              {p} <span className="num text-foreground">{plan.unassigned[p].toLocaleString()}</span> left
            </span>
          ))}
        </div>
      </form>
      <div className="grid gap-4 lg:grid-cols-[minmax(20rem,2fr)_3fr]">
        <div className="max-h-[72vh] overflow-y-auto pr-1"><TeamList teams={plan.teams} selected={selected} onSelect={setSelected} /></div>
        <DispatchMap plan={plan} depot={opts.depot} selected={selected} />
      </div>
    </div>
  );
}
