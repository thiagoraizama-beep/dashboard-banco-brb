import { useEffect, useState } from "react";
import { DateRangeProvider } from "./context/DateRangeContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { OfflineFiltersProvider } from "./context/OfflineFiltersContext.jsx";
import { CreativeAnalysisProvider } from "./context/CreativeAnalysisContext.jsx";
import Sidebar, {
  useSidebarCollapsed,
  SIDEBAR_WIDTH_EXPANDED,
  SIDEBAR_WIDTH_COLLAPSED,
  PAGES,
} from "./components/layout/Sidebar.jsx";
import { CREATIVE_VEHICLES } from "./components/layout/creativeVehicles.js";
import Header from "./components/layout/Header.jsx";
import OfflineHeader from "./components/layout/OfflineHeader.jsx";
import MediaOnlineDashboard from "./pages/MediaOnlineDashboard.jsx";
import OfflineMediaDashboard from "./pages/OfflineMediaDashboard.jsx";
import CreativeAnalysisPage from "./pages/CreativeAnalysisPage.jsx";
import PageLoader from "./components/common/PageLoader.jsx";
import Footer from "./components/layout/Footer.jsx";

const PAGE_LOAD_DELAY_MS = 600;

export default function App() {
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const [activePage, setActivePage] = useState(PAGES.DASHBOARD);
  const [pageLoading, setPageLoading] = useState(true);
  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  useEffect(() => {
    setPageLoading(true);
    const timer = setTimeout(() => setPageLoading(false), PAGE_LOAD_DELAY_MS);
    return () => clearTimeout(timer);
  }, [activePage]);

  return (
    <ThemeProvider>
      <DateRangeProvider>
        <OfflineFiltersProvider>
          <CreativeAnalysisProvider>
            {pageLoading && <PageLoader pageName={activePage} />}
            <Sidebar
              collapsed={collapsed}
              onToggle={toggleCollapsed}
              activePage={activePage}
              onNavigate={setActivePage}
            />
            <div
              className="app-shell"
              style={{ marginLeft: sidebarWidth, transition: "margin-left 0.2s ease" }}
            >
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
              {CREATIVE_VEHICLES.includes(activePage) && <CreativeAnalysisPage veiculo={activePage} />}
            </div>
            <div
              style={{
                marginLeft: sidebarWidth,
                transition: "margin-left 0.2s ease",
                padding: "0 24px 24px",
              }}
            >
              <Footer />
            </div>
          </CreativeAnalysisProvider>
        </OfflineFiltersProvider>
      </DateRangeProvider>
    </ThemeProvider>
  );
}
