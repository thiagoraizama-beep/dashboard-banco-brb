import "dotenv/config";
import express from "express";
import cors from "cors";
import mediaRoutes from "./routes/media.routes.js";
import siteRoutes from "./routes/site.routes.js";
import dealsRoutes from "./routes/deals.routes.js";
import offlineMediaRoutes from "./routes/offlineMedia.routes.js";
import programacaoRoutes from "./routes/programacao.routes.js";
import creativeAnalysisRoutes from "./routes/creativeAnalysis.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/media", mediaRoutes);
app.use("/api/site", siteRoutes);
app.use("/api/deals", dealsRoutes);
app.use("/api/offline-media", offlineMediaRoutes);
app.use("/api/programacoes", programacaoRoutes);
app.use("/api/creative-analysis", creativeAnalysisRoutes);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Erro interno" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port} (DATA_SOURCE=${process.env.DATA_SOURCE || "mock"})`);
});
