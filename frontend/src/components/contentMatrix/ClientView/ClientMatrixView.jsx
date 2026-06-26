import { useEffect, useState } from "react";
import { getMatrixCreatives } from "../../../api/client.js";
import StatusBadge from "../statusBadge.jsx";
import DownloadButton from "../DownloadButton.jsx";
import CreativePreviewPopup from "../CreativePreviewPopup.jsx";
import MatrixFilterBar from "../MatrixFilterBar.jsx";
import { useMatrixFilters } from "../useMatrixFilters.js";
import ThemeToggle from "../../layout/ThemeToggle.jsx";
import Spinner from "../../common/Spinner.jsx";

function formatPeriodo(inicio, fim) {
  if (!inicio && !fim) return "-";
  const fmt = (iso) => {
    const [, m, d] = iso.slice(0, 10).split("-");
    return `${d}/${m}`;
  };
  if (inicio && fim) return `${fmt(inicio)} - ${fmt(fim)}`;
  return fmt(inicio || fim);
}

function groupByStatus(creatives) {
  const groups = {};
  for (const c of creatives) {
    if (!c.status) continue;
    groups[c.status] = (groups[c.status] || 0) + 1;
  }
  return groups;
}

export default function ClientMatrixView() {
  const [creatives, setCreatives] = useState(null);
  const { filtered, options, filters, setStatus, setVeiculo, setCampanha } = useMatrixFilters(creatives);

  useEffect(() => {
    getMatrixCreatives().then(setCreatives).catch(console.error);
  }, []);

  if (!creatives) return <Spinner />;

  const counts = groupByStatus(creatives);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Relatório de Criativos</h2>
        <ThemeToggle variant="plain" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 20 }}>
        {Object.entries(counts).map(([status, count]) => (
          <div className="card" key={status}>
            <p className="card-title">{status}</p>
            <p className="kpi-value">{count}</p>
          </div>
        ))}
      </div>

      {creatives.length > 0 && (
        <MatrixFilterBar
          options={options}
          filters={filters}
          setStatus={setStatus}
          setVeiculo={setVeiculo}
          setCampanha={setCampanha}
        />
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Criativo</th>
              <th>Campanha</th>
              <th>Veículo</th>
              <th>Período</th>
              <th>Descrição</th>
              <th>Status</th>
              <th>Download</th>
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
                <td style={{ fontSize: 12 }}>{formatPeriodo(c.periodo_inicio, c.periodo_fim)}</td>
                <td
                  style={{
                    fontSize: 12,
                    maxWidth: 220,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.descricao || "-"}
                </td>
                <td>
                  <StatusBadge status={c.status} />
                </td>
                <td>
                  <DownloadButton creative={c} compact />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                  {creatives.length === 0
                    ? "Nenhum criativo cadastrado ainda"
                    : "Nenhum criativo encontrado para os filtros selecionados"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
