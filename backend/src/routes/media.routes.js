import { Router } from "express";
import { getSummary, getCampaignStatuses, getPerformanceSeries, getAvailableDateRange } from "../services/mediaService.js";
import { parseRange } from "../utils/dateRange.js";
import { scopeVeiculoFilter, scopeCampanhaFilter, vendedoresPermitidos, scopeModeloCompraFilter } from "../utils/scopeFilter.js";

const router = Router();

router.get("/available-range", async (req, res, next) => {
  try {
    const { campanha, veiculo, modeloCompra } = parseRange(req.query);
    const veiculoEscopo = scopeVeiculoFilter(req.user, veiculo);
    const campanhaEscopo = scopeCampanhaFilter(req.user, campanha);
    res.json(
      await getAvailableDateRange(
        campanhaEscopo,
        veiculoEscopo,
        modeloCompra,
        vendedoresPermitidos(req.user),
        scopeModeloCompraFilter(req.user)
      )
    );
  } catch (err) {
    next(err);
  }
});

router.get("/summary", async (req, res, next) => {
  try {
    const { start, end, isFiltered, campanha, veiculo, modeloCompra } = parseRange(req.query);
    const veiculoEscopo = scopeVeiculoFilter(req.user, veiculo);
    const campanhaEscopo = scopeCampanhaFilter(req.user, campanha);
    res.json(
      await getSummary(
        start,
        end,
        isFiltered,
        campanhaEscopo,
        veiculoEscopo,
        modeloCompra,
        vendedoresPermitidos(req.user),
        scopeModeloCompraFilter(req.user)
      )
    );
  } catch (err) {
    next(err);
  }
});

router.get("/campaign-status", async (req, res, next) => {
  try {
    const statuses = await getCampaignStatuses();
    const campanhasPermitidas = scopeCampanhaFilter(req.user, null);
    const filtrados = campanhasPermitidas
      ? statuses.filter((s) => campanhasPermitidas.includes(s.campanha))
      : statuses;
    res.json(filtrados);
  } catch (err) {
    next(err);
  }
});

router.get("/performance", async (req, res, next) => {
  try {
    const { start, end, isFiltered, campanha, veiculo, modeloCompra } = parseRange(req.query);
    const veiculoEscopo = scopeVeiculoFilter(req.user, veiculo);
    const campanhaEscopo = scopeCampanhaFilter(req.user, campanha);
    const metrics = req.query.metrics ? String(req.query.metrics).split(",") : undefined;
    res.json(
      await getPerformanceSeries(
        start,
        end,
        isFiltered,
        metrics,
        campanhaEscopo,
        veiculoEscopo,
        modeloCompra,
        vendedoresPermitidos(req.user),
        scopeModeloCompraFilter(req.user)
      )
    );
  } catch (err) {
    next(err);
  }
});

export default router;
