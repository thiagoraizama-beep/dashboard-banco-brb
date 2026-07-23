import { getSheetsClient } from "../config/googleSheets.js";
import { realizado as mockRealizado, planejamento as mockPlanejamento } from "./mockData.js";
import { normalizeImageUrl } from "../utils/imageUrl.js";

const CACHE_TTL_MS = 60_000;
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached(key, value) {
  cache.set(key, { value, timestamp: Date.now() });
}

// Converte a primeira linha (cabecalho) + linhas seguintes em objetos { coluna: valor }.
function rowsToObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const [header, ...lines] = rows;
  return lines.map((line) => {
    const obj = {};
    header.forEach((col, i) => {
      obj[col.trim()] = line[i] ?? "";
    });
    return obj;
  });
}

// Datas na planilha vem como "DD/MM/YYYY"; convertemos para "YYYY-MM-DD" (comparavel via string).
function parseBRDate(value) {
  const [day, month, year] = (value || "").split("/");
  if (!day || !month || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

// Numeros na planilha usam "." como separador de milhar (ex: "92.184").
function parseBRNumber(value) {
  if (!value) return 0;
  return Number(String(value).replace(/\./g, "").replace(",", ".")) || 0;
}

// Custo vem formatado como "R$ 2.389,41".
function parseBRCurrency(value) {
  if (!value) return 0;
  const cleaned = String(value).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return Number(cleaned) || 0;
}

// Percentual (ex: Viewability) pode vir formatado de formas diferentes na planilha:
// "85%", "85", "85,5" ou fracao "0,85"/"0.85". Retorna sempre em escala 0-100, ou
// null quando a celula esta vazia (nao confundir "sem dado" com "0%").
function parseBRPercent(value) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const cleaned = String(value).replace("%", "").trim().replace(",", ".");
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return null;
  return num <= 1 ? num * 100 : num;
}

// Colunas reais da aba "BASE CONSOLIDADA - MÍDIA ON": Date, Campaign name, Ad Set Name,
// Ad Name, Impressions, Clicks, Video views, ..., Plataforma, Tipo de Compra, ..., Campanha,
// ..., Veículo, Cost, Categoria.
// IMPORTANTE: "veiculo" no objeto normalizado (usado em todo o dashboard para pacing,
// contratado x entregue, Analise por Criativo etc) sempre significou a PLATAFORMA de midia
// (Meta Ads, Google Search...) -- e por isso le da coluna "Plataforma" da planilha, nao da
// coluna "Veiculo" (que e o vendor/agenciador cadastrado em Perfil > Veiculos, ex: "Go On Ad
// Group"). O vendor nao e consumido nesta normalizacao pois nada no sistema hoje precisa dele.
// Sessoes/tempo medio/custo por sessao (dados de site) ainda nao existem nesta planilha.
function normalizeRealizadoRow(row) {
  return {
    data: parseBRDate(row.Date),
    campanha: row.Campanha || row["Campaign name"],
    veiculo: row["Plataforma"],
    investimento: parseBRCurrency(row.Cost),
    impressoes: parseBRNumber(row.Impressions),
    cliques: parseBRNumber(row.Clicks),
    visualizacoes: parseBRNumber(row["Video views"]),
    viewability: parseBRPercent(row.Viewability),
  };
}

// Mesma aba "BASE CONSOLIDADA - MÍDIA ON", mas com as colunas de nível de criativo
// (Ad Name, Nome do Criativo, Imagem do Criativo, Tipo de Compra, Posicionamento) usadas
// na página de Análise por Criativo.
function normalizeCriativoRow(row) {
  return {
    data: parseBRDate(row.Date),
    campanha: row.Campanha || row["Campaign name"],
    veiculo: row["Plataforma"],
    // Alias mantido por compatibilidade com codigo que ja le "plataforma" separadamente
    // (ex: creativeAnalysisService "plataforma: r.veiculo").
    plataforma: row["Plataforma"],
    adName: row["Ad Name"],
    nomeCriativo: row["Nome do Criativo"],
    imagemCriativo: normalizeImageUrl(row["Imagem do Criativo"]),
    tipoCompra: row["Tipo de Compra"],
    posicionamento: row.Posicionamento,
    investimento: parseBRCurrency(row.Cost),
    impressoes: parseBRNumber(row.Impressions),
    cliques: parseBRNumber(row.Clicks),
    alcance: parseBRNumber(row.Impressions),
    videoViews: parseBRNumber(row["Video views"]),
    videoViews25: parseBRNumber(row["Video views 25%"]),
    videoViews50: parseBRNumber(row["Video views 50%"]),
    videoViews75: parseBRNumber(row["Video views 75%"]),
    videoCompletions: parseBRNumber(row["Video completions"]),
    engajamentos: parseBRNumber(row["Total engagements"]),
  };
}

// Colunas reais da aba "Contratado de cada veículo - online": Veículo, Modelo de Compra,
// Quantidade contratada, Data de início, Data de Fim, Campanha.
function normalizePlanejamentoRow(row) {
  return {
    veiculo: row["Veículo"],
    modeloCompra: row["Modelo de Compra"],
    contratado: parseBRNumber(row["Quantidade contratada"]),
    dataInicio: parseBRDate(row["Data de início"]),
    dataFim: parseBRDate(row["Data de Fim"]),
    campanha: row["Campanha"],
  };
}

async function fetchSheetRows(range) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SHEET_ID;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return res.data.values || [];
}

export async function getRealizado() {
  const cacheKey = "realizado";
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let data;
  if (process.env.DATA_SOURCE === "sheets") {
    const rows = await fetchSheetRows(process.env.SHEET_RANGE_REALIZADO);
    data = rowsToObjects(rows).map(normalizeRealizadoRow);
  } else {
    data = mockRealizado;
  }

  setCached(cacheKey, data);
  return data;
}

export async function getPlanejamento() {
  const cacheKey = "planejamento";
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let data;
  if (process.env.DATA_SOURCE === "sheets") {
    const rows = await fetchSheetRows(process.env.SHEET_RANGE_PLANEJAMENTO);
    data = rowsToObjects(rows).map(normalizePlanejamentoRow);
  } else {
    data = mockPlanejamento;
  }

  setCached(cacheKey, data);
  return data;
}

// Aba "Período de Veiculação por campanha": Campanha | Data de início | Data de Fim | Tipo de mídia
function normalizePeriodoRow(row) {
  return {
    campanha: row["Campanha"],
    dataInicio: parseBRDate(row["Data de início"]),
    dataFim: parseBRDate(row["Data de Fim"]),
    tipoMidia: (row["Tipo de mídia"] || "").toLowerCase(), // "online" | "offline"
  };
}

export async function getPeriodosVeiculacao() {
  const cacheKey = "periodos-veiculacao";
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let data;
  if (process.env.DATA_SOURCE === "sheets") {
    const rows = await fetchSheetRows("Período de Veiculação por campanha!A:D");
    data = rowsToObjects(rows).map(normalizePeriodoRow).filter((r) => r.campanha && r.dataFim);
  } else {
    data = [];
  }

  setCached(cacheKey, data);
  return data;
}

export async function getRealizadoDetalhado() {
  const cacheKey = "realizado-detalhado";
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let data;
  if (process.env.DATA_SOURCE === "sheets") {
    const rows = await fetchSheetRows(process.env.SHEET_RANGE_REALIZADO);
    data = rowsToObjects(rows).map(normalizeCriativoRow);
  } else {
    data = [];
  }

  setCached(cacheKey, data);
  return data;
}
