import { query } from "../config/database.js";
import { getCloudinaryClient } from "../config/cloudinary.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import { scopeVeiculoFilter, scopeCampanhaFilter } from "../utils/scopeFilter.js";

export const STATUSES = [
  "Em veiculação",
  "Com erro",
  "Programado",
  "Pausado",
  "Em aprovação",
  "Aprovado",
  "Aguardando implementação",
  "Ativo",
  "Interrompido",
  "Finalizado",
];

export const STATUSES_VEICULO = [
  "Em veiculação",
  "Programado",
  "Pausado",
  "Com erro",
  "Interrompido",
  "Finalizado",
];

function veiculosVisiveis(user) {
  if (user.papel === "veiculo") return scopeVeiculoFilter(user, null);
  return null;
}

export async function listCreatives(user) {
  const veiculos = veiculosVisiveis(user);
  if (veiculos) {
    const campanhas = scopeCampanhaFilter(user, null);
    if (campanhas) {
      const { rows } = await query(
        "SELECT * FROM creatives WHERE veiculo = ANY($1) AND campanha = ANY($2) ORDER BY criado_em DESC",
        [veiculos, campanhas]
      );
      return rows;
    }
    const { rows } = await query(
      "SELECT * FROM creatives WHERE veiculo = ANY($1) ORDER BY criado_em DESC",
      [veiculos]
    );
    return rows;
  }
  const { rows } = await query("SELECT * FROM creatives ORDER BY criado_em DESC");
  return rows;
}

export async function findCreativeByAdNameOnly(adName) {
  if (!adName) return null;
  const normalized = adName.replace(/\s+/g, " ").trim();
  // Tenta match exato normalizado primeiro, depois por replace de whitespace no banco
  const { rows } = await query(
    `SELECT * FROM creatives
     WHERE REPLACE(REPLACE(REPLACE(ad_name, E'\\n', ' '), E'\\r', ''), '  ', ' ') = $1
        OR TRIM(ad_name) = $1
        OR ad_name = $2
     ORDER BY criado_em DESC LIMIT 1`,
    [normalized, adName]
  );
  return rows[0] || null;
}

export async function findCreativeByAdName(adName, veiculo, formato) {
  if (!adName) return null;
  const normalized = adName.replace(/\s+/g, " ").trim();
  if (formato) {
    const { rows } = await query(
      "SELECT * FROM creatives WHERE REGEXP_REPLACE(ad_name, '\\s+', ' ', 'g') = $1 AND veiculo = $2 AND formato = $3 ORDER BY criado_em DESC LIMIT 1",
      [normalized, veiculo, formato]
    );
    if (rows[0]) return rows[0];
  }
  const { rows } = await query(
    "SELECT * FROM creatives WHERE REGEXP_REPLACE(ad_name, '\\s+', ' ', 'g') = $1 AND veiculo = $2 ORDER BY criado_em DESC LIMIT 1",
    [normalized, veiculo]
  );
  return rows[0] || null;
}

export async function getCreativeById(id) {
  const { rows } = await query("SELECT * FROM creatives WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function createCreative({
  file, cloudinaryUrl, cloudinaryPublicId, tipoMidia: tipoMidiaParam,
  nome, adName, campanha, campaignName, conjunto, descricao, observacoes,
  periodoInicio, periodoFim, veiculo, plataforma, formato, posicionamento,
  urlDestino, impulsionado, segmentacao, titulo, tiposCompra, criadoPor,
}) {
  let publicId, secureUrl, tipoMidia;
  if (file) {
    const upload = await uploadToCloudinary(file.buffer, file.mimetype, process.env.CLOUDINARY_CREATIVES_FOLDER);
    publicId = upload.public_id;
    secureUrl = upload.secure_url;
    tipoMidia = upload.resource_type === "video" ? "video" : "image";
  } else {
    publicId = cloudinaryPublicId;
    secureUrl = cloudinaryUrl;
    tipoMidia = tipoMidiaParam || "image";
  }

  const { rows } = await query(
    `INSERT INTO creatives
      (nome, ad_name, campanha, campaign_name, conjunto, descricao, observacoes,
       periodo_inicio, periodo_fim, veiculo, plataforma, formato, posicionamento,
       url_destino, impulsionado, segmentacao, titulo, tipos_compra,
       cloudinary_public_id, cloudinary_url, tipo_midia, criado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
     RETURNING *`,
    [
      nome, adName?.trim() || null, campanha, campaignName || null, conjunto || null,
      descricao || null, observacoes || null, periodoInicio || null, periodoFim || null,
      veiculo, plataforma || null, formato || null, posicionamento || null,
      urlDestino || null, impulsionado !== false, segmentacao || null, titulo || null,
      tiposCompra?.length ? tiposCompra : [],
      publicId, secureUrl, tipoMidia, criadoPor,
    ]
  );
  return rows[0];
}

export async function updateCreative(id, {
  nome, adName, campanha, campaignName, conjunto, descricao, observacoes,
  periodoInicio, periodoFim, veiculo, plataforma, formato, posicionamento,
  urlDestino, impulsionado, segmentacao, titulo, tiposCompra,
}) {
  const { rows } = await query(
    `UPDATE creatives SET
      nome = COALESCE($2, nome),
      ad_name = COALESCE($3, ad_name),
      campanha = COALESCE($4, campanha),
      campaign_name = COALESCE($5, campaign_name),
      conjunto = COALESCE($6, conjunto),
      descricao = COALESCE($7, descricao),
      observacoes = COALESCE($8, observacoes),
      periodo_inicio = COALESCE($9, periodo_inicio),
      periodo_fim = COALESCE($10, periodo_fim),
      veiculo = COALESCE($11, veiculo),
      plataforma = $12,
      formato = COALESCE($13, formato),
      posicionamento = COALESCE($14, posicionamento),
      url_destino = $15,
      impulsionado = COALESCE($16, impulsionado),
      segmentacao = $17,
      titulo = $18,
      tipos_compra = COALESCE($19, tipos_compra),
      atualizado_em = now()
     WHERE id = $1
     RETURNING *`,
    [
      id, nome, adName?.trim() || null, campanha, campaignName, conjunto, descricao, observacoes,
      periodoInicio, periodoFim, veiculo,
      plataforma || null, formato || null, posicionamento || null, urlDestino || null,
      impulsionado !== undefined ? impulsionado : null,
      segmentacao || null, titulo || null,
      tiposCompra?.length ? tiposCompra : null,
    ]
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
  const validStatuses = user.papel === "veiculo" ? STATUSES_VEICULO : STATUSES;
  if (!validStatuses.includes(novoStatus)) {
    const err = new Error("Status inválido para seu perfil");
    err.statusCode = 403;
    throw err;
  }

  const creative = await getCreativeById(id);
  if (!creative) return null;

  if (user.papel === "veiculo") {
    const plataformasPermitidas = scopeVeiculoFilter(user, null) || [];
    if (!plataformasPermitidas.includes(creative.veiculo)) {
      const err = new Error("Você não tem permissão para alterar este criativo");
      err.statusCode = 403;
      throw err;
    }
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
