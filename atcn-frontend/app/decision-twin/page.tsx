"use client";

import { PageShell } from "@/components/layout/PageShell";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { ConfidenceScore } from "@/components/decision-twin/ConfidenceScore";
import { BehavioralRiskScore } from "@/components/decision-twin/BehavioralRiskScore";
import { SimilarSituations } from "@/components/decision-twin/SimilarSituations";
import { AlternativeActions } from "@/components/decision-twin/AlternativeActions";
import { TradeReview } from "@/components/decision-twin/TradeReview";
import { useApi } from "@/hooks/useApi";
import { fetchTradeReview } from "@/lib/api";

export default function DecisionTwinPage() {
  const { data: trade } = useApi(fetchTradeReview);

  return (
    <PageShell title="Decision Twin Workspace" breadcrumb="ATCN">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border border-line bg-base-panel px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="label-eyebrow">Active Decision</span>
            {trade ? (
              <>
                <span className="font-mono text-sm font-semibold text-ink">
                  {trade.ticker} — {trade.side} {trade.proposedSize}
                </span>
                <Badge tone="amber" dot>Awaiting Review</Badge>
              </>
            ) : (
              <span className="text-xs text-ink-tertiary">No trade pending — submit one below</span>
            )}
          </div>
          <span className="font-mono text-2xs text-ink-tertiary">Matched against 47 historical analogues</span>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <Panel title="Decision Confidence" eyebrow="Model Output" className="col-span-12 lg:col-span-6">
            <ConfidenceScore />
          </Panel>

          <Panel title="Behavioral Risk" eyebrow="Trader Psychology Model" className="col-span-12 lg:col-span-6">
            <BehavioralRiskScore />
          </Panel>

          <Panel
            title="Similar Historical Situations" eyebrow="NSE Pattern Matching · Top 4"
            className="col-span-12 lg:col-span-7"
            bodyClassName="max-h-[480px] overflow-y-auto"
          >
            <SimilarSituations />
          </Panel>

          <Panel title="Alternative Actions" eyebrow="Comparison Matrix" className="col-span-12 lg:col-span-5">
            <AlternativeActions />
          </Panel>

          <Panel title="Trade Review Workspace" eyebrow="Execution Desk" className="col-span-12">
            <TradeReview />
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
