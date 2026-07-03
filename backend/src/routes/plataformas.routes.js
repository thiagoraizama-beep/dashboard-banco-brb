import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import { listPlataformas, createPlataforma, updatePlataforma, deletePlataforma } from "../services/plataformasService.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    res.json(await listPlataformas());
  } catch (err) {
    next(err);
  }
});

router.post("/", requireRole("agencia"), async (req, res, next) => {
  try {
    const { nome, tipo, subcanais } = req.body;
    if (!nome) return res.status(400).json({ error: "Campo obrigatório: nome" });
    const p = await createPlataforma({ nome, tipo, subcanais });
    res.status(201).json(p);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Já existe uma plataforma com este nome" });
    return res.status(500).json({ error: err.message });
  }
});

router.put("/:id", requireRole("agencia"), async (req, res, next) => {
  try {
    const { nome, tipo, subcanais } = req.body;
    const updated = await updatePlataforma(req.params.id, { nome, tipo, subcanais });
    if (!updated) return res.status(404).json({ error: "Plataforma não encontrada" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireRole("agencia"), async (req, res, next) => {
  try {
    const deleted = await deletePlataforma(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Plataforma não encontrada" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
