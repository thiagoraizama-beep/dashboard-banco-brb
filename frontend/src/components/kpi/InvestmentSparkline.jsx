import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { getPerformanceSeries } from "../../api/client.js";
import { useDateRange } from "../../context/DateRangeContext.jsx";

export default function InvestmentSparkline() {
  const { range, campanha, veiculo, modeloCompra, refreshToken } = useDateRange();
  const [data, setData] = useState([]);

  useEffect(() => {
    getPerformanceSeries(range, ["investimento"], campanha, veiculo, modeloCompra).then(setData).catch(console.error);
  }, [range, JSON.stringify(campanha), JSON.stringify(veiculo), JSON.stringify(modeloCompra), refreshToken]);

  if (data.length === 0) return null;

  return (
    <div style={{ marginTop: 8, height: 50 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="investmentFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            formatter={(value) => [`R$ ${Number(value).toLocaleString("pt-BR")}`, "Investimento"]}
            labelFormatter={(_, payload) => {
              const dataStr = payload?.[0]?.payload?.data;
              if (!dataStr) return "";
              const [year, month, day] = dataStr.split("-");
              return `${day}/${month}/${year}`;
            }}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
            }}
            labelStyle={{ color: "var(--text-primary)" }}
            itemStyle={{ color: "var(--text-primary)" }}
          />
          <Area
            type="monotone"
            dataKey="investimento"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#investmentFill)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
