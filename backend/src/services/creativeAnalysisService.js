import { getRealizadoDetalhado } from "./sheetsClient.js";
import { isWithinRange } from "../utils/dateRange.js";
import { getVeiculosRealizadoEquivalentes } from "../utils/vehicleAliases.js";
import { findCreativeMedia } from "./cloudinaryImagesService.js";

// Veiculos de criativo exibidos no submenu lateral. "Kwai" ainda nao tem aba na
// planilha; fica disponivel na navegacao mas retorna listas vazias.
export const CREATIVE_VEHICLES = ["Meta", "TikTok", "YouTube", "Kwai"];

const VEICULO_PLANILHA_POR_OPCAO = {
  Meta: getVeiculosRealizadoEquivalentes("Meta"),
  TikTok: ["Tik Tok"],
  YouTube: ["YouTube"],
  Kwai: ["Kwai"],
};

// Aceita filtro como valor unico ou array (multi-selecao). Vazio/null/[] = sem filtro.
function matchesFilter(rowValue, filterValue) {
  if (!filterValue) return true;
  if (Array.isArray(filterValue)) return filterValue.length === 0 || filterValue.includes(rowValue);
  return rowValue === filterValue;
}

function filterRows(rows, veiculoOpcao, filters) {
  const veiculosPlanilha = VEICULO_PLANILHA_POR_OPCAO[veiculoOpcao] || [veiculoOpcao];
  const { start, end, campanha, tipoCompra, posicionamento, plataforma } = filters;

  return rows.filter(
    (r) =>
      veiculosPlanilha.includes(r.veiculo) &&
      (!start || !end || isWithinRange(r.data, start, end)) &&
      matchesFilter(r.campanha, campanha) &&
      matchesFilter(r.tipoCompra, tipoCompra) &&
      matchesFilter(r.posicionamento, posicionamento) &&
      matchesFilter(r.veiculo, plataforma)
  );
}

function ctr(impressoes, cliques) {
  return impressoes > 0 ? (cliques / impressoes) * 100 : 0;
}

export async function getFilterOptions(veiculoOpcao) {
  const rows = await getRealizadoDetalhado();
  const veiculosPlanilha = VEICULO_PLANILHA_POR_OPCAO[veiculoOpcao] || [veiculoOpcao];
  const doVeiculo = rows.filter((r) => veiculosPlanilha.includes(r.veiculo));

  const campanhas = [...new Set(doVeiculo.map((r) => r.campanha))].filter(Boolean).sort();
  const tiposCompra = [...new Set(doVeiculo.map((r) => r.tipoCompra))].filter(Boolean).sort();
  const posicionamentos = [...new Set(doVeiculo.map((r) => r.posicionamento))].filter(Boolean).sort();
  // Plataforma (Facebook/Instagram) so existe como distincao dentro do Meta.
  const plataformas = veiculoOpcao === "Meta" ? veiculosPlanilha : [];

  return { campanhas, tiposCompra, posicionamentos, plataformas };
}

export async function getSummary(veiculoOpcao, filters) {
  const rows = filterRows(await getRealizadoDetalhado(), veiculoOpcao, filters);

  const totals = rows.reduce(
    (acc, r) => ({
      investimento: acc.investimento + r.investimento,
      impressoes: acc.impressoes + r.impressoes,
      alcance: acc.alcance + r.alcance,
      cliques: acc.cliques + r.cliques,
    }),
    { investimento: 0, impressoes: 0, alcance: 0, cliques: 0 }
  );

  const cpm = totals.impressoes > 0 ? (totals.investimento / totals.impressoes) * 1000 : 0;
  const cpc = totals.cliques > 0 ? totals.investimento / totals.cliques : 0;
  const frequencia = totals.alcance > 0 ? totals.impressoes / totals.alcance : 0;

  return {
    ...totals,
    cpm: Number(cpm.toFixed(2)),
    cpc: Number(cpc.toFixed(2)),
    ctr: Number(ctr(totals.impressoes, totals.cliques).toFixed(2)),
    frequencia: Number(frequencia.toFixed(2)),
  };
}

// Serie diaria de um criativo especifico (Ad Name), para o grafico de evolucao no modal de detalhe.
export async function getCreativeSeries(veiculoOpcao, adName, filters) {
  const rows = filterRows(await getRealizadoDetalhado(), veiculoOpcao, filters).filter(
    (r) => (r.adName || r.nomeCriativo) === adName
  );

  const byDate = new Map();
  for (const r of rows) {
    if (!byDate.has(r.data)) {
      byDate.set(r.data, { data: r.data, impressoes: 0, cliques: 0, videoViews: 0 });
    }
    const entry = byDate.get(r.data);
    entry.impressoes += r.impressoes;
    entry.cliques += r.cliques;
    entry.videoViews += r.videoViews;
  }

  return Array.from(byDate.values()).sort((a, b) => (a.data < b.data ? -1 : 1));
}

// Agrupa por criativo (Ad Name), somando metricas de todas as linhas/dias daquele criativo.
export async function getCreatives(veiculoOpcao, filters) {
  const rows = filterRows(await getRealizadoDetalhado(), veiculoOpcao, filters);

  const byAd = new Map();
  for (const r of rows) {
    const key = r.adName || r.nomeCriativo;
    if (!byAd.has(key)) {
      byAd.set(key, {
        adName: r.adName,
        nomeCriativo: r.nomeCriativo,
        imagemCriativo: r.imagemCriativo,
        tipoCompra: r.tipoCompra,
        posicionamento: r.posicionamento,
        plataforma: r.veiculo,
        investimento: 0,
        impressoes: 0,
        cliques: 0,
        videoViews: 0,
        videoViews25: 0,
        videoViews50: 0,
        videoViews75: 0,
        videoCompletions: 0,
        engajamentos: 0,
      });
    }
    const entry = byAd.get(key);
    entry.investimento += r.investimento;
    entry.impressoes += r.impressoes;
    entry.cliques += r.cliques;
    entry.videoViews += r.videoViews;
    entry.videoViews25 += r.videoViews25;
    entry.videoViews50 += r.videoViews50;
    entry.videoViews75 += r.videoViews75;
    entry.videoCompletions += r.videoCompletions;
    entry.engajamentos += r.engajamentos;
  }

  const creatives = await Promise.all(
    Array.from(byAd.values()).map(async (c) => {
      const media = await findCreativeMedia(c.adName, c.nomeCriativo, veiculoOpcao);
      return {
        ...c,
        imagemCriativo: media?.url || c.imagemCriativo,
        tipoMidia: media?.tipo || "image",
        investimento: Number(c.investimento.toFixed(2)),
        ctr: Number(ctr(c.impressoes, c.cliques).toFixed(2)),
        vtr: c.impressoes > 0 ? Number(((c.videoViews / c.impressoes) * 100).toFixed(2)) : 0,
      };
    })
  );

  return creatives;
}
