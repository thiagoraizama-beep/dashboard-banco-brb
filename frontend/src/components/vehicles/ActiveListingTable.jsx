import { useEffect, useState } from "react";
import { getVehicles, getPlataformas } from "../../api/client.js";
import { useDateRange } from "../../context/DateRangeContext.jsx";
import { getVehicleLogoUrl } from "./vehicleLogos.js";
import Spinner from "../common/Spinner.jsx";
import Avatar from "../common/Avatar.jsx";
import useIsMobile from "../../hooks/useIsMobile.js";

function VehicleLogo({ veiculo, plataformas }) {
  const [failed, setFailed] = useState(false);
  const registered = plataformas?.find((p) => p.nome === veiculo);
  const url = registered?.logo_url || getVehicleLogoUrl(veiculo);

  if (!url || failed) {
    return <Avatar nome={veiculo} size={24} />;
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

function pacingColor(status, dentroDoPacing) {
  if (dentroDoPacing == null) return { color: "var(--text-primary)", bg: "var(--border)" };
  return dentroDoPacing
    ? { color: "var(--success)", bg: "rgba(22,163,74,0.12)" }
    : { color: "var(--danger)", bg: "rgba(220,38,38,0.12)" };
}

function PacingBadge({ status, dentroDoPacing }) {
  if (!status) return null;
  const { color, bg } = pacingColor(status, dentroDoPacing);
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
        color,
        background: bg,
      }}
    >
      {status}
    </span>
  );
}

function ProgressBar({ percentual, status, dentroDoPacing }) {
  const { color, bg } = pacingColor(status, dentroDoPacing);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div className="progress-bar-track" style={{ flex: 1, background: dentroDoPacing == null ? undefined : bg }}>
        <div
          className="progress-bar-fill"
          style={{ width: `${percentual}%`, background: dentroDoPacing == null ? undefined : color }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: "nowrap",
          width: 30,
          color: dentroDoPacing == null ? "var(--text-primary)" : color,
        }}
      >
        {percentual}%
      </span>
    </div>
  );
}

function VehicleMobileCard({ v, plataformas }) {
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
          <VehicleLogo veiculo={v.veiculo} plataformas={plataformas} />
          <strong style={{ fontSize: 14 }}>{v.veiculo}</strong>
        </div>
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v.modeloCompra}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12 }}>
        <div>
          <span style={{ color: "var(--text-secondary)" }}>Contratado</span>
          <p style={{ margin: "2px 0 0", fontWeight: 600 }}>{v.contratado.toLocaleString("pt-BR")}</p>
        </div>
        <div>
          <span style={{ color: "var(--text-secondary)" }}>Entregue</span>
          <p style={{ margin: "2px 0 0", fontWeight: 600 }}>{v.entregue.toLocaleString("pt-BR")}</p>
        </div>
        <div>
          <span style={{ color: "var(--text-secondary)" }}>Viewability</span>
          <p style={{ margin: "2px 0 0", fontWeight: 600 }}>{v.viewability != null ? `${v.viewability.toFixed(1)}%` : "-"}</p>
        </div>
      </div>

      <ProgressBar percentual={v.percentual} status={v.pacingStatus} dentroDoPacing={v.dentroDoPacing} />

      <PacingBadge status={v.pacingStatus} dentroDoPacing={v.dentroDoPacing} />
    </div>
  );
}

export default function ActiveListingTable() {
  const { range, isFiltered, campanha, veiculo, modeloCompra, refreshToken } = useDateRange();
  const [vehicles, setVehicles] = useState(null);
  const [plataformas, setPlataformas] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setVehicles(null);
    getVehicles(range, isFiltered, campanha, veiculo, modeloCompra).then(setVehicles).catch(console.error);
  }, [range, isFiltered, JSON.stringify(campanha), JSON.stringify(veiculo), JSON.stringify(modeloCompra), refreshToken]);

  useEffect(() => {
    getPlataformas().then(setPlataformas).catch(console.error);
  }, []);

  return (
    <div className="card">
      <p className="card-title">Lista de Veículos</p>
      {!vehicles ? (
        <Spinner />
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {vehicles.map((v) => (
            <VehicleMobileCard key={`${v.veiculo}-${v.modeloCompra}`} v={v} plataformas={plataformas} />
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
                <th>Viewability</th>
                <th>Pacing</th>
                <th>% Entrega</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={`${v.veiculo}-${v.modeloCompra}`}>
                  <td style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <VehicleLogo veiculo={v.veiculo} plataformas={plataformas} />
                    {v.veiculo}
                  </td>
                  <td>{v.modeloCompra}</td>
                  <td>{v.contratado.toLocaleString("pt-BR")}</td>
                  <td>{v.entregue.toLocaleString("pt-BR")}</td>
                  <td>{v.viewability != null ? `${v.viewability.toFixed(1)}%` : "-"}</td>
                  <td>
                    <PacingBadge status={v.pacingStatus} dentroDoPacing={v.dentroDoPacing} />
                  </td>
                  <td>
                    <div style={{ width: 130 }}>
                      <ProgressBar percentual={v.percentual} status={v.pacingStatus} dentroDoPacing={v.dentroDoPacing} />
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
