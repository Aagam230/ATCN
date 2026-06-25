"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchAllocation } from "@/lib/api";

export function AllocationChart() {
  const { data, isLoading } = useApi(fetchAllocation);

  if (isLoading || !data) {
    return <Skeleton className="h-[280px] w-full" />;
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              stroke="#0a0c0f"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#11151b", border: "1px solid #1d232c", fontSize: 12, fontFamily: "var(--font-mono)" }}
              itemStyle={{ color: "#e7eaee" }}
              formatter={(value: number, name: string) => [`${value}%`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-semibold text-ink">100%</span>
          <span className="label-eyebrow">Allocated</span>
        </div>
      </div>

      <div className="mt-2 grid w-full grid-cols-2 gap-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0" style={{ backgroundColor: item.color }} />
            <span className="truncate text-2xs text-ink-secondary">{item.name}</span>
            <span className="ml-auto font-mono text-2xs text-ink tabular">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
