"use client";

import { ScoreGauge, LinearScore } from "@/components/ui/ScoreGauge";
import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchConfidenceScore } from "@/lib/api";

export function ConfidenceScore() {
  const { data: d, isLoading } = useApi(fetchConfidenceScore);

  if (isLoading || !d) return <Skeleton className="h-[160px] w-full" />;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
      <ScoreGauge value={d.score} label="CONFIDENCE" tone="amber" size={150} strokeWidth={8} />
      <div className="flex w-full flex-col gap-3">
        {d.drivers.map((dr) => (
          <LinearScore key={dr.label} label={dr.label} value={dr.value} tone="amber" />
        ))}
      </div>
    </div>
  );
}
