import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mediaRoutes from "./routes/media.routes.js";
import siteRoutes from "./routes/site.routes.js";
import dealsRoutes from "./routes/deals.routes.js";
import offlineMediaRoutes from "./routes/offlineMedia.routes.js";
import programacaoRoutes from "./routes/programacao.routes.js";
import creativeAnalysisRoutes from "./routes/creativeAnalysis.routes.js";
import authRoutes from "./routes/auth.routes.js";
import creativesRoutes from "./routes/creatives.routes.js";
import vehiclesRoutes from "./routes/vehicles.routes.js";
import { requireAuth } from "./middleware/auth.js";

export const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/creatives", requireAuth, creativesRoutes);
app.use("/api/vehicles", requireAuth, vehiclesRoutes);

app.use("/api/media", requireAuth, mediaRoutes);
app.use("/api/site", requireAuth, siteRoutes);
app.use("/api/deals", requireAuth, dealsRoutes);
app.use("/api/offline-media", requireAuth, offlineMediaRoutes);
app.use("/api/programacoes", requireAuth, programacaoRoutes);
app.use("/api/creative-analysis", requireAuth, creativeAnalysisRoutes);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Erro interno" });
});
