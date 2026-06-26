"use client";

import { Badge } from "@/components/ui/Badge";
import { LinearScore } from "@/components/ui/ScoreGauge";
import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchMarketRegime } from "@/lib/api";
import { Gauge } from "lucide-react";

// Backend sends state: "favorable" | "neutral" | "caution"
// Map to valid LinearScore tones
const stateLSTone: Record<string, "pos" | "info" | "amber"> = {
  favorable: "pos",
  neutral:   "info",
  caution:   "amber",
};

// Map to valid Badge tones
const stateBadgeTone: Record<string, "pos" | "muted" | "amber"> = {
  favorable: "pos",
  neutral:   "muted",
  caution:   "amber",
};

export function MarketRegimePanel() {
  const { data, isLoading } = useApi(fetchMarketRegime);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border border-line-strong bg-base-elevated px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Gauge size={14} className="text-signal-amber" />
          <span className="font-mono text-xs font-semibold tracking-wide text-ink">
            {data.regime_label}
          </span>
        </div>
        <Badge tone="amber">{data.regime_confidence}% confidence</Badge>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {data.factors.map((f) => (
          <div key={f.label} className="flex items-center gap-3">
            <LinearScore
              label={f.label}
              value={f.value}
              tone={stateLSTone[f.state] ?? "info"}
            />
            <Badge tone={stateBadgeTone[f.state] ?? "muted"} className="shrink-0">
              {f.state}
            </Badge>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-line-soft pt-4 text-2xs text-ink-tertiary">
        Updated {data.computed_at} · refreshes every hour
      </div>
    </div>
  );
}
