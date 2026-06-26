"use client";

import { cn } from "@/lib/utils";
import { clamp } from "@/lib/utils";

type Tone = "pos" | "neg" | "amber" | "info" | "violet";

const toneColor: Record<Tone, string> = {
  pos:    "#34d399",
  neg:    "#f87171",
  amber:  "#fbbf24",
  info:   "#60a5fa",
  violet: "#a78bfa",
};

const toneTailwind: Record<Tone, string> = {
  pos:    "text-pos",
  neg:    "text-neg",
  amber:  "text-signal-amber",
  info:   "text-info",
  violet: "text-violet",
};

// ─── Circular gauge ──────────────────────────────────────────────────────────

interface ScoreGaugeProps {
  /** 0–100 */
  value:        number;
  label?:       string;
  /** Optional smaller line rendered below the label */
  sublabel?:    string;
  tone?:        Tone;
  /** Outer diameter in px */
  size?:        number;
  strokeWidth?: number;
  className?:   string;
}

export function ScoreGauge({
  value,
  label,
  sublabel,
  tone = "pos",
  size = 120,
  strokeWidth = 6,
  className,
}: ScoreGaugeProps) {
  const r      = (size - strokeWidth) / 2;
  const cx     = size / 2;
  const cy     = size / 2;
  const circ   = 2 * Math.PI * r;
  const pct    = clamp(value, 0, 100) / 100;
  const arc    = circ * 0.75;
  const offset = arc - pct * arc;
  const rotate = 135;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`${label ?? "Score"}: ${value}`}
        role="img"
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--color-line-strong)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circ - arc}`}
          strokeDashoffset={0}
          transform={`rotate(${rotate} ${cx} ${cy})`}
        />
        {/* Fill */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={toneColor[tone]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circ - arc}`}
          strokeDashoffset={offset}
          transform={`rotate(${rotate} ${cx} ${cy})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute flex flex-col items-center">
        <span className={cn("font-mono text-2xl font-bold tabular leading-none", toneTailwind[tone])}>
          {Math.round(value)}
        </span>
        {label && (
          <span className="mt-1 text-center text-2xs font-semibold uppercase tracking-widest text-ink-tertiary">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="mt-0.5 text-center text-2xs text-ink-tertiary">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Linear / bar score ──────────────────────────────────────────────────────

interface LinearScoreProps {
  label:      string;
  /** 0–100 */
  value:      number;
  tone?:      Tone;
  className?: string;
}

export function LinearScore({ label, value, tone = "pos", className }: LinearScoreProps) {
  const pct = clamp(value, 0, 100);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs text-ink-secondary">{label}</span>
        <span className={cn("font-mono text-xs tabular shrink-0", toneTailwind[tone])}>
          {Math.round(pct)}
        </span>
      </div>
      <div className="h-1 w-full bg-line-soft">
        <div
          className="h-1"
          style={{
            width:           `${pct}%`,
            backgroundColor: toneColor[tone],
            transition:      "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}
