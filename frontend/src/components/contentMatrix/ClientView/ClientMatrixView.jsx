import { useEffect, useState } from "react";
import { getMatrixCreatives } from "../../../api/client.js";
import StatusBadge from "../statusBadge.jsx";
import DownloadButton from "../DownloadButton.jsx";
import MatrixFilterBar from "../MatrixFilterBar.jsx";
import { useMatrixFilters } from "../useMatrixFilters.js";
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
  const groups = { "Em veiculação": 0, "Com erro": 0, Programado: 0, Pausado: 0 };
  for (const c of creatives) {
    if (groups[c.status] != null) groups[c.status] += 1;
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
      <h2 style={{ margin: "0 0 16px" }}>Relatório de Criativos</h2>

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
                <td style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {c.tipo_midia === "video" ? (
                    <video src={c.cloudinary_url} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} />
                  ) : (
                    <img src={c.cloudinary_url} alt={c.nome} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} />
                  )}
                  <strong style={{ fontSize: 13 }}>{c.nome}</strong>
                </td>
                <td>{c.campanha}</td>
                <td>{c.veiculo}</td>
                <td style={{ fontSize: 12 }}>{formatPeriodo(c.periodo_inicio, c.periodo_fim)}</td>
                <td style={{ fontSize: 12, maxWidth: 220 }}>{c.descricao || "-"}</td>
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
