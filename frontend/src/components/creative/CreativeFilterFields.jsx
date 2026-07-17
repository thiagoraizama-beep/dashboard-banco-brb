import { useEffect, useState } from "react";
import { getCreativeFilterOptions } from "../../api/client.js";
import { useCreativeFilters } from "../../context/CreativeAnalysisContext.jsx";
import MultiSelectDropdown from "../layout/MultiSelectDropdown.jsx";
import DateRangeFields from "../layout/DateRangeFields.jsx";

export default function CreativeFilterFields({ veiculo }) {
  const { filters, setFilter, setRange, clearFilters } = useCreativeFilters(veiculo);
  const [options, setOptions] = useState({ campanhas: [], tiposCompra: [], posicionamentos: [], plataformas: [] });

  useEffect(() => {
    getCreativeFilterOptions(veiculo).then(setOptions).catch(console.error);
  }, [veiculo]);

  return (
    <>
      <div>
        <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Período</label>
        <DateRangeFields
          start={filters.start}
          end={filters.end}
          isFiltered={Boolean(filters.start && filters.end)}
          onChange={(start, end) => setRange(start, end)}
        />
      </div>
      <div>
        <button
          onClick={clearFilters}
          style={{
            padding: 0,
            border: "none",
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: 12,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Limpar filtros
        </button>
      </div>
      <div>
        <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Tipo de Compra</label>
        <MultiSelectDropdown
          multi
          value={filters.tipoCompra}
          onChange={(v) => setFilter("tipoCompra", v)}
          options={options.tiposCompra}
          placeholder="Todos"
        />
      </div>
      <div>
        <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Formato</label>
        <MultiSelectDropdown
          multi
          value={filters.posicionamento}
          onChange={(v) => setFilter("posicionamento", v)}
          options={options.posicionamentos}
          placeholder="Todos"
        />
      </div>
      <div>
        <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Campanha</label>
        <MultiSelectDropdown
          multi
          value={filters.campanha}
          onChange={(v) => setFilter("campanha", v)}
          options={options.campanhas}
          placeholder="Todas as campanhas"
        />
      </div>
      {options.plataformas.length > 0 && (
        <div>
          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Plataforma</label>
          <MultiSelectDropdown
            multi
            value={filters.plataforma}
            onChange={(v) => setFilter("plataforma", v)}
            options={options.plataformas}
            placeholder="Todas"
          />
        </div>
      )}
    </>
  );
}
