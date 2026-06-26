// Forca o download via Cloudinary inserindo fl_attachment na URL, em vez de abrir no navegador.
function toDownloadUrl(url) {
  return url.replace("/upload/", "/upload/fl_attachment/");
}

export default function DownloadButton({ creative, compact }) {
  return (
    <a
      href={toDownloadUrl(creative.cloudinary_url)}
      download
      title="Baixar criativo"
      aria-label="Baixar criativo"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: compact ? "4px 10px" : "6px 12px",
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: "transparent",
        color: "var(--text-primary)",
        fontSize: 12,
        textDecoration: "none",
        cursor: "pointer",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3v12" />
        <path d="M7 10l5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
      {!compact && "Baixar"}
    </a>
  );
}
