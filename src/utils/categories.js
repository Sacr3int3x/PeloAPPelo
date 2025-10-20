export const catSlug = (label) =>
  label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

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
