import { Router } from "express";
import { getSiteSummary } from "../services/siteService.js";
import { parseRange } from "../utils/dateRange.js";

const router = Router();

router.get("/summary", async (req, res, next) => {
  try {
    const { start, end, campanha, veiculo } = parseRange(req.query);
    res.json(await getSiteSummary(start, end, campanha, veiculo));
  } catch (err) {
    next(err);
  }
});

export default router;
