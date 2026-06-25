"use client";

import { PageShell } from "@/components/layout/PageShell";
import { Panel } from "@/components/ui/Panel";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { StressTesting } from "@/components/risk/StressTesting";
import { DrawdownScenarios } from "@/components/risk/DrawdownScenarios";
import { CorrelationAnalysis } from "@/components/risk/CorrelationAnalysis";
import { TailRiskMonitor } from "@/components/risk/TailRiskMonitor";
import { RiskHeatmap } from "@/components/risk/RiskHeatmap";
import { useApi } from "@/hooks/useApi";
import { fetchTailRisk, fetchStressScenarios } from "@/lib/api";
import { ShieldAlert, TrendingDown, Waves, Flame } from "lucide-react";

export default function RiskIntelligencePage() {
  const { data: tail }      = useApi(fetchTailRisk);
  const { data: scenarios } = useApi(fetchStressScenarios);

  const elevated  = scenarios?.filter((s) => s.probability === "elevated").length ?? 0;
  const worstCase = scenarios ? Math.min(...scenarios.map((s) => s.portfolioImpact)) : 0;

  return (
    <PageShell title="Risk Intelligence Center" breadcrumb="ATCN">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard
            label="VaR (99%, 1-Day)"
            value={tail ? `${tail.var99}%` : "—"}
            sublabel="of NAV"
            icon={<ShieldAlert size={14} />}
          />
          <MetricCard
            label="Worst Stress Scenario"
            value={scenarios ? `${worstCase.toFixed(1)}%` : "—"}
            sublabel="2008-style credit freeze"
            icon={<TrendingDown size={14} />}
          />
          <MetricCard
            label="Elevated Probability"
            value={String(elevated)}
            sublabel="scenarios flagged"
            icon={<Flame size={14} />}
          />
          <MetricCard
            label="Tail Kurtosis"
            value={tail ? tail.kurtosis.toFixed(1) : "—"}
            sublabel="excess vs normal"
            icon={<Waves size={14} />}
          />
        </div>

        <div className="grid grid-cols-12 gap-4">
          <Panel
            title="Portfolio Stress Testing" eyebrow="NSE Scenario Engine"
            action={<Badge tone="critical" dot>{elevated} elevated</Badge>}
            className="col-span-12 lg:col-span-6"
            bodyClassName="max-h-[520px] overflow-y-auto"
          >
            <StressTesting />
          </Panel>

          <Panel title="Drawdown Scenarios" eyebrow="65-Day Forward Projection" className="col-span-12 lg:col-span-6">
            <DrawdownScenarios />
          </Panel>

          <Panel title="Correlation Analysis" eyebrow="Cross-Asset Matrix · 60-Day" className="col-span-12 lg:col-span-7" bodyClassName="overflow-x-auto">
            <CorrelationAnalysis />
          </Panel>

          <Panel title="Tail-Risk Monitor" eyebrow="Distribution Diagnostics" className="col-span-12 lg:col-span-5">
            <TailRiskMonitor />
          </Panel>

          <Panel title="Risk Heatmap" eyebrow="Position-Level Risk Factors" className="col-span-12" bodyClassName="overflow-x-auto">
            <RiskHeatmap />
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
