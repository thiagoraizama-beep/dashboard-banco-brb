import axios from "axios";

const api = axios.create({ baseURL: "/api", withCredentials: true });

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

export function login(email, senha) {
  return api.post("/auth/login", { email, senha }).then((r) => r.data);
}

export function logout() {
  return api.post("/auth/logout").then((r) => r.data);
}

export function getMe() {
  return api.get("/auth/me").then((r) => r.data);
}

export function getUsers() {
  return api.get("/auth/users").then((r) => r.data);
}

export function createUserAccount(payload) {
  return api.post("/auth/users", payload).then((r) => r.data);
}

export function changeMyPassword(senhaAtual, novaSenha) {
  return api.put("/auth/me/password", { senhaAtual, novaSenha }).then((r) => r.data);
}

export function updateMyProfile(formData) {
  return api.put("/auth/me", formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
}

export function getMatrixCreatives() {
  return api.get("/creatives").then((r) => r.data);
}

export function getCreativeHistory(id) {
  return api.get(`/creatives/${id}/history`).then((r) => r.data);
}

export function createMatrixCreative(formData) {
  return api.post("/creatives", formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
}

export function updateMatrixCreative(id, payload) {
  return api.put(`/creatives/${id}`, payload).then((r) => r.data);
}

export function deleteMatrixCreative(id) {
  return api.delete(`/creatives/${id}`).then((r) => r.data);
}

export function updateMatrixCreativeStatus(id, status) {
  return api.patch(`/creatives/${id}/status`, { status }).then((r) => r.data);
}

export function getRegisteredVehicles() {
  return api.get("/vehicles").then((r) => r.data);
}

export function createVehicle(formData) {
  return api.post("/vehicles", formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
}

export function updateVehicle(id, formData) {
  return api.put(`/vehicles/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
}

export function deleteVehicle(id) {
  return api.delete(`/vehicles/${id}`).then((r) => r.data);
}
