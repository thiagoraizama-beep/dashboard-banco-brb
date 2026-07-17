import { useEffect, useState } from "react";
import KpiCard from "../kpi/KpiCard.jsx";
import Spinner from "../common/Spinner.jsx";
import { getOfflineSummary } from "../../api/client.js";
import { useOfflineFilters } from "../../context/OfflineFiltersContext.jsx";

function formatCompact(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("pt-BR");
}

export default function OfflineKpiRow() {
  const { categoria, praca, veiculo, campanha, refreshToken } = useOfflineFilters();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    setSummary(null);
    getOfflineSummary({ categoria, praca, veiculo, campanha }).then(setSummary).catch(console.error);
  }, [JSON.stringify(categoria), JSON.stringify(praca), JSON.stringify(veiculo), JSON.stringify(campanha), refreshToken]);

  if (!summary) {
    return (
      <div className="grid status-grid-4" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginTop: 20 }}>
        <div className="card">
          <Spinner />
        </div>
        <div className="card">
          <Spinner />
        </div>
        <div className="card">
          <Spinner />
        </div>
        <div className="card">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="grid status-grid-4" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginTop: 20 }}>
      <KpiCard label="Categorias" value={summary.categorias} />
      <KpiCard label="Veículos" value={summary.veiculos} />
      <KpiCard label="Investimento Total" value={`R$ ${summary.investimento.toLocaleString("pt-BR")}`} />
      <KpiCard label="Entrega" value={formatCompact(summary.entrega)} />
    </div>
  );
}
