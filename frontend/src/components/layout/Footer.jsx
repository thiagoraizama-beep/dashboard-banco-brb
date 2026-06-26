export default function Footer() {
  return (
    <footer
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "18px 24px",
        background: "var(--accent)",
        borderRadius: 16,
        boxShadow: "0 1px 3px rgba(20,33,61,0.06)",
      }}
    >
      <span style={{ color: "#fff", fontSize: 13 }}>Business Intelligence da Agência Cálix • Insights</span>
      <img
        src="/CALIX_branco.png"
        alt="Cálix"
        style={{ position: "absolute", right: 24, height: 28, objectFit: "contain" }}
      />
    </footer>
  );
}
