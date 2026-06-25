"use client";

import { Bot, Cog, User, Building2 } from "lucide-react";
import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchActivityTimeline } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ActivityEvent } from "@/types";

const actorMeta: Record<ActivityEvent["actor"], { icon: typeof Bot; tone: string }> = {
  ai:     { icon: Bot,       tone: "text-signal-amber border-signal-amber/30 bg-signal-amberDim" },
  system: { icon: Cog,       tone: "text-info border-info/30 bg-info-dim" },
  user:   { icon: User,      tone: "text-violet border-violet/30 bg-violet-dim" },
  desk:   { icon: Building2, tone: "text-pos border-pos/30 bg-pos-dim" },
};

// Hardcoded seed events shown when the activity endpoint returns nothing yet
const SEED_EVENTS: ActivityEvent[] = [
  { id: "s1", time: "09:02", actor: "system", message: "Market open — NSE session started. NIFTY 50 +0.42% at open.", tag: "MARKET" },
  { id: "s2", time: "09:14", actor: "ai",     message: "Opportunity engine surfaced 8 new signals across NIFTY 50 universe.", tag: "ENGINE" },
  { id: "s3", time: "09:31", actor: "desk",   message: "Equity desk flagged BAJFINANCE for Decision Twin review.", tag: "EQUITY" },
  { id: "s4", time: "10:05", actor: "system", message: "India VIX declined 1.2 pts — regime model updated to RISK-ON.", tag: "REGIME" },
  { id: "s5", time: "10:22", actor: "user",   message: "Portfolio rebalance threshold review completed.", tag: "PORTFOLIO" },
];

export function ActivityTimeline() {
  const { data, isLoading } = useApi(fetchActivityTimeline);
  const events = (data && data.length > 0) ? data : SEED_EVENTS;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-line" />
      {events.map((ev) => {
        const meta = actorMeta[ev.actor];
        const Icon = meta.icon;
        return (
          <div key={ev.id} className="relative flex gap-3 py-2.5">
            <div className={cn("relative z-10 flex h-7 w-7 shrink-0 items-center justify-center border", meta.tone)}>
              <Icon size={13} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xs text-ink-tertiary tabular">{ev.time}</span>
                {ev.tag && (
                  <span className="border border-line-strong px-1.5 py-0.5 text-2xs text-ink-secondary">
                    {ev.tag}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-secondary">{ev.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
