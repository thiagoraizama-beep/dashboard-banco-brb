import { useEffect, useState } from "react";
import { getCampaignStatus } from "../../api/client.js";
import { useDateRange } from "../../context/DateRangeContext.jsx";
import Spinner from "../common/Spinner.jsx";

function formatDateBR(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export default function CampaignStatusCard() {
  const [campaigns, setCampaigns] = useState(null);
  const { campanha, toggleCampanha } = useDateRange();

  useEffect(() => {
    getCampaignStatus().then(setCampaigns).catch(console.error);
  }, []);

  return (
    <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <p className="card-title">Campanhas</p>
      {!campaigns ? (
        <Spinner fullHeight />
      ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", flex: 1 }}>
        {campaigns.map((c) => {
          const selected = campanha.includes(c.campanha);
          return (
            <div key={c.campanha}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong style={{ fontSize: 14 }}>{c.campanha}</strong>
                  <button
                    onClick={() => toggleCampanha(c.campanha)}
                    title="Filtrar dashboard por esta campanha"
                    aria-label="Filtrar dashboard por esta campanha"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      color: selected ? "var(--success)" : "#c7cad1",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
                <span className={`badge badge-${c.status}`}>{c.status === "ativo" ? "Ativo" : "Inativo"}</span>
              </div>
              <small style={{ color: "var(--text-secondary)" }}>Último dado: {formatDateBR(c.ultimaData)}</small>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
