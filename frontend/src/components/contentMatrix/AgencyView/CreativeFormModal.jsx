import { useEffect, useRef, useState } from "react";
import { createMatrixCreative, updateMatrixCreative, getCampanhas } from "../../../api/client.js";
import SearchSelect from "../../layout/SearchSelect.jsx";
import RangeCalendarPicker from "../../layout/RangeCalendarPicker.jsx";

const TODOS_FORMATOS = [
  "Feed", "Stories", "Reels", "Carrossel", "Coleção", "Instant Experience", "Messenger",
  "In-Feed", "TopView", "Brand Takeover", "Branded Hashtag Challenge", "Branded Effect", "Spark Ads",
  "In-Stream Pulável", "In-Stream Não Pulável", "Bumper Ad", "Discovery", "Shorts", "Masthead",
  "Kwai In-Feed", "Kwai TopView",
  "Audio Ad", "Podcast Ad", "Branded Playlist", "Display Audio",
  "Display", "Display Rich Media", "Interstitial", "Native", "Skin / Roadblock",
  "Banner", "Half Page", "Billboard", "Pop-Under",
  "DOOH", "OOH Outdoor", "OOH Mobiliário Urbano", "DOOH Metro", "DOOH Aeroporto",
  "VT 30s", "VT 15s", "VT 60s", "Spot Rádio 30s", "Spot Rádio 60s", "Merchandising",
  "Banner Home", "Sponsored Content", "Newsletter", "Push Notification",
  "Influencer Post", "Live", "Stories Interativo", "Link Patrocinado",
];

const TIPOS_COMPRA_OPTIONS = ["CPC", "CPM", "CPV", "CPE", "CPL", "CPT", "CPF", "CPA"];

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

export default function CreativeFormModal({ creative, onClose, onSaved }) {
  const isEdit = Boolean(creative?.id) && !creative?._duplicate;
  const title = creative?._duplicate ? "Duplicar criativo" : isEdit ? "Editar criativo" : "Novo criativo";

  const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 13, boxSizing: "border-box" };
  const textareaStyle = { ...inputStyle, fontFamily: "inherit", resize: "vertical" };

  const [nome, setNome] = useState(creative?.nome || "");
  const [adName, setAdName] = useState((creative?.ad_name || "").replace(/\s+/g, " ").trim());
  const [campaignName, setCampaignName] = useState(creative?.campaign_name || "");
  const [campanha, setCampanha] = useState(creative?.campanha || "");
  const [veiculo, setVeiculo] = useState(creative?.veiculo || "");
  const [conjunto, setConjunto] = useState(creative?.conjunto || "");
  const [formato, setFormato] = useState(creative?.formato || "");
  const [plataforma, setPlataforma] = useState(creative?.plataforma || "");
  const [posicionamento, setPosicionamento] = useState(creative?.posicionamento || "");
  const [urlDestino, setUrlDestino] = useState(creative?.url_destino || "");
  const [impulsionado, setImpulsionado] = useState(creative?.impulsionado !== false);
  const [segmentacao, setSegmentacao] = useState(creative?.segmentacao || "");
  const [titulo, setTitulo] = useState(creative?.titulo || "");
  const [tipoCompra, setTipoCompra] = useState(creative?.tipos_compra?.[0] || "");
  const [periodoInicio, setPeriodoInicio] = useState(creative?.periodo_inicio?.slice(0, 10) || "");
  const [periodoFim, setPeriodoFim] = useState(creative?.periodo_fim?.slice(0, 10) || "");
  const [descricao, setDescricao] = useState(creative?.descricao || "");
  const [observacoes, setObservacoes] = useState(creative?.observacoes || "");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(creative?.cloudinary_url || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [campanhaOptions, setCampanhaOptions] = useState([]);
  const [veiculoOptions, setVeiculoOptions] = useState([]);
  const [campanhaData, setCampanhaData] = useState([]);
  const [plataformasVeiculo, setPlataformasVeiculo] = useState([]);
  // Guarda os valores iniciais para não resetar ao carregar dados em modo edição
  const initialCampanha = useRef(creative?.campanha || "");
  const initialVeiculo = useRef(creative?.veiculo || "");
  const initialPlataforma = useRef(creative?.plataforma || "");
  const dataLoaded = useRef(false);

  useEffect(() => {
    getCampanhas()
      .then((list) => {
        setCampanhaData(list);
        setCampanhaOptions(list.map((c) => c.nome));
      })
      .catch(console.error);
  }, []);

  // Quando campanhaData chega: popula opções e restaura plataformas (modo edição)
  useEffect(() => {
    if (campanhaData.length === 0) return;
    dataLoaded.current = true;

    if (!campanha) { setVeiculoOptions([]); setPlataformasVeiculo([]); return; }
    const found = campanhaData.find((c) => c.nome === campanha);
    setVeiculoOptions(found?.veiculos?.length ? found.veiculos.map((v) => v.nome) : []);

    if (veiculo) {
      const veiculoData = found?.veiculos?.find((v) => v.nome === veiculo);
      setPlataformasVeiculo(veiculoData?.plataformas || []);
    }
  }, [campanhaData]);

  // Quando campanha muda
  useEffect(() => {
    if (!dataLoaded.current) return;
    // Ignorar se é o valor inicial carregando (modo edição)
    if (campanha === initialCampanha.current) { initialCampanha.current = ""; return; }

    if (!campanha) { setVeiculoOptions([]); setPlataformasVeiculo([]); setVeiculo(""); setPlataforma(""); return; }
    const found = campanhaData.find((c) => c.nome === campanha);
    setVeiculoOptions(found?.veiculos?.length ? found.veiculos.map((v) => v.nome) : []);
    setVeiculo("");
    setPlataforma("");
    setPlataformasVeiculo([]);
  }, [campanha]);

  // Quando veículo muda
  useEffect(() => {
    if (!dataLoaded.current) return;
    // Ignorar se é o valor inicial carregando (modo edição)
    if (veiculo === initialVeiculo.current) { initialVeiculo.current = ""; return; }

    if (!veiculo) { setPlataformasVeiculo([]); setPlataforma(""); return; }
    const found = campanhaData.find((c) => c.nome === campanha);
    const veiculoData = found?.veiculos?.find((v) => v.nome === veiculo);
    const pls = veiculoData?.plataformas || [];
    setPlataformasVeiculo(pls);
    // Manter plataforma inicial se ainda for válida
    if (initialPlataforma.current && pls.includes(initialPlataforma.current)) {
      initialPlataforma.current = "";
    } else {
      setPlataforma("");
      initialPlataforma.current = "";
    }
  }, [veiculo]);

  function handleFileChange(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : creative?.cloudinary_url || null);
  }


  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isEdit) {
        await updateMatrixCreative(creative.id, {
          nome, adName, campanha, campaignName, conjunto, descricao, observacoes,
          periodoInicio: periodoInicio || null, periodoFim: periodoFim || null,
          veiculo, plataforma: plataforma || null,
          formato: formato || null, posicionamento: posicionamento || null,
          urlDestino: urlDestino || null, impulsionado, segmentacao, titulo,
          tiposCompra: tipoCompra ? [tipoCompra] : [],
        });
      } else {
        if (!file && !creative?.cloudinary_url) { setError("Selecione um arquivo de imagem ou vídeo"); setSaving(false); return; }
        const fd = new FormData();
        if (file) fd.append("file", file);
        if (!file && creative?.cloudinary_url) {
          fd.append("cloudinaryUrl", creative.cloudinary_url);
          fd.append("cloudinaryPublicId", creative.cloudinary_public_id);
          fd.append("tipoMidia", creative.tipo_midia);
        }
        fd.append("nome", nome);
        fd.append("adName", adName);
        fd.append("campaignName", campaignName);
        fd.append("campanha", campanha);
        fd.append("veiculo", veiculo);
        fd.append("plataforma", plataforma);
        fd.append("conjunto", conjunto);
        fd.append("formato", formato);
        fd.append("posicionamento", posicionamento);
        fd.append("urlDestino", urlDestino);
        fd.append("impulsionado", String(impulsionado));
        fd.append("segmentacao", segmentacao);
        fd.append("titulo", titulo);
        fd.append("tiposCompra", JSON.stringify(tipoCompra ? [tipoCompra] : []));
        if (periodoInicio) fd.append("periodoInicio", periodoInicio);
        if (periodoFim) fd.append("periodoFim", periodoFim);
        fd.append("descricao", descricao);
        fd.append("observacoes", observacoes);
        await createMatrixCreative(fd);
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
      style={{ position: "fixed", inset: 0, background: "rgba(20,33,61,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}
    >
      <form
        onSubmit={handleSubmit}
        className="card"
        style={{ width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, position: "relative" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <strong style={{ fontSize: 15 }}>{title}</strong>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text-secondary)", lineHeight: 1 }}>×</button>
        </div>

        {/* Arquivo */}
        {!isEdit && (
          <Field label="Arquivo (imagem ou vídeo) *">
            <input type="file" accept="image/*,video/*" onChange={handleFileChange} style={{ width: "100%" }} />
            {preview && (
              <div style={{ marginTop: 8, borderRadius: 8, overflow: "hidden", maxHeight: 140, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--border)" }}>
                {file?.type?.startsWith("video") ? (
                  <video src={preview} style={{ maxHeight: 140, maxWidth: "100%" }} controls />
                ) : (
                  <img src={preview} alt="preview" style={{ maxHeight: 140, maxWidth: "100%", objectFit: "contain" }} />
                )}
              </div>
            )}
          </Field>
        )}

        {/* Campanha → carrega veículos */}
        <Field label="Campanha *">
          <SearchSelect
            value={campanha}
            onChange={(v) => { setCampanha(v || ""); setVeiculo(""); }}
            options={campanhaOptions}
            placeholder="Selecione a campanha..."
            allowFreeText
          />
        </Field>

        {/* Veículo — carregado a partir da campanha */}
        <Field label="Veículo *">
          <SearchSelect
            value={veiculo}
            onChange={(v) => setVeiculo(v || "")}
            options={veiculoOptions}
            placeholder={campanha ? "Selecione o veículo..." : "Selecione a campanha primeiro"}
            allowFreeText
          />
          {plataformasVeiculo.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Plataforma</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {plataformasVeiculo.map((p) => {
                  const sel = plataforma === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlataforma(sel ? "" : p)}
                      style={{
                        padding: "4px 12px",
                        borderRadius: 999,
                        border: "1px solid",
                        borderColor: sel ? "var(--accent)" : "var(--border)",
                        background: sel ? "var(--accent)" : "transparent",
                        color: sel ? "#fff" : "var(--text-secondary)",
                        fontSize: 12,
                        fontWeight: sel ? 700 : 400,
                        cursor: "pointer",
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Field>

        {/* Tipo de compra — seleção única */}
        <Field label="Tipo de compra">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
            {TIPOS_COMPRA_OPTIONS.map((t) => {
              const sel = tipoCompra === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipoCompra(sel ? "" : t)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 999,
                    border: "1px solid",
                    borderColor: sel ? "var(--accent)" : "var(--border)",
                    background: sel ? "var(--accent)" : "transparent",
                    color: sel ? "#fff" : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: sel ? 700 : 400,
                    cursor: "pointer",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Nome do criativo */}
        <Field label="Nome do criativo *">
          <input value={nome} onChange={(e) => setNome(e.target.value)} required style={inputStyle} />
        </Field>

        {/* Campaign Name (técnico) */}
        <Field label="Campaign Name">
          <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} style={inputStyle} placeholder="Ex: BR_CAMPANHA-INSTITUCIONAL-2026_CPM" />
        </Field>

        {/* Conjunto / Ad Group */}
        <Field label="Ad Group">
          <input value={conjunto} onChange={(e) => setConjunto(e.target.value)} style={inputStyle} />
        </Field>

        {/* Ad Name */}
        <Field label="Ad Name">
          <textarea
            value={adName}
            onChange={(e) => setAdName(e.target.value.replace(/\n/g, ""))}
            placeholder="Deve bater exatamente com o Ad Name da planilha"
            rows={2}
            style={{ ...textareaStyle, resize: "none" }}
          />
        </Field>

        {/* Formato */}
        <Field label="Formato">
          <SearchSelect
            value={formato}
            onChange={(v) => setFormato(v || "")}
            options={TODOS_FORMATOS}
            placeholder="Stories, Reels, Feed..."
            allowFreeText
          />
        </Field>

        {/* Período */}
        <Field label="Período de veiculação">
          <RangeCalendarPicker
            start={periodoInicio}
            end={periodoFim}
            onChange={(s, en) => { setPeriodoInicio(s); setPeriodoFim(en); }}
          />
        </Field>

        {/* URL destino */}
        <Field label="URL de destino">
          <input value={urlDestino} onChange={(e) => setUrlDestino(e.target.value)} type="url" placeholder="https://" style={inputStyle} />
        </Field>

        {/* Impulsionado / Darkpost */}
        <Field label="Tipo de publicação">
          <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
            {[{ label: "Impulsionado", val: true }, { label: "Dark Post", val: false }].map(({ label, val }) => (
              <label key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="impulsionado"
                  checked={impulsionado === val}
                  onChange={() => setImpulsionado(val)}
                />
                {label}
              </label>
            ))}
          </div>
        </Field>

        {/* Segmentação */}
        <Field label="Segmentação">
          <textarea value={segmentacao} onChange={(e) => setSegmentacao(e.target.value)} rows={2} style={textareaStyle} placeholder="Descreva o público-alvo..." />
        </Field>

        {/* Título */}
        <Field label="Título do criativo">
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} style={inputStyle} />
        </Field>

        {/* Descrição */}
        <Field label="Descricao">
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} style={textareaStyle} />
        </Field>

        {/* Observações */}
        <Field label="Observacoes">
          <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} style={textareaStyle} />
        </Field>

        {error && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p>}

        <button
          type="submit"
          disabled={saving}
          style={{ padding: "10px 0", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "Salvando..." : isEdit ? "Salvar alterações" : creative?._duplicate ? "Criar cópia" : "Criar criativo"}
        </button>
      </form>
    </div>
  );
}
