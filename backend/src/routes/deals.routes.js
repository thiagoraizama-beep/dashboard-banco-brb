import { Router } from "express";
import { getDealsProgress, getVehicles } from "../services/dealsService.js";
import { parseRange } from "../utils/dateRange.js";
import { veiculoLogos } from "../services/mockData.js";
import { scopeVeiculoFilter } from "../utils/scopeFilter.js";

const router = Router();

router.get("/progress", async (req, res, next) => {
  try {
    const { start, end, campanha, veiculo, modeloCompra } = parseRange(req.query);
    const veiculoEscopo = scopeVeiculoFilter(req.user, veiculo);
    res.json(await getDealsProgress(start, end, campanha, veiculoEscopo, modeloCompra));
  } catch (err) {
    next(err);
  }
});

router.get("/vehicles", async (req, res, next) => {
  try {
    const { start, end, campanha, veiculo, modeloCompra } = parseRange(req.query);
    const veiculoEscopo = scopeVeiculoFilter(req.user, veiculo);
    const vehicles = await getVehicles(start, end, campanha, veiculoEscopo, modeloCompra);
    res.json(vehicles.map((v) => ({ ...v, logoUrl: veiculoLogos[v.veiculo] || null })));
  } catch (err) {
    next(err);
  }
});

export default router;
