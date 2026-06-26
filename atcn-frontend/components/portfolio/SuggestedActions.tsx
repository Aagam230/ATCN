"use client";

import { Badge } from "@/components/ui/Badge";
import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchSuggestedActions } from "@/lib/api";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SuggestedAction } from "@/types";

const priorityTone: Record<SuggestedAction["priority"], "critical" | "warning" | "muted"> = {
  high:   "critical",
  medium: "warning",
  low:    "muted",
};

export function SuggestedActions() {
  const { data: actions, isLoading } = useApi(fetchSuggestedActions);

  if (isLoading || !actions) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-line-soft">
      {actions.map((a) => (
        <div key={a.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-medium text-ink">{a.action}</span>
            <Badge tone={priorityTone[a.priority]} className="shrink-0">{a.priority}</Badge>
          </div>
          <p className="text-2xs leading-relaxed text-ink-secondary">{a.rationale}</p>
          <div className="flex items-center justify-between">
            <span className="font-mono text-2xs text-pos">{a.impact}</span>
            <button className={cn(
              "flex items-center gap-1 border border-line-strong px-2 py-1 text-2xs text-ink-secondary",
              "hover:border-signal-amber/40 hover:text-signal-amber transition-colors focus-ring"
            )}>
              Review <ArrowRight size={11} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
