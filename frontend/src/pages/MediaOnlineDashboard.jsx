import KpiRow from "../components/kpi/KpiRow.jsx";
import SiteSummaryCard from "../components/site/SiteSummaryCard.jsx";
import CampaignStatusCard from "../components/campaign/CampaignStatusCard.jsx";
import PerformanceChart from "../components/performance/PerformanceChart.jsx";
import DealsProgressCard from "../components/deals/DealsProgressCard.jsx";
import ActiveListingTable from "../components/vehicles/ActiveListingTable.jsx";

export default function MediaOnlineDashboard() {
  return (
    <>
      <div className="grid grid-kpis" style={{ marginTop: 20 }}>
        <KpiRow />
        <SiteSummaryCard />
      </div>

      <div className="grid grid-main">
        <PerformanceChart />
        <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
          <div style={{ flex: 1 }}>
            <CampaignStatusCard />
          </div>
          <DealsProgressCard />
        </div>
      </div>

      <div className="grid grid-main-full">
        <ActiveListingTable />
      </div>
    </>
  );
}
