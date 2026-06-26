import { useEffect, useState } from "react";
import { getVehicles } from "../../api/client.js";
import { useDateRange } from "../../context/DateRangeContext.jsx";
import { getVehicleLogoUrl } from "./vehicleLogos.js";
import Spinner from "../common/Spinner.jsx";

function VehicleLogo({ veiculo }) {
  const [failed, setFailed] = useState(false);
  const url = getVehicleLogoUrl(veiculo);

  if (!url || failed) {
    return (
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "var(--border)",
          display: "inline-block",
        }}
      />
    );
  }

  return (
    <img
      src={url}
      alt={veiculo}
      className="vehicle-logo"
      onError={() => setFailed(true)}
      style={{ width: 24, height: 24, objectFit: "contain", borderRadius: "50%" }}
    />
  );
}

export default function ActiveListingTable() {
  const { range, campanha, veiculo, modeloCompra } = useDateRange();
  const [vehicles, setVehicles] = useState(null);

  useEffect(() => {
    setVehicles(null);
    getVehicles(range, campanha, veiculo, modeloCompra).then(setVehicles).catch(console.error);
  }, [range, JSON.stringify(campanha), JSON.stringify(veiculo), JSON.stringify(modeloCompra)]);

  return (
    <div className="card">
      <p className="card-title">Lista de Veículos</p>
      {!vehicles ? (
        <Spinner />
      ) : (
      <table>
        <thead>
          <tr>
            <th>Veículo</th>
            <th>Modelo</th>
            <th>Contratado</th>
            <th>Entregue</th>
            <th>Pacing</th>
            <th>% Entrega</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <tr key={v.veiculo}>
              <td style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <VehicleLogo veiculo={v.veiculo} />
                {v.veiculo}
              </td>
              <td>{v.modeloCompra}</td>
              <td>{v.contratado.toLocaleString("pt-BR")}</td>
              <td>{v.entregue.toLocaleString("pt-BR")}</td>
              <td>
                {v.pacingStatus && (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      color: v.dentroDoPacing ? "var(--success)" : "var(--danger)",
                      background: v.dentroDoPacing ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)",
                    }}
                  >
                    {v.pacingStatus}
                  </span>
                )}
              </td>
              <td>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <div
                    className="progress-bar-track"
                    style={{
                      width: 80,
                      background:
                        v.dentroDoPacing == null
                          ? undefined
                          : v.dentroDoPacing
                          ? "rgba(22,163,74,0.12)"
                          : "rgba(220,38,38,0.12)",
                    }}
                  >
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${v.percentual}%`,
                        background:
                          v.dentroDoPacing == null
                            ? undefined
                            : v.dentroDoPacing
                            ? "var(--success)"
                            : "var(--danger)",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      width: 30,
                      color:
                        v.dentroDoPacing == null
                          ? "var(--text-primary)"
                          : v.dentroDoPacing
                          ? "var(--success)"
                          : "var(--danger)",
                    }}
                  >
                    {v.percentual}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}
