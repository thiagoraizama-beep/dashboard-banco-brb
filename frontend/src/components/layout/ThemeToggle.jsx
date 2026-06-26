import { useTheme } from "../../context/ThemeContext.jsx";

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

export default function ThemeToggle({ variant = "onImage" }) {
  const { theme, toggleTheme } = useTheme();
  const onImage = variant === "onImage";

  return (
    <button
      onClick={toggleTheme}
      title={theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: onImage ? "1px solid rgba(255,255,255,0.4)" : "1px solid var(--border)",
        background: onImage ? "rgba(255,255,255,0.08)" : "var(--card-bg)",
        color: onImage ? "#fff" : "var(--text-primary)",
        cursor: "pointer",
      }}
    >
      {theme === "light" ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
