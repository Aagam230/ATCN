"use client";

import { ScoreGauge, LinearScore } from "@/components/ui/ScoreGauge";
import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchPortfolioHealth } from "@/lib/api";
import { ArrowUpRight } from "lucide-react";

export function HealthScore() {
  const { data: h, isLoading } = useApi(fetchPortfolioHealth);

  if (isLoading || !h) return <Skeleton className="h-[200px] w-full" />;

  const delta = h.score - h.prior;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
      <div className="flex flex-col items-center shrink-0">
        <ScoreGauge value={h.score} label="HEALTH SCORE" tone="pos" size={140} />
        <div className="mt-2 flex items-center gap-1 text-2xs text-pos">
          <ArrowUpRight size={12} />
          <span className="font-mono tabular">{delta >= 0 ? "+" : ""}{delta} vs last quarter</span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2.5">
        {h.components.map((c) => (
          <LinearScore
            key={c.label} label={c.label} value={c.score}
            tone={c.score >= 75 ? "pos" : c.score >= 55 ? "amber" : "neg"}
          />
        ))}
      </div>
    </div>
  );
}
