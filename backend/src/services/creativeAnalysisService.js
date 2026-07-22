import { getRealizadoDetalhado } from "./sheetsClient.js";
import { isWithinRange } from "../utils/dateRange.js";
import { findCreativeByAdName, findCreativeByAdNameOnly } from "./creativesService.js";
import { listPlataformas } from "./plataformasService.js";
import { listCampanhas } from "./campanhasService.js";

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function addDaysISO(iso, n) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function diffDays(isoInicio, isoFim) {
  const a = new Date(`${isoInicio}T00:00:00`);
  const b = new Date(`${isoFim}T00:00:00`);
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

function seedRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

// Enquanto DATA_SOURCE=mock (planilha ainda nao conectada), getRealizadoDetalhado()
// retorna sempre []. Para permitir testar Analise por Criativo (filtros, graficos,
// comparativo) com as campanhas/plataformas REAIS ja cadastradas no Postgres, gera
// linhas sinteticas a partir delas -- 20 dias de dados por plataforma com
// acesso_analise_criativo, usando os subcanais cadastrados quando existirem.
// So roda em modo mock; com DATA_SOURCE=sheets, getRealizadoDetalhado() ja retorna
// dados reais e essa geracao nunca e usada.
let mockCache = null;
async function gerarMockAnaliseCriativo() {
  if (mockCache) return mockCache;

  const [campanhas, plataformasCadastradas] = await Promise.all([listCampanhas(), listPlataformas()]);
  const subcanaisPorNome = new Map(plataformasCadastradas.map((p) => [p.nome, p.subcanais]));
  const rand = seedRandom(7);
  const rows = [];

  for (const campanha of campanhas) {
    const plataformasNaCampanha = new Set();
    for (const v of campanha.veiculos) {
      if (v.acessoAnaliseCriativo === false) continue;
      for (const p of v.plataformasAnaliseCriativo || []) plataformasNaCampanha.add(p);
    }

    // Dados sinteticos ficam DENTRO do periodo de veiculacao real da campanha
    // (data_inicio/data_fim cadastrados), para o calendario de filtro bater com o
    // periodo esperado. Sem periodo cadastrado, cai no fallback de ultimos 20 dias.
    const dataInicio = campanha.data_inicio ? new Date(campanha.data_inicio).toISOString().slice(0, 10) : null;
    const dataFim = campanha.data_fim ? new Date(campanha.data_fim).toISOString().slice(0, 10) : null;
    const totalDias = dataInicio && dataFim ? diffDays(dataInicio, dataFim) : 20;

    for (const plataforma of plataformasNaCampanha) {
      const subcanais = subcanaisPorNome.get(plataforma);
      const veiculosPlanilha = subcanais?.length ? subcanais : [plataforma];

      for (const veiculoPlanilha of veiculosPlanilha) {
        for (let dia = 0; dia < totalDias; dia++) {
          const impressoes = Math.round(3000 + rand() * 15000);
          const cliques = Math.round(impressoes * (0.008 + rand() * 0.025));
          const investimento = Number((cliques * (1.2 + rand() * 2)).toFixed(2));
          const videoViews = Math.round(impressoes * (0.15 + rand() * 0.25));
          rows.push({
            data: dataInicio ? addDaysISO(dataInicio, dia) : daysAgoISO(totalDias - 1 - dia),
            campanha: campanha.nome,
            veiculo: veiculoPlanilha,
            plataforma: veiculoPlanilha,
            adName: `${veiculoPlanilha} - Criativo ${(dia % 3) + 1}`,
            nomeCriativo: `${veiculoPlanilha} - Criativo ${(dia % 3) + 1}`,
            imagemCriativo: null,
            tipoCompra: ["CPC", "CPM"][dia % 2],
            posicionamento: ["Feed", "Stories"][dia % 2],
            investimento,
            impressoes,
            cliques,
            alcance: Math.round(impressoes * 0.7),
            videoViews,
            videoViews25: Math.round(videoViews * 0.6),
            videoViews50: Math.round(videoViews * 0.4),
            videoViews75: Math.round(videoViews * 0.25),
            videoCompletions: Math.round(videoViews * 0.15),
            engajamentos: Math.round(cliques * 1.3),
          });
        }
      }
    }
  }

  mockCache = rows;
  return rows;
}

async function getRealizadoDetalhadoComMock() {
  const real = await getRealizadoDetalhado();
  if (real.length > 0) return real;
  if (process.env.DATA_SOURCE === "sheets") return real;
  return gerarMockAnaliseCriativo();
}

// Resolve a midia do criativo:
// 1. Usa a imagem que vem diretamente da planilha (coluna "Imagem do Criativo"),
//    que ja foi normalizada pelo sheetsClient (Google Drive -> URL direta).
// 2. So cai na Matriz de Conteudo (Cloudinary) se a planilha nao tiver imagem.
// Isso evita dependencia do Cloudinary para criativos que ja tem imagem na planilha.
async function resolveCreativeMedia(adName, nomeCriativo, veiculoOpcao, imagemDaPlanilha, posicionamento) {
  let fromMatrix = await findCreativeByAdName(adName, veiculoOpcao, posicionamento);
  if (!fromMatrix) fromMatrix = await findCreativeByAdNameOnly(adName);
  if (!fromMatrix && nomeCriativo) fromMatrix = await findCreativeByAdNameOnly(nomeCriativo);

  const cloudinaryUrl = fromMatrix?.cloudinary_url || null;
  const cloudinaryTipo = fromMatrix?.tipo_midia || "image";

  // Cloudinary tem prioridade — URLs de terceiros (postimg, ibb.co) bloqueiam hotlink
  if (cloudinaryUrl) {
    return { url: cloudinaryUrl, tipo: cloudinaryTipo, cloudinaryUrl, cloudinaryTipo };
  }
  if (imagemDaPlanilha) {
    return { url: imagemDaPlanilha, tipo: "image", cloudinaryUrl: null, cloudinaryTipo: "image" };
  }
  return null;
}

// Veiculos de criativo exibidos no submenu lateral. Mantido como lista de
// referencia para o CREATIVE_VEHICLES.includes() de validacao de rota -- o
// casamento real com a planilha agora vem dos subcanais cadastrados em Plataformas.
export const CREATIVE_VEHICLES = ["Meta", "TikTok", "YouTube", "Kwai"];

// Resolve os "subcanais" (nomes reais na planilha de realizado) de uma plataforma
// cadastrada pela agencia. Ex: plataforma "Meta Ads" com subcanais ["Facebook",
// "Instagram"] cadastrados na aba Plataformas -> filtro de Analise por Criativo
// busca linhas com veiculo "Facebook" OU "Instagram". Sem subcanal cadastrado,
// usa o proprio nome da plataforma como veiculo da planilha.
async function resolveVeiculosPlanilha(veiculoOpcao) {
  const plataformas = await listPlataformas();
  const encontrada = plataformas.find((p) => p.nome === veiculoOpcao);
  return encontrada?.subcanais?.length ? encontrada.subcanais : [veiculoOpcao];
}

// Aceita filtro como valor unico ou array (multi-selecao). Vazio/null/[] = sem filtro.
function matchesFilter(rowValue, filterValue) {
  if (!filterValue) return true;
  if (Array.isArray(filterValue)) return filterValue.length === 0 || filterValue.includes(rowValue);
  return rowValue === filterValue;
}

function filterRows(rows, veiculosPlanilha, filters) {
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
  const [rows, veiculosPlanilha] = await Promise.all([getRealizadoDetalhadoComMock(), resolveVeiculosPlanilha(veiculoOpcao)]);
  const doVeiculo = rows.filter((r) => veiculosPlanilha.includes(r.veiculo));

  const campanhas = [...new Set(doVeiculo.map((r) => r.campanha))].filter(Boolean).sort();
  const tiposCompra = [...new Set(doVeiculo.map((r) => r.tipoCompra))].filter(Boolean).sort();
  const posicionamentos = [...new Set(doVeiculo.map((r) => r.posicionamento))].filter(Boolean).sort();
  // Plataforma (ex: Facebook/Instagram) so aparece como filtro quando a plataforma
  // cadastrada engloba mais de um subcanal na planilha.
  const plataformas = veiculosPlanilha.length > 1 ? veiculosPlanilha : [];

  return { campanhas, tiposCompra, posicionamentos, plataformas };
}

function summarize(rows) {
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

export async function getSummary(veiculoOpcao, filters) {
  const [rows, veiculosPlanilha] = await Promise.all([getRealizadoDetalhadoComMock(), resolveVeiculosPlanilha(veiculoOpcao)]);
  return summarize(filterRows(rows, veiculosPlanilha, filters));
}

// Resumo agregado de TODAS as plataformas de uma campanha (usado no comparativo
// entre campanhas) -- soma as linhas cujo campo "veiculo" bate com qualquer uma
// das plataformas informadas, dentro da campanha.
export async function getCampanhaSummary(campanhaNome, plataformas) {
  const rows = await getRealizadoDetalhadoComMock();
  const doCampanha = rows.filter((r) => r.campanha === campanhaNome && plataformas.includes(r.veiculo));

  const porPlataforma = new Map();
  for (const p of plataformas) porPlataforma.set(p, []);
  for (const r of doCampanha) porPlataforma.get(r.veiculo)?.push(r);

  return {
    total: summarize(doCampanha),
    porPlataforma: Object.fromEntries(
      [...porPlataforma.entries()].map(([p, rowsDaPlataforma]) => [p, summarize(rowsDaPlataforma)])
    ),
  };
}

// Serie diaria de uma plataforma inteira dentro de uma campanha (sem filtrar por
// criativo especifico), usada no grafico de evolucao do comparativo.
export async function getPlataformaSeries(veiculoOpcao, filters) {
  const [rows, veiculosPlanilha] = await Promise.all([getRealizadoDetalhadoComMock(), resolveVeiculosPlanilha(veiculoOpcao)]);
  const filteredRows = filterRows(rows, veiculosPlanilha, filters);

  const byDate = new Map();
  for (const r of filteredRows) {
    if (!byDate.has(r.data)) {
      byDate.set(r.data, { data: r.data, impressoes: 0, cliques: 0, investimento: 0 });
    }
    const entry = byDate.get(r.data);
    entry.impressoes += r.impressoes;
    entry.cliques += r.cliques;
    entry.investimento += r.investimento;
  }

  return Array.from(byDate.values()).sort((a, b) => (a.data < b.data ? -1 : 1));
}

// Serie diaria agregada de uma campanha inteira (todas as plataformas informadas),
// usada no grafico de evolucao do comparativo entre campanhas.
export async function getCampanhaSeries(campanhaNome, plataformas) {
  const rows = (await getRealizadoDetalhadoComMock()).filter((r) => r.campanha === campanhaNome && plataformas.includes(r.veiculo));

  const byDate = new Map();
  for (const r of rows) {
    if (!byDate.has(r.data)) {
      byDate.set(r.data, { data: r.data, impressoes: 0, cliques: 0, investimento: 0 });
    }
    const entry = byDate.get(r.data);
    entry.impressoes += r.impressoes;
    entry.cliques += r.cliques;
    entry.investimento += r.investimento;
  }

  return Array.from(byDate.values()).sort((a, b) => (a.data < b.data ? -1 : 1));
}

// Serie diaria de um criativo especifico (Ad Name), para o grafico de evolucao no modal de detalhe.
export async function getCreativeSeries(veiculoOpcao, adName, filters) {
  const [allRows, veiculosPlanilha] = await Promise.all([getRealizadoDetalhadoComMock(), resolveVeiculosPlanilha(veiculoOpcao)]);
  const rows = filterRows(allRows, veiculosPlanilha, filters).filter(
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
  const [allRows, veiculosPlanilha] = await Promise.all([getRealizadoDetalhadoComMock(), resolveVeiculosPlanilha(veiculoOpcao)]);
  const rows = filterRows(allRows, veiculosPlanilha, filters);

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
      const media = await resolveCreativeMedia(c.adName, c.nomeCriativo, veiculoOpcao, c.imagemCriativo, c.posicionamento);
      return {
        ...c,
        imagemCriativo: media?.url || null,
        cloudinaryUrl: media?.cloudinaryUrl || null,
        tipoMidia: media?.cloudinaryTipo || media?.tipo || "image",
        investimento: Number(c.investimento.toFixed(2)),
        ctr: Number(ctr(c.impressoes, c.cliques).toFixed(2)),
        vtr: c.impressoes > 0 ? Number(((c.videoViews / c.impressoes) * 100).toFixed(2)) : 0,
      };
    })
  );

  return creatives;
}
