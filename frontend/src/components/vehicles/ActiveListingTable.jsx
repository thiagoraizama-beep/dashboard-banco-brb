import { useEffect, useState } from "react";
import { getVehicles, getRegisteredVehicles } from "../../api/client.js";
import { useDateRange } from "../../context/DateRangeContext.jsx";
import { getVehicleLogoUrl } from "./vehicleLogos.js";
import Spinner from "../common/Spinner.jsx";
import useIsMobile from "../../hooks/useIsMobile.js";

function VehicleLogo({ veiculo, registeredVehicles }) {
  const [failed, setFailed] = useState(false);
  const registered = registeredVehicles?.find((v) => v.nome === veiculo);
  const url = registered?.logo_url || getVehicleLogoUrl(veiculo);

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

function PacingBadge({ status, dentroDoPacing }) {
  if (!status) return null;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
        color: dentroDoPacing ? "var(--success)" : "var(--danger)",
        background: dentroDoPacing ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)",
      }}
    >
      {status}
    </span>
  );
}

function ProgressBar({ percentual, dentroDoPacing }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        className="progress-bar-track"
        style={{
          flex: 1,
          background:
            dentroDoPacing == null ? undefined : dentroDoPacing ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)",
        }}
      >
        <div
          className="progress-bar-fill"
          style={{
            width: `${percentual}%`,
            background: dentroDoPacing == null ? undefined : dentroDoPacing ? "var(--success)" : "var(--danger)",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: "nowrap",
          width: 30,
          color: dentroDoPacing == null ? "var(--text-primary)" : dentroDoPacing ? "var(--success)" : "var(--danger)",
        }}
      >
        {percentual}%
      </span>
    </div>
  );
}

function VehicleMobileCard({ v, registeredVehicles }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <VehicleLogo veiculo={v.veiculo} registeredVehicles={registeredVehicles} />
          <strong style={{ fontSize: 14 }}>{v.veiculo}</strong>
        </div>
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v.modeloCompra}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
        <div>
          <span style={{ color: "var(--text-secondary)" }}>Contratado</span>
          <p style={{ margin: "2px 0 0", fontWeight: 600 }}>{v.contratado.toLocaleString("pt-BR")}</p>
        </div>
        <div>
          <span style={{ color: "var(--text-secondary)" }}>Entregue</span>
          <p style={{ margin: "2px 0 0", fontWeight: 600 }}>{v.entregue.toLocaleString("pt-BR")}</p>
        </div>
      </div>

      <ProgressBar percentual={v.percentual} dentroDoPacing={v.dentroDoPacing} />

      <PacingBadge status={v.pacingStatus} dentroDoPacing={v.dentroDoPacing} />
    </div>
  );
}

export default function ActiveListingTable() {
  const { range, campanha, veiculo, modeloCompra, refreshToken } = useDateRange();
  const [vehicles, setVehicles] = useState(null);
  const [registeredVehicles, setRegisteredVehicles] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setVehicles(null);
    getVehicles(range, campanha, veiculo, modeloCompra).then(setVehicles).catch(console.error);
  }, [range, JSON.stringify(campanha), JSON.stringify(veiculo), JSON.stringify(modeloCompra), refreshToken]);

  useEffect(() => {
    getRegisteredVehicles().then(setRegisteredVehicles).catch(console.error);
  }, []);

  return (
    <div className="card">
      <p className="card-title">Lista de Veículos</p>
      {!vehicles ? (
        <Spinner />
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {vehicles.map((v) => (
            <VehicleMobileCard key={v.veiculo} v={v} registeredVehicles={registeredVehicles} />
          ))}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
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
                    <VehicleLogo veiculo={v.veiculo} registeredVehicles={registeredVehicles} />
                    {v.veiculo}
                  </td>
                  <td>{v.modeloCompra}</td>
                  <td>{v.contratado.toLocaleString("pt-BR")}</td>
                  <td>{v.entregue.toLocaleString("pt-BR")}</td>
                  <td>
                    <PacingBadge status={v.pacingStatus} dentroDoPacing={v.dentroDoPacing} />
                  </td>
                  <td>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div style={{ width: 110 }}>
                        <ProgressBar percentual={v.percentual} dentroDoPacing={v.dentroDoPacing} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
