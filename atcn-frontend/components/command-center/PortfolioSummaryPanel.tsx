"use client";

import { Sparkline } from "@/components/ui/Sparkline";
import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchPortfolioSummary, fetchAumSeries } from "@/lib/api";
import { formatCurrency, formatPercent, trendColor } from "@/lib/utils";

export function PortfolioSummaryPanel() {
  const { data: s }      = useApi(fetchPortfolioSummary);
  const { data: series } = useApi(fetchAumSeries);

  if (!s) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="label-eyebrow">Net Asset Value</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-ink tabular">
            {formatCurrency(s.nav, true)}
          </div>
        </div>
        <span className={`font-mono text-xs tabular ${trendColor(s.navChangePct)}`}>
          {formatPercent(s.navChangePct)}
        </span>
      </div>

      <div className="mt-3 h-12">
        {series && series.length > 0 ? (
          <Sparkline data={series.map((d) => ({ v: d.v }))} color="#c8923a" height={48} />
        ) : (
          <Skeleton className="h-12 w-full" />
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line-soft pt-3">
        <Stat label="Day P&L"      value={formatCurrency(s.dayPnl, true)} positive={s.dayPnl >= 0} />
        <Stat label="YTD Return"   value={formatPercent(s.ytdReturn)}     positive={s.ytdReturn >= 0} />
        <Stat label="vs Benchmark" value={formatPercent(s.ytdReturn - s.benchmarkYtd)} positive={(s.ytdReturn - s.benchmarkYtd) >= 0} />
        <Stat label="Sharpe Ratio" value={s.sharpe.toFixed(2)} />
        <Stat label="Beta"         value={s.beta.toFixed(2)} />
        <Stat label="Cash Weight"  value={`${s.cash.toFixed(1)}%`} />
      </div>
    </div>
  );
}

function Stat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <div className="text-2xs text-ink-tertiary">{label}</div>
      <div className={`mt-0.5 font-mono text-sm tabular ${positive === true ? "text-pos" : positive === false ? "text-neg" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}
