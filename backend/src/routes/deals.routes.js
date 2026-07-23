import { Router } from "express";
import { getDealsProgress, getVehicles } from "../services/dealsService.js";
import { parseRange } from "../utils/dateRange.js";
import { veiculoLogos } from "../services/mockData.js";
import { scopeVeiculoFilter, scopeCampanhaFilter, vendedoresPermitidos } from "../utils/scopeFilter.js";

const router = Router();

router.get("/progress", async (req, res, next) => {
  try {
    const { start, end, isFiltered, campanha, veiculo, modeloCompra } = parseRange(req.query);
    const veiculoEscopo = scopeVeiculoFilter(req.user, veiculo);
    const campanhaEscopo = scopeCampanhaFilter(req.user, campanha);
    res.json(
      await getDealsProgress(start, end, isFiltered, campanhaEscopo, veiculoEscopo, modeloCompra, vendedoresPermitidos(req.user))
    );
  } catch (err) {
    next(err);
  }
});

router.get("/vehicles", async (req, res, next) => {
  try {
    const { start, end, isFiltered, campanha, veiculo, modeloCompra } = parseRange(req.query);
    const veiculoEscopo = scopeVeiculoFilter(req.user, veiculo);
    const campanhaEscopo = scopeCampanhaFilter(req.user, campanha);
    const vehicles = await getVehicles(
      start,
      end,
      isFiltered,
      campanhaEscopo,
      veiculoEscopo,
      modeloCompra,
      vendedoresPermitidos(req.user)
    );
    res.json(vehicles.map((v) => ({ ...v, logoUrl: veiculoLogos[v.veiculo] || null })));
  } catch (err) {
    next(err);
  }
});

export default router;
