import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { parseWorkOrders } from "./parse";
import type { WorkOrder } from "./types";

export class CsvMissingError extends Error {
  constructor(public path: string) {
    super(`final.csv not found at ${path}`);
  }
}

export const csvPath = () =>
  process.env.FINAL_CSV ?? path.resolve(process.cwd(), "../data/processed/final.csv");

export const loadWorkOrders = cache(async (): Promise<WorkOrder[]> => {
  const p = csvPath();
  let text: string;
  try {
    text = await readFile(p, "utf8");
  } catch {
    throw new CsvMissingError(p);
  }
  const { rows, skipped } = parseWorkOrders(text);
  if (skipped) console.warn(`final.csv: skipped ${skipped} rows without id/coords`);
  return rows;
});
