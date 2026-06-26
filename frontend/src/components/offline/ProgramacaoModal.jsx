import { useState } from "react";
import SearchSelect from "./SearchSelect.jsx";
import { createProgramacao, updateProgramacao } from "../../api/client.js";

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

export default function ProgramacaoModal({ initialDate, editingProgramacao, veiculos, programas, onClose, onCreated }) {
  const isEditing = Boolean(editingProgramacao);
  const [veiculo, setVeiculo] = useState(editingProgramacao?.veiculo || "");
  const [programa, setPrograma] = useState(editingProgramacao?.programa || "");
  const [data, setData] = useState(editingProgramacao?.data || toISODate(initialDate || new Date()));
  const [horaInicio, setHoraInicio] = useState(editingProgramacao?.horaInicio || "10:00");
  const [horaFim, setHoraFim] = useState(editingProgramacao?.horaFim || "12:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!veiculo || !programa || !data || !horaInicio || !horaFim) {
      setError("Preencha todos os campos.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = { veiculo, programa, data, horaInicio, horaFim };
      const saved = isEditing
        ? await updateProgramacao(editingProgramacao.id, payload)
        : await createProgramacao(payload);
      onCreated(saved);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao salvar programação.");
    } finally {
      setSaving(false);
    }
  }

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
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="card"
        style={{ width: 380, display: "flex", flexDirection: "column", gap: 14 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ fontSize: 16 }}>{isEditing ? "Editar programação" : "Nova programação"}</strong>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text-secondary)" }}
          >
            ×
          </button>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Veículo</label>
          <SearchSelect options={veiculos} value={veiculo} onChange={setVeiculo} placeholder="Buscar veículo..." />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Programa</label>
          <SearchSelect
            options={programas}
            value={programa}
            onChange={setPrograma}
            placeholder="Buscar ou digitar programa..."
            allowFreeText
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Data</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Início</label>
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Fim</label>
            <input
              type="time"
              value={horaFim}
              onChange={(e) => setHoraFim(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
            />
          </div>
        </div>

        {error && <small style={{ color: "var(--danger)" }}>{error}</small>}

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "10px 0",
            borderRadius: 8,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 13,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar"}
        </button>
      </form>
    </div>
  );
}
