import { useEffect, useState } from "react";
import {
  DashboardIcon,
  BroadcastIcon,
  CreativeIcon,
  TransactionIcon,
  LogoutIcon,
  ChevronIcon,
} from "./navIcons.jsx";
import { CREATIVE_VEHICLES } from "./creativeVehicles.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Avatar from "../common/Avatar.jsx";

export const PAGES = {
  DASHBOARD: "Dashboard",
  MIDIA_OFFLINE: "Mídia Offline",
  MATRIZ_CONTEUDO: "Matriz de Conteúdo",
  PERFIL: "Perfil",
};

export const CREATIVE_ANALYSIS_LABEL = "Análise por Criativo";

const NAV_ITEMS = [
  { label: PAGES.DASHBOARD, icon: DashboardIcon },
  { label: PAGES.MIDIA_OFFLINE, icon: BroadcastIcon },
];

const STORAGE_KEY = "sidebar-collapsed";

export const SIDEBAR_WIDTH_EXPANDED = 260;
export const SIDEBAR_WIDTH_COLLAPSED = 72;

export default function Sidebar({ collapsed, onToggle, activePage, onNavigate, user }) {
  const { logout } = useAuth();
  const [creativeMenuOpen, setCreativeMenuOpen] = useState(false);
  const creativeActive = CREATIVE_VEHICLES.includes(activePage);
  const matrixActive = activePage === PAGES.MATRIZ_CONTEUDO;
  const matrixLabel = user?.papel === "cliente" ? "Relatório de Criativos" : PAGES.MATRIZ_CONTEUDO;

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
        background: "var(--card-bg)",
        boxShadow: "1px 0 3px rgba(20,33,61,0.06)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        zIndex: 10,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          padding: "24px 16px 20px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <img
          src={collapsed ? "/logotipo sem letras.png" : "/cor-solida-horizontal-1.png"}
          alt="Senado Federal"
          style={{
            height: collapsed ? 26 : 52,
            maxWidth: "100%",
            objectFit: "contain",
            borderRadius: collapsed ? 6 : 0,
          }}
        />
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 4, padding: "20px 12px 12px", flex: 1, overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.label === activePage;
          return (
            <div
              key={item.label}
              title={collapsed ? item.label : undefined}
              onClick={() => onNavigate(item.label)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                cursor: "pointer",
                color: active ? "var(--accent)" : "var(--text-secondary)",
                background: active ? "var(--accent-soft)" : "transparent",
                fontWeight: active ? 600 : 400,
                whiteSpace: "nowrap",
              }}
            >
              <Icon />
              {!collapsed && <span>{item.label}</span>}
            </div>
          );
        })}

        <div
          title={collapsed ? CREATIVE_ANALYSIS_LABEL : undefined}
          onClick={() => setCreativeMenuOpen((o) => !o)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 12px",
            borderRadius: 10,
            cursor: "pointer",
            color: creativeActive ? "var(--accent)" : "var(--text-secondary)",
            background: creativeActive ? "var(--accent-soft)" : "transparent",
            fontWeight: creativeActive ? 600 : 400,
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CreativeIcon />
            {!collapsed && <span>{CREATIVE_ANALYSIS_LABEL}</span>}
          </div>
          {!collapsed && (
            <span style={{ transform: creativeMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
              <ChevronIcon collapsed={false} style={{ transform: "rotate(-90deg)" }} />
            </span>
          )}
        </div>

        {!collapsed && creativeMenuOpen && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingLeft: 32 }}>
            {CREATIVE_VEHICLES.map((veiculo) => {
              const active = veiculo === activePage;
              return (
                <div
                  key={veiculo}
                  onClick={() => onNavigate(veiculo)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                    background: active ? "var(--accent-soft)" : "transparent",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {veiculo}
                </div>
              );
            })}
          </div>
        )}

        <div
          title={collapsed ? matrixLabel : undefined}
          onClick={() => onNavigate(PAGES.MATRIZ_CONTEUDO)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 12px",
            borderRadius: 10,
            cursor: "pointer",
            color: matrixActive ? "var(--accent)" : "var(--text-secondary)",
            background: matrixActive ? "var(--accent-soft)" : "transparent",
            fontWeight: matrixActive ? 600 : 400,
            whiteSpace: "nowrap",
          }}
        >
          <TransactionIcon />
          {!collapsed && <span>{matrixLabel}</span>}
        </div>
      </nav>

      {user && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            gap: 8,
            padding: "12px 16px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            onClick={() => onNavigate(PAGES.PERFIL)}
            title={collapsed ? "Perfil" : undefined}
            style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden", cursor: "pointer" }}
          >
            <Avatar nome={user.nome} fotoUrl={user.fotoUrl} size={36} />
            {!collapsed && (
              <div style={{ overflow: "hidden" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.nome}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)", textTransform: "capitalize" }}>
                  {user.papel}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            title="Sair"
            aria-label="Sair"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--danger)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <LogoutIcon />
          </button>
        </div>
      )}

      <button
        onClick={onToggle}
        aria-label={collapsed ? "Expandir menu" : "Encolher menu"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          margin: 12,
          padding: "10px",
          borderRadius: 10,
          border: "1px solid var(--border)",
          background: "transparent",
          color: "var(--text-secondary)",
          cursor: "pointer",
        }}
      >
        <ChevronIcon collapsed={collapsed} />
      </button>
    </aside>
  );
}

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  return [collapsed, () => setCollapsed((c) => !c)];
}
