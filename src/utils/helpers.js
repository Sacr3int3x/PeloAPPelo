// Funciones auxiliares

// Generar ID basado en timestamp
export const nowId = () => Date.now();

// Leer datos de localStorage con fallback
export const read = (k, f) => {
  try {
    return JSON.parse(localStorage.getItem(k) || "null") ?? f;
  } catch {
    return f;
  }
};

// Escribir datos en localStorage
export const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// Limitar un número entre un mínimo y máximo
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// Formatear números con separadores de miles
export const fmt = (n) =>
  (typeof n === "number" ? n : Number(n || 0)).toLocaleString();

// Convertir categoría a slug URL-friendly
export const catSlug = (label) =>
  label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

// Convertir slug a objeto de categoría
export const catFromSlug = (slug) => {
  const map = {
    vehiculos: { label: "Vehículos", key: "Vehículo" },
    celulares: { label: "Celulares", key: "Celular" },
    electronica: { label: "Electrónica", key: "Electrónica" },
    muebles: { label: "Muebles", key: "Muebles" },
    otros: { label: "Otros", key: "Otros" },
  };
  return map[slug] || { label: slug, key: slug };
};
