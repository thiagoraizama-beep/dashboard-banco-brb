import { createContext, useContext, useMemo, useState } from "react";

const DateRangeContext = createContext(null);

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

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

  function applyRange(newRange) {
    setRange(newRange);
    setIsFiltered(true);
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
    }),
    [range, isFiltered, campanha, veiculo, modeloCompra]
  );

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange deve ser usado dentro de DateRangeProvider");
  return ctx;
}
