import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getUsers, createUserAccount, deleteUserAccount } from "../../api/client.js";
import { CREATIVE_VEHICLES } from "../layout/creativeVehicles.js";
import Avatar from "../common/Avatar.jsx";
import TrashIcon from "../common/TrashIcon.jsx";
import ConfirmDialog from "../common/ConfirmDialog.jsx";

const PAPEL_LABELS = { agencia: "Agência", veiculo: "Veículo", cliente: "Cliente" };

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  function load() {
    getUsers().then(setUsers).catch(console.error);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete() {
    await deleteUserAccount(deleting.id);
    setDeleting(null);
    load();
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p className="card-title" style={{ margin: 0 }}>
          Usuários
        </p>
        <button
          onClick={() => setFormOpen((o) => !o)}
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
          {formOpen ? "Cancelar" : "+ Novo usuário"}
        </button>
      </div>

      {formOpen && <NewUserForm onCreated={() => { load(); setFormOpen(false); }} />}

      {!users ? (
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Carregando...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {users.map((u) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar nome={u.nome} fotoUrl={u.fotoUrl} size={32} />
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 13 }}>{u.nome}</strong>
                <p style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)" }}>{u.email}</p>
              </div>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {PAPEL_LABELS[u.papel]}
                {u.veiculos?.length > 0 && ` · ${u.veiculos.join(", ")}`}
              </span>
              {u.id !== currentUser.id && (
                <button
                  onClick={() => setDeleting(u)}
                  title="Excluir usuário"
                  aria-label="Excluir usuário"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--danger)",
                    cursor: "pointer",
                  }}
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {deleting && (
        <ConfirmDialog
          title="Excluir usuário"
          message={`Tem certeza que deseja excluir o usuário "${deleting.nome}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

function NewUserForm({ onCreated }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [papel, setPapel] = useState("cliente");
  const [veiculos, setVeiculos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleVeiculo(v) {
    setVeiculos((current) => (current.includes(v) ? current.filter((x) => x !== v) : [...current, v]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await createUserAccount({ email, senha, nome, papel, veiculos: papel === "veiculo" ? veiculos : [] });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao criar usuário");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Papel</label>
          <select
            value={papel}
            onChange={(e) => setPapel(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)" }}
          >
            <option value="agencia">Agência</option>
            <option value="veiculo">Veículo</option>
            <option value="cliente">Cliente</option>
          </select>
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)" }}
        />
      </div>

      <div>
        <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)" }}
        />
      </div>

      {papel === "veiculo" && (
        <div>
          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Veículos vinculados</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            {CREATIVE_VEHICLES.map((v) => (
              <label key={v} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                <input type="checkbox" checked={veiculos.includes(v)} onChange={() => toggleVeiculo(v)} />
                {v}
              </label>
            ))}
          </div>
        </div>
      )}

      {error && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p>}

      <button
        type="submit"
        disabled={saving}
        style={{
          padding: "8px 0",
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
        {saving ? "Criando..." : "Criar usuário"}
      </button>
    </form>
  );
}
