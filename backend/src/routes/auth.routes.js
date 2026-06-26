import { Router } from "express";
import multer from "multer";
import { login, createUser, listUsers, updateProfile, changePassword, deactivateUser } from "../services/authService.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

const router = Router();
const COOKIE_NAME = "token";
const isProduction = process.env.NODE_ENV === "production";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\//.test(file.mimetype)) return cb(new Error("Arquivo deve ser uma imagem"));
    cb(null, true);
  },
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    const result = await login(email, senha);
    if (!result) return res.status(401).json({ error: "Email ou senha inválidos" });

    res.cookie(COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json(result.user);
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

router.get("/users", requireAuth, requireRole("agencia"), async (_req, res, next) => {
  try {
    res.json(await listUsers());
  } catch (err) {
    next(err);
  }
});

router.post("/users", requireAuth, requireRole("agencia"), async (req, res, next) => {
  try {
    const { email, senha, nome, papel, veiculos } = req.body;
    if (!email || !senha || !nome || !papel) {
      return res.status(400).json({ error: "Campos obrigatórios: email, senha, nome, papel" });
    }
    const user = await createUser({ email, senha, nome, papel, veiculos });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

router.put("/me", requireAuth, upload.single("foto"), async (req, res, next) => {
  try {
    const { nome } = req.body;
    let fotoUrl;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, "avatares-senado");
      fotoUrl = result.secure_url;
    }
    const updated = await updateProfile(req.user.id, { nome, fotoUrl });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.put("/me/password", requireAuth, async (req, res, next) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ error: "Campos obrigatórios: senhaAtual, novaSenha" });
    }
    if (novaSenha.length < 6) {
      return res.status(400).json({ error: "A nova senha deve ter pelo menos 6 caracteres" });
    }
    const result = await changePassword(req.user.id, senhaAtual, novaSenha);
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/users/:id", requireAuth, requireRole("agencia"), async (req, res, next) => {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ error: "Você não pode excluir sua própria conta" });
    }
    const deactivated = await deactivateUser(req.params.id);
    if (!deactivated) return res.status(404).json({ error: "Usuário não encontrado" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
