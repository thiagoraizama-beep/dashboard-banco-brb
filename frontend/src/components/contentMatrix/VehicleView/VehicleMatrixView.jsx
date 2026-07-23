import { useEffect, useRef, useState } from "react";
import { getMatrixCreatives, updateMatrixCreativeStatus } from "../../../api/client.js";
import StatusBadge, { STATUS_OPTIONS_VEICULO } from "../statusBadge.jsx";
import DownloadButton from "../DownloadButton.jsx";
import CreativePreviewPopup from "../CreativePreviewPopup.jsx";
import CreativeDetailsModal from "../CreativeDetailsModal.jsx";
import MatrixMobileHeader from "../MatrixMobileHeader.jsx";
import { useMatrixFilters } from "../useMatrixFilters.js";
import { groupByStatus } from "../statusCounts.js";
import Spinner from "../../common/Spinner.jsx";
import useIsMobile from "../../../hooks/useIsMobile.js";

function formatPeriodo(inicio, fim) {
  if (!inicio && !fim) return null;
  const fmt = (iso) => { const [y, m, d] = iso.slice(0, 10).split("-"); return `${d}/${m}`; };
  if (inicio && fim) return `${fmt(inicio)} - ${fmt(fim)}`;
  return fmt(inicio || fim);
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function StatusPopover({ value, onChangeStatus, onClose, anchorRect }) {
  const ref = useRef(null);
  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const top = anchorRect ? anchorRect.bottom + 6 : 0;
  const right = anchorRect ? window.innerWidth - anchorRect.right : 0;

  return (
    <div ref={ref} style={{ position: "fixed", top, right, zIndex: 9999, background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 24px rgba(20,33,61,0.15)", padding: 6, minWidth: 180 }}>
      {STATUS_OPTIONS_VEICULO.map((s) => (
        <button
          key={s}
          onClick={() => { onChangeStatus(s); onClose(); }}
          style={{ display: "block", width: "100%", padding: "8px 12px", border: "none", borderRadius: 7, background: s === value ? "var(--accent-soft)" : "transparent", color: s === value ? "var(--accent)" : "var(--text-primary)", fontWeight: s === value ? 700 : 400, fontSize: 13, textAlign: "left", cursor: "pointer" }}
        >
          <StatusBadge status={s} />
        </button>
      ))}
    </div>
  );
}

function StatusCell({ c, onStatusChange, updating }) {
  const [anchorRect, setAnchorRect] = useState(null);
  const btnRef = useRef(null);

  function handleToggle() {
    if (anchorRect) { setAnchorRect(null); return; }
    if (btnRef.current) setAnchorRect(btnRef.current.getBoundingClientRect());
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
      <StatusBadge status={c.status} />
      <button
        ref={btnRef}
        onClick={handleToggle}
        disabled={updating}
        title="Alterar status"
        style={{ display: "flex", alignItems: "center", background: "none", border: "none", cursor: updating ? "default" : "pointer", color: "var(--text-secondary)", padding: 2, borderRadius: 4, opacity: updating ? 0.4 : 1 }}
      >
        <PencilIcon />
      </button>
      {anchorRect && <StatusPopover value={c.status} anchorRect={anchorRect} onChangeStatus={(s) => { onStatusChange(c.id, s); setAnchorRect(null); }} onClose={() => setAnchorRect(null)} />}
    </div>
  );
}

function CreativeCard({ c, onStatusChange, onViewDetails, updating }) {
  return (
    <div className="card matrix-item-card" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <CreativePreviewPopup creative={c}>
        {c.tipo_midia === "video"
          ? <video src={c.cloudinary_url} style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover" }} />
          : <img src={c.cloudinary_url} alt={c.nome} style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover" }} />}
      </CreativePreviewPopup>
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ fontSize: 14 }}>{c.nome}</strong>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
          {c.campanha}{c.conjunto && ` · ${c.conjunto}`} · {c.veiculo}
          {formatPeriodo(c.periodo_inicio, c.periodo_fim) && ` · ${formatPeriodo(c.periodo_inicio, c.periodo_fim)}`}
        </p>
        {c.formato && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>{c.formato}</p>}
        {c.observacoes && <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-primary)" }}>{c.observacoes}</p>}
      </div>
      <button
        onClick={() => onViewDetails(c)}
        style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-primary)", fontSize: 12, cursor: "pointer" }}
      >
        Ver informações
      </button>
      <DownloadButton creative={c} />
      <StatusCell c={c} onStatusChange={onStatusChange} updating={updating} />
    </div>
  );
}

export default function VehicleMatrixView() {
  const [creatives, setCreatives] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const { filtered, options, filters, setStatus, setVeiculo, setCampanha } = useMatrixFilters(creatives);
  const isMobile = useIsMobile();
  const statusCounts = creatives ? groupByStatus(creatives) : {};

  function load() {
    setCreatives(null);
    getMatrixCreatives().then(setCreatives).catch(console.error);
  }

  useEffect(() => { load(); }, []);

  async function handleStatusChange(id, status) {
    setUpdatingId(id);
    try {
      await updateMatrixCreativeStatus(id, status);
      setCreatives((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    }
    finally { setUpdatingId(null); }
  }

  const empty = (
    <div className="card" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
      {creatives?.length === 0 ? "Nenhum criativo cadastrado para o seu veículo ainda" : "Nenhum criativo encontrado para os filtros selecionados"}
    </div>
  );

  if (isMobile) {
    return (
      <div>
        <MatrixMobileHeader options={options} filters={filters} setStatus={setStatus} setVeiculo={setVeiculo} setCampanha={setCampanha} />
        <h2 style={{ margin: "16px 0" }}>Meus Criativos</h2>
        {creatives && (
          <div className="grid status-grid-4" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 20 }}>
            {Object.entries(statusCounts).map(([status, count]) => (
              <div className="card" key={status}>
                <p className="card-title">{status}</p>
                <p className="kpi-value">{count}</p>
              </div>
            ))}
          </div>
        )}
        {!creatives ? <Spinner /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((c) => <CreativeCard key={c.id} c={c} onStatusChange={handleStatusChange} onViewDetails={setViewing} updating={updatingId === c.id} />)}
            {filtered.length === 0 && empty}
          </div>
        )}
        {viewing && <CreativeDetailsModal creative={viewing} onClose={() => setViewing(null)} />}
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 20 }}>
      {creatives && (
        <div className="grid status-grid-4" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 20 }}>
          {Object.entries(statusCounts).map(([status, count]) => (
            <div className="card" key={status}>
              <p className="card-title">{status}</p>
              <p className="kpi-value">{count}</p>
            </div>
          ))}
        </div>
      )}
      <div className="card" style={{ overflowX: creatives?.length ? "auto" : undefined }}>
        {!creatives ? <Spinner /> : (
          <table>
            <thead>
              <tr>
                <th>Criativo</th>
                <th>Campanha</th>
                <th>Plataforma</th>
                <th>Formato</th>
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
                      {c.tipo_midia === "video"
                        ? <video src={c.cloudinary_url} style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }} />
                        : <img src={c.cloudinary_url} alt={c.nome} style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }} />}
                      <strong style={{ fontSize: 13 }}>{c.nome}</strong>
                    </CreativePreviewPopup>
                  </td>
                  <td>{c.campanha}</td>
                  <td>{c.plataforma || c.veiculo}</td>
                  <td style={{ fontSize: 12 }}>{c.formato || <span style={{ color: "var(--text-secondary)" }}>—</span>}</td>
                  <td style={{ fontSize: 12 }}>{formatPeriodo(c.periodo_inicio, c.periodo_fim) || "-"}</td>
                  <td style={{ fontSize: 12 }}>{c.tipos_compra?.length ? c.tipos_compra.join(", ") : <span style={{ color: "var(--text-secondary)" }}>—</span>}</td>
                  <td>
                    <StatusCell c={c} onStatusChange={handleStatusChange} updating={updatingId === c.id} />
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
                    {creatives.length === 0 ? "Nenhum criativo cadastrado para o seu veículo ainda" : "Nenhum criativo encontrado para os filtros selecionados"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      {viewing && <CreativeDetailsModal creative={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
