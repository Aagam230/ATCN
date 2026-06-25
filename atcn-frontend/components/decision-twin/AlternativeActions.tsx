"use client";

import { Badge } from "@/components/ui/Badge";
import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchAlternativeActions } from "@/lib/api";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AlternativeActions() {
  const { data: actions, isLoading } = useApi(fetchAlternativeActions);

  if (isLoading || !actions) return <Skeleton className="h-[200px] w-full" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="py-2 pr-3 font-mono text-2xs uppercase tracking-wider text-ink-tertiary">Action</th>
            <th className="py-2 pr-3 font-mono text-2xs uppercase tracking-wider text-ink-tertiary">Exp. Return</th>
            <th className="py-2 pr-3 font-mono text-2xs uppercase tracking-wider text-ink-tertiary">Risk Score</th>
            <th className="py-2 pr-3 font-mono text-2xs uppercase tracking-wider text-ink-tertiary">Confidence</th>
            <th className="py-2 font-mono text-2xs uppercase tracking-wider text-ink-tertiary" />
          </tr>
        </thead>
        <tbody>
          {actions.map((a) => (
            <tr
              key={a.id}
              className={cn("border-b border-line-soft last:border-b-0", a.recommended && "bg-signal-amberDim/40")}
            >
              <td className="py-2.5 pr-3">
                <div className="flex items-center gap-2">
                  {a.recommended && <CheckCircle2 size={13} className="text-signal-amber shrink-0" />}
                  <span className={cn("text-xs", a.recommended ? "text-ink font-medium" : "text-ink-secondary")}>
                    {a.label}
                  </span>
                </div>
              </td>
              <td className="py-2.5 pr-3 font-mono text-xs text-pos tabular">
                {a.expectedReturn > 0 ? "+" : ""}{a.expectedReturn.toFixed(1)}%
              </td>
              <td className="py-2.5 pr-3">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-16 bg-line-soft">
                    <div
                      className={cn("h-1", a.riskScore > 60 ? "bg-neg" : a.riskScore > 35 ? "bg-signal-amber" : "bg-pos")}
                      style={{ width: `${a.riskScore}%` }}
                    />
                  </div>
                  <span className="font-mono text-2xs text-ink-tertiary tabular">{a.riskScore}</span>
                </div>
              </td>
              <td className="py-2.5 pr-3 font-mono text-xs text-ink tabular">{a.confidence}%</td>
              <td className="py-2.5">{a.recommended && <Badge tone="amber">Recommended</Badge>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
