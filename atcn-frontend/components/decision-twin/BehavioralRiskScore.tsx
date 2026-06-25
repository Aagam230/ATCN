"use client";

import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchBehavioralRisk } from "@/lib/api";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function BehavioralRiskScore() {
  const { data: b, isLoading } = useApi(fetchBehavioralRisk);

  if (isLoading || !b) return <Skeleton className="h-[160px] w-full" />;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
      <ScoreGauge value={b.score} label={b.level.toUpperCase()} sublabel="behavioral risk" tone="violet" size={150} strokeWidth={8} />
      <div className="flex w-full flex-col gap-2">
        {b.markers.map((m) => (
          <div
            key={m.label}
            className={cn(
              "flex items-center justify-between border px-3 py-2",
              m.detected ? "border-violet/30 bg-violet-dim" : "border-line bg-base-raised"
            )}
          >
            <div className="flex items-center gap-2">
              {m.detected
                ? <AlertTriangle size={13} className="text-violet" />
                : <CheckCircle2  size={13} className="text-ink-tertiary" />}
              <span className={cn("text-xs", m.detected ? "text-ink" : "text-ink-tertiary")}>{m.label}</span>
            </div>
            <span className="font-mono text-2xs text-ink-tertiary tabular">
              {m.detected ? `+${m.weight}` : "clear"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
