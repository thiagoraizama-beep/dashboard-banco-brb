import { useEffect, useState } from "react";
import { getCampanhas, updateGa4PropertyId, getGa4ServiceAccount } from "../../api/client.js";

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

// Cada campanha (LP) pode ter sua propria conta/property do Google Analytics 4.
// Sem vinculo cadastrado aqui, o card de Sessoes no Dashboard mostra "Sem dados"
// para essa campanha em vez de tentar puxar de uma property padrao/inexistente.
export default function Ga4IntegrationsManagement() {
  const [campanhas, setCampanhas] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [valor, setValor] = useState("");
  const [saving, setSaving] = useState(false);
  // undefined = ainda buscando; null = buscou e nao ha conta configurada no .env do
  // backend; string = e-mail configurado. Distingue "carregando" de "nao configurado"
  // para nao ficar em "Carregando..." para sempre quando o backend nao tem a credencial.
  const [serviceEmail, setServiceEmail] = useState(undefined);
  const [copied, setCopied] = useState(false);

  function load() {
    getCampanhas().then(setCampanhas).catch(console.error);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    getGa4ServiceAccount()
      .then((r) => setServiceEmail(r.email))
      .catch(() => setServiceEmail(null));
  }, []);

  function handleCopyEmail() {
    if (!serviceEmail) return;
    navigator.clipboard.writeText(serviceEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function startEdit(c) {
    setEditingId(c.id);
    setValor(c.ga4_property_id || "");
  }

  async function handleSave(id) {
    setSaving(true);
    try {
      await updateGa4PropertyId(id, valor.trim());
      setEditingId(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id) {
    setSaving(true);
    try {
      await updateGa4PropertyId(id, null);
      load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <p className="card-title" style={{ marginBottom: 4 }}>Integrações GA4</p>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 16px" }}>
        Vincule o Property ID do Google Analytics 4 de cada campanha (LP). Sem vínculo, o card
        de Sessões no Dashboard mostra "Sem dados" para essa campanha em vez de números de outra LP.
      </p>

      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "14px 16px",
          marginBottom: 20,
        }}
      >
        <strong style={{ fontSize: 13 }}>Antes de vincular: libere o acesso no GA4</strong>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 10px" }}>
          Colar o Property ID aqui não é suficiente — o Google Analytics só libera a leitura para quem tiver
          permissão explícita na property. Sem esse passo, a busca falha mesmo com o ID certo cadastrado.
        </p>
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 6 }}>
          <li>No GA4 da campanha, vá em <strong style={{ color: "var(--text-primary)" }}>Admin</strong> → <strong style={{ color: "var(--text-primary)" }}>Acesso à conta/property</strong> (Property Access Management).</li>
          <li>
            Clique em <strong style={{ color: "var(--text-primary)" }}>Adicionar usuário</strong> e cole o e-mail abaixo:
            {serviceEmail === null ? (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--danger)" }}>
                Nenhuma conta de serviço configurada ainda no servidor (GOOGLE_SERVICE_ACCOUNT_EMAIL vazio).
                Peça para configurar essa credencial antes de liberar o acesso no GA4.
              </p>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <code
                  style={{
                    flex: 1,
                    fontSize: 12,
                    padding: "6px 10px",
                    borderRadius: 6,
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    overflowX: "auto",
                    whiteSpace: "nowrap",
                  }}
                >
                  {serviceEmail === undefined ? "Carregando..." : serviceEmail}
                </code>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  disabled={!serviceEmail}
                  title="Copiar e-mail"
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-primary)", fontSize: 12, cursor: serviceEmail ? "pointer" : "default", whiteSpace: "nowrap" }}
                >
                  <CopyIcon />
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            )}
          </li>
          <li>Papel: <strong style={{ color: "var(--text-primary)" }}>Visualizador</strong> já é suficiente (só leitura).</li>
          <li>Salve e volte aqui para colar o <strong style={{ color: "var(--text-primary)" }}>Property ID</strong> da campanha na lista abaixo.</li>
        </ol>
      </div>

      {!campanhas ? (
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Carregando...</p>
      ) : campanhas.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Nenhuma campanha cadastrada ainda.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {campanhas.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "10px 12px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: 13 }}>{c.nome}</strong>
              </div>

              {editingId === c.id ? (
                <>
                  <input
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="Property ID do GA4 (ex: 123456789)"
                    style={{ width: 220, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12 }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleSave(c.id)}
                    disabled={saving}
                    style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 12, color: c.ga4_property_id ? "var(--text-primary)" : "var(--text-secondary)", fontFamily: "monospace" }}>
                    {c.ga4_property_id || "Sem vínculo"}
                  </span>
                  <button
                    onClick={() => startEdit(c)}
                    style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-primary)", fontSize: 12, cursor: "pointer" }}
                  >
                    {c.ga4_property_id ? "Editar" : "Vincular"}
                  </button>
                  {c.ga4_property_id && (
                    <button
                      onClick={() => handleRemove(c.id)}
                      disabled={saving}
                      style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--danger)", fontSize: 12, cursor: "pointer" }}
                    >
                      Remover
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
