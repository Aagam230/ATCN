"use client";

import { TrendingUp, TrendingDown, Shuffle, Shield } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchOpportunities } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Opportunity } from "@/types";

const typeMeta: Record<Opportunity["type"], { icon: typeof TrendingUp; tone: "pos" | "neg" | "info" | "violet"; label: string }> = {
  long:     { icon: TrendingUp,   tone: "pos",    label: "LONG"   },
  short:    { icon: TrendingDown, tone: "neg",    label: "SHORT"  },
  hedge:    { icon: Shield,       tone: "info",   label: "HEDGE"  },
  rotation: { icon: Shuffle,      tone: "violet", label: "ROTATE" },
};

export function OpportunityFeed() {
  const { data: opps, isLoading } = useApi(fetchOpportunities);

  if (isLoading || !opps) {
    return (
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {opps.map((op) => {
        const meta = typeMeta[op.type];
        const Icon = meta.icon;
        return (
          <div
            key={op.id}
            className="group border border-line bg-base-raised p-3 transition-colors hover:border-line-strong"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center border",
                  meta.tone === "pos"    && "border-pos/30 bg-pos-dim",
                  meta.tone === "neg"    && "border-neg/30 bg-neg-dim",
                  meta.tone === "info"   && "border-info/30 bg-info-dim",
                  meta.tone === "violet" && "border-violet/30 bg-violet-dim",
                )}>
                  <Icon size={14} className={cn(
                    meta.tone === "pos"    && "text-pos",
                    meta.tone === "neg"    && "text-neg",
                    meta.tone === "info"   && "text-info",
                    meta.tone === "violet" && "text-violet",
                  )} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-ink">{op.ticker}</span>
                    <span className="truncate text-2xs text-ink-tertiary">{op.name}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-ink-secondary leading-relaxed">
                    {op.thesis}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge tone={meta.tone}>{meta.label}</Badge>
                <span className="font-mono text-2xs text-ink-tertiary">{op.horizon}</span>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between border-t border-line-soft pt-2.5">
              <div className="flex flex-wrap gap-1.5">
                {op.tags.map((tag) => (
                  <span key={tag} className="border border-line-strong px-1.5 py-0.5 text-2xs text-ink-tertiary">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-2xs text-ink-tertiary">
                  Edge <span className={cn("tabular", op.edgeBps >= 0 ? "text-pos" : "text-neg")}>
                    {op.edgeBps >= 0 ? "+" : ""}{op.edgeBps}bps
                  </span>
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="h-1 w-12 bg-line-soft">
                    <div className="h-1 bg-signal-amber" style={{ width: `${op.confidence}%` }} />
                  </div>
                  <span className="font-mono text-2xs text-ink tabular">{op.confidence}%</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
