import { createContext, useContext, useMemo, useState } from "react";

const OfflineFiltersContext = createContext(null);

export function OfflineFiltersProvider({ children }) {
  const [categoria, setCategoria] = useState([]);
  const [praca, setPraca] = useState([]);
  const [veiculo, setVeiculo] = useState([]);
  const [campanha, setCampanha] = useState([]);
  const [refreshToken, setRefreshToken] = useState(0);

  function triggerRefresh() {
    setRefreshToken((t) => t + 1);
  }

  function toggleCategoria(nome) {
    setCategoria((current) =>
      current.includes(nome) ? current.filter((c) => c !== nome) : [...current, nome]
    );
  }

  function clearAll() {
    setCategoria([]);
    setPraca([]);
    setVeiculo([]);
    setCampanha([]);
  }

  const value = useMemo(
    () => ({
      categoria,
      setCategoria,
      toggleCategoria,
      praca,
      setPraca,
      veiculo,
      setVeiculo,
      campanha,
      setCampanha,
      clearAll,
      refreshToken,
      triggerRefresh,
    }),
    [categoria, praca, veiculo, campanha, refreshToken]
  );

  return <OfflineFiltersContext.Provider value={value}>{children}</OfflineFiltersContext.Provider>;
}

export function useOfflineFilters() {
  const ctx = useContext(OfflineFiltersContext);
  if (!ctx) throw new Error("useOfflineFilters deve ser usado dentro de OfflineFiltersProvider");
  return ctx;
}
