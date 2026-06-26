import { Router } from "express";
import { getSummary, getCampaignStatuses, getPerformanceSeries } from "../services/mediaService.js";
import { parseRange } from "../utils/dateRange.js";
import { scopeVeiculoFilter } from "../utils/scopeFilter.js";

const router = Router();

router.get("/summary", async (req, res, next) => {
  try {
    const { start, end, isFiltered, campanha, veiculo, modeloCompra } = parseRange(req.query);
    const veiculoEscopo = scopeVeiculoFilter(req.user, veiculo);
    res.json(await getSummary(start, end, isFiltered, campanha, veiculoEscopo, modeloCompra));
  } catch (err) {
    next(err);
  }
});

router.get("/campaign-status", async (_req, res, next) => {
  try {
    res.json(await getCampaignStatuses());
  } catch (err) {
    next(err);
  }
});

router.get("/performance", async (req, res, next) => {
  try {
    const { start, end, campanha, veiculo, modeloCompra } = parseRange(req.query);
    const veiculoEscopo = scopeVeiculoFilter(req.user, veiculo);
    const metrics = req.query.metrics ? String(req.query.metrics).split(",") : undefined;
    res.json(await getPerformanceSeries(start, end, metrics, campanha, veiculoEscopo, modeloCompra));
  } catch (err) {
    next(err);
  }
});

export default router;
