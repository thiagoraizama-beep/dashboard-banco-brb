import axios from "axios";

// Serializa arrays como "chave=valor1&chave=valor2" (sem o "[]" que o axios usa por padrao).
// Necessario porque na Vercel o req.query e populado pelo parser nativo do Node antes do
// Express, e esse parser nao entende a notacao "chave[]=valor" para arrays.
function serializeParams(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, item));
    } else {
      search.append(key, value);
    }
  }
  return search.toString();
}

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  paramsSerializer: { serialize: serializeParams },
});

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

export function getPublicAvatar(email) {
  return api.get("/auth/avatar", { params: { email } }).then((r) => r.data);
}

export function requestPasswordReset(email) {
  return api.post("/auth/password-reset/request", { email }).then((r) => r.data);
}

export function validateResetToken(token) {
  return api.get("/auth/password-reset/validate", { params: { token } }).then((r) => r.data);
}

export function confirmPasswordReset(token, novaSenha) {
  return api.post("/auth/password-reset/confirm", { token, novaSenha }).then((r) => r.data);
}

export function getUsers() {
  return api.get("/auth/users").then((r) => r.data);
}

export function createUserAccount(payload) {
  return api.post("/auth/users", payload).then((r) => r.data);
}

export function deleteUserAccount(id) {
  return api.delete(`/auth/users/${id}`).then((r) => r.data);
}

export function updateUserRoleAccount(id, payload) {
  return api.put(`/auth/users/${id}/role`, payload).then((r) => r.data);
}

export function updateUserAccount(id, payload) {
  return api.put(`/auth/users/${id}`, payload).then((r) => r.data);
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

// Parceiros (empresas veiculadoras)
export function getParceiros() {
  return api.get("/parceiros").then((r) => r.data);
}

export function createParceiro(payload) {
  return api.post("/parceiros", payload).then((r) => r.data);
}

export function updateParceiro(id, payload) {
  return api.put(`/parceiros/${id}`, payload).then((r) => r.data);
}

export function deleteParceiro(id) {
  return api.delete(`/parceiros/${id}`).then((r) => r.data);
}

export function upsertEscopoParaceiro(parceiroId, payload) {
  return api.put(`/parceiros/${parceiroId}/escopos`, payload).then((r) => r.data);
}

export function deleteEscopoParceiroById(escopoId) {
  return api.delete(`/parceiros/escopos/${escopoId}`).then((r) => r.data);
}

// Campanhas
export function getCampanhas() {
  return api.get("/campanhas").then((r) => r.data);
}

export function createCampanha(nome) {
  return api.post("/campanhas", { nome }).then((r) => r.data);
}

export function updateCampanhaNome(id, nome) {
  return api.put(`/campanhas/${id}`, { nome }).then((r) => r.data);
}

export function deleteCampanha(id) {
  return api.delete(`/campanhas/${id}`).then((r) => r.data);
}

export function upsertCampanhaVeiculo(campanhaId, vehicleId, plataformas, tipoMidia) {
  return api.put(`/campanhas/${campanhaId}/veiculos`, { vehicleId, plataformas, tipoMidia }).then((r) => r.data);
}

export function deleteCampanhaVeiculo(vinculoId) {
  return api.delete(`/campanhas/veiculos/${vinculoId}`).then((r) => r.data);
}

// Plataformas
export function getPlataformas() {
  return api.get("/plataformas").then((r) => r.data);
}

export function createPlataforma(payload) {
  return api.post("/plataformas", payload).then((r) => r.data);
}

export function updatePlataforma(id, payload) {
  return api.put(`/plataformas/${id}`, payload).then((r) => r.data);
}

export function deletePlataforma(id) {
  return api.delete(`/plataformas/${id}`).then((r) => r.data);
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
