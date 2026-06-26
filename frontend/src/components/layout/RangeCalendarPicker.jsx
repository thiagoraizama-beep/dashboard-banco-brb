import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import "react-day-picker/dist/style.css";

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function formatDateBR(iso) {
  if (!iso) return null;
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export default function RangeCalendarPicker({ start, end, onChange }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState({
    from: start ? new Date(start) : undefined,
    to: end ? new Date(end) : undefined,
  });
  const containerRef = useRef(null);

  useEffect(() => {
    setSelected({ from: start ? new Date(start) : undefined, to: end ? new Date(end) : undefined });
  }, [start, end]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(value) {
    if (value?.from) setSelected({ from: value.from, to: value.to || value.from });
    else setSelected({ from: undefined, to: undefined });
  }

  function handleApply() {
    if (selected?.from && selected?.to) {
      onChange(toISODate(selected.from), toISODate(selected.to));
      setOpen(false);
    }
  }

  const label =
    start && end ? `${formatDateBR(start)} - ${formatDateBR(end)}` : "Selecionar período";

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--card-bg)",
          color: "var(--text-primary)",
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 50,
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(20,33,61,0.15)",
            padding: 12,
          }}
        >
          <div className="mini-calendar mini-calendar-compact" style={{ display: "flex", justifyContent: "center" }}>
            <DayPicker
              mode="range"
              selected={selected}
              onSelect={handleSelect}
              numberOfMonths={1}
              defaultMonth={selected?.to || new Date()}
              locale={ptBR}
            />
          </div>
          <button
            onClick={handleApply}
            disabled={!selected?.from || !selected?.to}
            style={{
              width: "100%",
              marginTop: 8,
              padding: "8px 0",
              borderRadius: 8,
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: selected?.from && selected?.to ? "pointer" : "not-allowed",
              opacity: selected?.from && selected?.to ? 1 : 0.5,
            }}
          >
            Filtrar
          </button>
        </div>
      )}
    </div>
  );
}
