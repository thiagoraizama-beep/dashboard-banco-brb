import { useEffect, useState } from "react";
import { getDealsProgress } from "../../api/client.js";
import { useDateRange } from "../../context/DateRangeContext.jsx";
import Spinner from "../common/Spinner.jsx";

export default function DealsProgressCard() {
  const { range, isFiltered, campanha, veiculo, modeloCompra, refreshToken } = useDateRange();
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    getDealsProgress(range, isFiltered, campanha, veiculo, modeloCompra).then(setData).catch(console.error);
  }, [range, isFiltered, JSON.stringify(campanha), JSON.stringify(veiculo), JSON.stringify(modeloCompra), refreshToken]);

  return (
    <div className="card">
      <p className="card-title">Contratado vs Realizado</p>
      {!data ? (
        <Spinner />
      ) : (
        <>
          <div className="progress-bar-track" style={{ marginBottom: 10 }}>
            <div className="progress-bar-fill" style={{ width: `${data.percentual}%` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, fontSize: 20 }}>{data.entregue.toLocaleString("pt-BR")}</span>
            <span style={{ color: "var(--text-secondary)" }}>{data.percentual}%</span>
          </div>
          <small style={{ color: "var(--text-secondary)" }}>
            Entregue de {data.contratado.toLocaleString("pt-BR")} contratado
          </small>
        </>
      )}
    </div>
  );
}
