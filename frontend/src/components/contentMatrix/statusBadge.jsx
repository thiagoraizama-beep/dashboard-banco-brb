const STATUS_COLORS = {
  "Em veiculação": { color: "var(--success)", bg: "rgba(22,163,74,0.12)" },
  "Com erro": { color: "var(--danger)", bg: "rgba(220,38,38,0.12)" },
  Programado: { color: "var(--accent)", bg: "var(--accent-soft)" },
  Pausado: { color: "var(--text-secondary)", bg: "var(--border)" },
};

export const STATUS_OPTIONS = ["Em veiculação", "Com erro", "Programado", "Pausado"];

export default function StatusBadge({ status }) {
  const style = STATUS_COLORS[status] || STATUS_COLORS.Programado;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
        color: style.color,
        background: style.bg,
      }}
    >
      {status}
    </span>
  );
}
