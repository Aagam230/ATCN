"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PanelProps {
  /** Panel header title */
  title:        string;
  /** Small all-caps label above the title */
  eyebrow?:     string;
  /** JSX element rendered in the top-right of the header (e.g. a Badge) */
  action?:      ReactNode;
  /** Panel body content */
  children:     ReactNode;
  /** Extra classes on the outer container */
  className?:   string;
  /** Extra classes on the body section */
  bodyClassName?: string;
}

export function Panel({
  title,
  eyebrow,
  action,
  children,
  className,
  bodyClassName,
}: PanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col border border-line bg-base-panel",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex flex-col">
          {eyebrow && (
            <span className="label-eyebrow mb-0.5">{eyebrow}</span>
          )}
          <h2 className="font-mono text-sm font-semibold leading-tight text-ink">
            {title}
          </h2>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Body */}
      <div className={cn("flex-1 p-4", bodyClassName)}>
        {children}
      </div>
    </div>
  );
}
