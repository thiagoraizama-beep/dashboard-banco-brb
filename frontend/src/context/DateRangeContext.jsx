import { createContext, useContext, useMemo, useState } from "react";
import { toISODate } from "../utils/date.js";

const DateRangeContext = createContext(null);

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return { start: toISODate(start), end: toISODate(end) };
}

export function DateRangeProvider({ children }) {
  const [range, setRange] = useState(defaultRange);
  const [isFiltered, setIsFiltered] = useState(false);
  const [campanha, setCampanhaState] = useState([]);
  const [veiculo, setVeiculo] = useState([]);
  const [modeloCompra, setModeloCompra] = useState([]);
  const [refreshToken, setRefreshToken] = useState(0);

  function triggerRefresh() {
    setRefreshToken((t) => t + 1);
  }

  function applyRange(newRange) {
    setRange(newRange);
    setIsFiltered(true);
  }

  function clearFilters() {
    setRange(defaultRange());
    setIsFiltered(false);
    setCampanhaState([]);
    setVeiculo([]);
    setModeloCompra([]);
  }

  function toggleCampanha(nome) {
    setCampanhaState((current) =>
      current.includes(nome) ? current.filter((c) => c !== nome) : [...current, nome]
    );
  }

  const value = useMemo(
    () => ({
      range,
      setRange: applyRange,
      isFiltered,
      campanha,
      toggleCampanha,
      veiculo,
      setVeiculo,
      modeloCompra,
      setModeloCompra,
      clearFilters,
      refreshToken,
      triggerRefresh,
    }),
    [range, isFiltered, campanha, veiculo, modeloCompra, refreshToken]
  );

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange deve ser usado dentro de DateRangeProvider");
  return ctx;
}
