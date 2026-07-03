import { useEffect, useRef, useState } from "react";
import { getMatrixCreatives, updateMatrixCreativeStatus } from "../../../api/client.js";
import StatusBadge, { STATUS_OPTIONS_VEICULO } from "../statusBadge.jsx";
import DownloadButton from "../DownloadButton.jsx";
import CreativePreviewPopup from "../CreativePreviewPopup.jsx";
import MatrixFilterBar from "../MatrixFilterBar.jsx";
import MatrixMobileHeader from "../MatrixMobileHeader.jsx";
import { useMatrixFilters } from "../useMatrixFilters.js";
import ThemeToggle from "../../layout/ThemeToggle.jsx";
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

function CreativeCard({ c, onStatusChange, updating }) {
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
      <DownloadButton creative={c} />
      <StatusCell c={c} onStatusChange={onStatusChange} updating={updating} />
    </div>
  );
}

export default function VehicleMatrixView() {
  const [creatives, setCreatives] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const { filtered, options, filters, setStatus, setVeiculo, setCampanha } = useMatrixFilters(creatives);
  const isMobile = useIsMobile();

  function load() {
    setCreatives(null);
    getMatrixCreatives().then(setCreatives).catch(console.error);
  }

  useEffect(() => { load(); }, []);

  async function handleStatusChange(id, status) {
    setUpdatingId(id);
    try { await updateMatrixCreativeStatus(id, status); load(); }
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
        {!creatives ? <Spinner /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((c) => <CreativeCard key={c.id} c={c} onStatusChange={handleStatusChange} updating={updatingId === c.id} />)}
            {filtered.length === 0 && empty}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Meus Criativos</h2>
        <ThemeToggle variant="plain" />
      </div>
      {creatives && creatives.length > 0 && (
        <MatrixFilterBar options={options} filters={filters} setStatus={setStatus} setVeiculo={setVeiculo} setCampanha={setCampanha} />
      )}
      {!creatives ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((c) => <CreativeCard key={c.id} c={c} onStatusChange={handleStatusChange} updating={updatingId === c.id} />)}
          {filtered.length === 0 && empty}
        </div>
      )}
    </div>
  );
}
