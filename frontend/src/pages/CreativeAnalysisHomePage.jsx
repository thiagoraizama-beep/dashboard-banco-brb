import { useEffect, useMemo } from "react";
import { periodoIntersecta, STATUS_LABEL, STATUS_BADGE_CLASS } from "../utils/campanhaStatus.js";
import { useCreativeHomeFilters } from "../context/CreativeHomeFiltersContext.jsx";
import CampaignComparisonSetupPage from "./CampaignComparisonSetupPage.jsx";

function ArrowIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function CreativeAnalysisHomePage({ campanhas, onSelectPlataforma }) {
  const { busca, status, periodoInicio, periodoFim, comparativoAberto, setComparativoAberto, setCampanhasParaBusca } =
    useCreativeHomeFilters();

  useEffect(() => {
    setCampanhasParaBusca(campanhas);
    return () => setCampanhasParaBusca([]);
  }, [campanhas]);

  const campanhasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return campanhas.filter((c) => {
      const bateStatus = status === "todas" || c.status === status;
      const bateBusca = !termo || c.campanhaNome.toLowerCase().includes(termo);
      const batePeriodo = periodoIntersecta(c.dataInicio, c.dataFim, periodoInicio, periodoFim);
      return bateStatus && bateBusca && batePeriodo;
    });
  }, [campanhas, busca, status, periodoInicio, periodoFim]);

  if (comparativoAberto) {
    return <CampaignComparisonSetupPage campanhas={campanhas} onVoltar={() => setComparativoAberto(false)} />;
  }

  return (
    <div style={{ paddingTop: 20 }}>
      {campanhasFiltradas.length === 0 ? (
        <div className="card">
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
            {campanhas.length === 0
              ? "Nenhuma campanha com acesso à Análise por Criativo ainda."
              : "Nenhuma campanha encontrada."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {campanhasFiltradas.map((c) => (
            <CampanhaCard key={c.campanhaId} campanha={c} onSelectPlataforma={onSelectPlataforma} />
          ))}
        </div>
      )}
    </div>
  );
}

function CampanhaCard({ campanha, onSelectPlataforma }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <strong style={{ fontSize: 13, lineHeight: 1.35 }}>{campanha.campanhaNome}</strong>
        {campanha.status && (
          <span className={`badge ${STATUS_BADGE_CLASS[campanha.status] || "badge-ativo"}`} style={{ flexShrink: 0 }}>
            {STATUS_LABEL[campanha.status] || campanha.status}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {campanha.plataformas.map((veiculo) => (
          <button
            key={veiculo}
            onClick={() => onSelectPlataforma(campanha.campanhaId, campanha.campanhaNome, veiculo)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px 5px 12px",
              borderRadius: 999,
              border: "1px solid var(--accent)",
              background: "transparent",
              color: "var(--accent)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.12s ease, color 0.12s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--accent)";
            }}
          >
            {veiculo}
            <ArrowIcon />
          </button>
        ))}
      </div>
    </div>
  );
}
