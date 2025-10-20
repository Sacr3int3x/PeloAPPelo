import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { CATALOG } from "../data/catalog";
import { catFromSlug, catSlug } from "../utils/categories";
import CategoryFilter from "../components/CategoryFilter/CategoryFilter";
import Card from "../components/Card/Card";
import FilterSheet from "../components/FilterSheet/FilterSheet";
import Select from "../components/Select/Select";
import "../styles/CategoryPage.css";

function CategoryPage() {
  const { slug } = useParams();
  const { label } = catFromSlug(slug);
  const { items } = useData();
  const navigate = useNavigate();

  const [location, setLocation] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [sort, setSort] = useState("new");
  const [openSheet, setOpenSheet] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const categories = [
    "Vehículos",
    "Celulares",
    "Electrónica",
    "Muebles",
    "Otros",
  ];

  // Filtrado base por categoría
  // Mapear slug a la categoría exactamente como está guardada en los items
  const categoryForItems = useMemo(() => {
    const map = {
      vehiculos: "Vehículo",
      celulares: "Celular",
      electronica: "Electrónica",
      muebles: "Muebles",
      otros: "Otros",
    };
    return map[slug] || label;
  }, [slug, label]);

  const base = useMemo(() => {
    return items.filter((x) => x.category === categoryForItems);
  }, [items, categoryForItems]);

  // Catálogo de filtros
  const catKey = useMemo(() => slug, [slug]);
  const catalog = useMemo(
    () => CATALOG[catKey] || { locations: [], brands: {} },
    [catKey],
  );

  // Ubicaciones disponibles
  const locations = useMemo(() => {
    const s = new Set(catalog.locations || []);
    base.forEach((x) => x.location && s.add(x.location));
    return Array.from(s).sort();
  }, [base, catalog]);

  // Marcas disponibles
  const brands = useMemo(() => {
    const s = new Set(Object.keys(catalog.brands || {}));
    base.forEach((x) => x.brand && s.add(x.brand));
    return Array.from(s).sort();
  }, [base, catalog]);

  // Modelos disponibles
  const models = useMemo(() => {
    const s = new Set();
    if (brand && catalog.brands) {
      const catModels = catalog.brands[brand] || [];
      catModels.forEach((m) => s.add(m));
    }

    base
      .filter((x) => !brand || x.brand === brand)
      .forEach((x) => x.model && s.add(x.model));

    return Array.from(s).sort();
  }, [base, brand, catalog]);

  // Aplicar filtros
  const filtered = useMemo(() => {
    let arr = base;

    if (location) arr = arr.filter((x) => x.location === location);
    if (brand) arr = arr.filter((x) => x.brand === brand);
    if (model) arr = arr.filter((x) => x.model === model);

    // Ordenamiento
    switch (sort) {
      case "new":
        return [...arr].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
      case "price_asc":
        return [...arr].sort((a, b) => (a.price || 0) - (b.price || 0));
      case "price_desc":
        return [...arr].sort((a, b) => (b.price || 0) - (a.price || 0));
      default:
        return arr;
    }
  }, [base, location, brand, model, sort]);

  // Resetear modelo al cambiar marca
  useEffect(() => setModel(""), [brand]);

  // Resetear filtros y vista al cambiar de categoría (slug)
  useEffect(() => {
    setLocation("");
    setBrand("");
    setModel("");
    setSort("new");
    setViewMode("grid");
  }, [slug]);

  // Formulario de filtros
  const FiltersForm = (
    <div className="filters-form">
      <Select
        label="Ordenar por"
        name="filter_sort"
        value={sort}
        onChange={setSort}
        options={[
          { value: 'new', label: 'Más recientes' },
          { value: 'price_asc', label: 'Precio más bajo' },
          { value: 'price_desc', label: 'Precio más alto' },
        ]}
        placeholder="Más recientes"
      />

      <Select
        label="Ubicación"
        name="filter_location"
        value={location}
        onChange={setLocation}
        options={[{ value: "", label: "Todas" }, ...locations.map((l) => ({ value: l, label: l }))]}
        placeholder="Todas"
      />

      <Select
        label="Marca"
        name="filter_brand"
        value={brand}
        onChange={(val) => {
          setBrand(val);
          setModel("");
        }}
        options={[{ value: "", label: "Todas" }, ...brands.map((b) => ({ value: b, label: b }))]}
        placeholder="Todas"
      />

      {brands.length > 0 && (
        <Select
          label="Modelo"
          name="filter_model"
          value={model}
          onChange={setModel}
          options={[{ value: "", label: "Todos" }, ...models.map((m) => ({ value: m, label: m }))]}
          placeholder="Todos"
          className={!brand ? "select-disabled" : ""}
        />
      )}
    </div>
  );

  return (
    <main className="container page">
      {/* Header con back iOS y botón de filtros */}
      <div className="page-header category-page-header">
        <button
          className="btn icon page-nav-btn"
          onClick={() => {
            if (window.history.length > 1) navigate(-1);
            else navigate('/');
          }}
          aria-label="Volver"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <polyline
              points="15 18 9 12 15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <h1 className="page-title h1" style={{ margin: 0 }}>{label}</h1>

        <button
          className="btn icon page-nav-btn"
          onClick={() => setOpenSheet(true)}
          aria-label="Filtros"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="7" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="11" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <CategoryFilter
        categories={categories}
        selectedCategory={label}
        onCategoryChange={(cat) => {
          const newSlug = catSlug(cat);
          if (newSlug !== slug) {
            navigate(`/category/${newSlug}`);
          }
        }}
      />

      <div className="category-toolbar">
        <div className="category-toolbar-info">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </div>
        <div className="category-toolbar-actions">
          <div className="view-toggle-group" role="group" aria-label="Cambiar vista">
            <button
              type="button"
              className={`view-toggle ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              aria-pressed={viewMode === "grid"}
              aria-label="Vista en cuadrícula"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              type="button"
              className={`view-toggle ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              aria-label="Vista en lista"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido ordenado sin aside de filtros fijo */}
      <div className="category-content">
        <div className="products-grid">
          {filtered.length > 0 ? (
            <div className={`grid-cards${viewMode === "list" ? " list-view" : ""}`}>
              {filtered.map((item) => (
                <Card key={item.id} item={item} viewMode={viewMode} />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>No se encontraron productos en esta categoría</p>
              <Link to="/publish" className="btn primary">
                Sé el primero en publicar
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Panel de filtros invocado por el botón de tres rayas */}
      <FilterSheet open={openSheet} onClose={() => setOpenSheet(false)}>
        {FiltersForm}
        <div className="filter-sheet-actions">
          <button
            className="btn outline"
            onClick={() => {
              setLocation("");
              setBrand("");
              setModel("");
              setSort("new");
            }}
          >
            Limpiar
          </button>
          <button className="btn primary" onClick={() => setOpenSheet(false)}>
            Ver {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </button>
        </div>
      </FilterSheet>
    </main>
  );
}

export default CategoryPage;
