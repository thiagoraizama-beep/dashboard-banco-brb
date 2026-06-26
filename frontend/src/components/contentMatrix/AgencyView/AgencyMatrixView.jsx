import { useEffect, useState } from "react";
import { getMatrixCreatives, deleteMatrixCreative, updateMatrixCreativeStatus } from "../../../api/client.js";
import StatusSelect from "../statusSelect.jsx";
import CreativeFormModal from "./CreativeFormModal.jsx";
import DownloadButton from "../DownloadButton.jsx";
import CreativePreviewPopup from "../CreativePreviewPopup.jsx";
import MatrixFilterBar from "../MatrixFilterBar.jsx";
import { useMatrixFilters } from "../useMatrixFilters.js";
import ThemeToggle from "../../layout/ThemeToggle.jsx";
import Spinner from "../../common/Spinner.jsx";

function formatPeriodo(inicio, fim) {
  if (!inicio && !fim) return "-";
  const fmt = (iso) => {
    const [y, m, d] = iso.slice(0, 10).split("-");
    return `${d}/${m}`;
  };
  if (inicio && fim) return `${fmt(inicio)} - ${fmt(fim)}`;
  return fmt(inicio || fim);
}

export default function AgencyMatrixView() {
  const [creatives, setCreatives] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const { filtered, options, filters, setStatus, setVeiculo, setCampanha } = useMatrixFilters(creatives);

  function load() {
    setCreatives(null);
    getMatrixCreatives().then(setCreatives).catch(console.error);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    if (!confirm("Excluir este criativo? Esta ação não pode ser desfeita.")) return;
    await deleteMatrixCreative(id);
    load();
  }

  async function handleStatusChange(id, status) {
    setUpdatingId(id);
    try {
      await updateMatrixCreativeStatus(id, status);
      load();
    } finally {
      setUpdatingId(null);
    }
  }

  function openEdit(creative) {
    setEditing(creative);
    setModalOpen(true);
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Matriz de Conteúdo</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ThemeToggle variant="plain" />
          <button
            onClick={openCreate}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Novo criativo
          </button>
        </div>
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

      <div className="card">
        {!creatives ? (
          <Spinner />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Criativo</th>
                <th>Campanha</th>
                <th>Conjunto</th>
                <th>Veículo</th>
                <th>Período</th>
                <th>Ad Name</th>
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
                        <video src={c.cloudinary_url} style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }} />
                      ) : (
                        <img src={c.cloudinary_url} alt={c.nome} style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }} />
                      )}
                      <strong style={{ fontSize: 13, cursor: "default" }}>{c.nome}</strong>
                    </CreativePreviewPopup>
                  </td>
                  <td>{c.campanha}</td>
                  <td>{c.conjunto || "-"}</td>
                  <td>{c.veiculo}</td>
                  <td style={{ fontSize: 12 }}>{formatPeriodo(c.periodo_inicio, c.periodo_fim)}</td>
                  <td>
                    {c.ad_name || (
                      <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>não vinculado</span>
                    )}
                  </td>
                  <td>
                    <StatusSelect
                      value={c.status}
                      onChange={(status) => handleStatusChange(c.id, status)}
                      disabled={updatingId === c.id}
                    />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <DownloadButton creative={c} compact />
                      <button
                        onClick={() => openEdit(c)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: "1px solid var(--border)",
                          background: "transparent",
                          color: "var(--text-primary)",
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: "1px solid var(--border)",
                          background: "transparent",
                          color: "var(--danger)",
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Excluir
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
        )}
      </div>

      {modalOpen && (
        <CreativeFormModal creative={editing} onClose={() => setModalOpen(false)} onSaved={load} />
      )}
    </div>
  );
}
