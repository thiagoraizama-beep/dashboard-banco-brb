import { getSiteMetricsFromGA4 } from "./ga4Service.js";
import { getRealizado } from "./sheetsClient.js";
import { realizado as mockRealizado } from "./mockData.js";
import { isWithinRange } from "../utils/dateRange.js";
import { matchesFilter, toFilterList } from "../utils/filterUtils.js";
import { getVeiculosRealizadoEquivalentes } from "../utils/vehicleAliases.js";

// Usado apenas quando GA4_PROPERTY_ID nao esta configurado (ex: ambiente local sem GA4 ainda).
function getSiteMetricsFromMock(start, end, campanha, veiculo) {
  const inRange = mockRealizado.filter(
    (r) => matchesFilter(r.campanha, campanha) && matchesFilter(r.veiculo, veiculo) && isWithinRange(r.data, start, end)
  );
  if (inRange.length === 0) return { sessoes: 0, tempoMedioSegundos: 0 };

  const totals = inRange.reduce(
    (acc, r) => ({ sessoes: acc.sessoes + r.sessoes, tempoMedioSegundos: acc.tempoMedioSegundos + r.tempoMedioSegundos }),
    { sessoes: 0, tempoMedioSegundos: 0 }
  );
  return { sessoes: totals.sessoes, tempoMedioSegundos: Math.round(totals.tempoMedioSegundos / inRange.length) };
}

export async function getSiteSummary(start, end, campanha, veiculo) {
  const ga4 = await getSiteMetricsFromGA4(start, end, veiculo, campanha);
  const { sessoes, tempoMedioSegundos } = ga4 ?? getSiteMetricsFromMock(start, end, campanha, veiculo);

  const veiculosSelecionados = toFilterList(veiculo);
  const veiculosEquivalentes = veiculosSelecionados
    ? veiculosSelecionados.flatMap((v) => getVeiculosRealizadoEquivalentes(v))
    : null;

  const rows = await getRealizado();
  const investimento = rows
    .filter(
      (r) =>
        matchesFilter(r.campanha, campanha) &&
        (!veiculosEquivalentes || veiculosEquivalentes.includes(r.veiculo)) &&
        isWithinRange(r.data, start, end)
    )
    .reduce((acc, r) => acc + r.investimento, 0);

  const custoPorSessao = sessoes > 0 ? Number((investimento / sessoes).toFixed(2)) : 0;

  return { sessoes, tempoMedioSegundos, custoPorSessao };
}
