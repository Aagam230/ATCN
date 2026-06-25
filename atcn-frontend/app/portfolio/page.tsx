"use client";

import { PageShell } from "@/components/layout/PageShell";
import { Panel } from "@/components/ui/Panel";
import { MetricCard } from "@/components/ui/MetricCard";
import { AllocationChart } from "@/components/portfolio/AllocationChart";
import { SectorExposure } from "@/components/portfolio/SectorExposure";
import { PerformanceAttribution } from "@/components/portfolio/PerformanceAttribution";
import { HealthScore } from "@/components/portfolio/HealthScore";
import { SuggestedActions } from "@/components/portfolio/SuggestedActions";
import { useApi } from "@/hooks/useApi";
import { fetchPortfolioSummary, fetchPortfolioHealth, fetchSuggestedActions } from "@/lib/api";
import { formatPercent } from "@/lib/utils";
import { Wallet, TrendingUp, Activity, ListChecks } from "lucide-react";

export default function PortfolioIntelligencePage() {
  const { data: s }       = useApi(fetchPortfolioSummary);
  const { data: health }  = useApi(fetchPortfolioHealth);
  const { data: actions } = useApi(fetchSuggestedActions);

  const highPriority = actions?.filter((a) => a.priority === "high").length ?? 0;

  return (
    <PageShell title="Portfolio Intelligence" breadcrumb="ATCN">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard
            label="YTD Return"
            value={s ? formatPercent(s.ytdReturn) : "—"}
            delta={s ? `${formatPercent(s.ytdReturn - s.benchmarkYtd)} vs bmk` : undefined}
            deltaValue={s ? s.ytdReturn - s.benchmarkYtd : 0}
            icon={<TrendingUp size={14} />}
          />
          <MetricCard
            label="Health Score"
            value={health ? String(health.score) : "—"}
            delta={health ? `+${health.score - health.prior} QoQ` : undefined}
            deltaValue={1}
            icon={<Activity size={14} />}
          />
          <MetricCard
            label="Sharpe Ratio"
            value={s ? s.sharpe.toFixed(2) : "—"}
            sublabel="trailing 12mo"
            icon={<Wallet size={14} />}
          />
          <MetricCard
            label="Open Actions"
            value={actions ? String(actions.length) : "—"}
            sublabel={`${highPriority} high priority`}
            icon={<ListChecks size={14} />}
          />
        </div>

        <div className="grid grid-cols-12 gap-4">
          <Panel title="Portfolio Allocation" eyebrow="Asset Class Mix" className="col-span-12 lg:col-span-4">
            <AllocationChart />
          </Panel>

          <Panel title="Sector Exposure" eyebrow="Active Weight vs NIFTY 50" className="col-span-12 lg:col-span-8">
            <SectorExposure />
          </Panel>

          <Panel title="Performance Attribution" eyebrow="Trailing 12 Months" className="col-span-12 lg:col-span-7">
            <PerformanceAttribution />
          </Panel>

          <Panel title="Portfolio Health Score" eyebrow="Composite Diagnostic" className="col-span-12 lg:col-span-5">
            <HealthScore />
          </Panel>

          <Panel title="Suggested Actions" eyebrow="AI Recommendations · Ranked" className="col-span-12">
            <SuggestedActions />
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
