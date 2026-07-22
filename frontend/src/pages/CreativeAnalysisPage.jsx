import { useState } from "react";
import CreativeHeader from "../components/creative/CreativeHeader.jsx";
import CreativeFilterFields from "../components/creative/CreativeFilterFields.jsx";
import CreativeKpiRow from "../components/creative/CreativeKpiRow.jsx";
import CreativesTable from "../components/creative/CreativesTable.jsx";
import ThemeToggle from "../components/layout/ThemeToggle.jsx";
import MobileTopBar from "../components/layout/MobileTopBar.jsx";
import MobileFilterModal from "../components/layout/MobileFilterModal.jsx";
import { useMobileNav } from "../context/MobileNavContext.jsx";
import useIsMobile from "../hooks/useIsMobile.js";

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5h16l-6 8v6l-4-2v-4z" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export default function CreativeAnalysisPage({ campanhaId, campanhaNome, veiculo, onVoltar }) {
  const isMobile = useIsMobile();
  const { openMobileMenu } = useMobileNav();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  if (isMobile) {
    return (
      <div>
        <MobileTopBar onOpenMenu={openMobileMenu}>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-primary)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <FilterIcon />
            Filtros
          </button>
          <ThemeToggle variant="plain" />

          {mobileFiltersOpen && (
            <MobileFilterModal title="Filtros" onClose={() => setMobileFiltersOpen(false)}>
              <CreativeFilterFields campanhaId={campanhaId} veiculo={veiculo} />
              <button
                onClick={() => setMobileFiltersOpen(false)}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Aplicar
              </button>
            </MobileFilterModal>
          )}
        </MobileTopBar>

        <button
          onClick={onVoltar}
          style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, padding: 0, border: "none", background: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          <BackIcon /> Análise por Criativo
        </button>
        <h2 style={{ margin: "8px 0 16px", fontSize: 18 }}>{campanhaNome} — Criativos {veiculo}</h2>
        <CreativeKpiRow campanhaId={campanhaId} veiculo={veiculo} />
        <CreativesTable campanhaId={campanhaId} veiculo={veiculo} />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onVoltar}
        style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, padding: 0, border: "none", background: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
      >
        <BackIcon /> Análise por Criativo
      </button>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{campanhaNome} — Criativos {veiculo}</h2>
        <ThemeToggle variant="plain" />
      </div>
      <CreativeHeader campanhaId={campanhaId} veiculo={veiculo} />
      <CreativeKpiRow campanhaId={campanhaId} veiculo={veiculo} />
      <CreativesTable campanhaId={campanhaId} veiculo={veiculo} />
    </div>
  );
}
