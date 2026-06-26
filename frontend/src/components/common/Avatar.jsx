const COLORS = ["#2f6feb", "#16a34a", "#f59e0b", "#a855f7", "#dc2626", "#0891b2"];

function colorForName(name) {
  const index = (name || "").charCodeAt(0) % COLORS.length;
  return COLORS[index] || COLORS[0];
}

export default function Avatar({ nome, fotoUrl, size = 36 }) {
  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nome}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }

  const inicial = (nome || "?").trim().charAt(0).toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: colorForName(nome),
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.42,
        fontWeight: 400,
        flexShrink: 0,
      }}
    >
      {inicial}
    </div>
  );
}
