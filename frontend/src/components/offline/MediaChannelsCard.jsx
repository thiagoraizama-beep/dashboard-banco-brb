import { useEffect, useState } from "react";
import { getOfflineCategories } from "../../api/client.js";
import { useOfflineFilters } from "../../context/OfflineFiltersContext.jsx";
import Spinner from "../common/Spinner.jsx";

function formatCompact(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("pt-BR");
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s" }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function EstadoRow({ estado }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderTop: "1px solid var(--border)" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 16px 10px 32px",
          cursor: "pointer",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <ChevronIcon open={open} />
          {estado.estado}
        </span>
        <div style={{ display: "flex", gap: 24, fontSize: 12, color: "var(--text-secondary)" }}>
          <span>
            Entrega <strong>{formatCompact(estado.entrega)}</strong>
          </span>
          <span>
            Investimento <strong>R$ {estado.investimento.toLocaleString("pt-BR")}</strong>
          </span>
        </div>
      </div>
      {open && (
        <table style={{ marginLeft: 32 }}>
          <thead>
            <tr>
              <th style={{ fontSize: 11 }}>Veículo</th>
              <th style={{ fontSize: 11 }}>Praça</th>
              <th style={{ fontSize: 11 }}>Tipo</th>
              <th style={{ fontSize: 11 }}>Entrega</th>
              <th style={{ fontSize: 11 }}>Investimento</th>
            </tr>
          </thead>
          <tbody>
            {estado.linhas.map((l, i) => (
              <tr key={i}>
                <td style={{ fontSize: 12 }}>{l.veiculo}</td>
                <td style={{ fontSize: 12 }}>{l.praca}</td>
                <td style={{ fontSize: 12 }}>{l.programa}</td>
                <td style={{ fontSize: 12 }}>{l.entrega.toLocaleString("pt-BR")}</td>
                <td style={{ fontSize: 12 }}>R$ {l.investimento.toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function CategoriaRow({ categoria }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderTop: "1px solid var(--border)" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          cursor: "pointer",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600 }}>
          <ChevronIcon open={open} />
          {categoria.categoria}
        </span>
        <div style={{ display: "flex", gap: 24, fontSize: 12, color: "var(--text-secondary)" }}>
          <span>
            Entrega <strong>{formatCompact(categoria.entrega)}</strong>
          </span>
          <span>
            Investimento <strong>R$ {categoria.investimento.toLocaleString("pt-BR")}</strong>
          </span>
        </div>
      </div>
      {open && categoria.estados.map((estado) => <EstadoRow key={estado.estado} estado={estado} />)}
    </div>
  );
}

export default function MediaChannelsCard() {
  const { categoria, praca, veiculo, campanha } = useOfflineFilters();
  const [categories, setCategories] = useState(null);

  useEffect(() => {
    setCategories(null);
    getOfflineCategories({ categoria, praca, veiculo, campanha }).then(setCategories).catch(console.error);
  }, [JSON.stringify(categoria), JSON.stringify(praca), JSON.stringify(veiculo), JSON.stringify(campanha)]);

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <p className="card-title" style={{ margin: 0, padding: "20px 16px 0" }}>
        Meios de Comunicação
      </p>
      {!categories ? (
        <Spinner />
      ) : (
        <div style={{ maxHeight: 480, overflowY: "auto", marginTop: 8 }}>
          {categories.map((c) => (
            <CategoriaRow key={c.categoria} categoria={c} />
          ))}
        </div>
      )}
    </div>
  );
}
