import type { DryingLogEntry } from "./drying-log-section";

type Props = {
  entries: DryingLogEntry[];
};

export function DryingLogChart({ entries }: Props) {
  const points = entries
    .filter((e) => e.moisture_percent !== null && e.moisture_percent !== undefined)
    .map((e) => ({
      date: new Date(e.recorded_at).getTime(),
      value: e.moisture_percent as number,
      room: e.room_label ?? null,
    }))
    .sort((a, b) => a.date - b.date);

  if (points.length < 2) {
    return null; // Kein Chart bei weniger als 2 Datenpunkten
  }

  const width = 600;
  const height = 180;
  const padding = { top: 20, right: 15, bottom: 30, left: 35 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const minDate = points[0].date;
  const maxDate = points[points.length - 1].date;
  const dateRange = Math.max(1, maxDate - minDate);

  const values = points.map((p) => p.value);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 100);
  const valRange = Math.max(1, maxVal - minVal);

  const scaleX = (d: number) => padding.left + ((d - minDate) / dateRange) * chartW;
  const scaleY = (v: number) =>
    padding.top + chartH - ((v - minVal) / valRange) * chartH;

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(p.date).toFixed(1)} ${scaleY(p.value).toFixed(1)}`)
    .join(" ");

  // Y-Achsen Labels (einfach)
  const yTicks = [minVal, minVal + valRange / 2, maxVal].map((v) => Math.round(v));

  // Trend: fallende Werte = Gut (grün), steigende = Rot
  const trendDelta = points[points.length - 1].value - points[0].value;
  const trendGood = trendDelta < 0;
  const strokeColor = trendGood ? "#059669" : "#dc2626"; // emerald-600 / red-600
  const fillColor = trendGood ? "#d1fae5" : "#fee2e2"; // emerald-100 / red-100

  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-700">
          Feuchtigkeits-Verlauf
        </p>
        <p
          className={`text-xs font-medium ${
            trendGood ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {trendGood ? "↓" : "↑"} {Math.abs(trendDelta).toFixed(1)}% {trendGood ? "getrocknet" : "zugenommen"}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Feuchtigkeits-Trendchart"
      >
        {/* Y-Achse */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={scaleY(v)}
              y2={scaleY(v)}
              stroke="#e2e8f0"
              strokeDasharray="2,2"
            />
            <text
              x={padding.left - 5}
              y={scaleY(v) + 4}
              textAnchor="end"
              className="fill-slate-400 text-[10px]"
            >
              {v}%
            </text>
          </g>
        ))}

        {/* Fläche unter der Linie */}
        <path
          d={`${pathD} L ${scaleX(maxDate).toFixed(1)} ${padding.top + chartH} L ${scaleX(minDate).toFixed(1)} ${padding.top + chartH} Z`}
          fill={fillColor}
          opacity="0.4"
        />

        {/* Datenlinie */}
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Datenpunkte */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={scaleX(p.date).toFixed(1)}
            cy={scaleY(p.value).toFixed(1)}
            r="3"
            fill={strokeColor}
          />
        ))}

        {/* X-Achse Datumslabels (erster + letzter) */}
        <text
          x={padding.left}
          y={height - 8}
          className="fill-slate-500 text-[10px]"
        >
          {new Intl.DateTimeFormat("de-DE", { dateStyle: "short" }).format(new Date(minDate))}
        </text>
        <text
          x={width - padding.right}
          y={height - 8}
          textAnchor="end"
          className="fill-slate-500 text-[10px]"
        >
          {new Intl.DateTimeFormat("de-DE", { dateStyle: "short" }).format(new Date(maxDate))}
        </text>
      </svg>
    </div>
  );
}
