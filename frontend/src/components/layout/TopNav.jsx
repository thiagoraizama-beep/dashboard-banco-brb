const NAV_ITEMS = ["Dashboard", "Leads", "Property", "Transaction", "Calendar"];

export default function TopNav() {
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#fff",
        borderRadius: "16px",
        padding: "6px 24px",
        boxShadow: "0 1px 3px rgba(20,33,61,0.06)",
      }}
    >
      <img src="/cor-solida-horizontal-1.png" alt="Senado Federal" style={{ height: 72 }} />
      <div style={{ display: "flex", gap: 8 }}>
        {NAV_ITEMS.map((item, i) => (
          <span
            key={item}
            style={{
              fontWeight: i === 0 ? 600 : 400,
              color: i === 0 ? "var(--accent)" : "var(--text-secondary)",
              cursor: "pointer",
              padding: "6px 14px",
              borderRadius: 999,
              border: i === 0 ? "1px solid var(--accent)" : "1px solid transparent",
              background: i === 0 ? "var(--accent-soft)" : "transparent",
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </nav>
  );
}
