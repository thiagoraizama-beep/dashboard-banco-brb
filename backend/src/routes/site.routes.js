import { Router } from "express";
import { getSiteSummary } from "../services/siteService.js";
import { parseRange } from "../utils/dateRange.js";
import { scopeVeiculoFilter } from "../utils/scopeFilter.js";

const router = Router();

router.get("/summary", async (req, res, next) => {
  try {
    const { start, end, campanha, veiculo } = parseRange(req.query);
    const veiculoEscopo = scopeVeiculoFilter(req.user, veiculo);
    res.json(await getSiteSummary(start, end, campanha, veiculoEscopo));
  } catch (err) {
    next(err);
  }
});

export default router;
