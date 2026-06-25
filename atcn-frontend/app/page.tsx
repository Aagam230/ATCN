"use client";

import { PageShell } from "@/components/layout/PageShell";
import { Panel } from "@/components/ui/Panel";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { MarketRegimePanel } from "@/components/command-center/MarketRegimePanel";
import { OpportunityFeed } from "@/components/command-center/OpportunityFeed";
import { RiskAlertsFeed } from "@/components/command-center/RiskAlerts";
import { PortfolioSummaryPanel } from "@/components/command-center/PortfolioSummaryPanel";
import { ActivityTimeline } from "@/components/command-center/ActivityTimeline";
import { useApi } from "@/hooks/useApi";
import { fetchPortfolioSummary, fetchRiskAlerts, fetchOpportunities } from "@/lib/api";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Sparkles, AlertOctagon, Target, BarChart3 } from "lucide-react";

export default function CommandCenterPage() {
  const { data: s }    = useApi(fetchPortfolioSummary);
  const { data: alerts } = useApi(fetchRiskAlerts);
  const { data: opps }   = useApi(fetchOpportunities);

  const critical      = alerts?.filter((a) => a.severity === "critical").length ?? 0;
  const oppCount      = opps?.length ?? 0;
  const avgConfidence = opps && opps.length
    ? Math.round(opps.reduce((acc, o) => acc + o.confidence, 0) / opps.length)
    : 0;

  return (
    <PageShell title="Command Center" breadcrumb="ATCN">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard
            label="Net Asset Value"
            value={s ? formatCurrency(s.nav, true) : "—"}
            delta={s ? formatPercent(s.navChangePct) : undefined}
            deltaValue={s?.navChangePct}
            sublabel="vs prior close"
            icon={<BarChart3 size={14} />}
          />
          <MetricCard
            label="Day P&L"
            value={s ? formatCurrency(s.dayPnl, true) : "—"}
            delta={s ? formatPercent((s.dayPnl / s.nav) * 100) : undefined}
            deltaValue={s?.dayPnl}
            sublabel="realized + unrealized"
            icon={<Target size={14} />}
          />
          <MetricCard
            label="Active Opportunities"
            value={String(oppCount)}
            delta={oppCount ? `${avgConfidence}% avg confidence` : undefined}
            deltaValue={1}
            sublabel="AI-surfaced"
            icon={<Sparkles size={14} />}
          />
          <MetricCard
            label="Risk Alerts"
            value={String(alerts?.length ?? "—")}
            delta={alerts ? `${critical} critical` : undefined}
            deltaValue={critical > 0 ? -1 : 0}
            sublabel="requires review"
            icon={<AlertOctagon size={14} />}
          />
        </div>

        <div className="grid grid-cols-12 gap-4">
          <Panel title="Market Regime" eyebrow="Macro Engine" className="col-span-12 lg:col-span-3">
            <MarketRegimePanel />
          </Panel>

          <Panel
            title="AI Opportunity Feed" eyebrow="Decision Engine · Live"
            action={<Badge tone="amber" dot>{oppCount} signals</Badge>}
            className="col-span-12 lg:col-span-5"
            bodyClassName="max-h-[560px] overflow-y-auto p-3"
          >
            <OpportunityFeed />
          </Panel>

          <Panel
            title="Risk Alerts" eyebrow="Risk Intelligence"
            action={<Badge tone="critical" dot>{critical} critical</Badge>}
            className="col-span-12 lg:col-span-4"
            bodyClassName="max-h-[560px] overflow-y-auto"
          >
            <RiskAlertsFeed />
          </Panel>

          <Panel title="Portfolio Summary" eyebrow="Book Overview" className="col-span-12 lg:col-span-4">
            <PortfolioSummaryPanel />
          </Panel>

          <Panel
            title="Activity Timeline" eyebrow="Cross-Desk Feed"
            className="col-span-12 lg:col-span-8"
            bodyClassName="max-h-[420px] overflow-y-auto"
          >
            <ActivityTimeline />
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
