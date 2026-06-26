const INACTIVITY_THRESHOLD_DAYS = 10;

// Recebe a data (string YYYY-MM-DD) mais recente com dados de uma campanha
// e retorna se ela deve ser considerada ativa, com base na regra dos 10 dias.
export function getCampaignStatus(lastDataDate, referenceDate = new Date()) {
  if (!lastDataDate) return "inativo";

  const last = new Date(lastDataDate);
  const diffMs = referenceDate.getTime() - last.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays > INACTIVITY_THRESHOLD_DAYS ? "inativo" : "ativo";
}
