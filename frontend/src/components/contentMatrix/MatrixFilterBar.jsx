import MultiSelectDropdown from "../layout/MultiSelectDropdown.jsx";

export default function MatrixFilterBar({ options, filters, setStatus, setVeiculo, setCampanha }) {
  return (
    <div className="card" style={{ marginBottom: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
      <div>
        <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Status</label>
        <MultiSelectDropdown
          multi
          value={filters.status}
          onChange={setStatus}
          options={options.statuses}
          placeholder="Todos os status"
        />
      </div>
      <div>
        <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Veículo</label>
        <MultiSelectDropdown
          multi
          value={filters.veiculo}
          onChange={setVeiculo}
          options={options.veiculos}
          placeholder="Todos os veículos"
        />
      </div>
      <div>
        <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Campanha</label>
        <MultiSelectDropdown
          multi
          value={filters.campanha}
          onChange={setCampanha}
          options={options.campanhas}
          placeholder="Todas as campanhas"
        />
      </div>
    </div>
  );
}
