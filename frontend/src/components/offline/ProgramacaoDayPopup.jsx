function formatDateBR(iso) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

const WEEKDAYS_LONG = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

// Popup de detalhe: mostra todas as programacoes de um dia especifico de forma
// legivel (dia da semana + data, depois cada item com emissora/programa/horario
// em destaque) -- substitui o texto espremido que ficava dentro da celula do
// calendario.
export default function ProgramacaoDayPopup({ date, items, onClose, onEdit, canEdit }) {
  const iso = date;
  const weekday = WEEKDAYS_LONG[new Date(`${iso}T12:00:00`).getDay()];
  const sorted = [...items].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,33,61,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: 420, maxHeight: "80vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>{weekday}</p>
            <strong style={{ fontSize: 18 }}>{formatDateBR(iso)}</strong>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text-secondary)" }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>Nenhuma programação cadastrada para este dia.</p>
          )}
          {sorted.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.3 }}>
                  Emissora:{" "}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--accent)",
                    background: "var(--accent-soft)",
                    borderRadius: 999,
                    padding: "2px 10px",
                  }}
                >
                  {p.veiculo}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.3 }}>
                  Programa:{" "}
                </span>
                <strong style={{ fontSize: 15 }}>{p.programa}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.3 }}>
                  Horário:{" "}
                </span>
                <strong style={{ fontSize: 14, color: "var(--text-primary)" }}>
                  {p.horaInicio} às {p.horaFim}
                </strong>
              </div>
              {canEdit && (
                <button
                  onClick={() => onEdit(p)}
                  style={{
                    alignSelf: "flex-start",
                    marginTop: 4,
                    padding: "5px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Editar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
