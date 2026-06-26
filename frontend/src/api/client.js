import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export function getMediaSummary(range, isFiltered, campanha, veiculo, modeloCompra) {
  return api
    .get("/media/summary", { params: { ...range, isFiltered, campanha, veiculo, modeloCompra } })
    .then((r) => r.data);
}

export function getCampaignStatus() {
  return api.get("/media/campaign-status").then((r) => r.data);
}

export function getPerformanceSeries(range, metrics, campanha, veiculo, modeloCompra) {
  return api
    .get("/media/performance", { params: { ...range, metrics: metrics?.join(","), campanha, veiculo, modeloCompra } })
    .then((r) => r.data);
}

export function getSiteSummary(range, campanha, veiculo) {
  return api.get("/site/summary", { params: { ...range, campanha, veiculo } }).then((r) => r.data);
}

export function getDealsProgress(range, campanha, veiculo, modeloCompra) {
  return api.get("/deals/progress", { params: { ...range, campanha, veiculo, modeloCompra } }).then((r) => r.data);
}

export function getVehicles(range, campanha, veiculo, modeloCompra) {
  return api.get("/deals/vehicles", { params: { ...range, campanha, veiculo, modeloCompra } }).then((r) => r.data);
}

export function getOfflineFilterOptions() {
  return api.get("/offline-media/filter-options").then((r) => r.data);
}

export function getOfflineSummary(filters) {
  return api.get("/offline-media/summary", { params: filters }).then((r) => r.data);
}

export function getOfflineCategories(filters) {
  return api.get("/offline-media/categories", { params: filters }).then((r) => r.data);
}

export function getProgramacoes(range) {
  return api.get("/programacoes", { params: range }).then((r) => r.data);
}

export function getProgramasList() {
  return api.get("/programacoes/programas").then((r) => r.data);
}

export function createProgramacao(payload) {
  return api.post("/programacoes", payload).then((r) => r.data);
}

export function updateProgramacao(id, payload) {
  return api.put(`/programacoes/${id}`, payload).then((r) => r.data);
}

export function deleteProgramacao(id) {
  return api.delete(`/programacoes/${id}`).then((r) => r.data);
}

export function getCreativeFilterOptions(veiculo) {
  return api.get(`/creative-analysis/${veiculo}/filter-options`).then((r) => r.data);
}

export function getCreativeSummary(veiculo, filters) {
  return api.get(`/creative-analysis/${veiculo}/summary`, { params: filters }).then((r) => r.data);
}

export function getCreatives(veiculo, filters) {
  return api.get(`/creative-analysis/${veiculo}/creatives`, { params: filters }).then((r) => r.data);
}

export function getCreativeSeries(veiculo, adName, filters) {
  return api
    .get(`/creative-analysis/${veiculo}/creatives/${encodeURIComponent(adName)}/series`, { params: filters })
    .then((r) => r.data);
}
