import { useEffect, useMemo, useState } from "react";
import { periodoIntersecta, STATUS_LABEL, STATUS_BADGE_CLASS, STATUS_OPTIONS } from "../utils/campanhaStatus.js";
import { useCreativeHomeFilters } from "../context/CreativeHomeFiltersContext.jsx";
import CampaignComparisonSetupPage from "./CampaignComparisonSetupPage.jsx";
import MobileTopBar from "../components/layout/MobileTopBar.jsx";
import MobileFilterModal from "../components/layout/MobileFilterModal.jsx";
import SimpleDateRangeFields from "../components/layout/SimpleDateRangeFields.jsx";
import MultiSelectDropdown from "../components/layout/MultiSelectDropdown.jsx";
import ThemeToggle from "../components/layout/ThemeToggle.jsx";
import NotificationBell from "../components/layout/NotificationBell.jsx";
import { useMobileNav } from "../context/MobileNavContext.jsx";
import useIsMobile from "../hooks/useIsMobile.js";

const HOME_STATUS_FILTERS = [{ key: "todas", label: "Todas" }, ...STATUS_OPTIONS.map((key) => ({ key, label: STATUS_LABEL[key] }))];

function ArrowIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5h16l-6 8v6l-4-2v-4z" />
    </svg>
  );
}

function CompareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 3v18M15 3v18M4 8h5M4 16h5M15 8h5M15 16h5" />
    </svg>
  );
}

function CreativeAnalysisMobileHeader({ homeFilters }) {
  const { openMobileMenu } = useMobileNav();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendInicio, setPendInicio] = useState(homeFilters.periodoInicio);
  const [pendFim, setPendFim] = useState(homeFilters.periodoFim);
  const [pendStatus, setPendStatus] = useState(homeFilters.status);
  const filtroAtivo = homeFilters.status !== "todas" || (homeFilters.periodoInicio && homeFilters.periodoFim);

  function abrirFiltros() {
    setPendInicio(homeFilters.periodoInicio);
    setPendFim(homeFilters.periodoFim);
    setPendStatus(homeFilters.status);
    setFiltersOpen(true);
  }

  function aplicarFiltros() {
    homeFilters.setPeriodo(pendInicio, pendFim);
    homeFilters.setStatus(pendStatus);
    setFiltersOpen(false);
  }

  function limparFiltros() {
    homeFilters.setPeriodo(null, null);
    homeFilters.setStatus("todas");
    setFiltersOpen(false);
  }

  return (
    <MobileTopBar onOpenMenu={openMobileMenu}>
      <button
        onClick={abrirFiltros}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 12px",
          borderRadius: 999,
          border: `1px solid ${filtroAtivo ? "var(--accent)" : "var(--border)"}`,
          background: "transparent",
          color: filtroAtivo ? "var(--accent)" : "var(--text-primary)",
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        <FilterIcon />
        Filtro
      </button>
      <button
        onClick={() => homeFilters.setComparativoAberto(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 12px",
          borderRadius: 999,
          border: "none",
          background: "var(--accent)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <CompareIcon />
        Comparativo
      </button>
      <NotificationBell variant="plain" />
      <ThemeToggle variant="plain" />

      {filtersOpen && (
        <MobileFilterModal title="Filtros" onClose={() => setFiltersOpen(false)}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Buscar campanha</label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 999,
                padding: "8px 14px",
              }}
            >
              <span style={{ color: "var(--text-secondary)", display: "flex" }}>
                <SearchIcon />
              </span>
              <input
                value={homeFilters.busca}
                onChange={(e) => homeFilters.setBusca(e.target.value)}
                placeholder="Buscar campanha..."
                style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "var(--text-primary)", width: "100%" }}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Período</label>
            <SimpleDateRangeFields
              start={pendInicio}
              end={pendFim}
              onChange={(inicio, fim) => { setPendInicio(inicio); setPendFim(fim); }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Status</label>
            <MultiSelectDropdown
              value={HOME_STATUS_FILTERS.find((f) => f.key === pendStatus)?.label || "Todas"}
              onChange={(label) => setPendStatus(HOME_STATUS_FILTERS.find((f) => f.label === label)?.key || "todas")}
              options={HOME_STATUS_FILTERS.map((f) => f.label)}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={limparFiltros}
              style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Limpar filtro
            </button>
            <button
              onClick={aplicarFiltros}
              style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Aplicar
            </button>
          </div>
        </MobileFilterModal>
      )}
    </MobileTopBar>
  );
}

export default function CreativeAnalysisHomePage({ campanhas, onSelectPlataforma }) {
  const homeFilters = useCreativeHomeFilters();
  const { busca, status, periodoInicio, periodoFim, comparativoAberto, setComparativoAberto, setCampanhasParaBusca } = homeFilters;
  const isMobile = useIsMobile();

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
      {isMobile && <CreativeAnalysisMobileHeader homeFilters={homeFilters} />}
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
