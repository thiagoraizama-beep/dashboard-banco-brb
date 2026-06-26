import { useAuth } from "../context/AuthContext.jsx";
import AgencyMatrixView from "../components/contentMatrix/AgencyView/AgencyMatrixView.jsx";
import VehicleMatrixView from "../components/contentMatrix/VehicleView/VehicleMatrixView.jsx";
import ClientMatrixView from "../components/contentMatrix/ClientView/ClientMatrixView.jsx";

export default function ContentMatrixPage() {
  const { user } = useAuth();

  if (user.papel === "agencia") return <AgencyMatrixView />;
  if (user.papel === "veiculo") return <VehicleMatrixView />;
  return <ClientMatrixView />;
}
