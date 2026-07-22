import { createContext, useContext, useMemo, useState } from "react";

const CreativeAnalysisContext = createContext(null);

function emptyFilters() {
  return { start: null, end: null, tipoCompra: [], posicionamento: [], plataforma: [] };
}

function keyFor(campanhaId, veiculo) {
  return `${campanhaId}:${veiculo}`;
}

export function CreativeAnalysisProvider({ children }) {
  const [filtersByCampanhaVeiculo, setFiltersByCampanhaVeiculo] = useState({});

  function setFilter(campanhaId, veiculo, key, value) {
    const k = keyFor(campanhaId, veiculo);
    setFiltersByCampanhaVeiculo((prev) => ({
      ...prev,
      [k]: { ...(prev[k] || emptyFilters()), [key]: value },
    }));
  }

  function setRange(campanhaId, veiculo, start, end) {
    const k = keyFor(campanhaId, veiculo);
    setFiltersByCampanhaVeiculo((prev) => ({
      ...prev,
      [k]: { ...(prev[k] || emptyFilters()), start, end },
    }));
  }

  function clearFilters(campanhaId, veiculo) {
    setFiltersByCampanhaVeiculo((prev) => ({
      ...prev,
      [keyFor(campanhaId, veiculo)]: emptyFilters(),
    }));
  }

  const value = useMemo(
    () => ({ filtersByCampanhaVeiculo, setFilter, setRange, clearFilters }),
    [filtersByCampanhaVeiculo]
  );

  return <CreativeAnalysisContext.Provider value={value}>{children}</CreativeAnalysisContext.Provider>;
}

export function useCreativeFilters(campanhaId, veiculo) {
  const ctx = useContext(CreativeAnalysisContext);
  if (!ctx) throw new Error("useCreativeFilters deve ser usado dentro de CreativeAnalysisProvider");

  const filters = ctx.filtersByCampanhaVeiculo[keyFor(campanhaId, veiculo)] || emptyFilters();
  return {
    filters,
    setFilter: (key, value) => ctx.setFilter(campanhaId, veiculo, key, value),
    setRange: (start, end) => ctx.setRange(campanhaId, veiculo, start, end),
    clearFilters: () => ctx.clearFilters(campanhaId, veiculo),
  };
}
