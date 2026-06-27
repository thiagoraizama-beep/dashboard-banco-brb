import { getAnalyticsDataClient } from "../config/googleAnalytics.js";
import { getGA4SourcesEquivalentes, getGA4CampaignsEquivalentes } from "../utils/ga4Aliases.js";

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

// Cruza os filtros de veiculo/campanha do dashboard com as dimensoes de UTM do GA4
// (sessionSource = utm_source, sessionCampaignName = utm_campaign), traduzindo os nomes
// legiveis do dashboard para os slugs reais via ga4Aliases.js.
// Nota: a tag de campanha do Instagram esta quebrada (vem como ID do anuncio em vez do
// nome), entao filtrar veiculo=Meta junto com uma campanha especifica pode zerar o Meta.
function buildDimensionFilter(veiculo, campanha) {
  const expressions = [];
  const veiculos = Array.isArray(veiculo) ? veiculo : veiculo ? [veiculo] : [];
  const campanhas = Array.isArray(campanha) ? campanha : campanha ? [campanha] : [];

  if (veiculos.length) {
    const sources = veiculos.flatMap((v) => getGA4SourcesEquivalentes(v));
    expressions.push({ filter: { fieldName: "sessionSource", inListFilter: { values: sources } } });
  }
  if (campanhas.length) {
    const campaigns = campanhas.flatMap((c) => getGA4CampaignsEquivalentes(c));
    expressions.push({ filter: { fieldName: "sessionCampaignName", inListFilter: { values: campaigns } } });
  }

  if (expressions.length === 0) return undefined;
  if (expressions.length === 1) return expressions[0];
  return { andGroup: { expressions } };
}

// Retorna null quando GA4_PROPERTY_ID nao esta configurado, para o chamador decidir o fallback.
export async function getSiteMetricsFromGA4(start, end, veiculo, campanha) {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) return null;

  const cacheKey = JSON.stringify({ start, end, veiculo, campanha });
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const analyticsData = getAnalyticsDataClient();
  const dimensionFilter = buildDimensionFilter(veiculo, campanha);

  const { data } = await analyticsData.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: start, endDate: end }],
      metrics: [{ name: "sessions" }, { name: "averageSessionDuration" }],
      ...(dimensionFilter ? { dimensionFilter } : {}),
    },
  });

  const row = data.rows?.[0];
  const result = {
    sessoes: row ? Number(row.metricValues[0].value) : 0,
    tempoMedioSegundos: row ? Math.round(Number(row.metricValues[1].value)) : 0,
  };

  setCached(cacheKey, result);
  return result;
}
