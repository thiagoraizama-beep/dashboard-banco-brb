import { useEffect, useState } from "react";
import { getCreatives } from "../../api/client.js";
import { useCreativeFilters } from "../../context/CreativeAnalysisContext.jsx";
import Spinner from "../common/Spinner.jsx";
import CreativeDetailModal from "./CreativeDetailModal.jsx";
import useIsMobile from "../../hooks/useIsMobile.js";
import { StatusDot } from "../contentMatrix/statusBadge.jsx";

function formatCompact(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("pt-BR");
}

function EyeIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// Thumbnail do criativo com a bolinha de status sobreposta no canto inferior
// direito. Clicavel (abre o detalhe), alem do botao de olho separado ao lado.
function CreativeThumb({ creative: c, onClick, size = 44 }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        display: "block",
        width: size,
        height: size,
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: c.imagemCriativo ? `var(--card-bg) url(${c.imagemCriativo}) center/cover no-repeat` : "var(--bg)",
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
      }}
    >
      {!c.imagemCriativo && (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            color: "var(--text-secondary)",
          }}
        >
          <EyeIcon size={16} />
        </span>
      )}
      {c.status && (
        <span style={{ position: "absolute", bottom: -3, right: -3 }}>
          <StatusDot status={c.status} />
        </span>
      )}
    </button>
  );
}

function EyeButton({ onClick, size = 30 }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "transparent",
        color: "var(--accent)",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <EyeIcon size={16} />
    </button>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s" }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function MetricRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CreativeMobileCard({ creative: c, veiculo, onViewDetail }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10 }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          cursor: "pointer",
        }}
      >
        <ChevronIcon open={open} />
        <CreativeThumb
          creative={c}
          size={36}
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail(c);
          }}
        />
        <EyeButton
          size={28}
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail(c);
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ fontSize: 13, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {c.nomeCriativo}
          </strong>
          {veiculo === "Meta" && c.plataforma && (
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{c.plataforma}</span>
          )}
        </div>
      </div>
      {open && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            background: "var(--bg)",
          }}
        >
          <MetricRow label="Investimento" value={`R$ ${c.investimento.toLocaleString("pt-BR")}`} />
          <MetricRow label="Impressões" value={formatCompact(c.impressoes)} />
          <MetricRow label="Cliques" value={formatCompact(c.cliques)} />
          <MetricRow label="CTR" value={`${c.ctr}%`} />
          <MetricRow label="VTR" value={`${c.vtr}%`} />
          <MetricRow label="Visualizações" value={formatCompact(c.videoViews)} />
          <MetricRow label="Visu. 25%" value={formatCompact(c.videoViews25)} />
          <MetricRow label="Visu. 50%" value={formatCompact(c.videoViews50)} />
          <MetricRow label="Visu. 75%" value={formatCompact(c.videoViews75)} />
          <MetricRow label="Visu. 100%" value={formatCompact(c.videoCompletions)} />
          <MetricRow label="Engajamentos" value={formatCompact(c.engajamentos)} />
          <MetricRow label="Tipo Compra" value={c.tipoCompra || "-"} />
          <MetricRow label="Formato" value={c.posicionamento || "-"} />
        </div>
      )}
    </div>
  );
}

export default function CreativesTable({ campanhaId, veiculo }) {
  const { filters } = useCreativeFilters(campanhaId, veiculo);
  const [creatives, setCreatives] = useState(null);
  const [selected, setSelected] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setCreatives(null);
    getCreatives(campanhaId, veiculo, filters)
      .then(setCreatives)
      .catch((err) => {
        console.error(err);
        setCreatives([]);
      });
  }, [
    campanhaId,
    veiculo,
    filters.start,
    filters.end,
    JSON.stringify(filters.tipoCompra),
    JSON.stringify(filters.posicionamento),
    JSON.stringify(filters.plataforma),
  ]);

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <p className="card-title">Criativos</p>
      {!creatives ? (
        <Spinner />
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {creatives.map((c) => (
            <CreativeMobileCard key={c.adName} creative={c} veiculo={veiculo} onViewDetail={setSelected} />
          ))}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ whiteSpace: "nowrap" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "center" }}>Imagem</th>
                <th>Criativo</th>
                <th>Investimento</th>
                <th>Impressões</th>
                <th>Cliques</th>
                <th>CTR</th>
                <th>VTR</th>
                <th>Visualizações</th>
                <th>Visu. 25%</th>
                <th>Visu. 50%</th>
                <th>Visu. 75%</th>
                <th>Visu. 100%</th>
                <th>Engajamentos</th>
                <th>Tipo Compra</th>
                <th style={{ textAlign: "center" }}>Formato</th>
              </tr>
            </thead>
            <tbody>
              {creatives.map((c) => (
                <tr key={c.adName}>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <CreativeThumb creative={c} onClick={() => setSelected(c)} />
                      <button
                        onClick={() => setSelected(c)}
                        style={{
                          padding: 0,
                          border: "none",
                          background: "transparent",
                          color: "var(--accent)",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Ver mais
                      </button>
                    </div>
                  </td>
                  <td>
                    <strong style={{ fontSize: 13 }}>{c.nomeCriativo}</strong>
                    {veiculo === "Meta" && c.plataforma && (
                      <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>{c.plataforma}</div>
                    )}
                  </td>
                  <td>R$ {c.investimento.toLocaleString("pt-BR")}</td>
                  <td>{formatCompact(c.impressoes)}</td>
                  <td>{formatCompact(c.cliques)}</td>
                  <td>{c.ctr}%</td>
                  <td>{c.vtr}%</td>
                  <td>{formatCompact(c.videoViews)}</td>
                  <td>{formatCompact(c.videoViews25)}</td>
                  <td>{formatCompact(c.videoViews50)}</td>
                  <td>{formatCompact(c.videoViews75)}</td>
                  <td>{formatCompact(c.videoCompletions)}</td>
                  <td>{formatCompact(c.engajamentos)}</td>
                  <td>{c.tipoCompra}</td>
                  <td style={{ textAlign: "center" }}>{c.posicionamento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <CreativeDetailModal creative={selected} campanhaId={campanhaId} veiculo={veiculo} filters={filters} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
