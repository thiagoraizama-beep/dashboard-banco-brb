import { getRealizado, getPeriodosVeiculacao } from "./sheetsClient.js";
import { realizado as mockRealizado } from "./mockData.js";
import { getDailySessionsFromGA4 } from "./ga4Service.js";
import { isWithinRange, previousEquivalentRange, defaultCtrRange } from "../utils/dateRange.js";
import { getCampaignStatus, getCampaignStatusFromPeriodos } from "../utils/campaignStatus.js";
import { getVeiculosRealizadoEquivalentes } from "../utils/vehicleAliases.js";
import { getVeiculosRealizadoPorModelo } from "./dealsService.js";
import { matchesFilter, toFilterList } from "../utils/filterUtils.js";

// Agrupa os períodos por campanha para consulta rápida.
function agruparPeriodosPorCampanha(periodos) {
  const map = new Map();
  for (const p of periodos) {
    if (!map.has(p.campanha)) map.set(p.campanha, []);
    map.get(p.campanha).push(p);
  }
  return map;
}

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

// Retorna null quando nao ha dado no periodo anterior para comparar (sem base
// de comparacao), em vez de mascarar como "0%" que pareceria uma variacao real.
function variacao(current, previous) {
  return previous > 0 ? Number((((current - previous) / previous) * 100).toFixed(1)) : null;
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

// Quando nenhum filtro de periodo e aplicado pelo usuario, usa o periodo real
// dos dados filtrados (do dia mais antigo ao mais recente) em vez do range
// padrao de 30 dias que o frontend sempre envia — senao campanhas mais antigas
// aparecem cortadas nos KPIs e no grafico principal.
function fullDataRange(rows, fallbackStart, fallbackEnd) {
  if (rows.length === 0) return { start: fallbackStart, end: fallbackEnd };
  let min = rows[0].data;
  let max = rows[0].data;
  for (const r of rows) {
    if (r.data < min) min = r.data;
    if (r.data > max) max = r.data;
  }
  return { start: min, end: max };
}

// Usado pelo frontend para desabilitar dias sem dados no calendario de filtro.
// Respeita os filtros de campanha/veiculo/modelo ja ativos, para que o range
// disponivel reflita a campanha selecionada quando houver uma.
export async function getAvailableDateRange(campanha, veiculo, modeloCompra) {
  const rows = await getRealizado();
  const veiculosPorModelo = await getVeiculosRealizadoPorModelo(modeloCompra);
  const filtrados = filterRows(rows, campanha, veiculo, veiculosPorModelo);
  if (filtrados.length === 0) return { start: null, end: null };
  return fullDataRange(filtrados, null, null);
}

export async function getSummary(start, end, isFiltered, campanha, veiculo, modeloCompra) {
  const rows = await getRealizado();
  const veiculosPorModelo = await getVeiculosRealizadoPorModelo(modeloCompra);
  const porCampanha = filterRows(rows, campanha, veiculo, veiculosPorModelo);

  const { start: effectiveStart, end: effectiveEnd } = isFiltered
    ? { start, end }
    : fullDataRange(porCampanha, start, end);

  const inRange = porCampanha.filter((r) => isWithinRange(r.data, effectiveStart, effectiveEnd));
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
  const [rows, periodos] = await Promise.all([getRealizado(), getPeriodosVeiculacao()]);
  const periodosPorCampanha = agruparPeriodosPorCampanha(periodos);

  // Coleta última data de dados por campanha (para fallback de status)
  const byCampanha = new Map();
  for (const r of rows) {
    const current = byCampanha.get(r.campanha);
    if (!current || r.data > current) byCampanha.set(r.campanha, r.data);
  }

  // Inclui também campanhas que estão na aba de períodos mas sem dados no realizado ainda
  for (const [campanha] of periodosPorCampanha) {
    if (!byCampanha.has(campanha)) byCampanha.set(campanha, null);
  }

  return Array.from(byCampanha.entries()).map(([campanha, ultimaData]) => {
    const periodosDaCampanha = periodosPorCampanha.get(campanha) || [];
    const statusFromPeriodo = getCampaignStatusFromPeriodos(periodosDaCampanha);
    const status = statusFromPeriodo ?? getCampaignStatus(ultimaData);
    return { campanha, ultimaData, status };
  });
}

const METRICS = ["investimento", "impressoes", "cliques", "visualizacoes", "sessoes"];

// Sessoes diarias nao existem na planilha real (so nos dados mock); vem sempre do GA4,
// com fallback para o mock quando GA4_PROPERTY_ID nao esta configurado.
async function getDailySessions(start, end, campanha, veiculo, modeloCompra) {
  const ga4Daily = await getDailySessionsFromGA4(start, end, veiculo, campanha);
  if (ga4Daily) return ga4Daily;

  const veiculosPorModelo = await getVeiculosRealizadoPorModelo(modeloCompra);
  const inRange = filterRows(mockRealizado, campanha, veiculo, veiculosPorModelo).filter((r) =>
    isWithinRange(r.data, start, end)
  );

  const byDate = new Map();
  for (const r of inRange) {
    byDate.set(r.data, (byDate.get(r.data) || 0) + r.sessoes);
  }
  return byDate;
}

export async function getPerformanceSeries(start, end, isFiltered, metrics, campanha, veiculo, modeloCompra) {
  const rows = await getRealizado();
  const veiculosPorModelo = await getVeiculosRealizadoPorModelo(modeloCompra);
  const porCampanha = filterRows(rows, campanha, veiculo, veiculosPorModelo);

  const { start: effectiveStart, end: effectiveEnd } = isFiltered
    ? { start, end }
    : fullDataRange(porCampanha, start, end);

  const inRange = porCampanha.filter((r) => isWithinRange(r.data, effectiveStart, effectiveEnd));
  const selectedMetrics = metrics?.length ? metrics.filter((m) => METRICS.includes(m)) : METRICS;
  const sheetMetrics = selectedMetrics.filter((m) => m !== "sessoes");

  const byDate = new Map();
  for (const r of inRange) {
    if (!byDate.has(r.data)) {
      byDate.set(r.data, Object.fromEntries(selectedMetrics.map((m) => [m, 0])));
    }
    const entry = byDate.get(r.data);
    for (const m of sheetMetrics) {
      entry[m] += r[m];
    }
  }

  if (selectedMetrics.includes("sessoes")) {
    const dailySessions = await getDailySessions(effectiveStart, effectiveEnd, campanha, veiculo, modeloCompra);
    for (const [data, sessoes] of dailySessions) {
      if (!byDate.has(data)) {
        byDate.set(data, Object.fromEntries(selectedMetrics.map((m) => [m, 0])));
      }
      byDate.get(data).sessoes = sessoes;
    }
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([data, values]) => ({ data, ...values }));
}
