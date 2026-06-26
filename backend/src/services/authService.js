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
  const { rows } = await query(
    `INSERT INTO users (email, password_hash, nome, papel, veiculos)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [email, passwordHash, nome, papel, veiculos || []]
  );
  return toPublicUser(rows[0]);
}

export async function listUsers() {
  const { rows } = await query("SELECT * FROM users ORDER BY criado_em DESC");
  return rows.map(toPublicUser);
}

export async function updateProfile(id, { nome, fotoUrl }) {
  const { rows } = await query(
    `UPDATE users SET
      nome = COALESCE($2, nome),
      foto_url = COALESCE($3, foto_url)
     WHERE id = $1
     RETURNING *`,
    [id, nome, fotoUrl]
  );
  return rows[0] ? toPublicUser(rows[0]) : null;
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
