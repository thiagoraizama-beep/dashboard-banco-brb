import CreativeHeader from "../components/creative/CreativeHeader.jsx";
import CreativeKpiRow from "../components/creative/CreativeKpiRow.jsx";
import CreativesTable from "../components/creative/CreativesTable.jsx";
import ThemeToggle from "../components/layout/ThemeToggle.jsx";

export default function CreativeAnalysisPage({ veiculo }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Criativos {veiculo}</h2>
        <ThemeToggle variant="plain" />
      </div>
      <CreativeHeader veiculo={veiculo} />
      <CreativeKpiRow veiculo={veiculo} />
      <CreativesTable veiculo={veiculo} />
    </div>
  );
}
