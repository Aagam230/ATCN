"use client";

import { AlertTriangle, AlertOctagon, Info } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchRiskAlerts } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { RiskAlert } from "@/types";

const severityMeta: Record<
  RiskAlert["severity"],
  { icon: typeof AlertTriangle; tone: "critical" | "warning" | "watch"; iconClass: string }
> = {
  critical: { icon: AlertOctagon, tone: "critical", iconClass: "text-neg" },
  warning:  { icon: AlertTriangle, tone: "warning",  iconClass: "text-signal-amber" },
  info:     { icon: Info,          tone: "watch",    iconClass: "text-info" },
};

export function RiskAlertsFeed() {
  const { data: alerts, isLoading } = useApi(fetchRiskAlerts);

  if (isLoading || !alerts) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (alerts.length === 0) {
    return <p className="py-4 text-center text-xs text-ink-tertiary">No active risk alerts.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-line-soft">
      {alerts.map((alert) => {
        const meta = severityMeta[alert.severity];
        const Icon = meta.icon;
        return (
          <div key={alert.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <Icon size={15} className={cn("mt-0.5 shrink-0", meta.iconClass)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-ink">{alert.title}</span>
                <span className="shrink-0 font-mono text-2xs text-ink-tertiary tabular">{alert.time}</span>
              </div>
              <p className="mt-0.5 text-2xs leading-relaxed text-ink-secondary">{alert.detail}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge tone={meta.tone}>{alert.severity}</Badge>
                <span className="text-2xs text-ink-tertiary">{alert.desk} Desk</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
