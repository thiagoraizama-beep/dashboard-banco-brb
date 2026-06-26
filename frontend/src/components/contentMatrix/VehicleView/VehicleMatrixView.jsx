import { useEffect, useState } from "react";
import { getMatrixCreatives, updateMatrixCreativeStatus } from "../../../api/client.js";
import StatusSelect from "../statusSelect.jsx";
import DownloadButton from "../DownloadButton.jsx";
import CreativePreviewPopup from "../CreativePreviewPopup.jsx";
import MatrixFilterBar from "../MatrixFilterBar.jsx";
import { useMatrixFilters } from "../useMatrixFilters.js";
import ThemeToggle from "../../layout/ThemeToggle.jsx";
import Spinner from "../../common/Spinner.jsx";

function formatPeriodo(inicio, fim) {
  if (!inicio && !fim) return null;
  const fmt = (iso) => {
    const [y, m, d] = iso.slice(0, 10).split("-");
    return `${d}/${m}`;
  };
  if (inicio && fim) return `${fmt(inicio)} - ${fmt(fim)}`;
  return fmt(inicio || fim);
}

export default function VehicleMatrixView() {
  const [creatives, setCreatives] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const { filtered, options, filters, setStatus, setVeiculo, setCampanha } = useMatrixFilters(creatives);

  function load() {
    setCreatives(null);
    getMatrixCreatives().then(setCreatives).catch(console.error);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleStatusChange(id, status) {
    setUpdatingId(id);
    try {
      await updateMatrixCreativeStatus(id, status);
      load();
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Meus Criativos</h2>
        <ThemeToggle variant="plain" />
      </div>

      {creatives && creatives.length > 0 && (
        <MatrixFilterBar
          options={options}
          filters={filters}
          setStatus={setStatus}
          setVeiculo={setVeiculo}
          setCampanha={setCampanha}
        />
      )}

      {!creatives ? (
        <Spinner />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((c) => (
            <div key={c.id} className="card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <CreativePreviewPopup creative={c}>
                {c.tipo_midia === "video" ? (
                  <video src={c.cloudinary_url} style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover" }} />
                ) : (
                  <img src={c.cloudinary_url} alt={c.nome} style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover" }} />
                )}
              </CreativePreviewPopup>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 14 }}>{c.nome}</strong>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
                  {c.campanha} {c.conjunto && `· ${c.conjunto}`} · {c.veiculo}
                  {formatPeriodo(c.periodo_inicio, c.periodo_fim) && ` · ${formatPeriodo(c.periodo_inicio, c.periodo_fim)}`}
                </p>
                {c.observacoes && (
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-primary)" }}>{c.observacoes}</p>
                )}
              </div>
              <DownloadButton creative={c} />
              <StatusSelect
                value={c.status}
                onChange={(status) => handleStatusChange(c.id, status)}
                disabled={updatingId === c.id}
              />
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="card" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
              {creatives.length === 0
                ? "Nenhum criativo cadastrado para o seu veículo ainda"
                : "Nenhum criativo encontrado para os filtros selecionados"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
