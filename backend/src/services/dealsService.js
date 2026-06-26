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

function entregueDoVeiculo(realizadoPorVeiculo, veiculoContratado, metrica) {
  const equivalentes = getVeiculosRealizadoEquivalentes(veiculoContratado);
  return equivalentes.reduce((sum, nome) => {
    const r = realizadoPorVeiculo.get(nome);
    return sum + (r ? r[metrica] : 0);
  }, 0);
}

function agruparRealizadoPorVeiculo(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.veiculo)) {
      map.set(r.veiculo, { impressoes: 0, cliques: 0, visualizacoes: 0 });
    }
    const entry = map.get(r.veiculo);
    entry.impressoes += r.impressoes;
    entry.cliques += r.cliques;
    entry.visualizacoes += r.visualizacoes;
  }
  return map;
}

function filterPlanejamento(planejamento, veiculo, modeloCompra) {
  return planejamento.filter(
    (p) => matchesFilter(p.veiculo, veiculo) && matchesFilter(p.modeloCompra, modeloCompra)
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

export async function getDealsProgress(start, end, campanha, veiculo, modeloCompra) {
  const [realizado, planejamento] = await Promise.all([getRealizado(), getPlanejamento()]);
  const porCampanha = realizado.filter((r) => matchesFilter(r.campanha, campanha));
  const inRange = porCampanha.filter((r) => isWithinRange(r.data, start, end));
  const realizadoPorVeiculo = agruparRealizadoPorVeiculo(inRange);
  const planejamentoFiltrado = filterPlanejamento(planejamento, veiculo, modeloCompra);

  let contratadoTotal = 0;
  let entregueTotal = 0;

  for (const p of planejamentoFiltrado) {
    const metrica = metricaParaModelo(p.modeloCompra);
    contratadoTotal += p.contratado;
    entregueTotal += entregueDoVeiculo(realizadoPorVeiculo, p.veiculo, metrica);
  }

  const percentual = contratadoTotal > 0 ? Math.min(100, Math.round((entregueTotal / contratadoTotal) * 100)) : 0;

  return { contratado: contratadoTotal, entregue: entregueTotal, percentual };
}

export async function getVehicles(start, end, campanha, veiculo, modeloCompra) {
  const [realizado, planejamento] = await Promise.all([getRealizado(), getPlanejamento()]);
  const porCampanha = realizado.filter((r) => matchesFilter(r.campanha, campanha));
  const inRange = porCampanha.filter((r) => isWithinRange(r.data, start, end));
  const realizadoPorVeiculo = agruparRealizadoPorVeiculo(inRange);
  const planejamentoFiltrado = filterPlanejamento(planejamento, veiculo, modeloCompra);

  return planejamentoFiltrado.map((p) => {
    const metrica = metricaParaModelo(p.modeloCompra);
    const equivalentes = getVeiculosRealizadoEquivalentes(p.veiculo);
    const totais = equivalentes.reduce(
      (acc, nome) => {
        const r = realizadoPorVeiculo.get(nome);
        if (!r) return acc;
        return {
          impressoes: acc.impressoes + r.impressoes,
          cliques: acc.cliques + r.cliques,
          visualizacoes: acc.visualizacoes + r.visualizacoes,
        };
      },
      { impressoes: 0, cliques: 0, visualizacoes: 0 }
    );

    const entregue = totais[metrica];
    const percentualReal = p.contratado > 0 ? (entregue / p.contratado) * 100 : 0;
    const percentual = Math.min(100, Math.round(percentualReal));
    const pacing = calcularPacing(p.dataInicio, p.dataFim, percentualReal);

    return {
      veiculo: p.veiculo,
      modeloCompra: p.modeloCompra,
      campanha: p.campanha,
      contratado: p.contratado,
      entregue,
      cliques: totais.cliques,
      visualizacoes: totais.visualizacoes,
      percentual,
      pacingStatus: pacing?.status || null,
      dentroDoPacing: pacing?.dentroDoPacing ?? null,
    };
  });
}
