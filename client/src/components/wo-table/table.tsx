"use client";
import { Fragment, useState } from "react";
import {
  flexRender, getCoreRowModel, getExpandedRowModel, getPaginationRowModel, getSortedRowModel,
  useReactTable, type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { WorkOrder } from "@/lib/types";
import { cn } from "@/lib/utils";
import { columns } from "./columns";

const PAGE = 50;

export function WoTable({ rows }: { rows: WorkOrder[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "newStatus", desc: true }, { id: "changed", desc: true }]);
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table v8 is not React Compiler-safe; fine without it
  const table = useReactTable({
    data: rows, columns,
    state: { sorting, columnVisibility: { assetType: false, streetClass: false } },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    initialState: { pagination: { pageSize: PAGE } },
    autoResetPageIndex: true,
  });
  const { pageIndex } = table.getState().pagination;
  const first = pageIndex * PAGE + 1, last = Math.min(rows.length, (pageIndex + 1) * PAGE);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table className="table-fixed">
          <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                <TableHead className="w-8" />
                {hg.headers.map((h) => {
                  const sorted = h.column.getIsSorted();
                  return (
                    <TableHead key={h.id} style={{ width: h.getSize() }} className="h-10 text-xs font-medium text-muted-foreground">
                      {h.isPlaceholder ? null : h.column.getCanSort() ? (
                        <button
                          className={cn("inline-flex items-center gap-1 rounded px-1 -mx-1 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring", sorted && "text-foreground")}
                          onClick={h.column.getToggleSortingHandler()}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {sorted === "asc" && <ArrowUp className="size-3" />}
                          {sorted === "desc" && <ArrowDown className="size-3" />}
                        </button>
                      ) : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const open = row.getIsExpanded();
              return (
                <Fragment key={row.id}>
                  <TableRow
                    onClick={row.getToggleExpandedHandler()}
                    aria-expanded={open}
                    className={cn(
                      "cursor-pointer border-l-2 border-l-transparent transition-colors",
                      row.original.changed && "border-l-harbour",
                      open && "bg-accent/60 hover:bg-accent/60",
                    )}
                  >
                    <TableCell className="w-8 pr-0 text-muted-foreground">
                      <ChevronRight className={cn("size-4 transition-transform", open && "rotate-90")} />
                    </TableCell>
                    {row.getVisibleCells().map((c) => (
                      <TableCell key={c.id} className="py-2.5 align-middle">{flexRender(c.column.columnDef.cell, c.getContext())}</TableCell>
                    ))}
                  </TableRow>
                  {open && (
                    <TableRow className="bg-accent/30 hover:bg-accent/30">
                      <TableCell colSpan={table.getVisibleLeafColumns().length + 1} className="px-6 py-4">
                        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                          <p className="max-w-[80ch] text-sm leading-relaxed">{row.original.newDescription}</p>
                          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <dt>Asset</dt><dd className="text-foreground">{row.original.assetType}</dd>
                            <dt>Street</dt><dd className="text-foreground">{row.original.streetClass || "—"}</dd>
                            <dt>Cause</dt><dd className="text-foreground">{row.original.cause || "—"}</dd>
                            <dt>Group</dt><dd className="text-foreground">{row.original.assetGroup || "—"}</dd>
                          </dl>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={12} className="py-10 text-center text-sm text-muted-foreground">Nothing matches these filters. Clear the search or switch status to see more.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="num">{rows.length ? `${first.toLocaleString()}–${last.toLocaleString()} of ${rows.length.toLocaleString()}` : ""}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
          <span className="num">Page {pageIndex + 1} / {Math.max(1, table.getPageCount())}</span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
        </div>
      </div>
    </div>
  );
}
