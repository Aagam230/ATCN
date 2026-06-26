"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone =
  | "pos"
  | "neg"
  | "info"
  | "violet"
  | "amber"
  | "critical"
  | "muted"
  | "neutral"
  | "elevated"
  | "warning"
  | "watch";

interface BadgeProps {
  children:   ReactNode;
  tone?:      Tone;
  dot?:       boolean;
  className?: string;
}

const toneStyles: Record<Tone, string> = {
  pos:      "border-pos/30 bg-pos-dim text-pos",
  neg:      "border-neg/30 bg-neg-dim text-neg",
  info:     "border-info/30 bg-info-dim text-info",
  violet:   "border-violet/30 bg-violet-dim text-violet",
  amber:    "border-signal-amber/30 bg-signal-amber/10 text-signal-amber",
  critical: "border-neg/30 bg-neg-dim text-neg",
  muted:    "border-line-strong bg-base-raised text-ink-secondary",
  neutral:  "border-line-strong bg-base-raised text-ink-secondary",
  elevated: "border-signal-amber/30 bg-signal-amber/10 text-signal-amber",
  warning:  "border-signal-amber/30 bg-signal-amber/10 text-signal-amber",
  watch:    "border-info/30 bg-info-dim text-info",
};

const dotStyles: Record<Tone, string> = {
  pos:      "bg-pos",
  neg:      "bg-neg",
  info:     "bg-info",
  violet:   "bg-violet",
  amber:    "bg-signal-amber",
  critical: "bg-neg",
  muted:    "bg-ink-tertiary",
  neutral:  "bg-ink-tertiary",
  elevated: "bg-signal-amber",
  warning:  "bg-signal-amber",
  watch:    "bg-info",
};

export function Badge({ children, tone = "muted", dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-1.5 py-0.5",
        "font-mono text-2xs font-medium uppercase tracking-wide",
        toneStyles[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0 animate-pulse", dotStyles[tone])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
