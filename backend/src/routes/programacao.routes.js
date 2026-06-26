import { Router } from "express";
import {
  listProgramacoes,
  createProgramacao,
  updateProgramacao,
  deleteProgramacao,
  listProgramas,
} from "../services/programacaoService.js";
import { requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { start, end } = req.query;
    res.json(await listProgramacoes({ start, end }));
  } catch (err) {
    next(err);
  }
});

router.get("/programas", async (_req, res, next) => {
  try {
    res.json(await listProgramas());
  } catch (err) {
    next(err);
  }
});

router.post("/", requireRole("agencia"), async (req, res, next) => {
  try {
    const nova = await createProgramacao(req.body);
    res.status(201).json(nova);
  } catch (err) {
    if (err.message.startsWith("Campos obrigatorios")) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

router.put("/:id", requireRole("agencia"), async (req, res, next) => {
  try {
    const updated = await updateProgramacao(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Programação não encontrada" });
    res.json(updated);
  } catch (err) {
    if (err.message.startsWith("Campos obrigatorios")) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

router.delete("/:id", requireRole("agencia"), async (req, res, next) => {
  try {
    const removed = await deleteProgramacao(req.params.id);
    if (!removed) return res.status(404).json({ error: "Programação não encontrada" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
