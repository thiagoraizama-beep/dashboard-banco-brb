import { createContext, useContext, useState } from "react";

// Estado dos filtros da Home de Analise por Criativo (lista de campanhas), exposto
// aqui para que a TopNav possa renderizar os controles (busca/periodo/status) e o
// botao Comparativo quando essa pagina estiver ativa, sem prop-drilling atraves do
// AuthenticatedApp. A propria pagina consome os mesmos valores para filtrar a lista.
const CreativeHomeFiltersContext = createContext(null);

export function CreativeHomeFiltersProvider({ children }) {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todas");
  const [periodoInicio, setPeriodoInicio] = useState(null);
  const [periodoFim, setPeriodoFim] = useState(null);
  const [comparativoAberto, setComparativoAberto] = useState(false);
  const [campanhasParaBusca, setCampanhasParaBusca] = useState([]);

  return (
    <CreativeHomeFiltersContext.Provider
      value={{
        busca, setBusca,
        status, setStatus,
        periodoInicio, periodoFim, setPeriodo: (i, f) => { setPeriodoInicio(i); setPeriodoFim(f); },
        comparativoAberto, setComparativoAberto,
        campanhasParaBusca, setCampanhasParaBusca,
      }}
    >
      {children}
    </CreativeHomeFiltersContext.Provider>
  );
}

export function useCreativeHomeFilters() {
  return useContext(CreativeHomeFiltersContext);
}
