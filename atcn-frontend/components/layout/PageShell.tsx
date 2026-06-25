"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  ShieldAlert,
  BrainCog,
  BarChart3,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { cn } from "@/lib/utils";

// ─── Navigation items ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/",                label: "Command",  icon: LayoutDashboard, short: "CMD"  },
  { href: "/portfolio",       label: "Portfolio",icon: Briefcase,       short: "PFL"  },
  { href: "/risk",            label: "Risk",     icon: ShieldAlert,     short: "RSK"  },
  { href: "/decision-twin",   label: "Decision", icon: BrainCog,        short: "DEC"  },
] as const;

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-14 flex-col border-r border-line bg-base-panel">
      {/* Logo mark */}
      <div className="flex h-11 items-center justify-center border-b border-line">
        <BarChart3 size={18} className="text-signal-amber" aria-label="ATCN" />
      </div>

      {/* Nav icons */}
      <nav className="flex flex-1 flex-col items-center gap-1 py-3" aria-label="Main navigation">
        {NAV_ITEMS.map(({ href, label, icon: Icon, short }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex h-10 w-10 flex-col items-center justify-center gap-0.5",
                "transition-colors focus-ring",
                active
                  ? "bg-base-raised text-signal-amber"
                  : "text-ink-tertiary hover:bg-base-elevated hover:text-ink",
              )}
            >
              {active && (
                <span
                  className="absolute inset-y-0 left-0 w-0.5 bg-signal-amber"
                  aria-hidden="true"
                />
              )}
              <Icon size={16} />
              <span className="text-2xs font-mono font-semibold uppercase tracking-wider leading-none">
                {short}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer dot — live indicator */}
      <div className="flex items-center justify-center pb-3">
        <span
          className="h-2 w-2 rounded-full bg-pos animate-pulse"
          title="Live connection"
          aria-label="Live"
        />
      </div>
    </aside>
  );
}

// ─── Page Shell ───────────────────────────────────────────────────────────────

interface PageShellProps {
  /** Page title shown in the header breadcrumb */
  title:      string;
  /** Short parent label for the breadcrumb */
  breadcrumb?: string;
  children:   ReactNode;
}

export function PageShell({ title, breadcrumb = "ATCN", children }: PageShellProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-base text-ink">
      {/* Left sidebar */}
      <Sidebar />

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar with ticker ribbon */}
        <TopBar />

        {/* Page breadcrumb / title bar */}
        <div className="flex items-center gap-2 border-b border-line bg-base-panel px-4 py-2">
          <span className="label-eyebrow">{breadcrumb}</span>
          <span className="text-ink-tertiary text-2xs">/</span>
          <h1 className="font-mono text-xs font-semibold text-ink">{title}</h1>
        </div>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
