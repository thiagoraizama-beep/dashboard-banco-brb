import { useEffect, useRef, useState } from "react";
import FilterCalendar from "../calendar/FilterCalendar.jsx";
import MultiSelectDropdown from "./MultiSelectDropdown.jsx";
import NotificationBell from "./NotificationBell.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import { getVehicles } from "../../api/client.js";
import { useDateRange } from "../../context/DateRangeContext.jsx";

const MODELOS_COMPRA = ["CPM", "CPC", "CPV"];

function CalendarButtonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </svg>
  );
}

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}

export default function Header() {
  const { range, veiculo, setVeiculo, modeloCompra, setModeloCompra } = useDateRange();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const calendarRef = useRef(null);

  useClickOutside(calendarRef, () => setCalendarOpen(false));

  useEffect(() => {
    getVehicles(range).then((vehicles) => setVehicleOptions(vehicles.map((v) => v.veiculo))).catch(console.error);
  }, [range]);

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 12,
        backgroundImage:
          "linear-gradient(rgba(47, 111, 235, 0.82), rgba(47, 111, 235, 0.82)), url(/PlenarioSenadoFederal.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: 16,
        padding: "12px 24px",
        boxShadow: "0 1px 3px rgba(20,33,61,0.06)",
        marginBottom: 20,
        position: "relative",
      }}
    >
      <MultiSelectDropdown
        multi
        variant="onImage"
        value={veiculo}
        onChange={setVeiculo}
        placeholder="Todos os veículos"
        options={vehicleOptions}
      />

      <MultiSelectDropdown
        multi
        variant="onImage"
        value={modeloCompra}
        onChange={setModeloCompra}
        placeholder="Todos os modelos"
        options={MODELOS_COMPRA}
      />

      <div ref={calendarRef} style={{ position: "relative" }}>
        <button
          onClick={() => setCalendarOpen((open) => !open)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.4)",
            background: "rgba(255,255,255,0.08)",
            color: "#fff",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <CalendarButtonIcon />
          Período
        </button>
        {calendarOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 20 }}>
            <FilterCalendar onApply={() => setCalendarOpen(false)} />
          </div>
        )}
      </div>

      <ThemeToggle />
      <NotificationBell />
    </header>
  );
}
