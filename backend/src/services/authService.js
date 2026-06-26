import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../config/database.js";

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = "7d";

function toPublicUser(row) {
  return {
    id: row.id,
    email: row.email,
    nome: row.nome,
    papel: row.papel,
    veiculos: row.veiculos,
    fotoUrl: row.foto_url,
  };
}

export async function login(email, senha) {
  const { rows } = await query("SELECT * FROM users WHERE email = $1 AND ativo = true", [email]);
  const user = rows[0];
  if (!user) return null;

  const valid = await bcrypt.compare(senha, user.password_hash);
  if (!valid) return null;

  const token = jwt.sign({ id: user.id, papel: user.papel }, JWT_SECRET, { expiresIn: TOKEN_TTL });
  return { token, user: toPublicUser(user) };
}

export async function getUserById(id) {
  const { rows } = await query("SELECT * FROM users WHERE id = $1 AND ativo = true", [id]);
  return rows[0] ? toPublicUser(rows[0]) : null;
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export async function createUser({ email, senha, nome, papel, veiculos }) {
  const passwordHash = await bcrypt.hash(senha, 10);

  // Se ja existe uma conta desativada (excluida) com esse email, reativa ela
  // com os novos dados em vez de tentar inserir um registro duplicado --
  // o email tem constraint UNIQUE e a exclusao so desativa, nunca remove de fato.
  const { rows: existentes } = await query("SELECT id FROM users WHERE email = $1 AND ativo = false", [email]);
  if (existentes[0]) {
    const { rows } = await query(
      `UPDATE users SET
        password_hash = $2,
        nome = $3,
        papel = $4,
        veiculos = $5,
        foto_url = NULL,
        ativo = true
       WHERE id = $1
       RETURNING *`,
      [existentes[0].id, passwordHash, nome, papel, veiculos || []]
    );
    return toPublicUser(rows[0]);
  }

  const { rows } = await query(
    `INSERT INTO users (email, password_hash, nome, papel, veiculos)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [email, passwordHash, nome, papel, veiculos || []]
  );
  return toPublicUser(rows[0]);
}

export async function listUsers() {
  const { rows } = await query("SELECT * FROM users WHERE ativo = true ORDER BY criado_em DESC");
  return rows.map(toPublicUser);
}

export async function updateProfile(id, { nome, fotoUrl, removerFoto }) {
  const novaFotoUrl = removerFoto ? null : fotoUrl;
  const { rows } = await query(
    `UPDATE users SET
      nome = COALESCE($2, nome),
      foto_url = CASE WHEN $4 THEN NULL ELSE COALESCE($3, foto_url) END
     WHERE id = $1
     RETURNING *`,
    [id, nome, novaFotoUrl, Boolean(removerFoto)]
  );
  return rows[0] ? toPublicUser(rows[0]) : null;
}

// Agencia pode trocar o papel (e veiculos vinculados, se for o caso) de
// outro usuario sem precisar excluir e recriar a conta.
export async function updateUserRole(id, { papel, veiculos }) {
  const { rows } = await query(
    `UPDATE users SET
      papel = COALESCE($2, papel),
      veiculos = COALESCE($3, veiculos)
     WHERE id = $1 AND ativo = true
     RETURNING *`,
    [id, papel, veiculos]
  );
  return rows[0] ? toPublicUser(rows[0]) : null;
}

// Desativa em vez de excluir de fato, para preservar o historico
// (criativos/status apontam para o usuario via foreign key).
export async function deactivateUser(id) {
  const { rowCount } = await query("UPDATE users SET ativo = false WHERE id = $1", [id]);
  return rowCount > 0;
}

export async function changePassword(id, senhaAtual, novaSenha) {
  const { rows } = await query("SELECT * FROM users WHERE id = $1", [id]);
  const user = rows[0];
  if (!user) return { ok: false, error: "Usuário não encontrado" };

  const valid = await bcrypt.compare(senhaAtual, user.password_hash);
  if (!valid) return { ok: false, error: "Senha atual incorreta" };

  const passwordHash = await bcrypt.hash(novaSenha, 10);
  await query("UPDATE users SET password_hash = $2 WHERE id = $1", [id, passwordHash]);
  return { ok: true };
}
