import { useEffect, useState } from "react";
import { getOfflineCategories } from "../../api/client.js";
import { useOfflineFilters } from "../../context/OfflineFiltersContext.jsx";
import Spinner from "../common/Spinner.jsx";

function formatCompact(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("pt-BR");
}

export default function CategoriesListCard() {
  const { categoria, toggleCategoria, setCategoria, praca, veiculo, campanha, refreshToken } = useOfflineFilters();
  const [categories, setCategories] = useState(null);

  useEffect(() => {
    setCategories(null);
    getOfflineCategories({ categoria, praca, veiculo, campanha }).then(setCategories).catch(console.error);
  }, [JSON.stringify(categoria), JSON.stringify(praca), JSON.stringify(veiculo), JSON.stringify(campanha), refreshToken]);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p className="card-title" style={{ margin: 0 }}>
          Categorias ({categories?.length ?? 0})
        </p>
        {categoria.length > 0 && (
          <button
            onClick={() => setCategoria([])}
            style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 13, cursor: "pointer" }}
          >
            Limpar
          </button>
        )}
      </div>

      {!categories ? (
        <Spinner />
      ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 420, overflowY: "auto" }}>
        {categories.map((c) => {
          const selected = categoria.includes(c.categoria);
          return (
            <div
              key={c.categoria}
              onClick={() => toggleCategoria(c.categoria)}
              style={{
                border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 12,
                padding: 14,
                cursor: "pointer",
                background: selected ? "var(--accent-soft)" : "transparent",
              }}
            >
              <strong style={{ fontSize: 14 }}>{c.categoria}</strong>
              <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 12 }}>
                <span style={{ color: "var(--text-secondary)" }}>
                  Investimento: <strong style={{ color: "var(--success)" }}>R$ {c.investimento.toLocaleString("pt-BR")}</strong>
                </span>
                <span style={{ color: "var(--text-secondary)" }}>
                  Entrega: <strong style={{ color: "var(--accent)" }}>{formatCompact(c.entrega)}</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
