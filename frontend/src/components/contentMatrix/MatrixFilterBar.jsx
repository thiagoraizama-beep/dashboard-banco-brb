function FilterSelect({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--card-bg)",
          color: "var(--text-primary)",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function MatrixFilterBar({ options, filters, setStatus, setVeiculo, setCampanha }) {
  return (
    <div className="card" style={{ marginBottom: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
      <FilterSelect
        label="Status"
        value={filters.status}
        onChange={setStatus}
        options={options.statuses}
        placeholder="Todos os status"
      />
      <FilterSelect
        label="Veículo"
        value={filters.veiculo}
        onChange={setVeiculo}
        options={options.veiculos}
        placeholder="Todos os veículos"
      />
      <FilterSelect
        label="Campanha"
        value={filters.campanha}
        onChange={setCampanha}
        options={options.campanhas}
        placeholder="Todas as campanhas"
      />
    </div>
  );
}
