import { useEffect, useMemo, useState } from "react";
import { getProgramacoes, getOfflineFilterOptions, getProgramasList } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import ProgramacaoModal from "./ProgramacaoModal.jsx";
import ProgramacoesListModal from "./ProgramacoesListModal.jsx";
import Spinner from "../common/Spinner.jsx";

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function buildCalendarGrid(monthDate) {
  const first = startOfMonth(monthDate);
  const last = endOfMonth(monthDate);
  const startWeekday = first.getDay();

  const days = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), d));
  }
  while (days.length % 7 !== 0) days.push(null);

  return days;
}

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export default function ProgramacaoCalendar() {
  const { user } = useAuth();
  const canEdit = user?.papel === "agencia";
  const [monthDate, setMonthDate] = useState(new Date());
  const [programacoes, setProgramacoes] = useState(null);
  const [veiculos, setVeiculos] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [modalDate, setModalDate] = useState(null);
  const [editingProgramacao, setEditingProgramacao] = useState(null);
  const [listOpen, setListOpen] = useState(false);

  const grid = useMemo(() => buildCalendarGrid(monthDate), [monthDate]);
  const monthLabel = monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  function loadProgramacoes() {
    setProgramacoes(null);
    const start = toISODate(startOfMonth(monthDate));
    const end = toISODate(endOfMonth(monthDate));
    getProgramacoes({ start, end }).then(setProgramacoes).catch(console.error);
  }

  useEffect(() => {
    loadProgramacoes();
  }, [monthDate]);

  useEffect(() => {
    getOfflineFilterOptions().then((opts) => setVeiculos(opts.veiculos)).catch(console.error);
  }, []);

  function loadProgramas() {
    getProgramasList().then(setProgramas).catch(console.error);
  }

  useEffect(() => {
    loadProgramas();
  }, []);

  function programacoesDoDia(date) {
    if (!date || !programacoes) return [];
    const iso = toISODate(date);
    return programacoes.filter((p) => p.data === iso);
  }

  function handleAddButtonClick() {
    setModalDate(new Date());
  }

  function handleListButtonClick() {
    setListOpen(true);
  }

  function handleEdit(programacao) {
    setListOpen(false);
    setEditingProgramacao(programacao);
  }

  function closeFormModal() {
    setModalDate(null);
    setEditingProgramacao(null);
  }

  function handleSaved() {
    loadProgramacoes();
    loadProgramas();
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <p className="card-title" style={{ margin: 0 }}>
            Programação de Televisão
          </p>
          <strong style={{ fontSize: 15, textTransform: "capitalize" }}>{monthLabel}</strong>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {canEdit && (
            <>
              <button onClick={handleListButtonClick} title="Ver programações" style={navButtonStyle}>
                ☰
              </button>
              <button onClick={handleAddButtonClick} title="Adicionar programação" style={navButtonStyle}>
                +
              </button>
            </>
          )}
          <button
            onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}
            style={navButtonStyle}
          >
            ‹
          </button>
          <button
            onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}
            style={navButtonStyle}
          >
            ›
          </button>
        </div>
      </div>

      {!programacoes ? (
        <Spinner />
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {WEEKDAYS.map((w) => (
          <div key={w} style={{ fontSize: 11, color: "var(--text-secondary)", textAlign: "center", fontWeight: 600 }}>
            {w}
          </div>
        ))}

        {grid.map((date, i) => {
          const items = programacoesDoDia(date);
          const isToday = date && toISODate(date) === toISODate(new Date());
          return (
            <div
              key={i}
              style={{
                minHeight: 84,
                borderRadius: 8,
                border: isToday ? "1px solid var(--accent)" : "1px solid var(--border)",
                padding: 6,
                background: date ? "var(--card-bg)" : "transparent",
              }}
            >
              {date && (
                <>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{date.getDate()}</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                    {items.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        title={`${p.veiculo} - ${p.programa} (${p.horaInicio} às ${p.horaFim})`}
                        style={{
                          background: "var(--accent-soft)",
                          color: "var(--accent)",
                          borderRadius: 6,
                          padding: "3px 6px",
                          fontSize: 10,
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.veiculo} · {p.programa}
                        <div style={{ fontWeight: 400, opacity: 0.85 }}>
                          {p.horaInicio} às {p.horaFim}
                        </div>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>+{items.length - 3} mais</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      )}

      {(modalDate || editingProgramacao) && (
        <ProgramacaoModal
          initialDate={modalDate}
          editingProgramacao={editingProgramacao}
          veiculos={veiculos}
          programas={programas}
          onClose={closeFormModal}
          onCreated={handleSaved}
        />
      )}

      {listOpen && programacoes && (
        <ProgramacoesListModal
          programacoes={programacoes}
          onClose={() => setListOpen(false)}
          onChanged={loadProgramacoes}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}

const navButtonStyle = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text-secondary)",
  cursor: "pointer",
  fontSize: 14,
};
