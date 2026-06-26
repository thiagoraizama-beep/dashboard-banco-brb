import { getSiteMetrics } from "./sheetsClient.js";
import { isWithinRange } from "../utils/dateRange.js";
import { matchesFilter } from "../utils/filterUtils.js";

export async function getSiteSummary(start, end, campanha, veiculo) {
  const rows = await getSiteMetrics();
  const filtered = rows.filter((r) => matchesFilter(r.campanha, campanha) && matchesFilter(r.veiculo, veiculo));
  const inRange = filtered.filter((r) => isWithinRange(r.data, start, end));

  if (inRange.length === 0) {
    return { sessoes: 0, tempoMedioSegundos: 0, custoPorSessao: 0 };
  }

  const totals = inRange.reduce(
    (acc, r) => ({
      sessoes: acc.sessoes + r.sessoes,
      tempoMedioSegundos: acc.tempoMedioSegundos + r.tempoMedioSegundos,
      custoPorSessao: acc.custoPorSessao + r.custoPorSessao,
    }),
    { sessoes: 0, tempoMedioSegundos: 0, custoPorSessao: 0 }
  );

  return {
    sessoes: totals.sessoes,
    tempoMedioSegundos: Math.round(totals.tempoMedioSegundos / inRange.length),
    custoPorSessao: Number((totals.custoPorSessao / inRange.length).toFixed(2)),
  };
}
