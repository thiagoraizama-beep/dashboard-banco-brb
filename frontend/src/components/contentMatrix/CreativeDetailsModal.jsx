import { useState } from "react";
import StatusBadge from "./statusBadge.jsx";

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function formatPeriodo(inicio, fim) {
  if (!inicio && !fim) return null;
  const fmt = (iso) => {
    const [y, m, d] = iso.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  };
  if (inicio && fim) return `${fmt(inicio)} - ${fmt(fim)}`;
  return fmt(inicio || fim);
}

function Field({ label, value }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>{label}</p>
      <p style={{ margin: "2px 0 0", fontSize: 13, wordBreak: "break-word" }}>
        {value || <span style={{ color: "var(--text-secondary)" }}>—</span>}
      </p>
    </div>
  );
}

export default function CreativeDetailsModal({ creative, onClose }) {
  const periodo = formatPeriodo(creative.periodo_inicio, creative.periodo_fim);
  const [copied, setCopied] = useState(false);

  function handleCopyUrl() {
    if (!creative.url_destino) return;
    navigator.clipboard.writeText(creative.url_destino);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,33,61,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: 560, maxWidth: "100%", maxHeight: "calc(100vh - 32px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <strong style={{ fontSize: 16 }}>{creative.nome}</strong>
            <div style={{ marginTop: 6 }}>
              <StatusBadge status={creative.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {creative.tipo_midia === "video" ? (
          <video
            src={creative.cloudinary_url}
            controls
            style={{ width: "100%", maxHeight: 280, borderRadius: 8, objectFit: "contain", background: "var(--bg)" }}
          />
        ) : (
          <img
            src={creative.cloudinary_url}
            alt={creative.nome}
            style={{ width: "100%", maxHeight: 280, borderRadius: 8, objectFit: "contain", background: "var(--bg)" }}
          />
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Veículo" value={creative.veiculo} />
          <Field label="Plataforma" value={creative.plataforma} />
          <Field label="Campanha" value={creative.campanha} />
          <Field label="Formato" value={creative.formato} />
          <Field
            label="Tipo de compra"
            value={creative.tipos_compra?.length ? creative.tipos_compra.join(", ") : null}
          />
          <Field label="Período de veiculação" value={periodo} />
          <Field label="Título" value={creative.titulo} />
          <Field label="Segmentação" value={creative.segmentacao} />
          <Field label="Campaign Name" value={creative.campaign_name} />
          <Field label="Ad Group" value={creative.conjunto} />
          <Field label="Ad Name" value={creative.ad_name} />
          <Field label="Posicionamento" value={creative.posicionamento} />
          <Field label="Tipo de publicação" value={creative.impulsionado === false ? "Dark Post" : "Impulsionado"} />
        </div>

        <Field label="Descrição" value={creative.descricao} />

        {creative.url_destino && (
          <div>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>URL de destino</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <code
                title={creative.url_destino}
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontFamily: "inherit",
                  fontSize: 12,
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: "var(--card-bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                }}
              >
                {creative.url_destino}
              </code>
              <button
                type="button"
                onClick={handleCopyUrl}
                title="Copiar link"
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-primary)", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
              >
                <CopyIcon />
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
        )}

        <Field label="Observações" value={creative.observacoes} />

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-primary)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
