"use client";

interface SparklineProps {
  data:        { v: number }[];
  /** Stroke colour (default: pos green) */
  color?:      string;
  height?:     number;
  strokeWidth?: number;
  className?:  string;
}

export function Sparkline({
  data,
  color = "#34d399",
  height = 40,
  strokeWidth = 1.5,
  className,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const values  = data.map((d) => d.v);
  const min     = Math.min(...values);
  const max     = Math.max(...values);
  const range   = max - min || 1;
  const width   = 100; // viewBox units

  // Map each point to x,y coordinates
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return { x, y };
  });

  // Build SVG polyline points string
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Build area fill path
  const areaPath = [
    `M ${points[0].x},${height}`,
    ...points.map((p) => `L ${p.x},${p.y}`),
    `L ${points[points.length - 1].x},${height}`,
    "Z",
  ].join(" ");

  const gradientId = `sparkline-grad-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0"   />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
