import { getRealizado } from "./sheetsClient.js";
import { isWithinRange, previousEquivalentRange, defaultCtrRange } from "../utils/dateRange.js";
import { getCampaignStatus } from "../utils/campaignStatus.js";
import { getVeiculosRealizadoEquivalentes } from "../utils/vehicleAliases.js";
import { getVeiculosRealizadoPorModelo } from "./dealsService.js";
import { matchesFilter, toFilterList } from "../utils/filterUtils.js";

function sumMetrics(rows) {
  return rows.reduce(
    (acc, r) => ({
      investimento: acc.investimento + r.investimento,
      impressoes: acc.impressoes + r.impressoes,
      cliques: acc.cliques + r.cliques,
      visualizacoes: acc.visualizacoes + r.visualizacoes,
    }),
    { investimento: 0, impressoes: 0, cliques: 0, visualizacoes: 0 }
  );
}

function ctr(totals) {
  return totals.impressoes > 0 ? (totals.cliques / totals.impressoes) * 100 : 0;
}

function vtr(totals) {
  return totals.impressoes > 0 ? (totals.visualizacoes / totals.impressoes) * 100 : 0;
}

function variacao(current, previous) {
  return previous > 0 ? Number((((current - previous) / previous) * 100).toFixed(1)) : 0;
}

function filterRows(rows, campanha, veiculo, veiculosPorModelo) {
  const veiculosSelecionados = toFilterList(veiculo);
  const veiculosEquivalentes = veiculosSelecionados
    ? veiculosSelecionados.flatMap((v) => getVeiculosRealizadoEquivalentes(v))
    : null;
  return rows.filter(
    (r) =>
      matchesFilter(r.campanha, campanha) &&
      (!veiculosEquivalentes || veiculosEquivalentes.includes(r.veiculo)) &&
      (!veiculosPorModelo || veiculosPorModelo.includes(r.veiculo))
  );
}

export async function getSummary(start, end, isFiltered, campanha, veiculo, modeloCompra) {
  const rows = await getRealizado();
  const veiculosPorModelo = await getVeiculosRealizadoPorModelo(modeloCompra);
  const porCampanha = filterRows(rows, campanha, veiculo, veiculosPorModelo);
  const inRange = porCampanha.filter((r) => isWithinRange(r.data, start, end));
  const totals = sumMetrics(inRange);

  const currentCtrRange = isFiltered ? { start, end } : defaultCtrRange();
  const previousCtrRange = previousEquivalentRange(currentCtrRange.start, currentCtrRange.end);

  const currentTotals = sumMetrics(
    porCampanha.filter((r) => isWithinRange(r.data, currentCtrRange.start, currentCtrRange.end))
  );
  const previousTotals = sumMetrics(
    porCampanha.filter((r) => isWithinRange(r.data, previousCtrRange.start, previousCtrRange.end))
  );

  const ctrVariacao = variacao(ctr(currentTotals), ctr(previousTotals));
  const vtrVariacao = variacao(vtr(currentTotals), vtr(previousTotals));
  const impressoesVariacao = variacao(currentTotals.impressoes, previousTotals.impressoes);

  return {
    ...totals,
    ctr: Number(ctr(totals).toFixed(2)),
    ctrVariacao,
    vtr: Number(vtr(totals).toFixed(2)),
    vtrVariacao,
    impressoesVariacao,
  };
}

export async function getCampaignStatuses() {
  const rows = await getRealizado();
  const byCampanha = new Map();

  for (const r of rows) {
    const current = byCampanha.get(r.campanha);
    if (!current || r.data > current) {
      byCampanha.set(r.campanha, r.data);
    }
  }

  return Array.from(byCampanha.entries()).map(([campanha, ultimaData]) => ({
    campanha,
    ultimaData,
    status: getCampaignStatus(ultimaData),
  }));
}

const METRICS = ["investimento", "impressoes", "cliques", "visualizacoes", "sessoes"];

export async function getPerformanceSeries(start, end, metrics, campanha, veiculo, modeloCompra) {
  const rows = await getRealizado();
  const veiculosPorModelo = await getVeiculosRealizadoPorModelo(modeloCompra);
  const porCampanha = filterRows(rows, campanha, veiculo, veiculosPorModelo);
  const inRange = porCampanha.filter((r) => isWithinRange(r.data, start, end));
  const selectedMetrics = metrics?.length ? metrics.filter((m) => METRICS.includes(m)) : METRICS;

  const byDate = new Map();
  for (const r of inRange) {
    if (!byDate.has(r.data)) {
      byDate.set(r.data, Object.fromEntries(selectedMetrics.map((m) => [m, 0])));
    }
    const entry = byDate.get(r.data);
    for (const m of selectedMetrics) {
      entry[m] += r[m];
    }
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([data, values]) => ({ data, ...values }));
}
