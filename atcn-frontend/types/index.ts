// ─── Shared domain types used across the ATCN frontend ───────────────────────

/** Generic time-series point used by charts */
export interface MetricPoint {
  t: string; // ISO date/time string
  v: number;
}

// ─── Market ──────────────────────────────────────────────────────────────────

export interface MarketRegimeFactor {
  label: string;
  value: number;
  // Backend sends "state" field with values: "favorable" | "neutral" | "caution"
  state: "favorable" | "neutral" | "caution";
}

// ─── Opportunities ───────────────────────────────────────────────────────────

export interface Opportunity {
  id:         string;
  ticker:     string;
  name:       string;
  thesis:     string;
  confidence: number;
  horizon:    string;
  type:       "long" | "short" | "hedge" | "rotation";
  edgeBps:    number;
  tags:       string[];
}

// ─── Risk ────────────────────────────────────────────────────────────────────

export interface RiskAlert {
  id:       string;
  // Backend sends "critical" | "warning" | "info" — components map these to badge tones
  severity: "info" | "warning" | "critical";
  title:    string;
  detail:   string;
  time:     string;
  desk:     string;
}

export interface StressScenario {
  id:              string;
  name:            string;
  description:     string;
  portfolioImpact: number;
  worstAsset:      string;
  probability:     "low" | "moderate" | "elevated" | "high";
}

export interface DrawdownPoint {
  // DrawdownScenarios component reads: day, base, adverse, severe
  day:     number;
  base:    number;
  adverse: number;
  severe:  number;
}

export interface CorrelationCell {
  // CorrelationAnalysis component reads: c.row, c.col, c.value
  row:   string;
  col:   string;
  value: number;
}

export interface HeatmapCell {
  asset:  string;
  metric: string;
  value:  number;
}

// ─── Portfolio ───────────────────────────────────────────────────────────────

export interface HoldingAllocation {
  label:  string;
  value:  number; // percentage
  color?: string;
}

export interface SectorExposureItem {
  sector:      string;
  weight:      number; // portfolio weight %
  benchmark:   number; // benchmark weight %
  activeWeight: number; // active weight = weight - benchmark
  // SectorExposure component reads `s.active` — alias below handled in component
}

export interface AttributionItem {
  // PerformanceAttribution component reads: d.factor, d.contribution
  factor:       string;
  contribution: number;
}

export interface SuggestedAction {
  id:       string;
  priority: "high" | "medium" | "low";
  // SuggestedActions component reads: a.action, a.rationale, a.impact
  action:   string;
  rationale: string;
  impact:   string;
}

// ─── Decision Twin ───────────────────────────────────────────────────────────

export interface SimilarSituation {
  id:         string;
  date:       string;
  setup:      string;
  // SimilarSituations component outcomeTone map uses: "win" | "loss" | "breakeven"
  outcome:    "win" | "loss" | "breakeven";
  similarity: number;
  returnPct:  number;
  note:       string;
}

export interface AlternativeAction {
  id:             string;
  label:          string;
  expectedReturn: number;
  riskScore:      number;
  confidence:     number;
  recommended?:   boolean;
}

// ─── Activity ────────────────────────────────────────────────────────────────

export interface ActivityEvent {
  id:      string;
  time:    string;
  actor:   "ai" | "trader" | "system" | "risk";
  message: string;
  tag?:    string;
}
