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
import useIsMobile from "../../hooks/useIsMobile.js";

export const PAGES = {
  DASHBOARD: "Dashboard",
  MIDIA_OFFLINE: "Mídia Offline",
  MATRIZ_CONTEUDO: "Matriz de Conteúdo",
  PERFIL: "Perfil",
};

export const CREATIVE_ANALYSIS_LABEL = "Análise por Criativo";

const ALL_NAV_ITEMS = [
  { label: PAGES.DASHBOARD, icon: DashboardIcon, tipo: "online", always: true },
  { label: PAGES.MIDIA_OFFLINE, icon: BroadcastIcon, tipo: "offline", always: false },
];

// Veiculos (plataformas) que o usuario tem permissao de ver no submenu de
// Analise por Criativo, com base nos escopos de campanha vinculados a ele.
// - Agencia/cliente (papel != veiculo/parceiro): veem todos
// - Veiculo/parceiro sem escopos: veem nenhum ([] = sem acesso)
// - Veiculo/parceiro com escopos: filtrado pelas plataformas vinculadas
function veiculosPermitidos(user) {
  if (user?.papel !== "veiculo" && user?.papel !== "parceiro") return CREATIVE_VEHICLES;
  if (!user?.escopos?.length) return [];
  const permitidos = new Set(user.escopos.flatMap((e) => e.plataformas || []));
  return CREATIVE_VEHICLES.filter((v) => permitidos.has(v));
}

const STORAGE_KEY = "sidebar-collapsed";

export const SIDEBAR_WIDTH_EXPANDED = 260;
export const SIDEBAR_WIDTH_COLLAPSED = 72;

export default function Sidebar({ collapsed: collapsedProp, onToggle, activePage, onNavigate, user, mobileOpen, onCloseMobile }) {
  const { logout } = useAuth();
  const [creativeMenuOpen, setCreativeMenuOpen] = useState(false);
  const creativeActive = CREATIVE_VEHICLES.includes(activePage);
  const matrixActive = activePage === PAGES.MATRIZ_CONTEUDO;
  const matrixLabel = user?.papel === "cliente" ? "Relatório de Criativos" : PAGES.MATRIZ_CONTEUDO;
  const isMobile = useIsMobile();
  const tiposMidia = user?.tiposMidia || ["online", "offline"];
  // Dashboard sempre aparece; Offline só aparece se o usuario tiver tipo offline
  const navItems = ALL_NAV_ITEMS.filter((item) => item.always || tiposMidia.includes(item.tipo));
  const veiculosVisiveis = veiculosPermitidos(user);
  // No mobile a sidebar sempre se comporta como expandida (largura total em drawer),
  // independente do estado de colapso salvo do desktop.
  const collapsed = isMobile ? false : collapsedProp;
  // No modo colapsado nao ha submenu visivel, entao o pai sempre reflete o estado
  // ativo; expandido, o destaque "desce" para o veiculo selecionado quando o
  // submenu esta aberto.
  const parentHighlighted = creativeActive && (collapsed || !creativeMenuOpen);

  function handleNavigate(page) {
    onNavigate(page);
    if (isMobile) onCloseMobile?.();
  }

  return (
    <>
      {isMobile && mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10,14,25,0.5)",
            zIndex: 19,
          }}
        />
      )}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: isMobile ? SIDEBAR_WIDTH_EXPANDED : collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
          background: "var(--card-bg)",
          boxShadow: "1px 0 3px rgba(20,33,61,0.06)",
          display: "flex",
          flexDirection: "column",
          transition: isMobile ? "transform 0.2s ease" : "width 0.2s ease",
          transform: isMobile && !mobileOpen ? "translateX(-100%)" : "translateX(0)",
          zIndex: 20,
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
        {isMobile && (
          <button
            onClick={onCloseMobile}
            aria-label="Fechar menu"
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            ×
          </button>
        )}
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 4, padding: "20px 12px 12px", flex: 1, overflowY: "auto" }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.label === activePage;
          return (
            <div
              key={item.label}
              title={collapsed ? item.label : undefined}
              onClick={() => handleNavigate(item.label)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
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

        {veiculosVisiveis.length > 0 && (
        <div
          title={collapsed ? CREATIVE_ANALYSIS_LABEL : undefined}
          onClick={() => setCreativeMenuOpen((o) => !o)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            gap: 12,
            padding: "10px 12px",
            borderRadius: 10,
            cursor: "pointer",
            color: parentHighlighted ? "var(--accent)" : "var(--text-secondary)",
            background: parentHighlighted ? "var(--accent-soft)" : "transparent",
            fontWeight: parentHighlighted ? 600 : 400,
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CreativeIcon />
            {!collapsed && <span>{CREATIVE_ANALYSIS_LABEL}</span>}
          </div>
          {!collapsed && (
            <span style={{ display: "flex", alignItems: "center", transform: creativeMenuOpen ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform 0.15s" }}>
              <ChevronIcon collapsed={false} />
            </span>
          )}
        </div>
        )}

        {veiculosVisiveis.length > 0 && !collapsed && creativeMenuOpen && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingLeft: 32 }}>
            {veiculosVisiveis.map((veiculo) => {
              const active = veiculo === activePage;
              return (
                <div
                  key={veiculo}
                  onClick={() => handleNavigate(veiculo)}
                  style={{
                    padding: "8px 12px",
                    borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                    cursor: "pointer",
                    fontSize: 13,
                    color: active ? "var(--accent)" : "var(--text-secondary)",
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
          onClick={() => handleNavigate(PAGES.MATRIZ_CONTEUDO)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
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

        <div
          title={collapsed ? "Configurações" : undefined}
          onClick={() => handleNavigate(PAGES.PERFIL)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 12,
            padding: "10px 12px",
            borderRadius: 10,
            cursor: "pointer",
            color: activePage === PAGES.PERFIL ? "var(--accent)" : "var(--text-secondary)",
            background: activePage === PAGES.PERFIL ? "var(--accent-soft)" : "transparent",
            fontWeight: activePage === PAGES.PERFIL ? 600 : 400,
            whiteSpace: "nowrap",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          {!collapsed && <span>Configurações</span>}
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
            onClick={() => handleNavigate(PAGES.PERFIL)}
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

      {!isMobile && (
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
      )}
      </aside>
    </>
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
