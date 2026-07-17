import { useEffect, useState } from "react";
import MultiSelectDropdown from "./MultiSelectDropdown.jsx";
import NotificationBell from "./NotificationBell.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import MobileFilterModal from "./MobileFilterModal.jsx";
import MobileTopBar from "./MobileTopBar.jsx";
import { getOfflineFilterOptions } from "../../api/client.js";
import { useOfflineFilters } from "../../context/OfflineFiltersContext.jsx";
import { useMobileNav } from "../../context/MobileNavContext.jsx";
import useIsMobile from "../../hooks/useIsMobile.js";

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5h16l-6 8v6l-4-2v-4z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export default function OfflineHeader() {
  const { categoria, setCategoria, praca, setPraca, veiculo, setVeiculo, campanha, setCampanha, clearAll, triggerRefresh } =
    useOfflineFilters();
  const [options, setOptions] = useState({ categorias: [], pracas: [], veiculos: [], campanhas: [] });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isMobile = useIsMobile();
  const { openMobileMenu } = useMobileNav();

  function loadOptions() {
    return getOfflineFilterOptions().then(setOptions).catch(console.error);
  }

  useEffect(() => {
    loadOptions();
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    triggerRefresh();
    loadOptions().finally(() => setRefreshing(false));
  }

  if (isMobile) {
    return (
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
        <NotificationBell variant="plain" />

        {mobileFiltersOpen && (
          <MobileFilterModal title="Filtros" onClose={() => setMobileFiltersOpen(false)}>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Categoria</label>
              <MultiSelectDropdown
                multi
                value={categoria}
                onChange={setCategoria}
                placeholder="Todas as categorias"
                options={options.categorias}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Praça</label>
              <MultiSelectDropdown
                multi
                value={praca}
                onChange={setPraca}
                placeholder="Todas as praças"
                options={options.pracas}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Veículo</label>
              <MultiSelectDropdown
                multi
                value={veiculo}
                onChange={setVeiculo}
                placeholder="Todos os veículos"
                options={options.veiculos}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Campanha</label>
              <MultiSelectDropdown
                multi
                value={campanha}
                onChange={setCampanha}
                placeholder="Todas as campanhas"
                options={options.campanhas}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Fechar
              </button>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                style={{
                  flex: 1,
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
            </div>
          </MobileFilterModal>
        )}
      </MobileTopBar>
    );
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          backgroundImage:
            "linear-gradient(rgba(47, 111, 235, 0.82), rgba(47, 111, 235, 0.82)), url(/PlenarioSenadoFederal.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: 16,
          padding: "16px 24px",
          boxShadow: "0 1px 3px rgba(20,33,61,0.06)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>Mídia Offline</h1>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeToggle />
          <NotificationBell />
        </div>
      </header>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 36,
            padding: "0 16px",
            borderRadius: 999,
            border: "1px solid var(--border)",
            background: filtersOpen ? "var(--accent-soft)" : "var(--card-bg)",
            color: "var(--text-primary)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <FilterIcon />
          Filtros
        </button>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="Atualizar dados"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 36,
            padding: "0 16px",
            borderRadius: 999,
            border: "1px solid var(--border)",
            background: "var(--card-bg)",
            color: "var(--text-primary)",
            fontSize: 13,
            fontWeight: 600,
            cursor: refreshing ? "default" : "pointer",
            opacity: refreshing ? 0.6 : 1,
          }}
        >
          <RefreshIcon />
          {refreshing ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {filtersOpen && (
        <div
          className="card"
          style={{
            marginTop: 8,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            gap: 16,
            position: "relative",
          }}
        >
          <button
            onClick={() => setFiltersOpen(false)}
            aria-label="Fechar filtros"
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 26,
              height: 26,
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            <CloseIcon />
          </button>

          <div style={{ minWidth: 200 }}>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Categoria</label>
            <MultiSelectDropdown
              multi
              value={categoria}
              onChange={setCategoria}
              placeholder="Todas as categorias"
              options={options.categorias}
            />
          </div>

          <div style={{ minWidth: 180 }}>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Praça</label>
            <MultiSelectDropdown
              multi
              value={praca}
              onChange={setPraca}
              placeholder="Todas as praças"
              options={options.pracas}
            />
          </div>

          <div style={{ minWidth: 180 }}>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Veículo</label>
            <MultiSelectDropdown
              multi
              value={veiculo}
              onChange={setVeiculo}
              placeholder="Todos os veículos"
              options={options.veiculos}
            />
          </div>

          <div style={{ minWidth: 180 }}>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Campanha</label>
            <MultiSelectDropdown
              multi
              value={campanha}
              onChange={setCampanha}
              placeholder="Todas as campanhas"
              options={options.campanhas}
            />
          </div>

          <button
            onClick={clearAll}
            style={{
              padding: "9px 4px",
              border: "none",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: 12,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
