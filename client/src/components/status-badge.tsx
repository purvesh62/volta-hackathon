import type { Tier } from "@/lib/types";
import { cn } from "@/lib/utils";

export const TIER_HEX: Record<Tier, string> = { High: "#c0202e", Medium: "#d97a06", Low: "#6b7a88" };

const TIER_CLASS: Record<Tier, string> = {
  High: "bg-tier-high/12 text-tier-high ring-tier-high/30",
  Medium: "bg-tier-medium/12 text-tier-medium ring-tier-medium/30",
  Low: "bg-tier-low/12 text-tier-low ring-tier-low/30",
};

/** Tier pill: dot + label, tinted not filled so the table stays quiet. */
export function StatusBadge({ tier, className }: { tier: Tier; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", TIER_CLASS[tier], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {tier}
    </span>
  );
}
