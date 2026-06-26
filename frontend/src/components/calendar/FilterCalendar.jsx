import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { useDateRange } from "../../context/DateRangeContext.jsx";

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

export default function FilterCalendar({ onApply }) {
  const { range, setRange } = useDateRange();
  const [selected, setSelected] = useState({
    from: new Date(range.start),
    to: new Date(range.end),
  });

  function handleSelect(value) {
    if (value?.from) {
      setSelected({ from: value.from, to: value.to || value.from });
    }
  }

  function handleApply() {
    if (selected?.from && selected?.to) {
      setRange({ start: toISODate(selected.from), end: toISODate(selected.to) });
      onApply?.();
    }
  }

  return (
    <div className="card" style={{ fontSize: 13 }}>
      <p className="card-title">Período</p>
      <div className="mini-calendar" style={{ display: "flex", justifyContent: "center" }}>
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
  );
}
