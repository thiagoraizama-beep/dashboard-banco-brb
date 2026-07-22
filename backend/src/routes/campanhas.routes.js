import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import {
  listCampanhas,
  createCampanha,
  updateCampanhaNome,
  updateCampanhaStatus,
  deleteCampanha,
  upsertCampanhaVeiculo,
  deleteCampanhaVeiculo,
  upsertMetaPlataforma,
  deleteMetaPlataforma,
  updateGa4PropertyId,
} from "../services/campanhasService.js";

const router = Router();

// E-mail da conta de servico do Google usada para ler o GA4 -- precisa ser adicionada
// como usuaria (Visualizador) em cada property GA4 vinculada, senao a leitura falha por
// permissao mesmo com o Property ID certo cadastrado. So o e-mail, nunca a chave privada.
router.get("/ga4-service-account", requireRole("agencia"), (_req, res) => {
  res.json({ email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || null });
});

router.get("/", async (_req, res, next) => {
  try {
    res.json(await listCampanhas());
  } catch (err) {
    next(err);
  }
});

router.post("/", requireRole("agencia"), async (req, res, next) => {
  try {
    const { nome, dataInicio, dataFim } = req.body;
    if (!nome) return res.status(400).json({ error: "Campo obrigatório: nome" });
    const campanha = await createCampanha(nome, { dataInicio, dataFim });
    res.status(201).json(campanha);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Já existe uma campanha com este nome" });
    }
    next(err);
  }
});

router.put("/:id", requireRole("agencia"), async (req, res, next) => {
  try {
    const { nome, dataInicio, dataFim } = req.body;
    if (!nome) return res.status(400).json({ error: "Campo obrigatório: nome" });
    const updated = await updateCampanhaNome(req.params.id, nome, { dataInicio, dataFim });
    if (!updated) return res.status(404).json({ error: "Campanha não encontrada" });
    res.json(updated);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Já existe uma campanha com este nome" });
    }
    next(err);
  }
});

router.patch("/:id/status", requireRole("agencia"), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["ativo", "pausado", "em_analise", "finalizado"].includes(status)) {
      return res.status(400).json({ error: "Status inválido" });
    }
    const updated = await updateCampanhaStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: "Campanha não encontrada" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Vincula/desvincula o Property ID do GA4 (Perfil > Integrações GA4).
router.patch("/:id/ga4", requireRole("agencia"), async (req, res, next) => {
  try {
    const { ga4PropertyId } = req.body;
    const updated = await updateGa4PropertyId(req.params.id, ga4PropertyId);
    if (!updated) return res.status(404).json({ error: "Campanha não encontrada" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireRole("agencia"), async (req, res, next) => {
  try {
    const deleted = await deleteCampanha(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Campanha não encontrada" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Vincula um veículo a uma campanha com plataformas específicas e tipo de mídia
router.put("/:id/veiculos", requireRole("agencia"), async (req, res, next) => {
  try {
    const { vehicleId, plataformas, tipoMidia, acessoAnaliseCriativo, acessoMatriz, plataformasAnaliseCriativo } = req.body;
    if (!vehicleId || !Array.isArray(plataformas)) {
      return res.status(400).json({ error: "Campos obrigatórios: vehicleId, plataformas (array)" });
    }
    const result = await upsertCampanhaVeiculo(req.params.id, vehicleId, plataformas, tipoMidia, {
      acessoAnaliseCriativo,
      acessoMatriz,
      plataformasAnaliseCriativo,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Remove vínculo veículo de campanha
router.delete("/veiculos/:vinculoId", requireRole("agencia"), async (req, res, next) => {
  try {
    const deleted = await deleteCampanhaVeiculo(req.params.vinculoId);
    if (!deleted) return res.status(404).json({ error: "Vínculo não encontrado" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Cadastra/atualiza a meta (quantidade contratada + modelo de compra + periodo)
// de uma plataforma especifica dentro de um vinculo campanha+veiculo.
router.put("/veiculos/:vinculoId/metas/:plataforma", requireRole("agencia"), async (req, res, next) => {
  try {
    const { quantidadeContratada, modeloCompra, dataInicio, dataFim } = req.body;
    const result = await upsertMetaPlataforma(req.params.vinculoId, req.params.plataforma, {
      quantidadeContratada,
      modeloCompra,
      dataInicio,
      dataFim,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.delete("/veiculos/metas/:metaId", requireRole("agencia"), async (req, res, next) => {
  try {
    const deleted = await deleteMetaPlataforma(req.params.metaId);
    if (!deleted) return res.status(404).json({ error: "Meta não encontrada" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
