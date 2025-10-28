/**
 * Theme Provider - Soporte para Modo Oscuro
 * Gestiona el tema de la aplicación (light/dark/system)
 */

import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider");
  }
  return context;
}

const THEME_KEY = "peloapelo-theme";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Obtener tema guardado o usar 'system'
    const savedTheme = localStorage.getItem(THEME_KEY);
    return savedTheme || "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState("light");

  // Resolver el tema actual (light o dark)
  useEffect(() => {
    const root = document.documentElement;

    const getResolvedTheme = () => {
      if (theme === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
      return theme;
    };

    const applyTheme = () => {
      const resolved = getResolvedTheme();
      setResolvedTheme(resolved);

      // Aplicar clase al HTML
      root.classList.remove("light", "dark");
      root.classList.add(resolved);

      // Aplicar atributo data-theme
      root.setAttribute("data-theme", resolved);

      // Color del tema para navegadores
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute(
          "content",
          resolved === "dark" ? "#1f2937" : "#ffffff",
        );
      }
    };

    applyTheme();

    // Escuchar cambios en preferencia del sistema
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme();

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  // Guardar tema en localStorage
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "system";
      return "light";
    });
  };

  const setLightTheme = () => setTheme("light");
  const setDarkTheme = () => setTheme("dark");
  const setSystemTheme = () => setTheme("system");

  const value = {
    theme, // 'light', 'dark', 'system'
    resolvedTheme, // 'light' o 'dark' (el tema actual aplicado)
    setTheme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Componente Toggle de Tema
 */
export function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();

  const icons = {
    light: "☀️",
    dark: "🌙",
    system: "💻",
  };

  const labels = {
    light: "Modo Claro",
    dark: "Modo Oscuro",
    system: "Seguir Sistema",
  };

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
      aria-label={`Cambiar tema (Actual: ${labels[theme]})`}
      title={labels[theme]}
    >
      <span className="theme-toggle-icon">{icons[theme]}</span>
      <span className="theme-toggle-label">{labels[theme]}</span>
    </button>
  );
}

export default ThemeProvider;
