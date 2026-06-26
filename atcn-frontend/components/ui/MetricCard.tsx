"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface MetricCardProps {
  label:       string;
  value:       string;
  /** Formatted string like "+2.5%" */
  delta?:      string;
  /** Positive → green, negative → red, zero/undefined → muted */
  deltaValue?: number;
  sublabel?:   string;
  icon?:       ReactNode;
  className?:  string;
}

export function MetricCard({
  label,
  value,
  delta,
  deltaValue,
  sublabel,
  icon,
  className,
}: MetricCardProps) {
  const deltaColor =
    deltaValue === undefined
      ? "text-ink-tertiary"
      : deltaValue > 0
      ? "text-pos"
      : deltaValue < 0
      ? "text-neg"
      : "text-ink-tertiary";

  return (
    <div
      className={cn(
        "flex flex-col gap-1 border border-line bg-base-panel p-3",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="label-eyebrow truncate">{label}</span>
        {icon && (
          <span className="shrink-0 text-ink-tertiary">{icon}</span>
        )}
      </div>

      <div className="font-mono text-xl font-semibold leading-none tabular text-ink">
        {value}
      </div>

      <div className="flex items-center gap-1.5 leading-none">
        {delta && (
          <span className={cn("font-mono text-2xs tabular", deltaColor)}>
            {delta}
          </span>
        )}
        {sublabel && (
          <span className="text-2xs text-ink-tertiary truncate">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
