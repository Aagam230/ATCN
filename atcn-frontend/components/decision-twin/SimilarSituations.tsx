"use client";

import { Badge } from "@/components/ui/Badge";
import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchSimilarSituations } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { SimilarSituation } from "@/types";

const outcomeTone: Record<SimilarSituation["outcome"], "pos" | "neg" | "muted"> = {
  win:       "pos",
  loss:      "neg",
  breakeven: "muted",
};

export function SimilarSituations() {
  const { data, isLoading } = useApi(fetchSimilarSituations);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-line-soft">
      {data.situations.map((s) => (
        <div key={s.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xs text-ink-tertiary tabular">{s.date}</span>
                <Badge tone={outcomeTone[s.outcome]}>{s.outcome}</Badge>
              </div>
              <p className="mt-1 text-xs text-ink leading-relaxed">{s.setup}</p>
            </div>
            <div className="shrink-0 text-right">
              <div className={cn("font-mono text-sm tabular", s.returnPct >= 0 ? "text-pos" : "text-neg")}>
                {s.returnPct >= 0 ? "+" : ""}{s.returnPct.toFixed(1)}%
              </div>
              <div className="text-2xs text-ink-tertiary">{s.similarity}% match</div>
            </div>
          </div>
          <p className="text-2xs leading-relaxed text-ink-secondary">{s.note}</p>
          <div className="h-1 w-full bg-line-soft">
            <div className="h-1 bg-info" style={{ width: `${s.similarity}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
