import { Router } from "express";
import { getFilterOptions, getSummary, getCategoriesBreakdown } from "../services/offlineMediaService.js";
import { scopeVeiculoFilter } from "../utils/scopeFilter.js";

const router = Router();

function parseFilters(req) {
  return {
    categoria: req.query.categoria || null,
    praca: req.query.praca || null,
    veiculo: scopeVeiculoFilter(req.user, req.query.veiculo || null),
    campanha: req.query.campanha || null,
  };
}

router.get("/filter-options", async (_req, res, next) => {
  try {
    res.json(await getFilterOptions());
  } catch (err) {
    next(err);
  }
});

router.get("/summary", async (req, res, next) => {
  try {
    res.json(await getSummary(parseFilters(req)));
  } catch (err) {
    next(err);
  }
});

router.get("/categories", async (req, res, next) => {
  try {
    res.json(await getCategoriesBreakdown(parseFilters(req)));
  } catch (err) {
    next(err);
  }
});

export default router;
