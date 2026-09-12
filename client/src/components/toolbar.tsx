"use client";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Filters } from "@/lib/filter";
import { TIERS } from "@/lib/types";

const ASSET_ITEMS: Record<string, string> = { all: "All assets", TRN_SECTRAV: "Sidewalks & walkways", TRN_STREET: "Streets", AST_TREE: "Trees" };
const STATUS_ITEMS: Record<string, string> = { all: "Any priority", ...Object.fromEntries([...TIERS].reverse().map((t) => [t, `${t} now`])) };

export function Toolbar({ filters, onChange, total, shown }: {
  filters: Filters; onChange: (f: Filters) => void; total: number; shown: number;
}) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => onChange({ ...filters, [k]: v });
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search work order, address or type" value={filters.q} onChange={(e) => set("q", e.target.value)} className="w-80 bg-card pl-8" />
      </div>
      <Select items={ASSET_ITEMS} value={filters.assetType} onValueChange={(v) => set("assetType", v as Filters["assetType"])}>
        <SelectTrigger className="w-52 bg-card"><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.entries(ASSET_ITEMS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select items={STATUS_ITEMS} value={filters.newStatus} onValueChange={(v) => set("newStatus", v as Filters["newStatus"])}>
        <SelectTrigger className="w-40 bg-card"><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.entries(STATUS_ITEMS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
        </SelectContent>
      </Select>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={filters.changedOnly} onCheckedChange={(v) => set("changedOnly", Boolean(v))} /> Moved up only
      </label>
      <span className="num ml-auto text-sm text-muted-foreground">{shown.toLocaleString()} of {total.toLocaleString()}</span>
    </div>
  );
}
