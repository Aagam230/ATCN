"use client";

import { useEffect, useState } from "react";
import { Search, Bell, Wifi, LogOut } from "lucide-react";
import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchTickerFeed } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

function Clock() {
  const [time, setTime] = useState<string>("");
  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false, timeZone: "Asia/Kolkata",
      }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono text-xs text-ink-secondary tabular">{time || "--:--:--"} IST</span>;
}

export function TickerRibbon() {
  const { data, isLoading } = useApi(fetchTickerFeed);

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
    );
  }

  const loop = [...data.tickers, ...data.tickers];
  return (
    <div className="relative flex overflow-hidden">
      <div className="flex animate-ticker gap-6 whitespace-nowrap">
        {loop.map((t, i) => (
          <span key={`${t.symbol}-${i}`} className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-ink-secondary">{t.symbol}</span>
            <span className="text-ink tabular">{t.value}</span>
            <span className={cn("tabular", t.up ? "text-pos" : "text-neg")}>{t.change}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function TopBar() {
  const { user, logout } = useAuth();
  return (
    <header className="flex h-11 items-center justify-between border-b border-line bg-base-panel px-4 gap-4">
      <div className="min-w-0 flex-1 overflow-hidden">
        <TickerRibbon />
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Clock />
        <div className="flex items-center gap-1">
          <Wifi size={13} className="text-pos" />
          <span className="text-2xs text-pos">NSE LIVE</span>
        </div>
        <button className="text-ink-tertiary hover:text-ink focus-ring transition-colors">
          <Search size={15} />
        </button>
        <button className="text-ink-tertiary hover:text-ink focus-ring transition-colors">
          <Bell size={15} />
        </button>
        {user && (
          <button
            onClick={logout}
            title="Sign out"
            className="flex items-center gap-1.5 text-ink-tertiary hover:text-neg focus-ring transition-colors"
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </header>
  );
}
