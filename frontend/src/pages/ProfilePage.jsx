import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { updateMyProfile } from "../api/client.js";
import Avatar from "../components/common/Avatar.jsx";
import UserManagement from "../components/profile/UserManagement.jsx";
import ChangePasswordForm from "../components/profile/ChangePasswordForm.jsx";
import VehicleManagement from "../components/profile/VehicleManagement.jsx";
import ThemeToggle from "../components/layout/ThemeToggle.jsx";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [nome, setNome] = useState(user.nome);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removerFoto, setRemoverFoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleFileChange(e) {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : null);
    if (selected) setRemoverFoto(false);
  }

  function handleRemovePhoto() {
    setFile(null);
    setPreview(null);
    setRemoverFoto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append("nome", nome);
      if (file) formData.append("foto", file);
      if (removerFoto) formData.append("removerFoto", "true");
      await updateMyProfile(formData);
      await refreshUser();
      setRemoverFoto(false);
      setSuccess(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Meu Perfil</h2>
        <ThemeToggle variant="plain" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Avatar nome={nome} fotoUrl={removerFoto ? null : preview || user.fotoUrl} size={64} />
            <div style={{ display: "flex", gap: 8 }}>
              <label
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Trocar foto
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
              </label>
              {!removerFoto && (preview || user.fotoUrl) && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--danger)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Remover foto
                </button>
              )}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Email</label>
            <input
              value={user.email}
              disabled
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", opacity: 0.6 }}
            />
          </div>

          {success && <p style={{ color: "var(--success)", fontSize: 13, margin: 0 }}>Perfil atualizado!</p>}

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
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>

        <ChangePasswordForm />
      </div>

      {user.papel === "agencia" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20, alignItems: "start" }}>
          <VehicleManagement />
          <UserManagement />
        </div>
      )}
    </div>
  );
}
