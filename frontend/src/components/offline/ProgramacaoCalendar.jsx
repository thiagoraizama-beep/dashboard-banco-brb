import { useEffect, useMemo, useState } from "react";
import { getProgramacoes, getOfflineFilterOptions, getProgramasList } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useOfflineFilters } from "../../context/OfflineFiltersContext.jsx";
import ProgramacaoModal from "./ProgramacaoModal.jsx";
import ProgramacoesListModal from "./ProgramacoesListModal.jsx";
import ProgramacaoDayPopup from "./ProgramacaoDayPopup.jsx";
import Spinner from "../common/Spinner.jsx";
import useIsMobile from "../../hooks/useIsMobile.js";
import { toISODate } from "../../utils/date.js";

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

function formatDateBR(iso) {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export default function ProgramacaoCalendar() {
  const { user } = useAuth();
  const { refreshToken } = useOfflineFilters();
  const canEdit = user?.papel === "agencia";
  const [monthDate, setMonthDate] = useState(new Date());
  const [programacoes, setProgramacoes] = useState(null);
  const [veiculos, setVeiculos] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [modalDate, setModalDate] = useState(null);
  const [editingProgramacao, setEditingProgramacao] = useState(null);
  const [listOpen, setListOpen] = useState(false);
  const [dayPopup, setDayPopup] = useState(null);
  const isMobile = useIsMobile();

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
  }, [monthDate, refreshToken]);

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

  // Proximas programacoes a partir de hoje (inclusive), agrupadas por data (cada
  // grupo ja ordenado por horario) -- alimenta o rail lateral "Próximas
  // programações" com um cabecalho de data por dia, em vez de repetir a data em
  // cada item (fica mais legivel quando ha varias programacoes no mesmo dia).
  const proximasPorDia = useMemo(() => {
    if (!programacoes) return [];
    const hojeIso = toISODate(new Date());
    const futuras = programacoes
      .filter((p) => p.data >= hojeIso)
      .sort((a, b) => (a.data + a.horaInicio).localeCompare(b.data + b.horaInicio));
    const grupos = new Map();
    for (const p of futuras) {
      if (!grupos.has(p.data)) grupos.set(p.data, []);
      grupos.get(p.data).push(p);
    }
    return [...grupos.entries()].map(([data, items]) => ({ data, items }));
  }, [programacoes]);

  function handleAddButtonClick() {
    setModalDate(new Date());
  }

  function handleListButtonClick() {
    setListOpen(true);
  }

  function handleEdit(programacao) {
    setListOpen(false);
    setDayPopup(null);
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

  function handleDayClick(date) {
    if (!date) return;
    const items = programacoesDoDia(date);
    if (items.length === 0) return;
    setDayPopup({ date: toISODate(date), items });
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(200px, 260px)",
            gap: isMobile ? 16 : 20,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: isMobile ? 3 : 6, minWidth: 0 }}>
            {WEEKDAYS.map((w) => (
              <div key={w} style={{ fontSize: isMobile ? 9 : 11, color: "var(--text-secondary)", textAlign: "center", fontWeight: 600 }}>
                {isMobile ? w.slice(0, 1).toUpperCase() : w}
              </div>
            ))}

            {grid.map((date, i) => {
              const items = programacoesDoDia(date);
              const isToday = date && toISODate(date) === toISODate(new Date());
              const temItens = items.length > 0;
              // "Hoje" (borda cheia na cor de destaque) e "dia com programacao"
              // (fundo azul suave) sao sinais independentes -- um dia pode ser so
              // hoje, so ter programacao, os dois, ou nenhum. Quando coincidem, a
              // borda cheia + fundo suave se somam sem precisar de uma segunda cor.
              return (
                <div
                  key={i}
                  onClick={() => handleDayClick(date)}
                  style={{
                    minHeight: isMobile ? 34 : 44,
                    borderRadius: 8,
                    border: isToday ? "2px solid var(--accent)" : "1px solid var(--border)",
                    padding: isMobile ? 3 : 6,
                    background: temItens ? "var(--accent-soft)" : date ? "var(--card-bg)" : "transparent",
                    cursor: temItens ? "pointer" : "default",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    transition: "filter 0.12s ease",
                  }}
                  onMouseEnter={(e) => { if (temItens) e.currentTarget.style.filter = "brightness(0.96)"; }}
                  onMouseLeave={(e) => { if (temItens) e.currentTarget.style.filter = "none"; }}
                >
                  {date && (
                    <>
                      <span
                        style={{
                          fontSize: isMobile ? 10 : 12,
                          fontWeight: isToday ? 700 : 400,
                          color: isToday || temItens ? "var(--accent)" : "var(--text-secondary)",
                        }}
                      >
                        {date.getDate()}
                      </span>
                      {temItens && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: "#fff",
                            background: "var(--accent)",
                            borderRadius: 999,
                            padding: "1px 6px",
                            lineHeight: 1.4,
                          }}
                        >
                          {items.length}
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.4 }}>
              Próximas programações
            </p>
            {proximasPorDia.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>Nenhuma programação futura.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: isMobile ? undefined : 380, overflowY: "auto", paddingRight: 2 }}>
                {proximasPorDia.map((grupo) => (
                  <div key={grupo.data} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>{formatDateBR(grupo.data)}</span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: "var(--accent)",
                          background: "var(--accent-soft)",
                          borderRadius: 999,
                          padding: "1px 6px",
                        }}
                      >
                        {grupo.items.length}
                      </span>
                    </div>
                    {grupo.items.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setDayPopup({ date: grupo.data, items: grupo.items })}
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: "8px 10px",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: 3,
                        }}
                      >
                        <div>
                          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Emissora: </span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)" }}>{p.veiculo}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Programa: </span>
                          <strong style={{ fontSize: 12 }}>{p.programa}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Horário: </span>
                          <span style={{ fontSize: 11, color: "var(--text-primary)" }}>{p.horaInicio} às {p.horaFim}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {dayPopup && (
        <ProgramacaoDayPopup
          date={dayPopup.date}
          items={dayPopup.items}
          onClose={() => setDayPopup(null)}
          onEdit={handleEdit}
          canEdit={canEdit}
        />
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
