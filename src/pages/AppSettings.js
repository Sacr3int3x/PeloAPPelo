import React from "react";
import { useTheme } from "../components/ThemeProvider/ThemeProvider";

/**
 * Pestaña de Configuraciones de la App
 * Permite cambiar el tema (oscuro/claro/sistema)
 */
function AppSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <section
      style={{
        maxWidth: 400,
        margin: "2rem auto",
        padding: "2rem",
        background: "var(--color-bg-card)",
        borderRadius: 12,
      }}
    >
      <h2 style={{ marginBottom: "1.5rem" }}>Configuraciones de la App</h2>
      <div style={{ marginBottom: "2rem" }}>
        <label htmlFor="theme-select" style={{ fontWeight: "bold" }}>
          Tema visual:
        </label>
        <select
          id="theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          style={{ marginLeft: 12, padding: "0.5rem", borderRadius: 6 }}
        >
          <option value="system">Automático (según sistema)</option>
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
        </select>
      </div>
      <p style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)" }}>
        El modo oscuro se activa automáticamente si tu sistema lo tiene
        configurado, o puedes elegirlo manualmente aquí.
      </p>
    </section>
  );
}

export default AppSettings;
