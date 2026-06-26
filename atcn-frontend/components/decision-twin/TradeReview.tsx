"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchTradeReview, submitDecision } from "@/lib/api";
import { Loader2 } from "lucide-react";

export function TradeReview() {
  const { data: t, isLoading, refresh } = useApi(fetchTradeReview);
  const [submitting, setSubmitting]     = useState(false);
  const [message, setMessage]           = useState<string | null>(null);

  if (isLoading) return <Skeleton className="h-[260px] w-full" />;

  if (!t) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10">
        <p className="text-sm text-ink-secondary">No trade pending review.</p>
        <p className="text-2xs text-ink-tertiary">Submit a trade from the Decision Twin to begin analysis.</p>
      </div>
    );
  }

  async function handleDecision(decision: "approve" | "reject" | "return") {
    if (!t) return;
    setSubmitting(true);
    try {
      const res = await submitDecision(t.id, decision);
      setMessage(res.message);
      setTimeout(() => { setMessage(null); refresh(); }, 3000);
    } catch {
      setMessage("Failed to submit decision.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-lg font-semibold text-ink">{t.ticker}</span>
          <Badge tone="pos">{t.side}</Badge>
        </div>
        <span className="font-mono text-sm text-ink tabular">₹{t.currentPrice.toFixed(2)}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Proposed Size" value={t.proposedSize} />
        <Field label="Entry Range"   value={t.entryRange} />
        <Field label="Stop Level"    value={`₹${t.stopLevel.toFixed(2)}`}  tone="text-neg" />
        <Field label="Target Level"  value={`₹${t.targetLevel.toFixed(2)}`} tone="text-pos" />
      </div>

      <div className="relative h-8 w-full bg-line-soft">
        {(() => {
          const lo  = t.stopLevel;
          const hi  = t.targetLevel;
          const rng = hi - lo;
          const cur = Math.max(0, Math.min(100, ((t.currentPrice - lo) / rng) * 100));
          return (
            <>
              <div className="absolute inset-y-0 left-0 w-full bg-neg/20" />
              <div className="absolute inset-y-0 left-0 bg-pos/30" style={{ width: `${cur}%` }} />
              <div className="absolute top-0 h-8 w-0.5 bg-signal-amber" style={{ left: `${cur}%` }} />
            </>
          );
        })()}
      </div>
      <div className="flex justify-between font-mono text-2xs text-ink-tertiary tabular">
        <span>STOP ₹{t.stopLevel.toFixed(2)}</span>
        <span className="text-signal-amber">MARK ₹{t.currentPrice.toFixed(2)}</span>
        <span>TARGET ₹{t.targetLevel.toFixed(2)}</span>
      </div>

      {t.notes && (
        <div className="border border-line bg-base-raised p-3">
          <div className="label-eyebrow mb-1.5">Decision Twin Notes</div>
          <p className="text-xs leading-relaxed text-ink-secondary">{t.notes}</p>
        </div>
      )}

      {message && (
        <div className="border border-pos/30 bg-pos/10 px-3 py-2 text-xs text-pos">{message}</div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleDecision("approve")}
          disabled={submitting}
          className="flex flex-1 items-center justify-center gap-1.5 border border-pos/40 bg-pos-dim py-2 text-xs font-medium text-pos transition-colors hover:bg-pos/20 disabled:opacity-50 focus-ring"
        >
          {submitting && <Loader2 size={12} className="animate-spin" />}
          Approve Staged Entry
        </button>
        <button
          onClick={() => handleDecision("return")}
          disabled={submitting}
          className="flex-1 border border-line-strong py-2 text-xs font-medium text-ink-secondary transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50 focus-ring"
        >
          Send Back to Desk
        </button>
        <button
          onClick={() => handleDecision("reject")}
          disabled={submitting}
          className="flex-1 border border-neg/40 bg-neg-dim py-2 text-xs font-medium text-neg transition-colors hover:bg-neg/20 disabled:opacity-50 focus-ring"
        >
          Reject Trade
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="border border-line bg-base-raised px-3 py-2">
      <div className="text-2xs text-ink-tertiary">{label}</div>
      <div className={`mt-0.5 font-mono text-xs tabular ${tone ?? "text-ink"}`}>{value}</div>
    </div>
  );
}
