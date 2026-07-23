import { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
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

// Slugs de URL (ASCII, sem acento) para cada pagina de nivel superior -- a label em
// PAGES continua sendo a fonte usada para exibicao/comparacao no TopNav/Sidebar,
// so a URL passa a ser a fonte de verdade de "em qual pagina o usuario esta".
const PAGE_PATHS = {
  [PAGES.DASHBOARD]: "/dashboard",
  [PAGES.MIDIA_OFFLINE]: "/midia-offline",
  [PAGES.ANALISE_CRIATIVO]: "/analise-por-criativo",
  [PAGES.MATRIZ_CONTEUDO]: "/matriz-de-conteudo",
  [PAGES.PERFIL]: "/perfil",
};

function pageFromPath(pathname) {
  if (pathname.startsWith("/midia-offline")) return PAGES.MIDIA_OFFLINE;
  if (pathname.startsWith("/analise-por-criativo")) return PAGES.ANALISE_CRIATIVO;
  if (pathname.startsWith("/matriz-de-conteudo")) return PAGES.MATRIZ_CONTEUDO;
  if (pathname.startsWith("/perfil")) return PAGES.PERFIL;
  return PAGES.DASHBOARD;
}

export default function AuthenticatedApp() {
  const { user, refreshUser } = useAuth();
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = useMemo(() => pageFromPath(location.pathname), [location.pathname]);
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
  // recarrega ao entrar nessas paginas para nao mostrar dado desatualizado. Chaveado
  // em "activePage" (nao em location.pathname bruto) para nao redisparar ao trocar de
  // plataforma dentro de Analise por Criativo, so ao entrar/sair da secao.
  useEffect(() => {
    if (activePage === PAGES.MATRIZ_CONTEUDO || activePage === PAGES.ANALISE_CRIATIVO) {
      refreshUser().catch(() => {});
      loadCampanhas();
    }
  }, [activePage]);

  function handleNavigate(page) {
    navigate(PAGE_PATHS[page]);
  }

  function handleSelectPlataforma(campanhaId, campanhaNome, veiculo) {
    navigate(`/analise-por-criativo/${campanhaId}/${encodeURIComponent(veiculo)}`);
  }

  useEffect(() => {
    setPageLoading(true);
    const timer = setTimeout(() => setPageLoading(false), PAGE_LOAD_DELAY_MS);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

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

// Le campanhaId/veiculo da URL e resolve campanhaNome a partir da lista ja carregada
// (nao ha necessidade de nova chamada -- campanhaNome e so um label de exibicao).
// Se o id nao bater com nenhuma campanha visivel (link velho/invalido), volta pra lista.
function CreativeAnalysisDrillIn({ campanhas }) {
  const { campanhaId, veiculo } = useParams();
  const navigate = useNavigate();
  const campanha = campanhas.find((c) => String(c.campanhaId) === campanhaId);

  if (!campanha) return <Navigate to="/analise-por-criativo" replace />;

  return (
    <CreativeAnalysisPage
      campanhaId={campanhaId}
      campanhaNome={campanha.campanhaNome}
      veiculo={decodeURIComponent(veiculo)}
      onVoltar={() => navigate("/analise-por-criativo")}
    />
  );
}

function AppShell({
  user, collapsed, toggleCollapsed, activePage, handleNavigate, campanhas,
  mobileNavOpen, setMobileNavOpen, isMobile, sidebarWidth, pageLoading,
  handleSelectPlataforma, openMobileMenu,
}) {
  const { comparativoAberto } = useCreativeHomeFilters();
  const location = useLocation();
  // Dentro de Analise por Criativo, existe drill-in numa plataforma quando a URL tem
  // /analise-por-criativo/:campanhaId/:veiculo (nao so /analise-por-criativo).
  const emDrillIn = activePage === PAGES.ANALISE_CRIATIVO && location.pathname !== "/analise-por-criativo";
  const showCreativeHomeFilters =
    USE_TOP_NAV && !isMobile && activePage === PAGES.ANALISE_CRIATIVO && !emDrillIn && !comparativoAberto;
  const campanhasParaAnalise = useMemo(() => campanhasComAnalise(user, campanhas), [user, campanhas]);
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
          (activePage !== PAGES.ANALISE_CRIATIVO || !emDrillIn) && <MobileTopBar onOpenMenu={openMobileMenu} />}
        <div className="app-shell" style={{ flex: 1, paddingTop: isMobile ? 56 : undefined }}>
          <Routes>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="dashboard"
              element={
                <>
                  <Header />
                  <MediaOnlineDashboard />
                </>
              }
            />
            <Route
              path="midia-offline"
              element={
                <>
                  <OfflineHeader />
                  <OfflineMediaDashboard />
                </>
              }
            />
            <Route
              path="analise-por-criativo"
              element={<CreativeAnalysisHomePage campanhas={campanhasParaAnalise} onSelectPlataforma={handleSelectPlataforma} />}
            />
            <Route
              path="analise-por-criativo/:campanhaId/:veiculo"
              element={<CreativeAnalysisDrillIn campanhas={campanhasParaAnalise} />}
            />
            <Route path="matriz-de-conteudo" element={<ContentMatrixPage />} />
            <Route path="perfil" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
        <div style={{ padding: "0 24px 24px" }}>
          <Footer />
        </div>
      </div>
    </>
  );
}
