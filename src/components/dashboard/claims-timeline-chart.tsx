type DataPoint = { month: string; count: number; amount: number };

function buildMonthlyData(claims: { created_at: string; damage_amount_estimate: number }[]): DataPoint[] {
  const map = new Map<string, { count: number; amount: number }>();

  for (const c of claims) {
    const d = new Date(c.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const existing = map.get(key) ?? { count: 0, amount: 0 };
    map.set(key, {
      count: existing.count + 1,
      amount: existing.amount + (c.damage_amount_estimate ?? 0),
    });
  }

  const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  return sorted.map(([month, v]) => ({ month, ...v }));
}

export function ClaimsTimelineChart({
  claims,
}: {
  claims: { created_at: string; damage_amount_estimate: number }[];
}) {
  if (claims.length < 2) return null;

  const data = buildMonthlyData(claims);
  if (data.length < 2) return null;

  const w = 600;
  const h = 120;
  const padL = 8;
  const padR = 8;
  const padT = 10;
  const padB = 20;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);
  const scaleX = (i: number) => padL + (i / (data.length - 1)) * chartW;
  const scaleY = (v: number) => padT + chartH - (v / maxAmount) * chartH;

  const pathD = data
    .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(i).toFixed(1)} ${scaleY(p.amount).toFixed(1)}`)
    .join(" ");

  const areaD = `${pathD} L ${scaleX(data.length - 1).toFixed(1)} ${padT + chartH} L ${scaleX(0).toFixed(1)} ${padT + chartH} Z`;

  const formatMonth = (key: string) => {
    const [y, m] = key.split("-");
    return new Intl.DateTimeFormat("de-DE", { month: "short", year: "2-digit" }).format(
      new Date(Number(y), Number(m) - 1)
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Schadensvolumen nach Monat</p>
        <p className="text-xs text-slate-400">{data.length} Monate</p>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <path d={areaD} fill="#e0f2fe" opacity="0.5" />
        <path d={pathD} fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((p, i) => (
          <g key={p.month}>
            <circle cx={scaleX(i)} cy={scaleY(p.amount)} r="3" fill="#0284c7" />
            {(i === 0 || i === data.length - 1 || data.length <= 6) && (
              <text
                x={scaleX(i)}
                y={h - 4}
                textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
                fontSize="9"
                fill="#94a3b8"
              >
                {formatMonth(p.month)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-slate-400">
        <span>
          {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
            data[0].amount
          )}
        </span>
        <span>
          Max:{" "}
          {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
            maxAmount
          )}
        </span>
        <span>
          {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
            data[data.length - 1].amount
          )}
        </span>
      </div>
    </div>
  );
}
