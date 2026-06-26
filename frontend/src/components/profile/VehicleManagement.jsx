import { useEffect, useState } from "react";
import { getRegisteredVehicles, createVehicle, updateVehicle, deleteVehicle } from "../../api/client.js";
import Avatar from "../common/Avatar.jsx";

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  function load() {
    getRegisteredVehicles().then(setVehicles).catch(console.error);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    if (!confirm("Excluir este veículo? Esta ação não pode ser desfeita.")) return;
    await deleteVehicle(id);
    load();
  }

  function openEdit(vehicle) {
    setEditing(vehicle);
    setFormOpen(true);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p className="card-title" style={{ margin: 0 }}>
          Veículos
        </p>
        <button
          onClick={openCreate}
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Novo veículo
        </button>
      </div>

      {formOpen && (
        <VehicleForm
          vehicle={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            load();
            setFormOpen(false);
          }}
        />
      )}

      {!vehicles ? (
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Carregando...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {vehicles.map((v) => (
            <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar nome={v.nome} fotoUrl={v.logo_url} size={32} />
              <strong style={{ fontSize: 13, flex: 1 }}>{v.nome}</strong>
              <button
                onClick={() => openEdit(v)}
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
                onClick={() => handleDelete(v.id)}
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
          ))}
          {vehicles.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>Nenhum veículo cadastrado ainda</p>
          )}
        </div>
      )}
    </div>
  );
}

function VehicleForm({ vehicle, onClose, onSaved }) {
  const isEdit = Boolean(vehicle);
  const [nome, setNome] = useState(vehicle?.nome || "");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("nome", nome);
      if (file) formData.append("logo", file);
      if (isEdit) {
        await updateVehicle(vehicle.id, formData);
      } else {
        await createVehicle(formData);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao salvar veículo");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div>
        <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Nome do veículo</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)" }}
        />
      </div>

      <div>
        <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Logo (imagem)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ width: "100%", marginTop: 4 }}
        />
      </div>

      {error && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
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
          Cancelar
        </button>
      </div>
    </form>
  );
}
