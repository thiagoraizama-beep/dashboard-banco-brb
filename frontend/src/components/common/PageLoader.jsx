export default function PageLoader({ pageName }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        zIndex: 1000,
      }}
    >
      <span
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "4px solid var(--border)",
          borderTopColor: "var(--accent)",
          display: "inline-block",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
        Carregando {pageName}...
      </p>
    </div>
  );
}
