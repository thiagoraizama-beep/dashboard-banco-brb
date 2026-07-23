import { useEffect, useState } from "react";
import { getMatrixCreatives } from "../../../api/client.js";
import StatusBadge from "../statusBadge.jsx";
import DownloadButton from "../DownloadButton.jsx";
import CreativePreviewPopup from "../CreativePreviewPopup.jsx";
import CreativeDetailsModal from "../CreativeDetailsModal.jsx";
import MatrixMobileHeader from "../MatrixMobileHeader.jsx";
import { useMatrixFilters } from "../useMatrixFilters.js";
import { groupByStatus } from "../statusCounts.js";
import Spinner from "../../common/Spinner.jsx";
import useIsMobile from "../../../hooks/useIsMobile.js";

function formatPeriodo(inicio, fim) {
  if (!inicio && !fim) return "-";
  const fmt = (iso) => {
    const [, m, d] = iso.slice(0, 10).split("-");
    return `${d}/${m}`;
  };
  if (inicio && fim) return `${fmt(inicio)} - ${fmt(fim)}`;
  return fmt(inicio || fim);
}

function CreativeMobileCard({ c, onViewDetails }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <CreativePreviewPopup creative={c}>
          {c.tipo_midia === "video" ? (
            <video src={c.cloudinary_url} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />
          ) : (
            <img src={c.cloudinary_url} alt={c.nome} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />
          )}
        </CreativePreviewPopup>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ fontSize: 13, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {c.nome}
          </strong>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
            {c.campanha} · {c.veiculo}
          </span>
        </div>
        <StatusBadge status={c.status} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-secondary)" }}>Período</span>
          <strong>{formatPeriodo(c.periodo_inicio, c.periodo_fim)}</strong>
        </div>
        {c.descricao && (
          <span style={{ color: "var(--text-secondary)" }}>{c.descricao}</span>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => onViewDetails(c)}
          style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-primary)", fontSize: 12, cursor: "pointer" }}
        >
          Ver informações
        </button>
        <DownloadButton creative={c} compact />
      </div>
    </div>
  );
}

export default function ClientMatrixView() {
  const [creatives, setCreatives] = useState(null);
  const [viewing, setViewing] = useState(null);
  const { filtered, options, filters, setStatus, setVeiculo, setCampanha } = useMatrixFilters(creatives);
  const isMobile = useIsMobile();

  useEffect(() => {
    getMatrixCreatives().then(setCreatives).catch(console.error);
  }, []);

  if (!creatives) return <Spinner />;

  const counts = groupByStatus(creatives);

  if (isMobile) {
    return (
      <div>
        <MatrixMobileHeader options={options} filters={filters} setStatus={setStatus} setVeiculo={setVeiculo} setCampanha={setCampanha} />

        <h2 style={{ margin: "16px 0" }}>Relatório de Criativos</h2>

        <div className="grid status-grid-4" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 20 }}>
          {Object.entries(counts).map(([status, count]) => (
            <div className="card" key={status}>
              <p className="card-title">{status}</p>
              <p className="kpi-value">{count}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((c) => (
            <CreativeMobileCard key={c.id} c={c} onViewDetails={setViewing} />
          ))}
          {filtered.length === 0 && (
            <div className="card" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
              {creatives.length === 0
                ? "Nenhum criativo cadastrado ainda"
                : "Nenhum criativo encontrado para os filtros selecionados"}
            </div>
          )}
        </div>
        {viewing && <CreativeDetailsModal creative={viewing} onClose={() => setViewing(null)} />}
      </div>
    );
  }

  return (
    <div>
      <div className="grid status-grid-4" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 20 }}>
        {Object.entries(counts).map(([status, count]) => (
          <div className="card" key={status}>
            <p className="card-title">{status}</p>
            <p className="kpi-value">{count}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Criativo</th>
              <th>Campanha</th>
              <th>Veículo</th>
              <th>Plataforma</th>
              <th>Período</th>
              <th>Modelo de compra</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  <CreativePreviewPopup creative={c}>
                    {c.tipo_midia === "video" ? (
                      <video src={c.cloudinary_url} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} />
                    ) : (
                      <img src={c.cloudinary_url} alt={c.nome} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} />
                    )}
                    <strong style={{ fontSize: 13, cursor: "default" }}>{c.nome}</strong>
                  </CreativePreviewPopup>
                </td>
                <td>{c.campanha}</td>
                <td>{c.veiculo}</td>
                <td>{c.plataforma || <span style={{ color: "var(--text-secondary)" }}>—</span>}</td>
                <td style={{ fontSize: 12 }}>{formatPeriodo(c.periodo_inicio, c.periodo_fim)}</td>
                <td style={{ fontSize: 12 }}>{c.tipos_compra?.length ? c.tipos_compra.join(", ") : <span style={{ color: "var(--text-secondary)" }}>—</span>}</td>
                <td>
                  <StatusBadge status={c.status} />
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <DownloadButton creative={c} compact />
                    <button
                      onClick={() => setViewing(c)}
                      style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", fontSize: 12, cursor: "pointer", color: "var(--text-primary)" }}
                    >
                      Ver informações
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                  {creatives.length === 0
                    ? "Nenhum criativo cadastrado ainda"
                    : "Nenhum criativo encontrado para os filtros selecionados"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {viewing && <CreativeDetailsModal creative={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
