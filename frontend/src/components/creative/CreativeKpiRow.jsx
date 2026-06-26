import { useEffect, useState } from "react";
import KpiCard from "../kpi/KpiCard.jsx";
import Spinner from "../common/Spinner.jsx";
import { getCreativeSummary } from "../../api/client.js";
import { useCreativeFilters } from "../../context/CreativeAnalysisContext.jsx";

function formatCompact(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("pt-BR");
}

export default function CreativeKpiRow({ veiculo }) {
  const { filters } = useCreativeFilters(veiculo);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    setSummary(null);
    getCreativeSummary(veiculo, filters).then(setSummary).catch(console.error);
  }, [
    veiculo,
    filters.start,
    filters.end,
    JSON.stringify(filters.campanha),
    JSON.stringify(filters.tipoCompra),
    JSON.stringify(filters.posicionamento),
    JSON.stringify(filters.plataforma),
  ]);

  if (!summary) {
    return (
      <div className="grid" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div className="card" key={i}>
            <Spinner />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
      <KpiCard compact label="Investimento" value={`R$ ${summary.investimento.toLocaleString("pt-BR")}`} />
      <KpiCard compact label="Impressões" value={formatCompact(summary.impressoes)} />
      <KpiCard compact label="Alcance" value={formatCompact(summary.alcance)} />
      <KpiCard compact label="Cliques" value={formatCompact(summary.cliques)} />
      <KpiCard compact label="CPM" value={`R$ ${summary.cpm.toLocaleString("pt-BR")}`} />
      <KpiCard compact label="CPC" value={`R$ ${summary.cpc.toLocaleString("pt-BR")}`} />
      <KpiCard compact label="CTR" value={`${summary.ctr}%`} />
    </div>
  );
}
