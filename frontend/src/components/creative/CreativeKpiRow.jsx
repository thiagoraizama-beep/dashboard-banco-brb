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

const SUMMARY_VAZIO = { investimento: 0, impressoes: 0, alcance: 0, cliques: 0, cpm: 0, cpc: 0, ctr: 0 };

export default function CreativeKpiRow({ campanhaId, veiculo }) {
  const { filters } = useCreativeFilters(campanhaId, veiculo);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCreativeSummary(campanhaId, veiculo, filters)
      .then(setSummary)
      .catch((err) => {
        console.error(err);
        setSummary(SUMMARY_VAZIO);
      })
      .finally(() => setLoading(false));
  }, [
    campanhaId,
    veiculo,
    filters.start,
    filters.end,
    JSON.stringify(filters.tipoCompra),
    JSON.stringify(filters.posicionamento),
    JSON.stringify(filters.plataforma),
  ]);

  if (loading) {
    return (
      <div className="grid kpi-grid-7" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div className="card" key={i}>
            <Spinner />
          </div>
        ))}
      </div>
    );
  }

  const s = summary || SUMMARY_VAZIO;

  return (
    <div className="grid kpi-grid-7" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
      <KpiCard compact label="Investimento" value={`R$ ${s.investimento.toLocaleString("pt-BR")}`} />
      <KpiCard compact label="Impressões" value={formatCompact(s.impressoes)} />
      <KpiCard compact label="Alcance" value={formatCompact(s.alcance)} />
      <KpiCard compact label="Cliques" value={formatCompact(s.cliques)} />
      <KpiCard compact label="CPM" value={`R$ ${s.cpm.toLocaleString("pt-BR")}`} />
      <KpiCard compact label="CPC" value={`R$ ${s.cpc.toLocaleString("pt-BR")}`} />
      <KpiCard compact label="CTR" value={`${s.ctr}%`} />
    </div>
  );
}
