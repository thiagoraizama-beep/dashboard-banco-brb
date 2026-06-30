import { useEffect, useRef, useState } from "react";

const POPUP_WIDTH = 280;

export default function CreativePreviewPopup({ creative, children }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const popupRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        popupRef.current &&
        !popupRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleToggle() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const left = Math.min(rect.left, window.innerWidth - POPUP_WIDTH - 12);
      setCoords({ top: rect.bottom + 8, left: Math.max(8, left) });
    }
    setOpen((o) => !o);
  }

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleToggle}
        style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}
      >
        {children}
      </div>

      {open && coords && (
        <div
          ref={popupRef}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            zIndex: 1000,
            width: POPUP_WIDTH,
            maxWidth: "calc(100vw - 16px)",
            maxHeight: "calc(100vh - 16px)",
            overflowY: "auto",
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
    </>
  );
}
