"use client";

import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchSectorExposure } from "@/lib/api";
import { cn } from "@/lib/utils";

export function SectorExposure() {
  const { data, isLoading } = useApi(fetchSectorExposure);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
      </div>
    );
  }

  const maxWeight = Math.max(...data.map((s) => Math.max(s.weight, s.benchmark)));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 text-2xs text-ink-tertiary">
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 bg-signal-amber" /> Portfolio</div>
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 border border-ink-tertiary bg-transparent" /> Benchmark</div>
      </div>

      {data.map((s) => (
        <div key={s.sector} className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div>
            <div className="flex items-center justify-between text-xs text-ink-secondary">
              <span className="truncate">{s.sector}</span>
              <span className={cn(
                "font-mono text-2xs tabular",
                s.active > 0 ? "text-pos" : s.active < 0 ? "text-neg" : "text-ink-tertiary"
              )}>
                {s.active > 0 ? "+" : ""}{s.active.toFixed(1)}pp
              </span>
            </div>
            <div className="relative mt-1 h-3 w-full bg-line-soft">
              <div
                className="absolute inset-y-0 left-0 bg-signal-amber/80"
                style={{ width: `${(s.weight / maxWeight) * 100}%` }}
              />
              <div
                className="absolute top-0 h-3 w-px bg-ink-secondary"
                style={{ left: `${(s.benchmark / maxWeight) * 100}%` }}
              />
            </div>
          </div>
          <span className="w-12 shrink-0 text-right font-mono text-xs text-ink tabular">
            {s.weight.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}
