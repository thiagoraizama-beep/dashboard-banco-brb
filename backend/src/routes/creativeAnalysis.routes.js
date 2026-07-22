import { Router } from "express";
import {
  getFilterOptions,
  getSummary,
  getCampanhaSummary,
  getCampanhaSeries,
  getPlataformaSeries,
  getCreatives,
  getCreativeSeries,
} from "../services/creativeAnalysisService.js";
import { temAcessoFeature, plataformasPermitidasNaCampanha } from "../utils/scopeFilter.js";
import { getCampanhaById, listCampanhas } from "../services/campanhasService.js";

const router = Router();

function parseFilters(query, campanhaNome) {
  return {
    start: query.start || null,
    end: query.end || null,
    // Campanha e travada pela navegacao (campanhaId na URL), nao mais um filtro livre.
    campanha: campanhaNome ? [campanhaNome] : null,
    tipoCompra: query.tipoCompra || null,
    posicionamento: query.posicionamento || null,
    plataforma: query.plataforma || null,
  };
}

// Todas as plataformas com acesso_analise_criativo=true cadastradas nos vinculos
// desta campanha (independente de qual veiculo/usuario) -- usado para agencia/
// cliente, que nao tem restricao de escopo mas ainda precisam de uma lista real
// (nao mais a antiga lista fixa CREATIVE_VEHICLES).
async function plataformasDaCampanha(campanhaId) {
  const campanhas = await listCampanhas();
  const campanha = campanhas.find((c) => String(c.id) === String(campanhaId));
  if (!campanha) return [];
  const plataformas = new Set();
  for (const v of campanha.veiculos) {
    if (v.acessoAnaliseCriativo === false) continue;
    for (const p of v.plataformasAnaliseCriativo || []) plataformas.add(p);
  }
  return [...plataformas];
}

// Valida que o usuario tem, NA CAMPANHA informada, um vinculo com esta plataforma
// e com acesso_analise_criativo liberado. Agencia/cliente sem restricao de escopo,
// mas ainda precisam de uma campanha valida e da plataforma existir ali.
async function validCampanhaVeiculo(req, res, next) {
  try {
    if (!temAcessoFeature(req.user, "acessoAnaliseCriativo")) {
      return res.status(403).json({ error: "Acesso não permitido a Análise por Criativo" });
    }

    const campanha = await getCampanhaById(req.params.campanhaId);
    if (!campanha) return res.status(404).json({ error: "Campanha não encontrada" });

    if (req.user.papel === "veiculo" || req.user.papel === "parceiro") {
      const plataformasNaCampanha = plataformasPermitidasNaCampanha(req.user, req.params.campanhaId, "acessoAnaliseCriativo") || [];
      if (!plataformasNaCampanha.includes(req.params.veiculo)) {
        return res.status(403).json({ error: "Acesso não permitido a este veículo nesta campanha" });
      }
    } else {
      const permitidas = await plataformasDaCampanha(req.params.campanhaId);
      if (!permitidas.includes(req.params.veiculo)) {
        return res.status(404).json({ error: "Veículo inválido nesta campanha" });
      }
    }

    req.campanha = campanha;
    next();
  } catch (err) {
    next(err);
  }
}

// Resumo agregado de uma campanha inteira (todas as plataformas que o usuario tem
// permissao de ver ali), usado no comparativo entre campanhas.
router.get("/:campanhaId/campaign-summary", async (req, res, next) => {
  try {
    if (!temAcessoFeature(req.user, "acessoAnaliseCriativo")) {
      return res.status(403).json({ error: "Acesso não permitido a Análise por Criativo" });
    }
    const campanha = await getCampanhaById(req.params.campanhaId);
    if (!campanha) return res.status(404).json({ error: "Campanha não encontrada" });

    let plataformas;
    if (req.user.papel === "veiculo" || req.user.papel === "parceiro") {
      plataformas = plataformasPermitidasNaCampanha(req.user, req.params.campanhaId, "acessoAnaliseCriativo") || [];
    } else {
      plataformas = await plataformasDaCampanha(req.params.campanhaId);
    }

    const resumo = await getCampanhaSummary(campanha.nome, plataformas);
    res.json({ campanhaId: campanha.id, campanhaNome: campanha.nome, ...resumo });
  } catch (err) {
    next(err);
  }
});

// Serie diaria agregada da campanha inteira, usada no grafico de evolucao do comparativo.
router.get("/:campanhaId/campaign-series", async (req, res, next) => {
  try {
    if (!temAcessoFeature(req.user, "acessoAnaliseCriativo")) {
      return res.status(403).json({ error: "Acesso não permitido a Análise por Criativo" });
    }
    const campanha = await getCampanhaById(req.params.campanhaId);
    if (!campanha) return res.status(404).json({ error: "Campanha não encontrada" });

    let plataformas;
    if (req.user.papel === "veiculo" || req.user.papel === "parceiro") {
      plataformas = plataformasPermitidasNaCampanha(req.user, req.params.campanhaId, "acessoAnaliseCriativo") || [];
    } else {
      plataformas = await plataformasDaCampanha(req.params.campanhaId);
    }

    res.json(await getCampanhaSeries(campanha.nome, plataformas));
  } catch (err) {
    next(err);
  }
});

router.get("/:campanhaId/:veiculo/filter-options", validCampanhaVeiculo, async (req, res, next) => {
  try {
    const options = await getFilterOptions(req.params.veiculo);
    res.json({
      ...options,
      periodoInicio: req.campanha.data_inicio,
      periodoFim: req.campanha.data_fim,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:campanhaId/:veiculo/summary", validCampanhaVeiculo, async (req, res, next) => {
  try {
    res.json(await getSummary(req.params.veiculo, parseFilters(req.query, req.campanha.nome)));
  } catch (err) {
    next(err);
  }
});

router.get("/:campanhaId/:veiculo/creatives", validCampanhaVeiculo, async (req, res, next) => {
  try {
    res.json(await getCreatives(req.params.veiculo, parseFilters(req.query, req.campanha.nome)));
  } catch (err) {
    next(err);
  }
});

router.get("/:campanhaId/:veiculo/creatives/:adName/series", validCampanhaVeiculo, async (req, res, next) => {
  try {
    res.json(await getCreativeSeries(req.params.veiculo, req.params.adName, parseFilters(req.query, req.campanha.nome)));
  } catch (err) {
    next(err);
  }
});

// Serie diaria agregada de uma plataforma inteira (todos os criativos dela), usada
// no grafico de evolucao do comparativo quando o item selecionado e uma plataforma.
router.get("/:campanhaId/:veiculo/series", validCampanhaVeiculo, async (req, res, next) => {
  try {
    res.json(await getPlataformaSeries(req.params.veiculo, parseFilters(req.query, req.campanha.nome)));
  } catch (err) {
    next(err);
  }
});

export default router;
