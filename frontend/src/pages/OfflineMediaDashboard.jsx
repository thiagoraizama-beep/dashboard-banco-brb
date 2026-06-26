import OfflineKpiRow from "../components/offline/OfflineKpiRow.jsx";
import CategoriesListCard from "../components/offline/CategoriesListCard.jsx";
import MediaChannelsCard from "../components/offline/MediaChannelsCard.jsx";
import ProgramacaoCalendar from "../components/offline/ProgramacaoCalendar.jsx";

export default function OfflineMediaDashboard() {
  return (
    <>
      <OfflineKpiRow />
      <div className="grid grid-bottom">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <CategoriesListCard />
          <ProgramacaoCalendar />
        </div>
        <MediaChannelsCard />
      </div>
    </>
  );
}
