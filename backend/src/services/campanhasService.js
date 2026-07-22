import { query } from "../config/database.js";

// Status efetivo: se data_fim ja passou, a campanha esta "finalizado" independente
// do status salvo -- data vencida tem prioridade sobre status manual (Pausada/Em
// analise/Ativa nao "seguram" uma campanha cuja data fim ja passou).
function statusEfetivo(row) {
  if (row.data_fim && new Date(row.data_fim) < new Date(new Date().toDateString())) {
    return "finalizado";
  }
  return row.status;
}

function toPublicCampanha(row) {
  return { ...row, status: statusEfetivo(row) };
}

// Retorna campanhas com os veículos, plataformas e metas de contratado vinculados
export async function listCampanhas() {
  const { rows: campanhas } = await query(
    "SELECT * FROM campanhas ORDER BY nome ASC"
  );

  const { rows: vinculos } = await query(`
    SELECT cv.*, v.nome AS veiculo_nome, v.logo_url, v.plataformas AS plataformas_veiculo, v.tipo
    FROM campanha_veiculos cv
    JOIN vehicles v ON v.id = cv.vehicle_id
    ORDER BY v.nome ASC
  `);

  const { rows: metas } = await query("SELECT * FROM campanha_veiculo_metas");

  return campanhas.map((c) => ({
    ...toPublicCampanha(c),
    veiculos: vinculos
      .filter((v) => v.campanha_id === c.id)
      .map((v) => ({
        id: v.id,
        vehicleId: v.vehicle_id,
        nome: v.veiculo_nome,
        logoUrl: v.logo_url,
        tipo: v.tipo,
        tipoMidia: v.tipo_midia,
        plataformas: v.plataformas,
        plataformasVeiculo: v.plataformas_veiculo,
        acessoAnaliseCriativo: v.acesso_analise_criativo,
        acessoMatriz: v.acesso_matriz,
        plataformasAnaliseCriativo: v.plataformas_analise_criativo,
        metas: metas
          .filter((m) => m.campanha_veiculo_id === v.id)
          .map((m) => ({
            id: m.id,
            plataforma: m.plataforma,
            quantidadeContratada: Number(m.quantidade_contratada),
            modeloCompra: m.modelo_compra,
            dataInicio: m.data_inicio,
            dataFim: m.data_fim,
          })),
      })),
  }));
}

export async function getCampanhaById(id) {
  const { rows } = await query("SELECT * FROM campanhas WHERE id = $1", [id]);
  return rows[0] ? toPublicCampanha(rows[0]) : null;
}

export async function createCampanha(nome, { dataInicio, dataFim } = {}) {
  const { rows } = await query(
    "INSERT INTO campanhas (nome, data_inicio, data_fim) VALUES ($1, $2, $3) RETURNING *",
    [nome, dataInicio || null, dataFim || null]
  );
  return { ...toPublicCampanha(rows[0]), veiculos: [] };
}

export async function updateCampanhaNome(id, nome, { dataInicio, dataFim } = {}) {
  const { rows } = await query(
    `UPDATE campanhas SET
      nome = $2,
      data_inicio = COALESCE($3, data_inicio),
      data_fim = COALESCE($4, data_fim)
     WHERE id = $1 RETURNING *`,
    [id, nome, dataInicio || null, dataFim || null]
  );
  return rows[0] ? toPublicCampanha(rows[0]) : null;
}

// Resolve o Property ID do GA4 a usar para um filtro de campanha do Dashboard.
// So retorna um valor quando o filtro aponta para exatamente UMA campanha e ela tem
// property vinculada -- sem filtro, com varias campanhas, ou campanha sem vinculo,
// retorna null (o chamador mostra "Sem dados" em vez de misturar properties diferentes
// ou usar uma property "padrao" que pode nao ter nada a ver com a campanha certa).
export async function resolveGa4PropertyId(campanhaFiltro) {
  const nomes = Array.isArray(campanhaFiltro) ? campanhaFiltro : campanhaFiltro ? [campanhaFiltro] : [];
  if (nomes.length !== 1) return null;
  const { rows } = await query("SELECT ga4_property_id FROM campanhas WHERE nome = $1", [nomes[0]]);
  return rows[0]?.ga4_property_id || null;
}

// Vincula/desvincula o Property ID do GA4 desta campanha (Perfil > Integrações GA4).
// ga4PropertyId null/vazio remove o vinculo -- o card de Sessoes volta a mostrar
// "Sem dados" para essa campanha em vez de tentar consultar uma property inexistente.
export async function updateGa4PropertyId(id, ga4PropertyId) {
  const { rows } = await query(
    "UPDATE campanhas SET ga4_property_id = $2 WHERE id = $1 RETURNING *",
    [id, ga4PropertyId || null]
  );
  return rows[0] ? toPublicCampanha(rows[0]) : null;
}

export async function updateCampanhaStatus(id, status) {
  const { rows } = await query(
    "UPDATE campanhas SET status = $2 WHERE id = $1 RETURNING *",
    [id, status]
  );
  return rows[0] ? toPublicCampanha(rows[0]) : null;
}

export async function deleteCampanha(id) {
  const { rowCount } = await query("DELETE FROM campanhas WHERE id = $1", [id]);
  return rowCount > 0;
}

// Adiciona ou atualiza o vínculo de um veículo numa campanha com suas plataformas,
// o escopo de midia (online/offline/ambos), as permissoes de acesso (Analise por
// Criativo / Matriz de Conteudo) e QUAIS plataformas do vinculo aparecem em
// Analise por Criativo -- tudo contextual a ESTA campanha especifica.
export async function upsertCampanhaVeiculo(campanhaId, vehicleId, plataformas, tipoMidia, permissoes = {}) {
  const acessoAnaliseCriativo = permissoes.acessoAnaliseCriativo !== false;
  const acessoMatriz = permissoes.acessoMatriz !== false;
  const plataformasAnaliseCriativo = acessoAnaliseCriativo ? (permissoes.plataformasAnaliseCriativo || []) : [];
  const { rows } = await query(
    `INSERT INTO campanha_veiculos (campanha_id, vehicle_id, plataformas, tipo_midia, acesso_analise_criativo, acesso_matriz, plataformas_analise_criativo)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (campanha_id, vehicle_id)
     DO UPDATE SET plataformas = EXCLUDED.plataformas, tipo_midia = EXCLUDED.tipo_midia,
       acesso_analise_criativo = EXCLUDED.acesso_analise_criativo, acesso_matriz = EXCLUDED.acesso_matriz,
       plataformas_analise_criativo = EXCLUDED.plataformas_analise_criativo
     RETURNING *`,
    [campanhaId, vehicleId, plataformas, tipoMidia || "online", acessoAnaliseCriativo, acessoMatriz, plataformasAnaliseCriativo]
  );
  return rows[0];
}

export async function deleteCampanhaVeiculo(id) {
  const { rowCount } = await query("DELETE FROM campanha_veiculos WHERE id = $1", [id]);
  return rowCount > 0;
}

// Cadastra/atualiza uma meta (quantidade contratada + periodo) de uma plataforma
// dentro de um vinculo campanha+veiculo, identificada pela combinacao
// plataforma+modeloCompra -- permite que a mesma plataforma tenha varias metas
// simultaneas com modelos de compra diferentes (ex: Meta Ads: CPM + CPC). Chamar de
// novo com o MESMO modelo para a mesma plataforma atualiza a meta existente (upsert);
// com um modelo diferente, cria uma meta adicional.
// data_inicio/data_fim nulos = herda o periodo da campanha (resolvido na leitura, nao aqui).
export async function upsertMetaPlataforma(campanhaVeiculoId, plataforma, { quantidadeContratada, modeloCompra, dataInicio, dataFim }) {
  const { rows } = await query(
    `INSERT INTO campanha_veiculo_metas (campanha_veiculo_id, plataforma, quantidade_contratada, modelo_compra, data_inicio, data_fim)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (campanha_veiculo_id, plataforma, modelo_compra)
     DO UPDATE SET quantidade_contratada = EXCLUDED.quantidade_contratada,
       data_inicio = EXCLUDED.data_inicio, data_fim = EXCLUDED.data_fim
     RETURNING *`,
    [campanhaVeiculoId, plataforma, quantidadeContratada || 0, modeloCompra || "CPM", dataInicio || null, dataFim || null]
  );
  return rows[0];
}

export async function deleteMetaPlataforma(id) {
  const { rowCount } = await query("DELETE FROM campanha_veiculo_metas WHERE id = $1", [id]);
  return rowCount > 0;
}

// Retorna os vinculos (campanha + plataformas + tipo de midia) de um usuario "veiculo",
// baseado nos nomes de veiculo vinculados a conta (user.veiculos).
// As plataformas sao expandidas pelos seus subcanais cadastrados (ex: "Meta Ads" ->
// ["Facebook", "Instagram"]) para bater com os nomes reais usados na planilha/realizado.
export async function getEscoposUsuario(nomeVeiculos) {
  if (!nomeVeiculos?.length) return [];

  const { rows } = await query(
    `SELECT cv.id AS "campanhaVeiculoId", cv.plataformas, cv.tipo_midia AS "tipoMidia",
            cv.acesso_analise_criativo AS "acessoAnaliseCriativo", cv.acesso_matriz AS "acessoMatriz",
            cv.plataformas_analise_criativo AS "plataformasAnaliseCriativo",
            c.id AS "campanhaId", c.nome AS campanha, c.status, c.data_inicio, c.data_fim,
            v.id AS "vehicleId", v.nome AS veiculo
     FROM campanha_veiculos cv
     JOIN campanhas c ON c.id = cv.campanha_id
     JOIN vehicles v ON v.id = cv.vehicle_id
     WHERE v.nome = ANY($1)`,
    [nomeVeiculos]
  );

  const { rows: plataformasDb } = await query("SELECT nome, subcanais FROM plataformas");
  const subcanaisPorNome = new Map(plataformasDb.map((p) => [p.nome, p.subcanais]));
  // Inclui o nome da plataforma-mae junto dos subcanais (nao substitui) -- o Dashboard/Deals
  // referencia a plataforma-mae (ex "Meta Ads"), enquanto Midia/Analise por Criativo casam
  // com os nomes reais na planilha (ex "Facebook", "Instagram").
  const expandir = (nomePlataforma) => {
    const subcanais = subcanaisPorNome.get(nomePlataforma);
    return subcanais?.length ? [nomePlataforma, ...subcanais] : [nomePlataforma];
  };

  return rows.map((r) => ({
    ...r,
    campanhaStatus: statusEfetivo(r),
    plataformas: r.plataformas.flatMap(expandir),
    // NAO expandir em subcanais aqui: plataformasAnaliseCriativo alimenta a navegacao
    // campanha-primeiro (um card por plataforma cadastrada, ex "Meta Ads"), diferente de
    // "plataformas" acima que precisa bater com nomes reais na planilha/realizado.
    plataformasAnaliseCriativo: r.plataformasAnaliseCriativo || [],
  }));
}
