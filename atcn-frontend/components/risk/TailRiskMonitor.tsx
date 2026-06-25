"use client";

import { AlertOctagon } from "lucide-react";
import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchTailRisk } from "@/lib/api";

export function TailRiskMonitor() {
  const { data: t, isLoading } = useApi(fetchTailRisk);

  if (isLoading || !t) return <Skeleton className="h-[260px] w-full" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="VaR (95%)"          value={`${t.var95}%`} />
        <Stat label="VaR (99%)"          value={`${t.var99}%`} />
        <Stat label="CVaR (99%)"         value={`${t.cvar99}%`}            accent />
        <Stat label="Expected Shortfall" value={`${t.expectedShortfall}%`} accent />
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-line-soft pt-3">
        <Stat label="Kurtosis (excess)" value={t.kurtosis.toFixed(1)} />
        <Stat label="Skew"              value={t.skew.toFixed(2)} />
      </div>
      <div className="flex items-start gap-2 border border-signal-amber/30 bg-signal-amberDim px-3 py-2.5">
        <AlertOctagon size={14} className="mt-0.5 shrink-0 text-signal-amber" />
        <p className="text-2xs leading-relaxed text-ink-secondary">
          Fat-tail risk elevated: excess kurtosis of {t.kurtosis.toFixed(1)} indicates return distribution
          materially more peaked with heavier tails than normal — single-day moves beyond 3σ are more likely
          than standard models imply.
        </p>
      </div>
      <div className="flex flex-col divide-y divide-line-soft border-t border-line-soft">
        {t.tailEvents.map((e) => (
          <div key={e.label} className="flex items-center justify-between py-2">
            <span className="text-2xs text-ink-tertiary">{e.label}</span>
            <span className="font-mono text-xs text-ink tabular">{e.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border border-line bg-base-raised px-3 py-2.5">
      <div className="text-2xs text-ink-tertiary">{label}</div>
      <div className={`mt-0.5 font-mono text-lg tabular ${accent ? "text-neg" : "text-ink"}`}>{value}</div>
    </div>
  );
}
