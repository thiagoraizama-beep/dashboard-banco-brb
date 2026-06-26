import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getPerformanceSeries } from "../../api/client.js";
import { useDateRange } from "../../context/DateRangeContext.jsx";
import Spinner from "../common/Spinner.jsx";

function formatDateBR(iso) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

const ALL_METRICS = [
  { key: "impressoes", label: "Impressões", color: "#2f6feb" },
  { key: "cliques", label: "Cliques", color: "#16a34a" },
  { key: "visualizacoes", label: "Visualizações", color: "#f59e0b" },
  { key: "sessoes", label: "Sessões", color: "#a855f7" },
];

export default function PerformanceChart() {
  const { range, campanha, veiculo, modeloCompra } = useDateRange();
  const [activeMetrics, setActiveMetrics] = useState(["impressoes", "cliques"]);
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    getPerformanceSeries(range, activeMetrics, campanha, veiculo, modeloCompra).then(setData).catch(console.error);
  }, [range, activeMetrics, JSON.stringify(campanha), JSON.stringify(veiculo), JSON.stringify(modeloCompra)]);

  function toggleMetric(key) {
    setActiveMetrics((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]));
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p className="card-title" style={{ margin: 0 }}>
          Métricas
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          {ALL_METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => toggleMetric(m.key)}
              style={{
                border: `1px solid ${activeMetrics.includes(m.key) ? m.color : "var(--border)"}`,
                background: activeMetrics.includes(m.key) ? m.color : "transparent",
                color: activeMetrics.includes(m.key) ? "#fff" : "var(--text-secondary)",
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      {!data ? (
        <Spinner />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="data" tickFormatter={formatDateBR} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              labelFormatter={formatDateBR}
              contentStyle={{
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
              labelStyle={{ color: "var(--text-primary)" }}
              itemStyle={{ color: "var(--text-primary)" }}
            />
            <Legend />
            {ALL_METRICS.filter((m) => activeMetrics.includes(m.key)).map((m) => (
              <Line key={m.key} type="monotone" dataKey={m.key} name={m.label} stroke={m.color} dot={false} strokeWidth={2} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
