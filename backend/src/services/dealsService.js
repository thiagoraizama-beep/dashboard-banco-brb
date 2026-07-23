import { getRealizado } from "./sheetsClient.js";
import { isWithinRange } from "../utils/dateRange.js";
import { matchesFilter, toFilterList } from "../utils/filterUtils.js";
import { listCampanhas } from "./campanhasService.js";
import { listPlataformas } from "./plataformasService.js";

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

// Resolve os "subcanais" (nomes reais na base de realizado) de uma plataforma
// cadastrada -- mesmo padrao usado em creativeAnalysisService.resolveVeiculosPlanilha.
// Sem subcanal cadastrado, usa o proprio nome da plataforma.
async function resolveVeiculosRealizado(nomePlataforma, subcanaisPorNome) {
  const subcanais = subcanaisPorNome.get(nomePlataforma);
  return subcanais?.length ? subcanais : [nomePlataforma];
}

function entregueDoVeiculo(rows, equivalentes, metrica, dataInicio, dataFim) {
  return rows.reduce((sum, r) => {
    if (!equivalentes.includes(r.veiculo)) return sum;
    if (dataInicio && dataFim && !isWithinRange(r.data, dataInicio, dataFim)) return sum;
    return sum + r[metrica];
  }, 0);
}

// Media de viewability entre as linhas que batem veiculo (plataforma) + periodo do
// contrato, ignorando linhas sem o dado preenchido -- retorna null quando nenhuma
// linha tem viewability, para a UI mostrar "-" em vez de 0%.
function viewabilityMediaDoVeiculo(rows, equivalentes, dataInicio, dataFim) {
  let soma = 0;
  let count = 0;
  for (const r of rows) {
    if (!equivalentes.includes(r.veiculo)) continue;
    if (dataInicio && dataFim && !isWithinRange(r.data, dataInicio, dataFim)) continue;
    if (r.viewability === null || r.viewability === undefined) continue;
    soma += r.viewability;
    count += 1;
  }
  return count > 0 ? soma / count : null;
}

function filterPlanejamento(planejamento, campanha, veiculo, modeloCompra) {
  return planejamento.filter(
    (p) =>
      matchesFilter(p.campanha, campanha) &&
      matchesFilter(p.veiculo, veiculo) &&
      matchesFilter(p.modeloCompra, modeloCompra)
  );
}

// Metas cadastradas manualmente (Perfil > Campanhas) no mesmo formato que a antiga
// planilha de planejamento produzia -- assim getDealsProgress/getVehicles nao
// precisam mudar de logica, so a fonte do "contratado". data_inicio/data_fim nulos
// na meta herdam o periodo da campanha.
async function getContratadoPostgres() {
  const campanhas = await listCampanhas();
  const planejamento = [];
  for (const c of campanhas) {
    for (const v of c.veiculos) {
      for (const m of v.metas || []) {
        planejamento.push({
          veiculo: m.plataforma,
          modeloCompra: m.modeloCompra,
          contratado: m.quantidadeContratada,
          dataInicio: (m.dataInicio ? new Date(m.dataInicio) : c.data_inicio ? new Date(c.data_inicio) : null)?.toISOString().slice(0, 10) || null,
          dataFim: (m.dataFim ? new Date(m.dataFim) : c.data_fim ? new Date(c.data_fim) : null)?.toISOString().slice(0, 10) || null,
          campanha: c.nome,
        });
      }
    }
  }
  return planejamento;
}

// Resolve quais nomes de veiculo (na base de realizado) correspondem a um ou mais modelos de compra,
// usado por outros services (media/site) para filtrar quando nao ha coluna de modelo no realizado.
export async function getVeiculosRealizadoPorModelo(modeloCompra) {
  const modelos = toFilterList(modeloCompra);
  if (!modelos) return null;
  const [planejamento, plataformasCadastradas] = await Promise.all([getContratadoPostgres(), listPlataformas()]);
  const subcanaisPorNome = new Map(plataformasCadastradas.map((p) => [p.nome, p.subcanais]));
  const veiculosContratado = planejamento.filter((p) => modelos.includes(p.modeloCompra)).map((p) => p.veiculo);
  const resultados = await Promise.all(veiculosContratado.map((v) => resolveVeiculosRealizado(v, subcanaisPorNome)));
  return resultados.flat();
}

export async function getDealsProgress(start, end, isFiltered, campanha, veiculo, modeloCompra) {
  const [realizado, planejamento, plataformasCadastradas] = await Promise.all([
    getRealizado(),
    getContratadoPostgres(),
    listPlataformas(),
  ]);
  const subcanaisPorNome = new Map(plataformasCadastradas.map((p) => [p.nome, p.subcanais]));
  const porCampanha = realizado.filter((r) => matchesFilter(r.campanha, campanha));
  const planejamentoFiltrado = filterPlanejamento(planejamento, campanha, veiculo, modeloCompra);

  let contratadoTotal = 0;
  let entregueTotal = 0;

  for (const p of planejamentoFiltrado) {
    const metrica = metricaParaModelo(p.modeloCompra);
    const equivalentes = await resolveVeiculosRealizado(p.veiculo, subcanaisPorNome);
    const { start: pStart, end: pEnd } = periodoEfetivo(p.dataInicio, p.dataFim, isFiltered, start, end);
    contratadoTotal += p.contratado;
    entregueTotal += entregueDoVeiculo(porCampanha, equivalentes, metrica, pStart, pEnd);
  }

  const percentual = contratadoTotal > 0 ? Math.min(100, Math.round((entregueTotal / contratadoTotal) * 100)) : 0;

  return { contratado: contratadoTotal, entregue: entregueTotal, percentual };
}

export async function getVehicles(start, end, isFiltered, campanha, veiculo, modeloCompra) {
  const [realizado, planejamento, plataformasCadastradas] = await Promise.all([
    getRealizado(),
    getContratadoPostgres(),
    listPlataformas(),
  ]);
  const subcanaisPorNome = new Map(plataformasCadastradas.map((p) => [p.nome, p.subcanais]));
  const porCampanha = realizado.filter((r) => matchesFilter(r.campanha, campanha));
  const planejamentoFiltrado = filterPlanejamento(planejamento, campanha, veiculo, modeloCompra);

  return planejamentoFiltrado.map((p) => {
    const metrica = metricaParaModelo(p.modeloCompra);
    const equivalentes = subcanaisPorNome.get(p.veiculo)?.length ? subcanaisPorNome.get(p.veiculo) : [p.veiculo];
    const { start: pStart, end: pEnd } = periodoEfetivo(p.dataInicio, p.dataFim, isFiltered, start, end);
    const entregue = entregueDoVeiculo(porCampanha, equivalentes, "impressoes", pStart, pEnd);
    const cliques = entregueDoVeiculo(porCampanha, equivalentes, "cliques", pStart, pEnd);
    const visualizacoes = entregueDoVeiculo(porCampanha, equivalentes, "visualizacoes", pStart, pEnd);
    const entregueMetrica = { impressoes: entregue, cliques, visualizacoes }[metrica];

    const percentualReal = p.contratado > 0 ? (entregueMetrica / p.contratado) * 100 : 0;
    const percentual = Math.min(100, Math.round(percentualReal));

    // O pacing sempre avalia o ritmo do CONTRATO INTEIRO (contratado vs esperado
    // ate hoje), independente do filtro manual de periodo aplicado — senao
    // comparar "% do recorte filtrado" com "ritmo esperado do contrato" nao faz sentido.
    const entregueContratoInteiro = entregueDoVeiculo(porCampanha, equivalentes, metrica, p.dataInicio, p.dataFim);
    const percentualContratoInteiro = p.contratado > 0 ? (entregueContratoInteiro / p.contratado) * 100 : 0;
    const pacing = calcularPacing(p.dataInicio, p.dataFim, percentualContratoInteiro);
    const viewability = viewabilityMediaDoVeiculo(porCampanha, equivalentes, pStart, pEnd);

    return {
      veiculo: p.veiculo,
      modeloCompra: p.modeloCompra,
      campanha: p.campanha,
      contratado: p.contratado,
      entregue: entregueMetrica,
      cliques,
      visualizacoes,
      viewability,
      percentual,
      pacingStatus: pacing?.status || null,
      dentroDoPacing: pacing?.dentroDoPacing ?? null,
    };
  });
}
