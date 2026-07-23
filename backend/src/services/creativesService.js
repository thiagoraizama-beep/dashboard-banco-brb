import { query } from "../config/database.js";
import { getCloudinaryClient } from "../config/cloudinary.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import { scopeVeiculoFilter, scopeCampanhaFilter } from "../utils/scopeFilter.js";

export const STATUSES = [
  "Não registrado",
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

// Ids dos vinculos (campanha_veiculos) do usuario que tem acesso a Matriz de Conteudo.
function vinculoIdsComAcessoMatriz(user) {
  const escopos = Array.isArray(user.escopos) ? user.escopos : [];
  return escopos.filter((e) => e.acessoMatriz === true).map((e) => e.campanhaVeiculoId);
}

export async function listCreatives(user) {
  const veiculos = veiculosVisiveis(user);
  if (veiculos) {
    const vinculoIds = vinculoIdsComAcessoMatriz(user);
    const campanhas = scopeCampanhaFilter(user, null);
    if (campanhas) {
      // Isolamento por vinculo: criativos com campanha_veiculo_id so aparecem para
      // quem tem aquele vinculo especifico (com acessoMatriz). Criativos legados
      // (campanha_veiculo_id nulo) caem no fallback por string veiculo+campanha.
      const { rows } = await query(
        `SELECT * FROM creatives
         WHERE (campanha_veiculo_id = ANY($1))
            OR (campanha_veiculo_id IS NULL AND veiculo = ANY($2) AND campanha = ANY($3))
         ORDER BY criado_em DESC`,
        [vinculoIds, veiculos, campanhas]
      );
      return rows;
    }
    const { rows } = await query(
      `SELECT * FROM creatives
       WHERE (campanha_veiculo_id = ANY($1))
          OR (campanha_veiculo_id IS NULL AND veiculo = ANY($2))
       ORDER BY criado_em DESC`,
      [vinculoIds, veiculos]
    );
    return rows;
  }
  const { rows } = await query("SELECT * FROM creatives ORDER BY criado_em DESC");
  return rows;
}

// Cruza um Ad Name da planilha com o criativo cadastrado na Matriz de Conteudo,
// do mais especifico para o mais permissivo -- evita casar o criativo de um
// vendor/campanha com o Ad Name (as vezes repetido) de outro:
// 1. campanha + plataforma(veiculo) + modeloCompra + formato
// 2. campanha + plataforma + modeloCompra (sem formato)
// 3. campanha + plataforma (sem modeloCompra/formato -- dado incompleto na planilha)
// 4. plataforma + formato (sem campanha -- fallback para dados legados/fora do fluxo)
// "veiculo" aqui sempre significou a PLATAFORMA (Meta Ads etc), nao o vendor real
// (Go On Ad Group) -- essa e a granularidade disponivel, o vendor real so e isolado
// de fato pelo campanha_veiculo_id (Etapa 5 do isolamento por vinculo).
// Roda uma tier de busca e so retorna resultado quando ha exatamente 1 match --
// se vierem 2+ (ex: mesmo Ad Name cadastrado em Feed e Stories na mesma campanha)
// e esta tier nao filtra por formato, e ambiguo demais para escolher um dos dois
// sem risco de mostrar o nome/formato errado -- melhor deixar sem match (a proxima
// tier mais especifica, ou a ausencia de match, resolve isso do lado do caller).
async function matchUnico(sql, params) {
  const { rows } = await query(sql, params);
  return rows.length === 1 ? rows[0] : null;
}

// Cruzamento estrito: Ad Name + Plataforma + Veiculo(vendor real) + Campanha +
// Modelo de Compra + Formato/Posicionamento, todos vindos da linha da planilha.
// Sem qualquer um desses campos, ou sem match unico ao mesmo tempo, nao ha match --
// nenhum fallback mais permissivo, para nao arriscar mostrar o criativo errado
// (ex: cadastro em Stories aparecendo para uma linha de Feed, ou de um vendor
// aparecendo para outro).
// plataforma (ex: "Meta Ads") casa com creatives.plataforma; vendedor (ex: "Go On Ad
// Group", vindo da coluna "Veiculo" da planilha) casa com creatives.veiculo, que e
// como o formulario de cadastro da Matriz salva o vendor selecionado.
// Formato comparado sem diferenciar maiusculas/minusculas (planilha manda "FEED",
// cadastro tem "Feed").
export async function findCreativeByAdName(adName, plataforma, vendedor, formato, campanha, modeloCompra) {
  if (!adName || !plataforma || !vendedor || !formato || !campanha || !modeloCompra) return null;
  const normalized = adName.replace(/\s+/g, " ").trim();
  const adNameMatch = "REGEXP_REPLACE(ad_name, '\\s+', ' ', 'g') = $1";

  return matchUnico(
    `SELECT * FROM creatives WHERE ${adNameMatch} AND plataforma = $2 AND veiculo = $3 AND campanha = $4 AND $5 = ANY(tipos_compra) AND UPPER(formato) = UPPER($6)`,
    [normalized, plataforma, vendedor, campanha, modeloCompra, formato]
  );
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
  campanhaVeiculoId,
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
       cloudinary_public_id, cloudinary_url, tipo_midia, criado_por, campanha_veiculo_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
     RETURNING *`,
    [
      nome, adName?.trim() || null, campanha, campaignName || null, conjunto || null,
      descricao || null, observacoes || null, periodoInicio || null, periodoFim || null,
      veiculo, plataforma || null, formato || null, posicionamento || null,
      urlDestino || null, impulsionado !== false, segmentacao || null, titulo || null,
      tiposCompra?.length ? tiposCompra : [],
      publicId, secureUrl, tipoMidia, criadoPor, campanhaVeiculoId || null,
    ]
  );
  return rows[0];
}

export async function updateCreative(id, {
  file,
  nome, adName, campanha, campaignName, conjunto, descricao, observacoes,
  periodoInicio, periodoFim, veiculo, plataforma, formato, posicionamento,
  urlDestino, impulsionado, segmentacao, titulo, tiposCompra, campanhaVeiculoId,
}) {
  let midiaFields = { publicId: null, secureUrl: null, tipoMidia: null };
  let creativeAntigo = null;

  if (file) {
    creativeAntigo = await getCreativeById(id);
    const upload = await uploadToCloudinary(file.buffer, file.mimetype, process.env.CLOUDINARY_CREATIVES_FOLDER);
    midiaFields = {
      publicId: upload.public_id,
      secureUrl: upload.secure_url,
      tipoMidia: upload.resource_type === "video" ? "video" : "image",
    };
  }

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
      campanha_veiculo_id = COALESCE($20, campanha_veiculo_id),
      cloudinary_public_id = COALESCE($21, cloudinary_public_id),
      cloudinary_url = COALESCE($22, cloudinary_url),
      tipo_midia = COALESCE($23, tipo_midia),
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
      campanhaVeiculoId || null,
      midiaFields.publicId, midiaFields.secureUrl, midiaFields.tipoMidia,
    ]
  );

  // So apaga a midia antiga do Cloudinary depois que a troca no banco foi confirmada.
  if (file && creativeAntigo?.cloudinary_public_id) {
    const cloudinary = getCloudinaryClient();
    await cloudinary.uploader.destroy(creativeAntigo.cloudinary_public_id, {
      resource_type: creativeAntigo.tipo_midia === "video" ? "video" : "image",
    });
  }

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
    const temPosse = creative.campanha_veiculo_id
      ? vinculoIdsComAcessoMatriz(user).includes(creative.campanha_veiculo_id)
      : (scopeVeiculoFilter(user, null) || []).includes(creative.veiculo);
    if (!temPosse) {
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
