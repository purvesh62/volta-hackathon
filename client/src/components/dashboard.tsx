"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { applyFilters, DEFAULT_FILTERS, type Filters } from "@/lib/filter";
import type { WorkOrder } from "@/lib/types";
import { SummaryCards } from "./summary-cards";
import { Toolbar } from "./toolbar";
import { WoTable } from "./wo-table/table";

const WoMap = dynamic(() => import("./wo-map"), { ssr: false, loading: () => <div className="h-[70vh] animate-pulse rounded-md bg-muted" /> });

export function Dashboard({ rows }: { rows: WorkOrder[] }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  return (
    <div className="space-y-4">
      <SummaryCards rows={filtered} />
      <Toolbar filters={filters} onChange={setFilters} total={rows.length} shown={filtered.length} />
      <Tabs defaultValue="table">
        <TabsList><TabsTrigger value="table">Table</TabsTrigger><TabsTrigger value="map">Map</TabsTrigger></TabsList>
        <TabsContent value="table"><WoTable rows={filtered} /></TabsContent>
        <TabsContent value="map"><WoMap rows={filtered} /></TabsContent>
      </Tabs>
    </div>
  );
}
