import { Router } from "express";
import {
  getFilterOptions,
  getSummary,
  getCreatives,
  getCreativeSeries,
  CREATIVE_VEHICLES,
} from "../services/creativeAnalysisService.js";

const router = Router();

function parseFilters(query) {
  return {
    start: query.start || null,
    end: query.end || null,
    campanha: query.campanha || null,
    tipoCompra: query.tipoCompra || null,
    posicionamento: query.posicionamento || null,
    plataforma: query.plataforma || null,
  };
}

function validVeiculo(req, res, next) {
  if (!CREATIVE_VEHICLES.includes(req.params.veiculo)) {
    return res.status(404).json({ error: "Veículo inválido" });
  }
  if (req.user.papel === "veiculo" && !(req.user.veiculos || []).includes(req.params.veiculo)) {
    return res.status(403).json({ error: "Acesso não permitido a este veículo" });
  }
  next();
}

router.get("/:veiculo/filter-options", validVeiculo, async (req, res, next) => {
  try {
    res.json(await getFilterOptions(req.params.veiculo));
  } catch (err) {
    next(err);
  }
});

router.get("/:veiculo/summary", validVeiculo, async (req, res, next) => {
  try {
    res.json(await getSummary(req.params.veiculo, parseFilters(req.query)));
  } catch (err) {
    next(err);
  }
});

router.get("/:veiculo/creatives", validVeiculo, async (req, res, next) => {
  try {
    res.json(await getCreatives(req.params.veiculo, parseFilters(req.query)));
  } catch (err) {
    next(err);
  }
});

router.get("/:veiculo/creatives/:adName/series", validVeiculo, async (req, res, next) => {
  try {
    res.json(await getCreativeSeries(req.params.veiculo, req.params.adName, parseFilters(req.query)));
  } catch (err) {
    next(err);
  }
});

export default router;
