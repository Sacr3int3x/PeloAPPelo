export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const fmt = (n) =>
  (typeof n === "number" ? n : Number(n || 0)).toLocaleString();
