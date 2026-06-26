import { Router } from "express";
import { getFilterOptions, getSummary, getCategoriesBreakdown } from "../services/offlineMediaService.js";

const router = Router();

function parseFilters(query) {
  return {
    categoria: query.categoria || null,
    praca: query.praca || null,
    veiculo: query.veiculo || null,
    campanha: query.campanha || null,
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
    res.json(await getSummary(parseFilters(req.query)));
  } catch (err) {
    next(err);
  }
});

router.get("/categories", async (req, res, next) => {
  try {
    res.json(await getCategoriesBreakdown(parseFilters(req.query)));
  } catch (err) {
    next(err);
  }
});

export default router;
