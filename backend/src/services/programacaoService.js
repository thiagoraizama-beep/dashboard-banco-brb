import { query } from "../config/database.js";

function toCamel(row) {
  return {
    id: row.id,
    veiculo: row.veiculo,
    categoria: row.categoria,
    programa: row.programa,
    data: row.data,
    horaInicio: row.hora_inicio,
    horaFim: row.hora_fim,
    criadoEm: row.criado_em,
  };
}

export async function listProgramacoes({ start, end } = {}) {
  if (start && end) {
    const { rows } = await query(
      `SELECT id, veiculo, categoria, programa, to_char(data, 'YYYY-MM-DD') AS data, hora_inicio, hora_fim, criado_em
       FROM programacoes WHERE data >= $1 AND data <= $2 ORDER BY data ASC`,
      [start, end]
    );
    return rows.map(toCamel);
  }

  const { rows } = await query(
    `SELECT id, veiculo, categoria, programa, to_char(data, 'YYYY-MM-DD') AS data, hora_inicio, hora_fim, criado_em
     FROM programacoes ORDER BY data ASC`
  );
  return rows.map(toCamel);
}

export async function createProgramacao({ veiculo, categoria, programa, data, horaInicio, horaFim }) {
  if (!veiculo || !programa || !data || !horaInicio || !horaFim) {
    throw new Error("Campos obrigatorios: veiculo, programa, data, horaInicio, horaFim");
  }

  const { rows } = await query(
    `INSERT INTO programacoes (veiculo, categoria, programa, data, hora_inicio, hora_fim)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, veiculo, categoria, programa, to_char(data, 'YYYY-MM-DD') AS data, hora_inicio, hora_fim, criado_em`,
    [veiculo, categoria || null, programa, data, horaInicio, horaFim]
  );
  return toCamel(rows[0]);
}

export async function updateProgramacao(id, { veiculo, categoria, programa, data, horaInicio, horaFim }) {
  if (!veiculo || !programa || !data || !horaInicio || !horaFim) {
    throw new Error("Campos obrigatorios: veiculo, programa, data, horaInicio, horaFim");
  }

  const { rows } = await query(
    `UPDATE programacoes SET veiculo = $2, categoria = $3, programa = $4, data = $5, hora_inicio = $6, hora_fim = $7
     WHERE id = $1
     RETURNING id, veiculo, categoria, programa, to_char(data, 'YYYY-MM-DD') AS data, hora_inicio, hora_fim, criado_em`,
    [id, veiculo, categoria || null, programa, data, horaInicio, horaFim]
  );
  return rows[0] ? toCamel(rows[0]) : null;
}

export async function listProgramas() {
  const { rows } = await query("SELECT DISTINCT programa FROM programacoes WHERE programa IS NOT NULL ORDER BY programa ASC");
  return rows.map((r) => r.programa);
}

export async function deleteProgramacao(id) {
  const { rowCount } = await query("DELETE FROM programacoes WHERE id = $1", [id]);
  return rowCount > 0;
}
