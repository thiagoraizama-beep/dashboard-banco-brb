import { query } from "../config/database.js";
import { getCloudinaryClient } from "../config/cloudinary.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

const STATUSES = [
  "Em veiculação",
  "Com erro",
  "Programado",
  "Pausado",
  "Em aprovação",
  "Aprovado",
  "Aguardando implementação",
  "Ativo",
];

// Veiculos visiveis para o usuario: agencia e cliente veem tudo (null = sem filtro),
// veiculo so ve a propria lista de veiculos vinculada a conta.
function veiculosVisiveis(user) {
  if (user.papel === "veiculo") return user.veiculos || [];
  return null;
}

export async function listCreatives(user) {
  const veiculos = veiculosVisiveis(user);
  if (veiculos) {
    const { rows } = await query(
      "SELECT * FROM creatives WHERE veiculo = ANY($1) ORDER BY criado_em DESC",
      [veiculos]
    );
    return rows;
  }
  const { rows } = await query("SELECT * FROM creatives ORDER BY criado_em DESC");
  return rows;
}

// Usado pela Analise por Criativo para vincular a midia cadastrada na Matriz
// de Conteudo a uma linha de performance da planilha (cruzamento por Ad Name + veiculo).
export async function findCreativeByAdName(adName, veiculo) {
  if (!adName) return null;
  const { rows } = await query(
    "SELECT * FROM creatives WHERE ad_name = $1 AND veiculo = $2 ORDER BY criado_em DESC LIMIT 1",
    [adName, veiculo]
  );
  return rows[0] || null;
}

export async function getCreativeById(id) {
  const { rows } = await query("SELECT * FROM creatives WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function createCreative({
  file,
  nome,
  adName,
  campanha,
  conjunto,
  descricao,
  observacoes,
  periodoInicio,
  periodoFim,
  veiculo,
  criadoPor,
}) {
  const upload = await uploadToCloudinary(file.buffer, file.mimetype, process.env.CLOUDINARY_CREATIVES_FOLDER);
  const tipoMidia = upload.resource_type === "video" ? "video" : "image";

  const { rows } = await query(
    `INSERT INTO creatives
      (nome, ad_name, campanha, conjunto, descricao, observacoes, periodo_inicio, periodo_fim, veiculo, cloudinary_public_id, cloudinary_url, tipo_midia, criado_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      nome,
      adName || null,
      campanha,
      conjunto || null,
      descricao || null,
      observacoes || null,
      periodoInicio || null,
      periodoFim || null,
      veiculo,
      upload.public_id,
      upload.secure_url,
      tipoMidia,
      criadoPor,
    ]
  );
  return rows[0];
}

export async function updateCreative(
  id,
  { nome, adName, campanha, conjunto, descricao, observacoes, periodoInicio, periodoFim, veiculo }
) {
  const { rows } = await query(
    `UPDATE creatives SET
      nome = COALESCE($2, nome),
      ad_name = COALESCE($3, ad_name),
      campanha = COALESCE($4, campanha),
      conjunto = COALESCE($5, conjunto),
      descricao = COALESCE($6, descricao),
      observacoes = COALESCE($7, observacoes),
      periodo_inicio = COALESCE($8, periodo_inicio),
      periodo_fim = COALESCE($9, periodo_fim),
      veiculo = COALESCE($10, veiculo),
      atualizado_em = now()
     WHERE id = $1
     RETURNING *`,
    [id, nome, adName, campanha, conjunto, descricao, observacoes, periodoInicio, periodoFim, veiculo]
  );
  return rows[0] || null;
}

export async function deleteCreative(id) {
  const creative = await getCreativeById(id);
  if (!creative) return false;

  const cloudinary = getCloudinaryClient();
  await cloudinary.uploader.destroy(creative.cloudinary_public_id, {
    resource_type: creative.tipo_midia === "video" ? "video" : "image",
  });
  await query("DELETE FROM creatives WHERE id = $1", [id]);
  return true;
}

export async function updateStatus(id, novoStatus, user) {
  if (!STATUSES.includes(novoStatus)) {
    throw new Error("Status inválido");
  }

  const creative = await getCreativeById(id);
  if (!creative) return null;

  if (user.papel === "veiculo" && !(user.veiculos || []).includes(creative.veiculo)) {
    const err = new Error("Você não tem permissão para alterar este criativo");
    err.statusCode = 403;
    throw err;
  }

  const { rows } = await query(
    `UPDATE creatives SET status = $2, atualizado_em = now() WHERE id = $1 RETURNING *`,
    [id, novoStatus]
  );

  await query(
    `INSERT INTO creative_status_history (creative_id, status_anterior, status_novo, alterado_por)
     VALUES ($1, $2, $3, $4)`,
    [id, creative.status, novoStatus, user.id]
  );

  return rows[0];
}

export async function getStatusHistory(id) {
  const { rows } = await query(
    `SELECT h.*, u.nome AS alterado_por_nome
     FROM creative_status_history h
     JOIN users u ON u.id = h.alterado_por
     WHERE h.creative_id = $1
     ORDER BY h.alterado_em DESC`,
    [id]
  );
  return rows;
}

export { STATUSES };
