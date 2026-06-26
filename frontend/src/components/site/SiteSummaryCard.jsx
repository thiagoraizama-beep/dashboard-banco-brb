import { useEffect, useState } from "react";
import { getSiteSummary } from "../../api/client.js";
import { useDateRange } from "../../context/DateRangeContext.jsx";
import Spinner from "../common/Spinner.jsx";

function formatSeconds(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

export default function SiteSummaryCard() {
  const { range, campanha, veiculo } = useDateRange();
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    getSiteSummary(range, campanha, veiculo).then(setData).catch(console.error);
  }, [range, JSON.stringify(campanha), JSON.stringify(veiculo)]);

  return (
    <div className="card">
      <p className="card-title">Sessões</p>
      <img
        src="/senado-federal.jpg"
        alt="Senado Federal"
        style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 12, marginBottom: 12 }}
      />
      {!data ? (
        <Spinner />
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center" }}>
          <div>
            <strong>{data.sessoes.toLocaleString("pt-BR")}</strong>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>Sessões</p>
          </div>
          <div>
            <strong>{formatSeconds(data.tempoMedioSegundos)}</strong>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>Tempo médio</p>
          </div>
          <div>
            <strong>R$ {data.custoPorSessao.toFixed(2)}</strong>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>Custo/sessão</p>
          </div>
        </div>
      )}
    </div>
  );
}
