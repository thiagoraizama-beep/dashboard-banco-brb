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
  const { range, campanha, veiculo, refreshToken } = useDateRange();
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    getSiteSummary(range, campanha, veiculo).then(setData).catch(console.error);
  }, [range, JSON.stringify(campanha), JSON.stringify(veiculo), refreshToken]);

  return (
    <div className="card">
      <p className="card-title">Sessões</p>
      <img
        src="/bdf-20250904-192454-6e887e.jpeg"
        alt="BRB"
        style={{ width: "100%", height: 120, objectFit: "cover", objectPosition: "top", borderRadius: 12, marginBottom: 12 }}
      />
      {!data ? (
        <Spinner />
      ) : data.semDados ? (
        <p style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center", margin: 0 }}>
          Sem dados — nenhum GA4 vinculado a esta campanha.
        </p>
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
