import { getSheetsClient } from "../config/googleSheets.js";
import { matchesFilter } from "../utils/filterUtils.js";

const CACHE_TTL_MS = 60_000;
let cache = null;
let cacheTimestamp = 0;

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

function parseBRNumber(value) {
  if (!value) return 0;
  return Number(String(value).replace(/\./g, "").replace(",", ".")) || 0;
}

function normalizeRow(row) {
  return {
    veiculo: row.Veiculo,
    praca: row["Praça"],
    programa: row.Programa,
    insercoes: parseBRNumber(row["Inserções"]),
    custo: parseBRNumber(row.Custo),
    categoria: row.Categoria,
    estado: row.Estado,
    campanha: row.Campanha,
  };
}

async function fetchSheetRows(range) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SHEET_ID;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return res.data.values || [];
}

async function getAllRows() {
  if (cache && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cache;
  }

  let data;
  if (process.env.DATA_SOURCE === "sheets") {
    const rows = await fetchSheetRows("CONSOLIDADA - MÍDIA OFF!A:H");
    data = rowsToObjects(rows).map(normalizeRow);
  } else {
    data = [];
  }

  cache = data;
  cacheTimestamp = Date.now();
  return data;
}

function applyFilters(rows, { categoria, praca, veiculo, campanha }) {
  return rows.filter(
    (r) =>
      matchesFilter(r.categoria, categoria) &&
      matchesFilter(r.praca, praca) &&
      matchesFilter(r.veiculo, veiculo) &&
      matchesFilter(r.campanha, campanha)
  );
}

export async function getFilterOptions() {
  const rows = await getAllRows();
  const categorias = [...new Set(rows.map((r) => r.categoria))].filter(Boolean).sort();
  const pracas = [...new Set(rows.map((r) => r.praca))].filter(Boolean).sort();
  const veiculos = [...new Set(rows.map((r) => r.veiculo))].filter(Boolean).sort();
  const campanhas = [...new Set(rows.map((r) => r.campanha))].filter(Boolean).sort();
  return { categorias, pracas, veiculos, campanhas };
}

export async function getSummary(filters) {
  const rows = applyFilters(await getAllRows(), filters);

  const categorias = new Set();
  const veiculos = new Set();
  let investimento = 0;
  let entrega = 0;

  for (const r of rows) {
    categorias.add(r.categoria);
    veiculos.add(r.veiculo);
    investimento += r.custo;
    entrega += r.insercoes;
  }

  return {
    categorias: categorias.size,
    veiculos: veiculos.size,
    investimento,
    entrega,
  };
}

// Hierarquia: Categoria -> Estado/Praça -> linhas de veiculo/programa.
export async function getCategoriesBreakdown(filters) {
  const rows = applyFilters(await getAllRows(), filters);

  const byCategoria = new Map();
  for (const r of rows) {
    if (!byCategoria.has(r.categoria)) {
      byCategoria.set(r.categoria, { categoria: r.categoria, entrega: 0, investimento: 0, estados: new Map() });
    }
    const cat = byCategoria.get(r.categoria);
    cat.entrega += r.insercoes;
    cat.investimento += r.custo;

    if (!cat.estados.has(r.estado)) {
      cat.estados.set(r.estado, { estado: r.estado, entrega: 0, investimento: 0, linhas: [] });
    }
    const estado = cat.estados.get(r.estado);
    estado.entrega += r.insercoes;
    estado.investimento += r.custo;
    estado.linhas.push({
      veiculo: r.veiculo,
      praca: r.praca,
      programa: r.programa,
      entrega: r.insercoes,
      investimento: r.custo,
    });
  }

  return Array.from(byCategoria.values()).map((cat) => ({
    ...cat,
    estados: Array.from(cat.estados.values()),
  }));
}
