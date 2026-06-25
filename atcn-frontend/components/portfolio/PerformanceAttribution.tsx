"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, ReferenceLine } from "recharts";
import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchAttribution } from "@/lib/api";

export function PerformanceAttribution() {
  const { data, isLoading } = useApi(fetchAttribution);

  if (isLoading || !data) return <Skeleton className="h-[280px] w-full" />;

  const sorted = [...data.items].sort((a, b) => b.contribution - a.contribution);
  const total  = sorted.reduce((acc, d) => acc + d.contribution, 0);

  return (
    <div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category" dataKey="factor" width={150}
              tick={{ fill: "#8d96a3", fontSize: 11, fontFamily: "var(--font-mono)" }}
              axisLine={false} tickLine={false}
            />
            <ReferenceLine x={0} stroke="#1d232c" />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
              contentStyle={{ background: "#11151b", border: "1px solid #1d232c", fontSize: 12, fontFamily: "var(--font-mono)" }}
              itemStyle={{ color: "#e7eaee" }}
              formatter={(value: number) => [`${value > 0 ? "+" : ""}${value.toFixed(2)}%`, "Contribution"]}
            />
            <Bar dataKey="contribution" radius={0} barSize={14}>
              {sorted.map((d) => (
                <Cell key={d.factor} fill={d.contribution >= 0 ? "#3fb68c" : "#d8635a"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-2">
        <span className="text-2xs text-ink-tertiary">Total Active Return — {data.period}</span>
        <span className="font-mono text-sm text-pos tabular">{total > 0 ? "+" : ""}{total.toFixed(2)}%</span>
      </div>
    </div>
  );
}
