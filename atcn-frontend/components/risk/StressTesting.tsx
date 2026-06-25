"use client";

import { Badge } from "@/components/ui/Badge";
import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchStressScenarios } from "@/lib/api";
import type { StressScenario } from "@/types";

const probTone: Record<StressScenario["probability"], "neutral" | "elevated" | "watch"> = {
  low:      "neutral",
  moderate: "watch",
  elevated: "elevated",
};

export function StressTesting() {
  const { data, isLoading } = useApi(fetchStressScenarios);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  const maxImpact = Math.max(...data.map((s) => Math.abs(s.portfolioImpact)));

  return (
    <div className="flex flex-col divide-y divide-line-soft">
      {data.map((s) => (
        <div key={s.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-medium text-ink">{s.name}</span>
              <p className="mt-0.5 text-2xs leading-relaxed text-ink-secondary">{s.description}</p>
            </div>
            <span className="shrink-0 font-mono text-sm text-neg tabular">
              {s.portfolioImpact.toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-line-soft">
            <div className="h-1.5 bg-neg" style={{ width: `${(Math.abs(s.portfolioImpact) / maxImpact) * 100}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xs text-ink-tertiary">Worst contributor: {s.worstAsset}</span>
            <Badge tone={probTone[s.probability]}>{s.probability} probability</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
