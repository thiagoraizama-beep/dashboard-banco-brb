import { useEffect, useState } from "react";
import MultiSelectDropdown from "./MultiSelectDropdown.jsx";
import NotificationBell from "./NotificationBell.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import MobileFilterModal from "./MobileFilterModal.jsx";
import MobileTopBar from "./MobileTopBar.jsx";
import FilterCalendar from "../calendar/FilterCalendar.jsx";
import DateRangeFields from "./DateRangeFields.jsx";
import { getVehicles } from "../../api/client.js";
import { useDateRange } from "../../context/DateRangeContext.jsx";
import { useMobileNav } from "../../context/MobileNavContext.jsx";
import useIsMobile from "../../hooks/useIsMobile.js";

const MODELOS_COMPRA = ["CPM", "CPC", "CPV"];

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

export default function Header() {
  const { range, setRange, isFiltered, campanha, veiculo, setVeiculo, modeloCompra, setModeloCompra, clearFilters, triggerRefresh } =
    useDateRange();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const isMobile = useIsMobile();
  const { openMobileMenu } = useMobileNav();

  function loadVehicles() {
    return getVehicles(range, isFiltered, campanha)
      .then((vehicles) => setVehicleOptions(vehicles.map((v) => v.veiculo)))
      .catch(console.error);
  }

  useEffect(() => {
    loadVehicles();
  }, [range, isFiltered, JSON.stringify(campanha)]);

  function handleRefresh() {
    setRefreshing(true);
    triggerRefresh();
    loadVehicles().finally(() => setRefreshing(false));
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
              <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Veículos</label>
              <MultiSelectDropdown
                multi
                value={veiculo}
                onChange={setVeiculo}
                placeholder="Todos os veículos"
                options={vehicleOptions}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Modelo de compra</label>
              <MultiSelectDropdown
                multi
                value={modeloCompra}
                onChange={setModeloCompra}
                placeholder="Todos os modelos"
                options={MODELOS_COMPRA}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Período</label>
              <FilterCalendar hideApplyButton bare />
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
            <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Veículos</label>
            <MultiSelectDropdown
              multi
              value={veiculo}
              onChange={setVeiculo}
              placeholder="Todos os veículos"
              options={vehicleOptions}
            />
          </div>

          <div style={{ minWidth: 180 }}>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Modelo de compra</label>
            <MultiSelectDropdown
              multi
              value={modeloCompra}
              onChange={setModeloCompra}
              placeholder="Todos os modelos"
              options={MODELOS_COMPRA}
            />
          </div>

          <div style={{ minWidth: 260 }}>
            <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Período</label>
            <DateRangeFields
              start={range.start}
              end={range.end}
              isFiltered={isFiltered}
              campanha={campanha}
              veiculo={veiculo}
              modeloCompra={modeloCompra}
              onChange={(start, end) => setRange({ start, end })}
            />
          </div>

          <button
            onClick={clearFilters}
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
