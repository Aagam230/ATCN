"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface ApiState<T> {
  data:       T | null;
  isLoading:  boolean;
  error:      string | null;
  refresh:    () => void;
}

/**
 * Generic hook for calling any API function.
 * - Runs on mount (and when deps change)
 * - Exposes { data, isLoading, error, refresh }
 * - Redirects to /login on 401
 *
 * Usage:
 *   const { data, isLoading } = useApi(fetchPortfolioSummary);
 *   const { data } = useApi(() => fetchQuote("RELIANCE"), []);
 */
export function useApi<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
): ApiState<T> {
  const [data, setData]         = useState<T | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const router                  = useRouter();
  const fnRef                   = useRef(fn);
  fnRef.current                 = fn;

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current();
      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      // Redirect to login on auth failure
      if (msg.includes("401") || msg.toLowerCase().includes("credentials")) {
        router.push("/login");
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);

  return { data, isLoading, error, refresh: run };
}

/** Minimal loading skeleton — reuse inside components */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-none bg-line-soft ${className}`}
      aria-hidden="true"
    />
  );
}
