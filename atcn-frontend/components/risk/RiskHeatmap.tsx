"use client";

import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchRiskHeatmap } from "@/lib/api";
import { cn } from "@/lib/utils";

function heatColor(value: number): string {
  if (value >= 80) return "bg-neg/75 text-ink";
  if (value >= 60) return "bg-neg/45 text-ink";
  if (value >= 40) return "bg-signal-amber/40 text-ink";
  if (value >= 20) return "bg-pos/25 text-ink-secondary";
  return "bg-pos/40 text-ink-secondary";
}

export function RiskHeatmap() {
  const { data, isLoading } = useApi(fetchRiskHeatmap);

  if (isLoading || !data) return <Skeleton className="h-[280px] w-full" />;

  const { cells, assets, metrics } = data;

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid" style={{ gridTemplateColumns: `72px repeat(${metrics.length}, 84px)` }}>
        <div />
        {metrics.map((m) => (
          <div key={m} className="flex items-end justify-center pb-1.5 font-mono text-2xs text-ink-tertiary">{m}</div>
        ))}
        {assets.map((asset) => (
          <div key={asset} className="contents">
            <div className="flex items-center font-mono text-xs text-ink">{asset}</div>
            {metrics.map((metric) => {
              const cell  = cells.find((c) => c.asset === asset && c.metric === metric);
              const value = cell?.value ?? 0;
              return (
                <div
                  key={`${asset}-${metric}`}
                  className={cn("m-[1px] flex h-[36px] items-center justify-center font-mono text-2xs tabular", heatColor(value))}
                  title={`${asset} · ${metric}: ${value}`}
                >
                  {value}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 text-2xs text-ink-tertiary">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-pos/40" /> Low</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-signal-amber/40" /> Moderate</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-neg/75" /> High</span>
      </div>
    </div>
  );
}
