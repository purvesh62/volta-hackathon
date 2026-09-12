"use client";
import type { ColumnDef, SortingFn } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { TIER_ORDER, type Tier, type WorkOrder } from "@/lib/types";

const tierSort: SortingFn<WorkOrder> = (a, b, id) => TIER_ORDER[a.getValue<Tier>(id)] - TIER_ORDER[b.getValue<Tier>(id)];

export const columns: ColumnDef<WorkOrder>[] = [
  { accessorKey: "id", header: "WO", size: 80, cell: ({ getValue }) => <span className="num text-muted-foreground">{getValue<string>()}</span> },
  { accessorKey: "workType", header: "Work type", size: 260,
    cell: ({ row }) => (
      <div className="min-w-0">
        <div className="truncate font-medium">{row.original.workType}</div>
        <div className="truncate text-xs text-muted-foreground">{row.original.assetType.replace("TRN_", "").replace("AST_", "")}{row.original.streetClass ? ` · ${row.original.streetClass.toLowerCase()}` : ""}</div>
      </div>
    ) },
  { accessorKey: "address", header: "Address", size: 260, cell: ({ getValue }) => <span className="truncate">{getValue<string>()}</span> },
  { accessorKey: "district", header: "Dist", size: 56, cell: ({ getValue }) => <span className="num">{getValue<string>()}</span> },
  { accessorKey: "oldStatus", header: "Was", sortingFn: tierSort, size: 96, cell: ({ getValue }) => <StatusBadge tier={getValue<Tier>()} /> },
  { id: "arrow", header: "", size: 28, enableSorting: false,
    cell: ({ row }) => row.original.changed ? <ArrowRight className="size-4 text-harbour" /> : <span className="text-muted-foreground/50">–</span> },
  { accessorKey: "newStatus", header: "Now", sortingFn: tierSort, size: 96, cell: ({ getValue }) => <StatusBadge tier={getValue<Tier>()} /> },
  { accessorKey: "changed", header: "Moved", size: 64, cell: ({ getValue }) => getValue<boolean>() ? <span className="text-xs font-medium text-harbour">up</span> : null },
  { accessorKey: "dateInitiated", header: "Opened", size: 104, cell: ({ getValue }) => <span className="num text-muted-foreground">{getValue<string | null>() ?? "—"}</span> },
  { accessorKey: "ageDays", header: "Age", size: 72,
    cell: ({ getValue }) => { const d = getValue<number | null>(); return <span className="num">{d == null ? "—" : d >= 365 ? `${(d / 365).toFixed(1)} y` : `${d} d`}</span>; } },
  { accessorKey: "assetType", header: "Asset", enableHiding: true },
  { accessorKey: "streetClass", header: "Street class", enableHiding: true },
];
