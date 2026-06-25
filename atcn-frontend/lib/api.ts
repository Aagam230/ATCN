/**
 * ATCN API Client
 * All communication with the FastAPI backend.
 * Handles auth headers, token refresh, and snake_case → camelCase normalisation.
 */

import type {
  MetricPoint,
  MarketRegimeFactor,
  Opportunity,
  RiskAlert,
  ActivityEvent,
  HoldingAllocation,
  SectorExposureItem,
  AttributionItem,
  SuggestedAction,
  SimilarSituation,
  AlternativeAction,
  StressScenario,
  DrawdownPoint,
  CorrelationCell,
  HeatmapCell,
} from "@/types";

// ─── Config ─────────────────────────────────────────────────────────────────

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ─── Token storage ───────────────────────────────────────────────────────────

const TOKEN_KEY = "atcn_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Core fetch wrapper ──────────────────────────────────────────────────────

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {}
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Camel-case transformers ─────────────────────────────────────────────────
// Backend returns snake_case; frontend types use camelCase.
// Only fields that differ are transformed here.

function toOpportunity(raw: Record<string, unknown>): Opportunity {
  return {
    id:         raw.id as string,
    ticker:     raw.ticker as string,
    name:       raw.name as string,
    thesis:     raw.thesis as string,
    confidence: raw.confidence as number,
    horizon:    raw.horizon as string,
    type:       raw.type as Opportunity["type"],
    edgeBps:    raw.edge_bps as number,
    tags:       raw.tags as string[],
  };
}

function toRiskAlert(raw: Record<string, unknown>): RiskAlert {
  return {
    id:       raw.id as string,
    severity: raw.severity as RiskAlert["severity"],
    title:    raw.title as string,
    detail:   raw.detail as string,
    time:     raw.time as string,
    desk:     raw.desk as string,
  };
}

function toActivityEvent(raw: Record<string, unknown>): ActivityEvent {
  return {
    id:      raw.id as string,
    time:    raw.time as string,
    actor:   raw.actor as ActivityEvent["actor"],
    message: raw.message as string,
    tag:     raw.tag as string | undefined,
  };
}

function toSimilarSituation(raw: Record<string, unknown>): SimilarSituation {
  return {
    id:         raw.id as string,
    date:       raw.date as string,
    setup:      raw.setup as string,
    outcome:    raw.outcome as SimilarSituation["outcome"],
    similarity: raw.similarity as number,
    returnPct:  raw.return_pct as number,
    note:       raw.note as string,
  };
}

function toAlternativeAction(raw: Record<string, unknown>): AlternativeAction {
  return {
    id:             raw.id as string,
    label:          raw.label as string,
    expectedReturn: raw.expected_return as number,
    riskScore:      raw.risk_score as number,
    confidence:     raw.confidence as number,
    recommended:    raw.recommended as boolean | undefined,
  };
}

function toStressScenario(raw: Record<string, unknown>): StressScenario {
  return {
    id:              raw.id as string,
    name:            raw.name as string,
    description:     raw.description as string,
    portfolioImpact: raw.portfolio_impact as number,
    worstAsset:      raw.worst_asset as string,
    probability:     raw.probability as StressScenario["probability"],
  };
}

function toTailRisk(raw: Record<string, unknown>) {
  return {
    var95:             raw.var95 as number,
    var99:             raw.var99 as number,
    cvar99:            raw.cvar99 as number,
    expectedShortfall: raw.expected_shortfall as number,
    kurtosis:          raw.kurtosis as number,
    skew:              raw.skew as number,
    tailEvents:        (raw.tail_events as { label: string; value: number }[]),
  };
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginResult {
  access_token: string;
  user_id: number;
  name: string;
  email: string;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const form = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE}/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? "Login failed");
  }
  return res.json();
}

export async function register(
  email: string,
  name: string,
  password: string,
): Promise<{ id: number; email: string; name: string }> {
  return request("/auth/register", {
    method: "POST",
    body:   JSON.stringify({ email, name, password }),
  }, false);
}

// ─── Market ──────────────────────────────────────────────────────────────────

export interface TickerItem {
  symbol: string;
  value:  string;
  change: string;
  up:     boolean;
}

export async function fetchTickerFeed(): Promise<{ tickers: TickerItem[]; updated_at: string }> {
  return request("/market/ticker");
}

export interface MarketRegime {
  regime_label:      string;
  regime_confidence: number;
  factors:           MarketRegimeFactor[];
  computed_at:       string;
}

export async function fetchMarketRegime(): Promise<MarketRegime> {
  return request("/market/regime");
}

export async function fetchQuote(symbol: string) {
  return request<{
    symbol: string; name: string; price: number; change: number;
    change_pct: number; day_high: number | null; day_low: number | null;
  }>(`/market/quote/${symbol}`);
}

export async function fetchHistory(symbol: string, period = "6mo", interval = "1d") {
  return request<{ date: string; open: number; high: number; low: number; close: number }[]>(
    `/market/history/${symbol}?period=${period}&interval=${interval}`,
  );
}

// ─── Portfolio ───────────────────────────────────────────────────────────────

export interface PortfolioSummary {
  nav:            number;
  navChangePct:   number;
  dayPnl:         number;
  ytdReturn:      number;
  benchmarkYtd:   number;
  sharpe:         number;
  beta:           number;
  cash:           number;
  updated_at:     string;
}

export async function fetchPortfolioSummary(): Promise<PortfolioSummary> {
  const raw = await request<Record<string, unknown>>("/portfolio/summary");
  return {
    nav:          raw.nav as number,
    navChangePct: raw.nav_change_pct as number,
    dayPnl:       raw.day_pnl as number,
    ytdReturn:    raw.ytd_return as number,
    benchmarkYtd: raw.benchmark_ytd as number,
    sharpe:       raw.sharpe as number,
    beta:         raw.beta as number,
    cash:         raw.cash as number,
    updated_at:   raw.updated_at as string,
  };
}

export async function fetchAumSeries(): Promise<MetricPoint[]> {
  const raw = await request<{ series: { t: string; v: number }[] }>("/portfolio/aum");
  return raw.series;
}

export interface Holding {
  id: number; symbol: string; yf_symbol: string; exchange: string;
  asset_class: string; sector: string | null; quantity: number;
  avg_cost_inr: number; current_price: number; current_value: number;
  unrealised_pnl: number; unrealised_pnl_pct: number;
}

export async function fetchHoldings(): Promise<Holding[]> {
  return request("/portfolio/holdings");
}

export async function addHolding(payload: {
  symbol: string; exchange?: string; asset_class?: string;
  quantity: number; avg_cost_inr: number;
}): Promise<Holding> {
  return request("/portfolio/holdings", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateHolding(
  id: number,
  payload: { quantity?: number; avg_cost_inr?: number; asset_class?: string },
): Promise<Holding> {
  return request(`/portfolio/holdings/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deleteHolding(id: number): Promise<void> {
  return request(`/portfolio/holdings/${id}`, { method: "DELETE" });
}

export async function fetchAllocation(): Promise<HoldingAllocation[]> {
  const raw = await request<{ items: HoldingAllocation[] }>("/portfolio/allocation");
  return raw.items;
}

export async function fetchSectorExposure(): Promise<SectorExposureItem[]> {
  const raw = await request<{ items: SectorExposureItem[] }>("/portfolio/sector");
  return raw.items;
}

export async function fetchAttribution(): Promise<{ items: AttributionItem[]; period: string }> {
  const raw = await request<{ items: AttributionItem[]; period: string }>("/portfolio/attribution");
  return raw;
}

export interface PortfolioHealth {
  score:      number;
  prior:      number;
  components: { label: string; score: number }[];
}

export async function fetchPortfolioHealth(): Promise<PortfolioHealth> {
  return request("/portfolio/health");
}

export async function fetchSuggestedActions(): Promise<SuggestedAction[]> {
  const raw = await request<{ items: SuggestedAction[] }>("/portfolio/actions");
  return raw.items;
}

// ─── Risk ────────────────────────────────────────────────────────────────────

export async function fetchRiskAlerts(): Promise<RiskAlert[]> {
  const raw = await request<{ alerts: Record<string, unknown>[] }>("/risk/alerts");
  return raw.alerts.map(toRiskAlert);
}

export async function fetchTailRisk() {
  const raw = await request<Record<string, unknown>>("/risk/tail");
  return toTailRisk(raw);
}

export async function fetchStressScenarios(): Promise<StressScenario[]> {
  const raw = await request<{ scenarios: Record<string, unknown>[] }>("/risk/stress");
  return raw.scenarios.map(toStressScenario);
}

export async function fetchDrawdownSeries(): Promise<DrawdownPoint[]> {
  const raw = await request<{ series: DrawdownPoint[] }>("/risk/drawdown");
  return raw.series;
}

export async function fetchCorrelationMatrix(): Promise<{
  matrix: CorrelationCell[];
  assets: string[];
  period_days: number;
}> {
  return request("/risk/correlation");
}

export async function fetchRiskHeatmap(): Promise<{
  cells: HeatmapCell[];
  assets: string[];
  metrics: string[];
}> {
  return request("/risk/heatmap");
}

// ─── Decision Twin ───────────────────────────────────────────────────────────

export async function fetchOpportunities(): Promise<Opportunity[]> {
  const raw = await request<{ opportunities: Record<string, unknown>[]; count: number }>(
    "/decision/opportunities",
  );
  return raw.opportunities.map(toOpportunity);
}

export interface TradeReviewData {
  id:            number;
  ticker:        string;
  side:          string;
  proposedSize:  string;
  entryRange:    string;
  currentPrice:  number;
  stopLevel:     number;
  targetLevel:   number;
  notes:         string | null;
  status:        string;
}

export async function fetchTradeReview(): Promise<TradeReviewData | null> {
  try {
    const raw = await request<Record<string, unknown>>("/decision/trade");
    return {
      id:           raw.id as number,
      ticker:       raw.ticker as string,
      side:         raw.side as string,
      proposedSize: raw.proposed_size as string,
      entryRange:   raw.entry_range as string,
      currentPrice: raw.current_price as number,
      stopLevel:    raw.stop_level as number,
      targetLevel:  raw.target_level as number,
      notes:        raw.notes as string | null,
      status:       raw.status as string,
    };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function submitTradeForReview(payload: {
  ticker: string; side: "BUY" | "SELL"; proposed_size_pct: number;
  entry_low: number; entry_high: number; stop_level: number;
  target_level: number; notes?: string;
}): Promise<TradeReviewData> {
  const raw = await request<Record<string, unknown>>("/decision/trade", {
    method: "POST",
    body:   JSON.stringify(payload),
  });
  return {
    id:           raw.id as number,
    ticker:       raw.ticker as string,
    side:         raw.side as string,
    proposedSize: raw.proposed_size as string,
    entryRange:   raw.entry_range as string,
    currentPrice: raw.current_price as number,
    stopLevel:    raw.stop_level as number,
    targetLevel:  raw.target_level as number,
    notes:        raw.notes as string | null,
    status:       raw.status as string,
  };
}

export interface ConfidenceData {
  score:   number;
  drivers: { label: string; value: number }[];
}

export async function fetchConfidenceScore(): Promise<ConfidenceData> {
  return request("/decision/confidence");
}

export interface BehavioralRiskData {
  score:   number;
  level:   string;
  markers: { label: string; detected: boolean; weight: number }[];
}

export async function fetchBehavioralRisk(): Promise<BehavioralRiskData> {
  return request("/decision/behavioral");
}

export async function fetchSimilarSituations(): Promise<{
  situations: SimilarSituation[];
  analogues_searched: number;
}> {
  const raw = await request<{
    situations: Record<string, unknown>[];
    analogues_searched: number;
  }>("/decision/similar");
  return {
    situations:          raw.situations.map(toSimilarSituation),
    analogues_searched:  raw.analogues_searched,
  };
}

export async function fetchAlternativeActions(): Promise<AlternativeAction[]> {
  const raw = await request<{ actions: Record<string, unknown>[] }>("/decision/alternatives");
  return raw.actions.map(toAlternativeAction);
}

export async function submitDecision(
  tradeId: number,
  decision: "approve" | "reject" | "return",
  comment?: string,
): Promise<{ trade_id: number; decision: string; message: string }> {
  return request(`/decision/submit/${tradeId}`, {
    method: "POST",
    body:   JSON.stringify({ decision, comment }),
  });
}

// ─── Activity Timeline ───────────────────────────────────────────────────────

export async function fetchActivityTimeline(): Promise<ActivityEvent[]> {
  // Activity events come from the risk alerts feed for now; a dedicated
  // /activity endpoint can be added later. Falls back to empty array gracefully.
  try {
    const raw = await request<{ events: Record<string, unknown>[] }>("/activity/events");
    return raw.events.map(toActivityEvent);
  } catch {
    return [];
  }
}
