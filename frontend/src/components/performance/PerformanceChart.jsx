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
import MultiSelectDropdown from "../layout/MultiSelectDropdown.jsx";
import useIsMobile from "../../hooks/useIsMobile.js";

function formatDateBR(iso) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function formatCompact(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value;
}

const ALL_METRICS = [
  { key: "impressoes", label: "Impressões", color: "#2f6feb" },
  { key: "cliques", label: "Cliques", color: "#16a34a" },
  { key: "visualizacoes", label: "Visualizações", color: "#f59e0b" },
  { key: "sessoes", label: "Sessões", color: "#a855f7" },
];

export default function PerformanceChart() {
  const { range, isFiltered, campanha, veiculo, modeloCompra, refreshToken } = useDateRange();
  const [activeMetrics, setActiveMetrics] = useState(["impressoes", "cliques"]);
  const [data, setData] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setData(null);
    getPerformanceSeries(range, isFiltered, activeMetrics, campanha, veiculo, modeloCompra).then(setData).catch(console.error);
  }, [range, isFiltered, activeMetrics, JSON.stringify(campanha), JSON.stringify(veiculo), JSON.stringify(modeloCompra), refreshToken]);

  function toggleMetric(key) {
    setActiveMetrics((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]));
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <p className="card-title" style={{ margin: 0 }}>
          Métricas
        </p>
        {isMobile ? (
          <div style={{ width: 130 }}>
            <MultiSelectDropdown
              multi
              compact
              value={activeMetrics.map((key) => ALL_METRICS.find((m) => m.key === key)?.label)}
              onChange={(labels) =>
                setActiveMetrics(labels.map((label) => ALL_METRICS.find((m) => m.label === label)?.key))
              }
              placeholder="Selecione"
              options={ALL_METRICS.map((m) => m.label)}
            />
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
        )}
      </div>
      {!data ? (
        <Spinner />
      ) : (
        <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="data" tickFormatter={formatDateBR} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={formatCompact} width={40} />
            <Tooltip
              labelFormatter={formatDateBR}
              contentStyle={{
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
                padding: "8px 10px",
              }}
              labelStyle={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 600, marginBottom: 2 }}
              itemStyle={{ color: "var(--text-primary)", fontSize: 12, padding: 0 }}
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
