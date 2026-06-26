import { useEffect, useRef, useState } from "react";

export default function CreativePreviewPopup({ creative, children }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 8 }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
      >
        {children}
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 100,
            width: 280,
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 12px 32px rgba(20,33,61,0.2)",
            padding: 12,
            textAlign: "left",
          }}
        >
          {creative.tipo_midia === "video" ? (
            <video
              src={creative.cloudinary_url}
              controls
              style={{ width: "100%", maxHeight: 220, borderRadius: 8, objectFit: "contain", background: "var(--bg)" }}
            />
          ) : (
            <img
              src={creative.cloudinary_url}
              alt={creative.nome}
              style={{ width: "100%", maxHeight: 220, borderRadius: 8, objectFit: "contain", background: "var(--bg)" }}
            />
          )}

          <strong style={{ display: "block", fontSize: 13, marginTop: 10 }}>{creative.nome}</strong>

          <div style={{ marginTop: 8 }}>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>Descrição</p>
            <p style={{ margin: "2px 0 0", fontSize: 12 }}>{creative.descricao || "Sem descrição"}</p>
          </div>

          <div style={{ marginTop: 8 }}>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>Observações</p>
            <p style={{ margin: "2px 0 0", fontSize: 12 }}>{creative.observacoes || "Sem observações"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
