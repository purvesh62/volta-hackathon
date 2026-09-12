import { Dashboard } from "@/components/dashboard";
import { Hero } from "@/components/hero";
import { CsvMissingError, loadWorkOrders } from "@/lib/data";
import type { WorkOrder } from "@/lib/types";

export const dynamic = "force-dynamic";

async function load(): Promise<WorkOrder[] | { missing: string }> {
  try {
    return await loadWorkOrders();
  } catch (e) {
    if (e instanceof CsvMissingError) return { missing: e.path };
    throw e;
  }
}

export default async function Page() {
  const res = await load();
  if (!Array.isArray(res)) {
    return (
      <main className="mx-auto max-w-xl space-y-2 p-6">
        <h1 className="text-xl font-semibold">final.csv not found</h1>
        <p className="text-sm">Expected at <code>{res.missing}</code>. Generate it:</p>
        <pre className="rounded bg-muted p-3 text-xs">cd backend && uv run python -m cleanup.run && uv run python -m model.run</pre>
      </main>
    );
  }
  return (
    <>
      <Hero rows={res} />
      <main className="mx-auto w-full max-w-[1400px] space-y-4 px-6 py-6">
        <Dashboard rows={res} />
      </main>
    </>
  );
}
