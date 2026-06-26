import { useEffect, useState } from "react";
import KpiCard from "./KpiCard.jsx";
import MetricVariationIndicator from "./MetricVariationIndicator.jsx";
import InvestmentSparkline from "./InvestmentSparkline.jsx";
import Spinner from "../common/Spinner.jsx";
import { getMediaSummary } from "../../api/client.js";
import { useDateRange } from "../../context/DateRangeContext.jsx";

export default function KpiRow() {
  const { range, isFiltered, campanha, veiculo, modeloCompra } = useDateRange();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    setSummary(null);
    getMediaSummary(range, isFiltered, campanha, veiculo, modeloCompra).then(setSummary).catch(console.error);
  }, [range, isFiltered, JSON.stringify(campanha), JSON.stringify(veiculo), JSON.stringify(modeloCompra)]);

  if (!summary) {
    return (
      <>
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
      </>
    );
  }

  return (
    <>
      <KpiCard
        label="Investimento"
        value={`R$ ${summary.investimento.toLocaleString("pt-BR")}`}
        footer={<InvestmentSparkline />}
      />
      <KpiCard
        label="Impressões"
        value={summary.impressoes.toLocaleString("pt-BR")}
        footer={<MetricVariationIndicator variacao={summary.impressoesVariacao} />}
      />
      <KpiCard
        label="Cliques"
        value={summary.cliques.toLocaleString("pt-BR")}
        footer={<MetricVariationIndicator label="CTR" value={summary.ctr} variacao={summary.ctrVariacao} />}
      />
      <KpiCard
        label="Visualizações"
        value={summary.visualizacoes.toLocaleString("pt-BR")}
        footer={<MetricVariationIndicator label="VTR" value={summary.vtr} variacao={summary.vtrVariacao} />}
      />
    </>
  );
}
