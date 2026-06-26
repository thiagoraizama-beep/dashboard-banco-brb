import { useEffect, useState } from "react";
import MultiSelectDropdown from "./MultiSelectDropdown.jsx";
import NotificationBell from "./NotificationBell.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import { getOfflineFilterOptions } from "../../api/client.js";
import { useOfflineFilters } from "../../context/OfflineFiltersContext.jsx";

export default function OfflineHeader() {
  const { categoria, setCategoria, praca, setPraca, veiculo, setVeiculo, campanha, setCampanha } = useOfflineFilters();
  const [options, setOptions] = useState({ categorias: [], pracas: [], veiculos: [], campanhas: [] });

  useEffect(() => {
    getOfflineFilterOptions().then(setOptions).catch(console.error);
  }, []);

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 12,
        backgroundImage:
          "linear-gradient(rgba(47, 111, 235, 0.82), rgba(47, 111, 235, 0.82)), url(/PlenarioSenadoFederal.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: 16,
        padding: "12px 24px",
        boxShadow: "0 1px 3px rgba(20,33,61,0.06)",
        marginBottom: 20,
        position: "relative",
      }}
    >
      <MultiSelectDropdown multi variant="onImage" value={categoria} onChange={setCategoria} placeholder="Todas as categorias" options={options.categorias} />
      <MultiSelectDropdown multi variant="onImage" value={praca} onChange={setPraca} placeholder="Todas as praças" options={options.pracas} />
      <MultiSelectDropdown multi variant="onImage" value={veiculo} onChange={setVeiculo} placeholder="Todos os veículos" options={options.veiculos} />
      <MultiSelectDropdown multi variant="onImage" value={campanha} onChange={setCampanha} placeholder="Todas as campanhas" options={options.campanhas} />

      <ThemeToggle />
      <NotificationBell />
    </header>
  );
}
