import { useEffect, useState } from "react";
import { CREATIVE_VEHICLES } from "../../layout/creativeVehicles.js";
import { createMatrixCreative, updateMatrixCreative, getRegisteredVehicles } from "../../../api/client.js";

export default function CreativeFormModal({ creative, onClose, onSaved }) {
  const isEdit = Boolean(creative);
  const [nome, setNome] = useState(creative?.nome || "");
  const [adName, setAdName] = useState(creative?.ad_name || "");
  const [campanha, setCampanha] = useState(creative?.campanha || "");
  const [conjunto, setConjunto] = useState(creative?.conjunto || "");
  const [descricao, setDescricao] = useState(creative?.descricao || "");
  const [observacoes, setObservacoes] = useState(creative?.observacoes || "");
  const [periodoInicio, setPeriodoInicio] = useState(creative?.periodo_inicio?.slice(0, 10) || "");
  const [periodoFim, setPeriodoFim] = useState(creative?.periodo_fim?.slice(0, 10) || "");
  const [veiculo, setVeiculo] = useState(creative?.veiculo || CREATIVE_VEHICLES[0]);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [veiculoOptions, setVeiculoOptions] = useState(CREATIVE_VEHICLES);

  useEffect(() => {
    getRegisteredVehicles()
      .then((registered) => {
        const nomes = registered.map((v) => v.nome);
        const combinados = [...new Set([...CREATIVE_VEHICLES, ...nomes])];
        setVeiculoOptions(combinados);
      })
      .catch(console.error);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isEdit) {
        await updateMatrixCreative(creative.id, {
          nome,
          adName,
          campanha,
          conjunto,
          descricao,
          observacoes,
          periodoInicio: periodoInicio || null,
          periodoFim: periodoFim || null,
          veiculo,
        });
      } else {
        if (!file) {
          setError("Selecione um arquivo de imagem ou vídeo");
          setSaving(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("nome", nome);
        formData.append("adName", adName);
        formData.append("campanha", campanha);
        formData.append("conjunto", conjunto);
        formData.append("descricao", descricao);
        formData.append("observacoes", observacoes);
        if (periodoInicio) formData.append("periodoInicio", periodoInicio);
        if (periodoFim) formData.append("periodoFim", periodoFim);
        formData.append("veiculo", veiculo);
        await createMatrixCreative(formData);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao salvar criativo");
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
        background: "rgba(20,33,61,0.5)",
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
        style={{ width: 480, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ fontSize: 15 }}>{isEdit ? "Editar criativo" : "Novo criativo"}</strong>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text-secondary)" }}
          >
            ×
          </button>
        </div>

        {!isEdit && (
          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Arquivo (imagem ou vídeo)</label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
              style={{ width: "100%", marginTop: 4 }}
            />
          </div>
        )}

        <div>
          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Nome do criativo</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Veículo</label>
          <select
            value={veiculo}
            onChange={(e) => setVeiculo(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)" }}
          >
            {veiculoOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Campanha</label>
          <input
            value={campanha}
            onChange={(e) => setCampanha(e.target.value)}
            required
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Conjunto (ad set)</label>
          <input
            value={conjunto}
            onChange={(e) => setConjunto(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Ad Name (vínculo com a planilha de performance)
          </label>
          <input
            value={adName}
            onChange={(e) => setAdName(e.target.value)}
            placeholder="Deve bater exatamente com o Ad Name da planilha"
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Início da veiculação</label>
            <input
              type="date"
              value={periodoInicio}
              onChange={(e) => setPeriodoInicio(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Fim da veiculação</label>
            <input
              type="date"
              value={periodoFim}
              onChange={(e) => setPeriodoFim(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)" }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", fontFamily: "inherit" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Observações</label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", fontFamily: "inherit" }}
          />
        </div>

        {error && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p>}

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "10px 0",
            borderRadius: 8,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </div>
  );
}
