import { createContext, useContext, useMemo, useState } from "react";
import { CREATIVE_VEHICLES } from "../components/layout/creativeVehicles.js";

const CreativeAnalysisContext = createContext(null);

function emptyFilters() {
  return { start: null, end: null, campanha: [], tipoCompra: [], posicionamento: [], plataforma: [] };
}

export function CreativeAnalysisProvider({ children }) {
  const [filtersByVehicle, setFiltersByVehicle] = useState(() =>
    Object.fromEntries(CREATIVE_VEHICLES.map((v) => [v, emptyFilters()]))
  );

  function setFilter(veiculo, key, value) {
    setFiltersByVehicle((prev) => ({
      ...prev,
      [veiculo]: { ...prev[veiculo], [key]: value },
    }));
  }

  function setRange(veiculo, start, end) {
    setFiltersByVehicle((prev) => ({
      ...prev,
      [veiculo]: { ...prev[veiculo], start, end },
    }));
  }

  const value = useMemo(() => ({ filtersByVehicle, setFilter, setRange }), [filtersByVehicle]);

  return <CreativeAnalysisContext.Provider value={value}>{children}</CreativeAnalysisContext.Provider>;
}

export function useCreativeFilters(veiculo) {
  const ctx = useContext(CreativeAnalysisContext);
  if (!ctx) throw new Error("useCreativeFilters deve ser usado dentro de CreativeAnalysisProvider");

  const filters = ctx.filtersByVehicle[veiculo] || emptyFilters();
  return {
    filters,
    setFilter: (key, value) => ctx.setFilter(veiculo, key, value),
    setRange: (start, end) => ctx.setRange(veiculo, start, end),
  };
}
