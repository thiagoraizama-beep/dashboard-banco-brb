import { useEffect, useState } from "react";
import { getOfflineCategories } from "../../api/client.js";
import { useOfflineFilters } from "../../context/OfflineFiltersContext.jsx";
import Spinner from "../common/Spinner.jsx";
import useIsMobile from "../../hooks/useIsMobile.js";

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

function MetricPair({ entrega, investimento }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 12 }}>
      <span style={{ color: "var(--text-secondary)" }}>
        Entrega <strong style={{ color: "var(--accent)" }}>{formatCompact(entrega)}</strong>
      </span>
      <span style={{ color: "var(--text-secondary)" }}>
        Investimento <strong style={{ color: "var(--success)" }}>R$ {investimento.toLocaleString("pt-BR")}</strong>
      </span>
    </div>
  );
}

function LinhasMobile({ linhas }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 10 }}>
      {linhas.map((l, i) => (
        <div
          key={i}
          style={{
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 10,
            background: "var(--card-bg)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <strong style={{ fontSize: 12 }}>{l.veiculo}</strong>
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{l.praca}</span>
          </div>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{l.programa}</span>
          <div style={{ display: "flex", gap: 14, fontSize: 11, marginTop: 2 }}>
            <span>
              Entrega <strong style={{ color: "var(--accent)" }}>{l.entrega.toLocaleString("pt-BR")}</strong>
            </span>
            <span>
              Investimento <strong style={{ color: "var(--success)" }}>R$ {l.investimento.toLocaleString("pt-BR")}</strong>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function LinhasTabela({ linhas }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table>
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
          {linhas.map((l, i) => (
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
    </div>
  );
}

function EstadoRow({ estado }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 10,
      }}
    >
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          padding: "10px 14px",
          cursor: "pointer",
          background: "var(--bg)",
          borderRadius: 10,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
          <ChevronIcon open={open} />
          {estado.estado}
        </span>
        <MetricPair entrega={estado.entrega} investimento={estado.investimento} />
      </div>
      {open && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {isMobile ? <LinhasMobile linhas={estado.linhas} /> : <LinhasTabela linhas={estado.linhas} />}
        </div>
      )}
    </div>
  );
}

function CategoriaRow({ categoria }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
      }}
    >
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "14px 16px",
          cursor: "pointer",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700 }}>
          <ChevronIcon open={open} />
          {categoria.categoria}
        </span>
        <MetricPair entrega={categoria.entrega} investimento={categoria.investimento} />
      </div>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 12px 12px", background: "var(--bg)" }}>
          {categoria.estados.map((estado) => (
            <EstadoRow key={estado.estado} estado={estado} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MediaChannelsCard() {
  const { categoria, praca, veiculo, campanha, refreshToken } = useOfflineFilters();
  const [categories, setCategories] = useState(null);

  useEffect(() => {
    setCategories(null);
    getOfflineCategories({ categoria, praca, veiculo, campanha }).then(setCategories).catch(console.error);
  }, [JSON.stringify(categoria), JSON.stringify(praca), JSON.stringify(veiculo), JSON.stringify(campanha), refreshToken]);

  return (
    <div className="card">
      <p className="card-title">Meios de Comunicação</p>
      {!categories ? (
        <Spinner />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 480, overflowY: "auto" }}>
          {categories.map((c) => (
            <CategoriaRow key={c.categoria} categoria={c} />
          ))}
        </div>
      )}
    </div>
  );
}
