"use client";

import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchCorrelationMatrix } from "@/lib/api";
import { cn } from "@/lib/utils";

function cellColor(value: number): string {
  if (value === 1)    return "bg-base-elevated";
  if (value >= 0.6)   return "bg-neg/70";
  if (value >= 0.3)   return "bg-neg/35";
  if (value >= 0.05)  return "bg-neg/15";
  if (value > -0.05)  return "bg-line-soft";
  if (value > -0.3)   return "bg-info/20";
  if (value > -0.6)   return "bg-info/40";
  return "bg-info/65";
}

export function CorrelationAnalysis() {
  const { data, isLoading } = useApi(fetchCorrelationMatrix);

  if (isLoading || !data) return <Skeleton className="h-[320px] w-full" />;

  const { matrix, assets } = data;

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid" style={{ gridTemplateColumns: `90px repeat(${assets.length}, 56px)` }}>
        <div />
        {assets.map((c) => (
          <div key={c} className="flex items-end justify-center pb-1.5">
            <span className="rotate-0 text-center font-mono text-2xs leading-tight text-ink-tertiary">
              {c.split(" ")[0]}
            </span>
          </div>
        ))}
        {assets.map((row) => (
          <div key={row} className="contents">
            <div className="flex items-center pr-2 font-mono text-2xs text-ink-tertiary">{row}</div>
            {assets.map((col) => {
              const cell  = matrix.find((c) => c.row === row && c.col === col);
              const value = cell?.value ?? 0;
              return (
                <div
                  key={`${row}-${col}`}
                  className={cn(
                    "m-[1px] flex h-[40px] items-center justify-center text-2xs font-mono tabular",
                    cellColor(value),
                    Math.abs(value) >= 0.6 ? "text-ink" : "text-ink-secondary"
                  )}
                  title={`${row} vs ${col}: ${value.toFixed(2)}`}
                >
                  {value.toFixed(2)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 text-2xs text-ink-tertiary">
        <span>Negative</span>
        <div className="flex h-2 w-32 overflow-hidden">
          <div className="flex-1 bg-info/65" /><div className="flex-1 bg-info/40" />
          <div className="flex-1 bg-info/20" /><div className="flex-1 bg-line-soft" />
          <div className="flex-1 bg-neg/15" /><div className="flex-1 bg-neg/35" />
          <div className="flex-1 bg-neg/70" />
        </div>
        <span>Positive</span>
      </div>
    </div>
  );
}
