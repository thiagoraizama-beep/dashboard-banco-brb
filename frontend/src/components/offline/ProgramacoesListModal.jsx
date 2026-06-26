import { useState } from "react";
import { deleteProgramacao } from "../../api/client.js";

function formatDateBR(iso) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export default function ProgramacoesListModal({ programacoes, onClose, onChanged, onEdit }) {
  const [deletingId, setDeletingId] = useState(null);

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await deleteProgramacao(id);
      onChanged();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }

  const sorted = [...programacoes].sort((a, b) => (a.data + a.horaInicio).localeCompare(b.data + b.horaInicio));

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,33,61,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: 480, maxHeight: "70vh", display: "flex", flexDirection: "column", gap: 12 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ fontSize: 16 }}>Programações cadastradas ({sorted.length})</strong>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text-secondary)" }}
          >
            ×
          </button>
        </div>

        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Nenhuma programação cadastrada ainda.</p>
          )}
          {sorted.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              <div>
                <strong style={{ fontSize: 13 }}>
                  {p.veiculo} · {p.programa}
                </strong>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {formatDateBR(p.data)} — {p.horaInicio} às {p.horaFim}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => onEdit(p)} style={iconButtonStyle} title="Editar">
                  ✎
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                  style={{ ...iconButtonStyle, color: "var(--danger)" }}
                  title="Excluir"
                >
                  {deletingId === p.id ? "..." : "🗑"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const iconButtonStyle = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "transparent",
  cursor: "pointer",
  fontSize: 13,
};
