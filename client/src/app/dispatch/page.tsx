import Link from "next/link";
import { DispatchPlanner } from "@/components/dispatch/planner";
import { CsvMissingError, loadWorkOrders } from "@/lib/data";
import type { WorkOrder } from "@/lib/types";

const NAVY = "#1b3a5c";
export const dynamic = "force-dynamic";
export const metadata = { title: "Tree crew dispatch · HRM Work Orders" };

async function load(): Promise<WorkOrder[] | { missing: string }> {
  try {
    return await loadWorkOrders();
  } catch (e) {
    if (e instanceof CsvMissingError) return { missing: e.path };
    throw e;
  }
}

export default async function DispatchPage() {
  const res = await load();
  if (!Array.isArray(res)) {
    return (
      <main className="mx-auto max-w-xl space-y-2 p-6">
        <h1 className="text-xl font-semibold">final.csv not found</h1>
        <p className="text-sm">Expected at <code>{res.missing}</code>.</p>
      </main>
    );
  }
  return (
    <>
      <header className="border-b bg-white">
        <div className="h-1.5" style={{ background: NAVY }} />
        <div className="mx-auto w-full max-w-[1400px] space-y-2 px-6 py-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Re-prioritised work orders</Link>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: NAVY }}>Tree crew dispatch</h1>
          <p className="max-w-[70ch] text-base leading-relaxed text-foreground/85">
            Open tree work orders only. Pick a crew count and a shift length; each crew leaves the depot and works the
            highest-priority job it can reach next — Critical (raised to High by the model) 4 h, High 3 h, Medium 2 h,
            Low 1 h — until the shift is full.
          </p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1400px] px-6 py-6">
        <DispatchPlanner rows={res.filter((r) => r.assetType === "AST_TREE")} />
      </main>
    </>
  );
}
