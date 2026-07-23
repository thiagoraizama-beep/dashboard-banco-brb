import { Router } from "express";
import multer from "multer";
import { requireRole } from "../middleware/auth.js";
import {
  listCreatives,
  getCreativeById,
  createCreative,
  updateCreative,
  deleteCreative,
  updateStatus,
  getStatusHistory,
  STATUSES,
  STATUSES_VEICULO,
} from "../services/creativesService.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^(image|video)\//.test(file.mimetype)) {
      return cb(new Error("Arquivo deve ser imagem ou vídeo"));
    }
    cb(null, true);
  },
});

function handleUploadErrors(req, res, next) {
  return (err) => {
    if (err?.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Arquivo muito grande. O limite é de 100MB." });
    }
    if (err) return res.status(400).json({ error: err.message });
    next();
  };
}

// Retorna lista de status válidos para o papel do usuário logado
router.get("/statuses", (req, res) => {
  res.json(req.user.papel === "veiculo" ? STATUSES_VEICULO : STATUSES);
});

router.get("/", async (req, res, next) => {
  try {
    res.json(await listCreatives(req.user));
  } catch (err) {
    next(err);
  }
});

router.get("/:id/history", async (req, res, next) => {
  try {
    res.json(await getStatusHistory(req.params.id));
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  requireRole("agencia"),
  (req, res, next) => upload.single("file")(req, res, handleUploadErrors(req, res, next)),
  async (req, res, next) => {
    try {
      const {
        nome, adName, campanha, campaignName, conjunto, descricao, observacoes,
        periodoInicio, periodoFim, veiculo, plataforma, formato, posicionamento,
        urlDestino, impulsionado, segmentacao, titulo, tiposCompra,
        cloudinaryUrl, cloudinaryPublicId, tipoMidia, campanhaVeiculoId,
      } = req.body;
      if (!req.file && !cloudinaryUrl) return res.status(400).json({ error: "Arquivo obrigatório" });
      if (!nome || !campanha || !veiculo) {
        return res.status(400).json({ error: "Campos obrigatórios: nome, campanha, veiculo" });
      }
      const creative = await createCreative({
        file: req.file,
        cloudinaryUrl, cloudinaryPublicId, tipoMidia,
        nome, adName, campanha, campaignName, conjunto, descricao, observacoes,
        periodoInicio, periodoFim, veiculo, plataforma, formato, posicionamento,
        urlDestino,
        impulsionado: impulsionado !== "false",
        segmentacao, titulo,
        tiposCompra: tiposCompra ? JSON.parse(tiposCompra) : [],
        criadoPor: req.user.id,
        campanhaVeiculoId: campanhaVeiculoId || null,
      });
      res.status(201).json(creative);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/:id",
  requireRole("agencia"),
  (req, res, next) => upload.single("file")(req, res, handleUploadErrors(req, res, next)),
  async (req, res, next) => {
    try {
      const { tiposCompra, impulsionado, ...rest } = req.body;
      const updated = await updateCreative(req.params.id, {
        ...rest,
        file: req.file,
        impulsionado: impulsionado !== undefined ? impulsionado !== "false" : undefined,
        tiposCompra: tiposCompra ? JSON.parse(tiposCompra) : undefined,
      });
      if (!updated) return res.status(404).json({ error: "Criativo não encontrado" });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:id", requireRole("agencia"), async (req, res, next) => {
  try {
    const deleted = await deleteCreative(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Criativo não encontrado" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", requireRole("veiculo", "agencia"), async (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = await updateStatus(req.params.id, status, req.user);
    if (!updated) return res.status(404).json({ error: "Criativo não encontrado" });
    res.json(updated);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

export default router;
