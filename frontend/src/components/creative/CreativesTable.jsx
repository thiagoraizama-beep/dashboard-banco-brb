import { useEffect, useState } from "react";
import { getCreatives } from "../../api/client.js";
import { useCreativeFilters } from "../../context/CreativeAnalysisContext.jsx";
import Spinner from "../common/Spinner.jsx";
import CreativeDetailModal from "./CreativeDetailModal.jsx";

function formatCompact(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("pt-BR");
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function CreativesTable({ veiculo }) {
  const { filters } = useCreativeFilters(veiculo);
  const [creatives, setCreatives] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setCreatives(null);
    getCreatives(veiculo, filters).then(setCreatives).catch(console.error);
  }, [
    veiculo,
    filters.start,
    filters.end,
    JSON.stringify(filters.campanha),
    JSON.stringify(filters.tipoCompra),
    JSON.stringify(filters.posicionamento),
    JSON.stringify(filters.plataforma),
  ]);

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <p className="card-title">Criativos</p>
      {!creatives ? (
        <Spinner />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ whiteSpace: "nowrap" }}>
            <thead>
              <tr>
                <th>Imagem</th>
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
                <th>Formato</th>
              </tr>
            </thead>
            <tbody>
              {creatives.map((c) => (
                <tr key={c.adName}>
                  <td>
                    <button
                      onClick={() => setSelected(c)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "transparent",
                        color: "var(--accent)",
                        cursor: "pointer",
                      }}
                    >
                      <EyeIcon />
                    </button>
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
                  <td>{c.posicionamento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <CreativeDetailModal creative={selected} veiculo={veiculo} filters={filters} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
