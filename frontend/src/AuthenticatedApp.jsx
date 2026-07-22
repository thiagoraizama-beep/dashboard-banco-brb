import { useEffect, useState } from "react";
import { DateRangeProvider } from "./context/DateRangeContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { OfflineFiltersProvider } from "./context/OfflineFiltersContext.jsx";
import { CreativeAnalysisProvider } from "./context/CreativeAnalysisContext.jsx";
import { CreativeHomeFiltersProvider, useCreativeHomeFilters } from "./context/CreativeHomeFiltersContext.jsx";
import { MatrixFiltersProvider } from "./context/MatrixFiltersContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import Sidebar, {
  useSidebarCollapsed,
  SIDEBAR_WIDTH_EXPANDED,
  SIDEBAR_WIDTH_COLLAPSED,
  PAGES,
} from "./components/layout/Sidebar.jsx";
import TopNav, { TOPNAV_HEIGHT } from "./components/layout/TopNav.jsx";

// Flag temporaria para testar o layout de navegacao superior (top nav) no lugar da
// sidebar lateral. Trocar para false reverte imediatamente para a sidebar original.
const USE_TOP_NAV = true;
import { getCampanhas } from "./api/client.js";
import { campanhasComAnalise } from "./utils/creativeAnalysisScope.js";
import Header from "./components/layout/Header.jsx";
import OfflineHeader from "./components/layout/OfflineHeader.jsx";
import MediaOnlineDashboard from "./pages/MediaOnlineDashboard.jsx";
import OfflineMediaDashboard from "./pages/OfflineMediaDashboard.jsx";
import CreativeAnalysisHomePage from "./pages/CreativeAnalysisHomePage.jsx";
import CreativeAnalysisPage from "./pages/CreativeAnalysisPage.jsx";
import ContentMatrixPage from "./pages/ContentMatrixPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import PageLoader from "./components/common/PageLoader.jsx";
import Footer from "./components/layout/Footer.jsx";
import MobileTopBar from "./components/layout/MobileTopBar.jsx";
import useIsMobile from "./hooks/useIsMobile.js";
import { MobileNavProvider } from "./context/MobileNavContext.jsx";

const PAGE_LOAD_DELAY_MS = 600;
const PAGES_WITH_OWN_TOPBAR = [PAGES.DASHBOARD, PAGES.MIDIA_OFFLINE, PAGES.MATRIZ_CONTEUDO];

export default function AuthenticatedApp() {
  const { user, refreshUser } = useAuth();
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const [activePage, setActivePage] = useState(PAGES.DASHBOARD);
  const [activeCreativeSelection, setActiveCreativeSelection] = useState(null);
  const [campanhas, setCampanhas] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isMobile = useIsMobile();
  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;
  const openMobileMenu = () => setMobileNavOpen(true);

  // Agencia/cliente nao tem escopos restritos -- a lista de campanhas p/ o submenu
  // de Analise por Criativo vem direto do backend (sem filtro de escopo aplicavel).
  function loadCampanhas() {
    if (user?.papel !== "veiculo" && user?.papel !== "parceiro") {
      getCampanhas().then(setCampanhas).catch(console.error);
    }
  }

  useEffect(() => {
    loadCampanhas();
  }, [user?.papel]);

  // Pontos sensiveis a escopo/permissao desatualizada: a agencia pode ter mudado o
  // vinculo do usuario (campanha, plataformas, acessoAnaliseCriativo/acessoMatriz)
  // enquanto ele ja estava logado, ou editado status/dados da campanha em Perfil --
  // recarrega antes de entrar nessas paginas para nao mostrar dado desatualizado.
  function handleNavigate(page) {
    setActivePage(page);
    setActiveCreativeSelection(null);
    if (page === PAGES.MATRIZ_CONTEUDO || page === PAGES.ANALISE_CRIATIVO) {
      refreshUser().catch(() => {});
      loadCampanhas();
    }
  }

  function handleSelectPlataforma(campanhaId, campanhaNome, veiculo) {
    setActiveCreativeSelection({ campanhaId, campanhaNome, veiculo });
  }

  useEffect(() => {
    setPageLoading(true);
    const timer = setTimeout(() => setPageLoading(false), PAGE_LOAD_DELAY_MS);
    return () => clearTimeout(timer);
  }, [activePage, activeCreativeSelection]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [activePage, activeCreativeSelection]);

  return (
    <ThemeProvider>
      <DateRangeProvider>
        <OfflineFiltersProvider>
          <CreativeAnalysisProvider>
            <CreativeHomeFiltersProvider>
            <MatrixFiltersProvider>
              <MobileNavProvider openMobileMenu={openMobileMenu}>
                <AppShell
                  user={user}
                  collapsed={collapsed}
                  toggleCollapsed={toggleCollapsed}
                  activePage={activePage}
                  handleNavigate={handleNavigate}
                  campanhas={campanhas}
                  mobileNavOpen={mobileNavOpen}
                  setMobileNavOpen={setMobileNavOpen}
                  isMobile={isMobile}
                  sidebarWidth={sidebarWidth}
                  pageLoading={pageLoading}
                  activeCreativeSelection={activeCreativeSelection}
                  setActiveCreativeSelection={setActiveCreativeSelection}
                  handleSelectPlataforma={handleSelectPlataforma}
                  openMobileMenu={openMobileMenu}
                />
              </MobileNavProvider>
            </MatrixFiltersProvider>
            </CreativeHomeFiltersProvider>
          </CreativeAnalysisProvider>
        </OfflineFiltersProvider>
      </DateRangeProvider>
    </ThemeProvider>
  );
}

function AppShell({
  user, collapsed, toggleCollapsed, activePage, handleNavigate, campanhas,
  mobileNavOpen, setMobileNavOpen, isMobile, sidebarWidth, pageLoading,
  activeCreativeSelection, setActiveCreativeSelection, handleSelectPlataforma, openMobileMenu,
}) {
  const { comparativoAberto } = useCreativeHomeFilters();
  const showCreativeHomeFilters =
    USE_TOP_NAV && !isMobile && activePage === PAGES.ANALISE_CRIATIVO && !activeCreativeSelection && !comparativoAberto;
  const showMatrixFilters = USE_TOP_NAV && !isMobile && activePage === PAGES.MATRIZ_CONTEUDO;
  const topOffset = !isMobile && USE_TOP_NAV ? TOPNAV_HEIGHT : 0;

  return (
    <>
      {pageLoading && <PageLoader pageName={activePage} />}
      {USE_TOP_NAV && !isMobile && (
        <TopNav
          activePage={activePage}
          onNavigate={handleNavigate}
          campanhas={campanhas}
          user={user}
          showCreativeHomeFilters={showCreativeHomeFilters}
          showMatrixFilters={showMatrixFilters}
        />
      )}
      {(!USE_TOP_NAV || isMobile) && (
        <Sidebar
          collapsed={collapsed}
          onToggle={toggleCollapsed}
          activePage={activePage}
          onNavigate={handleNavigate}
          campanhas={campanhas}
          user={user}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />
      )}
      <div
        style={{
          marginLeft: isMobile || USE_TOP_NAV ? 0 : sidebarWidth,
          marginTop: topOffset,
          transition: "margin-left 0.2s ease",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {isMobile &&
          !PAGES_WITH_OWN_TOPBAR.includes(activePage) &&
          activePage !== PAGES.ANALISE_CRIATIVO && <MobileTopBar onOpenMenu={openMobileMenu} />}
        <div className="app-shell" style={{ flex: 1, paddingTop: isMobile ? 56 : undefined }}>
          {activePage === PAGES.DASHBOARD && (
            <>
              <Header />
              <MediaOnlineDashboard />
            </>
          )}
          {activePage === PAGES.MIDIA_OFFLINE && (
            <>
              <OfflineHeader />
              <OfflineMediaDashboard />
            </>
          )}
          {activePage === PAGES.ANALISE_CRIATIVO && (
            activeCreativeSelection ? (
              <CreativeAnalysisPage
                campanhaId={activeCreativeSelection.campanhaId}
                campanhaNome={activeCreativeSelection.campanhaNome}
                veiculo={activeCreativeSelection.veiculo}
                onVoltar={() => setActiveCreativeSelection(null)}
              />
            ) : (
              <CreativeAnalysisHomePage
                campanhas={campanhasComAnalise(user, campanhas)}
                onSelectPlataforma={handleSelectPlataforma}
              />
            )
          )}
          {activePage === PAGES.MATRIZ_CONTEUDO && <ContentMatrixPage />}
          {activePage === PAGES.PERFIL && <ProfilePage />}
        </div>
        <div style={{ padding: "0 24px 24px" }}>
          <Footer />
        </div>
      </div>
    </>
  );
}
