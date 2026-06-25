"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useApi, Skeleton } from "@/hooks/useApi";
import { fetchDrawdownSeries } from "@/lib/api";

export function DrawdownScenarios() {
  const { data, isLoading } = useApi(fetchDrawdownSeries);

  if (isLoading || !data) return <Skeleton className="h-[280px] w-full" />;

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="#161b22" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "#5c6470", fontSize: 10, fontFamily: "var(--font-mono)" }}
            axisLine={{ stroke: "#1d232c" }} tickLine={false}
            label={{ value: "Trading Days", position: "insideBottom", offset: -2, fill: "#5c6470", fontSize: 10 }}
          />
          <YAxis
            tick={{ fill: "#5c6470", fontSize: 10, fontFamily: "var(--font-mono)" }}
            axisLine={false} tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{ background: "#11151b", border: "1px solid #1d232c", fontSize: 12, fontFamily: "var(--font-mono)" }}
            itemStyle={{ color: "#e7eaee" }}
            formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#8d96a3" }} iconType="plainline" />
          <Line type="monotone" dataKey="base"    name="Base Case" stroke="#3fb68c" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="adverse" name="Adverse"   stroke="#c8923a" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="severe"  name="Severe"    stroke="#d8635a" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
