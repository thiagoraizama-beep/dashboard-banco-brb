import { getRealizado, getPlanejamento } from "./sheetsClient.js";
import { isWithinRange } from "../utils/dateRange.js";
import { getVeiculosRealizadoEquivalentes } from "../utils/vehicleAliases.js";
import { matchesFilter, toFilterList } from "../utils/filterUtils.js";

// Cada modelo de compra mede a entrega em uma metrica diferente.
const METRICA_POR_MODELO = {
  CPM: "impressoes",
  CPC: "cliques",
  CPV: "visualizacoes",
};

function metricaParaModelo(modeloCompra) {
  return METRICA_POR_MODELO[modeloCompra] || "impressoes";
}

// Diferenca em dias entre duas datas, sem somar o dia final (ex: 15/06 a 02/07 = 17 dias).
function diasEntre(inicio, fim) {
  return Math.round((new Date(fim) - new Date(inicio)) / (1000 * 60 * 60 * 24));
}

// Os dados da planilha sao consolidados em D-1, entao o pacing usa ontem como referencia
// de "hoje" (os numeros de hoje ainda nao estao fechados).
function ontemISO() {
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  return ontem.toISOString().slice(0, 10);
}

// Compara o quanto ja foi entregue com o quanto deveria ter sido entregue ate D-1,
// proporcional aos dias decorridos do contrato (Data de inicio / Data de Fim na planilha).
function calcularPacing(dataInicio, dataFim, percentualEntregue) {
  if (!dataInicio || !dataFim) return null;

  const referencia = ontemISO();
  const totalDias = diasEntre(dataInicio, dataFim);

  if (referencia > dataFim) {
    const finalizadaComSucesso = percentualEntregue >= 100;
    return {
      status: "Campanha Finalizada",
      dentroDoPacing: finalizadaComSucesso,
    };
  }

  const diasDecorridos = Math.max(0, diasEntre(dataInicio, referencia > dataInicio ? referencia : dataInicio));
  const percentualEsperado = totalDias > 0 ? Math.min(100, (diasDecorridos / totalDias) * 100) : 0;
  const dentroDoPacing = percentualEntregue >= percentualEsperado;

  return {
    status: dentroDoPacing ? "Dentro do Pacing" : "Fora do Pacing",
    dentroDoPacing,
  };
}

// Sem filtro manual de periodo, usa sempre o periodo total do contrato
// (dataInicio ate dataFim do planejamento) — senao campanhas ja finalizadas
// fora da janela padrao (ex: ultimos 30 dias) aparentam entrega parcial.
// Com filtro manual aplicado, usa a intersecao do periodo do contrato com o
// recorte escolhido pelo usuario, para refletir o que ele pediu ver.
function periodoEfetivo(dataInicio, dataFim, isFiltered, filtroStart, filtroEnd) {
  if (!isFiltered) return { start: dataInicio, end: dataFim };
  const start = dataInicio && dataInicio > filtroStart ? dataInicio : filtroStart;
  const end = dataFim && dataFim < filtroEnd ? dataFim : filtroEnd;
  return { start, end };
}

function entregueDoVeiculo(rows, veiculoContratado, metrica, dataInicio, dataFim) {
  const equivalentes = getVeiculosRealizadoEquivalentes(veiculoContratado);
  return rows.reduce((sum, r) => {
    if (!equivalentes.includes(r.veiculo)) return sum;
    if (dataInicio && dataFim && !isWithinRange(r.data, dataInicio, dataFim)) return sum;
    return sum + r[metrica];
  }, 0);
}

function filterPlanejamento(planejamento, campanha, veiculo, modeloCompra) {
  return planejamento.filter(
    (p) =>
      matchesFilter(p.campanha, campanha) &&
      matchesFilter(p.veiculo, veiculo) &&
      matchesFilter(p.modeloCompra, modeloCompra)
  );
}

// Resolve quais nomes de veiculo (na base de realizado) correspondem a um ou mais modelos de compra,
// usado por outros services (media/site) para filtrar quando nao ha coluna de modelo no realizado.
export async function getVeiculosRealizadoPorModelo(modeloCompra) {
  const modelos = toFilterList(modeloCompra);
  if (!modelos) return null;
  const planejamento = await getPlanejamento();
  const veiculosContratado = planejamento.filter((p) => modelos.includes(p.modeloCompra)).map((p) => p.veiculo);
  return veiculosContratado.flatMap((v) => getVeiculosRealizadoEquivalentes(v));
}

export async function getDealsProgress(start, end, isFiltered, campanha, veiculo, modeloCompra) {
  const [realizado, planejamento] = await Promise.all([getRealizado(), getPlanejamento()]);
  const porCampanha = realizado.filter((r) => matchesFilter(r.campanha, campanha));
  const planejamentoFiltrado = filterPlanejamento(planejamento, campanha, veiculo, modeloCompra);

  let contratadoTotal = 0;
  let entregueTotal = 0;

  for (const p of planejamentoFiltrado) {
    const metrica = metricaParaModelo(p.modeloCompra);
    const { start: pStart, end: pEnd } = periodoEfetivo(p.dataInicio, p.dataFim, isFiltered, start, end);
    contratadoTotal += p.contratado;
    entregueTotal += entregueDoVeiculo(porCampanha, p.veiculo, metrica, pStart, pEnd);
  }

  const percentual = contratadoTotal > 0 ? Math.min(100, Math.round((entregueTotal / contratadoTotal) * 100)) : 0;

  return { contratado: contratadoTotal, entregue: entregueTotal, percentual };
}

export async function getVehicles(start, end, isFiltered, campanha, veiculo, modeloCompra) {
  const [realizado, planejamento] = await Promise.all([getRealizado(), getPlanejamento()]);
  const porCampanha = realizado.filter((r) => matchesFilter(r.campanha, campanha));
  const planejamentoFiltrado = filterPlanejamento(planejamento, campanha, veiculo, modeloCompra);

  return planejamentoFiltrado.map((p) => {
    const metrica = metricaParaModelo(p.modeloCompra);
    const { start: pStart, end: pEnd } = periodoEfetivo(p.dataInicio, p.dataFim, isFiltered, start, end);
    const entregue = entregueDoVeiculo(porCampanha, p.veiculo, "impressoes", pStart, pEnd);
    const cliques = entregueDoVeiculo(porCampanha, p.veiculo, "cliques", pStart, pEnd);
    const visualizacoes = entregueDoVeiculo(porCampanha, p.veiculo, "visualizacoes", pStart, pEnd);
    const entregueMetrica = { impressoes: entregue, cliques, visualizacoes }[metrica];

    const percentualReal = p.contratado > 0 ? (entregueMetrica / p.contratado) * 100 : 0;
    const percentual = Math.min(100, Math.round(percentualReal));

    // O pacing sempre avalia o ritmo do CONTRATO INTEIRO (contratado vs esperado
    // ate hoje), independente do filtro manual de periodo aplicado — senao
    // comparar "% do recorte filtrado" com "ritmo esperado do contrato" nao faz sentido.
    const entregueContratoInteiro = entregueDoVeiculo(porCampanha, p.veiculo, metrica, p.dataInicio, p.dataFim);
    const percentualContratoInteiro = p.contratado > 0 ? (entregueContratoInteiro / p.contratado) * 100 : 0;
    const pacing = calcularPacing(p.dataInicio, p.dataFim, percentualContratoInteiro);

    return {
      veiculo: p.veiculo,
      modeloCompra: p.modeloCompra,
      campanha: p.campanha,
      contratado: p.contratado,
      entregue: entregueMetrica,
      cliques,
      visualizacoes,
      percentual,
      pacingStatus: pacing?.status || null,
      dentroDoPacing: pacing?.dentroDoPacing ?? null,
    };
  });
}
