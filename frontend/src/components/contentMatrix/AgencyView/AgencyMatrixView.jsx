import { useEffect, useRef, useState } from "react";
import { getMatrixCreatives, deleteMatrixCreative, updateMatrixCreativeStatus } from "../../../api/client.js";
import StatusBadge, { STATUS_OPTIONS_AGENCIA } from "../statusBadge.jsx";
import CreativeFormModal from "./CreativeFormModal.jsx";
import DownloadButton from "../DownloadButton.jsx";
import CreativePreviewPopup from "../CreativePreviewPopup.jsx";
import CreativeDetailsModal from "../CreativeDetailsModal.jsx";
import MatrixMobileHeader from "../MatrixMobileHeader.jsx";
import { useMatrixFilters } from "../useMatrixFilters.js";
import { groupByStatus } from "../statusCounts.js";
import Spinner from "../../common/Spinner.jsx";
import useIsMobile from "../../../hooks/useIsMobile.js";
import ConfirmDialog from "../../common/ConfirmDialog.jsx";

function formatPeriodo(inicio, fim) {
  if (!inicio && !fim) return "-";
  const fmt = (iso) => { const [y, m, d] = iso.slice(0, 10).split("-"); return `${d}/${m}`; };
  if (inicio && fim) return `${fmt(inicio)} - ${fmt(fim)}`;
  return fmt(inicio || fim);
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

// Popover de troca de status com position:fixed para não ser cortado por overflow da tabela
function StatusPopover({ value, onChangeStatus, onClose, anchorRect }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const top = anchorRect ? anchorRect.bottom + 6 : 0;
  const left = anchorRect ? anchorRect.left : 0;

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top,
        left,
        zIndex: 9999,
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        boxShadow: "0 8px 24px rgba(20,33,61,0.15)",
        padding: 6,
        minWidth: 190,
      }}
    >
      {STATUS_OPTIONS_AGENCIA.map((s) => (
        <button
          key={s}
          onClick={() => { onChangeStatus(s); onClose(); }}
          style={{
            display: "block",
            width: "100%",
            padding: "8px 12px",
            border: "none",
            borderRadius: 7,
            background: s === value ? "var(--accent-soft)" : "transparent",
            color: s === value ? "var(--accent)" : "var(--text-primary)",
            fontWeight: s === value ? 700 : 400,
            fontSize: 13,
            textAlign: "left",
            cursor: "pointer",
          }}
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
    <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <StatusBadge status={c.status} />
      <button
        ref={btnRef}
        onClick={handleToggle}
        disabled={updating}
        title="Alterar status"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: updating ? "default" : "pointer", color: "var(--text-secondary)", padding: 2, borderRadius: 4, opacity: updating ? 0.4 : 1 }}
      >
        <PencilIcon />
      </button>
      {anchorRect && (
        <StatusPopover
          value={c.status}
          anchorRect={anchorRect}
          onChangeStatus={(status) => { onStatusChange(c.id, status); setAnchorRect(null); }}
          onClose={() => setAnchorRect(null)}
        />
      )}
    </div>
  );
}

function CreativeMobileCard({ c, onEdit, onDuplicate, onDelete, onViewDetails, onStatusChange, updating }) {
  const [statusOpen, setStatusOpen] = useState(false);
  return (
    <div className="card" style={{ padding: 0, overflow: "visible" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>{c.campanha} · {c.veiculo}</span>
        <StatusCell c={c} onStatusChange={onStatusChange} updating={updating} />
      </div>
      <div style={{ padding: "12px 14px", display: "flex", gap: 12 }}>
        <CreativePreviewPopup creative={c}>
          {c.tipo_midia === "video"
            ? <video src={c.cloudinary_url} style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
            : <img src={c.cloudinary_url} alt={c.nome} style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />}
        </CreativePreviewPopup>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ fontSize: 14, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nome}</strong>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 10, rowGap: 3, fontSize: 12, marginTop: 6 }}>
            {c.formato && <><span style={{ color: "var(--text-secondary)" }}>Formato</span><strong>{c.formato}</strong></>}
            <span style={{ color: "var(--text-secondary)" }}>Período</span>
            <strong>{formatPeriodo(c.periodo_inicio, c.periodo_fim)}</strong>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", borderTop: "1px solid var(--border)" }}>
        <button onClick={() => onViewDetails(c)} style={{ flex: 1, padding: "10px 0", border: "none", background: "transparent", color: "var(--text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRight: "1px solid var(--border)" }}>Ver informações</button>
        <button onClick={() => onEdit(c)} style={{ flex: 1, padding: "10px 0", border: "none", background: "transparent", color: "var(--accent)", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRight: "1px solid var(--border)" }}>Editar</button>
        <button onClick={() => onDuplicate(c)} style={{ flex: 1, padding: "10px 0", border: "none", background: "transparent", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRight: "1px solid var(--border)" }}>Duplicar</button>
        <DownloadButton creative={c} compact />
        <button onClick={() => onDelete(c)} style={{ flex: 1, padding: "10px 0", border: "none", background: "transparent", color: "var(--danger)", fontSize: 13, fontWeight: 600, cursor: "pointer", borderLeft: "1px solid var(--border)" }}>Excluir</button>
      </div>
    </div>
  );
}

const btnStyle = { padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", fontSize: 12, cursor: "pointer" };

export default function AgencyMatrixView() {
  const [creatives, setCreatives] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [viewing, setViewing] = useState(null);
  const { filtered, options, filters, setStatus, setVeiculo, setCampanha } = useMatrixFilters(creatives);
  const isMobile = useIsMobile();
  const statusCounts = creatives ? groupByStatus(creatives) : {};

  function load() {
    setCreatives(null);
    getMatrixCreatives().then(setCreatives).catch(console.error);
  }

  useEffect(() => { load(); }, []);

  async function handleConfirmDelete() {
    await deleteMatrixCreative(deleting.id);
    setDeleting(null);
    load();
  }

  async function handleStatusChange(id, status) {
    setUpdatingId(id);
    try {
      await updateMatrixCreativeStatus(id, status);
      setCreatives((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    }
    finally { setUpdatingId(null); }
  }

  function openEdit(creative) { setEditing(creative); setModalOpen(true); }
  function openCreate() { setEditing(null); setModalOpen(true); }
  function openDuplicate(creative) { setEditing({ ...creative, _duplicate: true, id: null }); setModalOpen(true); }

  const newButton = (
    <button onClick={openCreate} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
      + Novo criativo
    </button>
  );

  if (isMobile) {
    return (
      <div>
        <MatrixMobileHeader
          options={options} filters={filters}
          setStatus={setStatus} setVeiculo={setVeiculo} setCampanha={setCampanha}
          extraAction={
            <button onClick={openCreate} aria-label="Novo criativo" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer" }}>
              <PlusIcon />
            </button>
          }
        />
        <h2 style={{ margin: "16px 0" }}>Matriz de Conteúdo</h2>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((c) => (
              <CreativeMobileCard key={c.id} c={c} onEdit={openEdit} onDuplicate={openDuplicate} onDelete={setDeleting} onViewDetails={setViewing} onStatusChange={handleStatusChange} updating={updatingId === c.id} />
            ))}
            {filtered.length === 0 && (
              <div className="card" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                {creatives.length === 0 ? "Nenhum criativo cadastrado ainda" : "Nenhum criativo encontrado para os filtros selecionados"}
              </div>
            )}
          </div>
        )}
        {modalOpen && <CreativeFormModal creative={editing} onClose={() => setModalOpen(false)} onSaved={load} />}
        {viewing && <CreativeDetailsModal creative={viewing} onClose={() => setViewing(null)} />}
        {deleting && (
          <ConfirmDialog
            title="Excluir criativo"
            message={`Tem certeza que deseja excluir "${deleting.nome}"? Esta ação não pode ser desfeita.`}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleting(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 16 }}>
        {newButton}
      </div>

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
                <th>Veículo</th>
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
                  <td>{c.veiculo}</td>
                  <td>{c.plataforma || <span style={{ color: "var(--text-secondary)" }}>—</span>}</td>
                  <td style={{ fontSize: 12 }}>{c.formato || <span style={{ color: "var(--text-secondary)" }}>—</span>}</td>
                  <td style={{ fontSize: 12 }}>{formatPeriodo(c.periodo_inicio, c.periodo_fim)}</td>
                  <td style={{ fontSize: 12 }}>{c.tipos_compra?.length ? c.tipos_compra.join(", ") : <span style={{ color: "var(--text-secondary)" }}>—</span>}</td>
                  <td>
                    <StatusCell c={c} onStatusChange={handleStatusChange} updating={updatingId === c.id} />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <DownloadButton creative={c} compact />
                      <button onClick={() => setViewing(c)} style={{ ...btnStyle, color: "var(--text-primary)" }}>Ver informações</button>
                      <button onClick={() => openEdit(c)} style={{ ...btnStyle, color: "var(--accent)" }}>Editar</button>
                      <button onClick={() => openDuplicate(c)} title="Duplicar" style={{ ...btnStyle, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                        <CopyIcon /> Duplicar
                      </button>
                      <button onClick={() => setDeleting(c)} style={{ ...btnStyle, color: "var(--danger)" }}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                    {creatives.length === 0 ? "Nenhum criativo cadastrado ainda" : "Nenhum criativo encontrado para os filtros selecionados"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && <CreativeFormModal creative={editing} onClose={() => setModalOpen(false)} onSaved={load} />}
      {viewing && <CreativeDetailsModal creative={viewing} onClose={() => setViewing(null)} />}
      {deleting && (
        <ConfirmDialog
          title="Excluir criativo"
          message={`Tem certeza que deseja excluir "${deleting.nome}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
