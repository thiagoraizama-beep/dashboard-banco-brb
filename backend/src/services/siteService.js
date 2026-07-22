import { getSiteMetricsFromGA4 } from "./ga4Service.js";
import { resolveGa4PropertyId } from "./campanhasService.js";
import { getRealizado } from "./sheetsClient.js";
import { isWithinRange } from "../utils/dateRange.js";
import { matchesFilter, toFilterList } from "../utils/filterUtils.js";
import { getVeiculosRealizadoEquivalentes } from "../utils/vehicleAliases.js";

// Sem property GA4 vinculada a campanha filtrada (ver Perfil > Integracoes GA4), o card
// de Sessoes mostra "Sem dados" em vez de numeros mockados/zerados -- so ha dado real de
// GA4 se alguem de fato conectou a integracao para aquela campanha especifica.
export async function getSiteSummary(start, end, campanha, veiculo) {
  const propertyId = await resolveGa4PropertyId(campanha);
  if (!propertyId) {
    return { sessoes: 0, tempoMedioSegundos: 0, custoPorSessao: 0, semDados: true };
  }

  const ga4 = await getSiteMetricsFromGA4(start, end, veiculo, campanha, propertyId);
  const { sessoes, tempoMedioSegundos } = ga4;

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

  return { sessoes, tempoMedioSegundos, custoPorSessao, semDados: false };
}
