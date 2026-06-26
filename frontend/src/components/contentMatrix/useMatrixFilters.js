import { useMemo, useState } from "react";

// Deriva as opcoes de filtro (status, veiculo, campanha) a partir dos proprios
// criativos cadastrados -- nao existe lista fixa, as opcoes so aparecem
// depois que algum criativo com aquele valor for cadastrado.
export function useMatrixFilters(creatives) {
  const [status, setStatus] = useState([]);
  const [veiculo, setVeiculo] = useState([]);
  const [campanha, setCampanha] = useState([]);

  const options = useMemo(() => {
    const list = creatives || [];
    return {
      statuses: [...new Set(list.map((c) => c.status))].filter(Boolean).sort(),
      veiculos: [...new Set(list.map((c) => c.veiculo))].filter(Boolean).sort(),
      campanhas: [...new Set(list.map((c) => c.campanha))].filter(Boolean).sort(),
    };
  }, [creatives]);

  const filtered = useMemo(() => {
    const list = creatives || [];
    return list.filter(
      (c) =>
        (status.length === 0 || status.includes(c.status)) &&
        (veiculo.length === 0 || veiculo.includes(c.veiculo)) &&
        (campanha.length === 0 || campanha.includes(c.campanha))
    );
  }, [creatives, status, veiculo, campanha]);

  return {
    filtered,
    options,
    filters: { status, veiculo, campanha },
    setStatus,
    setVeiculo,
    setCampanha,
  };
}
