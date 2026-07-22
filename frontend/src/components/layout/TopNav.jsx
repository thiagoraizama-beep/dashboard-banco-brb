import { useState } from "react";
import { LogoutIcon } from "./navIcons.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import NotificationBell from "./NotificationBell.jsx";
import Avatar from "../common/Avatar.jsx";
import useIsMobile from "../../hooks/useIsMobile.js";
import { campanhasComAnalise } from "../../utils/creativeAnalysisScope.js";
import { PAGES, CREATIVE_ANALYSIS_LABEL } from "./Sidebar.jsx";
import { useCreativeHomeFilters } from "../../context/CreativeHomeFiltersContext.jsx";
import { useMatrixFiltersContext } from "../../context/MatrixFiltersContext.jsx";
import { STATUS_OPTIONS, STATUS_LABEL } from "../../utils/campanhaStatus.js";
import SimpleDateRangeFields from "./SimpleDateRangeFields.jsx";
import MultiSelectDropdown from "./MultiSelectDropdown.jsx";
import { papelLabel } from "../../utils/papelLabel.js";

const TOPNAV_LOGOS = {
  light: "/BSLI3.SA_BIG.png",
  dark: "/BSLI3.SA_BIG.D.png",
};

export const TOPNAV_HEIGHT = 64;

const HOME_STATUS_FILTERS = [{ key: "todas", label: "Todas" }, ...STATUS_OPTIONS.map((key) => ({ key, label: STATUS_LABEL[key] }))];

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
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

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5h16l-6 8v6l-4-2v-4z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const ALL_NAV_ITEMS = [
  { label: PAGES.DASHBOARD, tipo: "online", always: true },
  { label: PAGES.MIDIA_OFFLINE, tipo: "offline", always: false },
];

export default function TopNav({ activePage, onNavigate, campanhas, user, showCreativeHomeFilters, showMatrixFilters }) {
  const { logout } = useAuth();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const homeFilters = useCreativeHomeFilters();
  const matrixFilters = useMatrixFiltersContext();
  const tiposMidia = user?.tiposMidia || ["online", "offline"];
  const navItems = ALL_NAV_ITEMS.filter((item) => item.always || tiposMidia.includes(item.tipo));
  const campanhasVisiveis = campanhasComAnalise(user, campanhas);
  const matrixLabel = user?.papel === "cliente" ? "Relatório de Criativos" : PAGES.MATRIZ_CONTEUDO;

  const items = [
    ...navItems.map((item) => ({ label: item.label })),
    ...(campanhasVisiveis.length > 0 ? [{ label: PAGES.ANALISE_CRIATIVO, displayLabel: CREATIVE_ANALYSIS_LABEL }] : []),
    { label: PAGES.MATRIZ_CONTEUDO, displayLabel: matrixLabel },
  ];

  function handleNavigate(page) {
    onNavigate(page);
    setMenuOpen(false);
  }

  if (isMobile) {
    // No mobile mantem o padrao existente (MobileTopBar) -- TopNav e so a variante desktop.
    return null;
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 20 }}>
    <header
      style={{
        height: TOPNAV_HEIGHT,
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "0 24px",
        background: "var(--card-bg)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <img
        src={TOPNAV_LOGOS[theme]}
        alt="Banco BRB"
        style={{ height: 28, objectFit: "contain", flexShrink: 0 }}
      />

      <nav style={{ display: "flex", alignItems: "stretch", gap: 28, height: "100%", flexShrink: 0 }}>
        {items.map((item) => {
          const active = item.label === activePage;
          return (
            <button
              key={item.label}
              onClick={() => handleNavigate(item.label)}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                height: "100%",
                padding: "0",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
                fontWeight: active ? 700 : 500,
                fontSize: 15,
                whiteSpace: "nowrap",
              }}
            >
              {item.displayLabel || item.label}
              {active && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 2,
                    background: "var(--accent)",
                    borderRadius: 2,
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {showCreativeHomeFilters && homeFilters && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 1 640px", minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 999,
              padding: "8px 14px",
              flex: 1,
              minWidth: 0,
            }}
          >
            <span style={{ color: "var(--text-secondary)", display: "flex" }}>
              <SearchIcon />
            </span>
            <input
              value={homeFilters.busca}
              onChange={(e) => homeFilters.setBusca(e.target.value)}
              placeholder="Buscar campanha..."
              list="topnav-campanhas-autocomplete"
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, color: "var(--text-primary)", width: "100%" }}
            />
            <datalist id="topnav-campanhas-autocomplete">
              {homeFilters.campanhasParaBusca.map((c) => (
                <option key={c.campanhaId} value={c.campanhaNome} />
              ))}
            </datalist>
          </div>

          <CreativeHomeFilterPopover
            open={filterOpen}
            setOpen={setFilterOpen}
            periodoInicio={homeFilters.periodoInicio}
            periodoFim={homeFilters.periodoFim}
            status={homeFilters.status}
            onApply={(periodo, status) => {
              homeFilters.setPeriodo(periodo.inicio, periodo.fim);
              homeFilters.setStatus(status);
            }}
          />

          <button
            onClick={() => homeFilters.setComparativoAberto(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 999,
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <CompareIcon />
            Comparativo
          </button>
        </div>
      )}

      {showMatrixFilters && matrixFilters && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 1 640px", minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 999,
              padding: "8px 14px",
              flex: 1,
              minWidth: 0,
            }}
          >
            <span style={{ color: "var(--text-secondary)", display: "flex" }}>
              <SearchIcon />
            </span>
            <input
              value={matrixFilters.busca}
              onChange={(e) => matrixFilters.setBusca(e.target.value)}
              placeholder="Buscar criativo ou campanha..."
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, color: "var(--text-primary)", width: "100%" }}
            />
          </div>

          <div style={{ position: "relative" }}>
            {(() => {
              const matrixFilterAtivo =
                matrixFilters.status.length > 0 ||
                matrixFilters.veiculo.length > 0 ||
                matrixFilters.campanha.length > 0 ||
                matrixFilters.plataforma.length > 0;
              return (
                <button
                  onClick={() => setFilterOpen((o) => !o)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 12px",
                    borderRadius: 999,
                    border: `1px solid ${filterOpen || matrixFilterAtivo ? "var(--accent)" : "var(--border)"}`,
                    background: filterOpen ? "var(--accent-soft)" : "transparent",
                    color: filterOpen || matrixFilterAtivo ? "var(--accent)" : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  <FilterIcon />
                  Filtro
                </button>
              );
            })()}

            {filterOpen && (
              <>
                <div onClick={() => setFilterOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 24 }} />
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    minWidth: 260,
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(20,33,61,0.15)",
                    padding: 14,
                    zIndex: 25,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Campanha</label>
                    <MultiSelectDropdown multi value={matrixFilters.campanha} onChange={matrixFilters.setCampanha} options={matrixFilters.matrixOptions.campanhas} placeholder="Todas as campanhas" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Veículo</label>
                    <MultiSelectDropdown multi value={matrixFilters.veiculo} onChange={matrixFilters.setVeiculo} options={matrixFilters.matrixOptions.veiculos} placeholder="Todos os veículos" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Plataforma</label>
                    <MultiSelectDropdown multi value={matrixFilters.plataforma} onChange={matrixFilters.setPlataforma} options={matrixFilters.matrixOptions.plataformas} placeholder="Todas as plataformas" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Status</label>
                    <MultiSelectDropdown multi value={matrixFilters.status} onChange={matrixFilters.setStatus} options={matrixFilters.matrixOptions.statuses} placeholder="Todos os status" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginLeft: 16 }}>
        <NotificationBell variant="plain" />

        <div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 6px" }} />

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "4px 10px 4px 4px",
              borderRadius: 999,
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <Avatar nome={user?.nome} fotoUrl={user?.fotoUrl} size={36} />
            {user && (
              <div style={{ textAlign: "left" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.nome}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.3, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {papelLabel(user)}
                </p>
              </div>
            )}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-secondary)"
              strokeWidth="2"
              style={{ transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease", flexShrink: 0 }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 24 }} />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  minWidth: 180,
                  background: "var(--card-bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(20,33,61,0.15)",
                  padding: 8,
                  zIndex: 25,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 10px 10px" }}>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Tema</span>
                  <ThemeToggle variant="plain" />
                </div>
                <button
                  onClick={() => handleNavigate(PAGES.PERFIL)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: activePage === PAGES.PERFIL ? "var(--accent-soft)" : "transparent",
                    color: activePage === PAGES.PERFIL ? "var(--accent)" : "var(--text-primary)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <SettingsIcon />
                  Configurações
                </button>
                <button
                  onClick={logout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    color: "var(--danger)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <LogoutIcon />
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
    </div>
  );
}

// Popover de Periodo + Status para a Home de Analise por Criativo. Mantem um estado
// "pendente" local que so e aplicado (repassado ao contexto compartilhado) quando o
// usuario clica em "Aplicar filtro" -- evita refiltrar a lista a cada clique no
// calendario/status.
function CreativeHomeFilterPopover({ open, setOpen, periodoInicio, periodoFim, status, onApply }) {
  const [pendInicio, setPendInicio] = useState(periodoInicio);
  const [pendFim, setPendFim] = useState(periodoFim);
  const [pendStatus, setPendStatus] = useState(status);

  function handleToggle() {
    if (!open) {
      setPendInicio(periodoInicio);
      setPendFim(periodoFim);
      setPendStatus(status);
    }
    setOpen((o) => !o);
  }

  function handleApply() {
    onApply({ inicio: pendInicio, fim: pendFim }, pendStatus);
    setOpen(false);
  }

  function handleClear() {
    setPendInicio(null);
    setPendFim(null);
    setPendStatus("todas");
    onApply({ inicio: null, fim: null }, "todas");
    setOpen(false);
  }

  const ativo = status !== "todas" || (periodoInicio && periodoFim);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={handleToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 12px",
          borderRadius: 999,
          border: `1px solid ${open || ativo ? "var(--accent)" : "var(--border)"}`,
          background: open ? "var(--accent-soft)" : "transparent",
          color: open || ativo ? "var(--accent)" : "var(--text-secondary)",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <FilterIcon />
        Filtro
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 24 }} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              minWidth: 320,
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(20,33,61,0.15)",
              padding: 14,
              zIndex: 25,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div>
              <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Período</label>
              <SimpleDateRangeFields
                start={pendInicio}
                end={pendFim}
                onChange={(inicio, fim) => { setPendInicio(inicio); setPendFim(fim); }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Status</label>
              <MultiSelectDropdown
                value={HOME_STATUS_FILTERS.find((f) => f.key === pendStatus)?.label || "Todas"}
                onChange={(label) => setPendStatus(HOME_STATUS_FILTERS.find((f) => f.label === label)?.key || "todas")}
                options={HOME_STATUS_FILTERS.map((f) => f.label)}
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button
                onClick={handleClear}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Limpar filtro
              </button>
              <button
                onClick={handleApply}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Aplicar filtro
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
