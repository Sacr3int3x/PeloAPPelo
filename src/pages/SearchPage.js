import React, { useState, useMemo, useEffect } from "react";
import { HiOutlineArrowLeft, HiOutlineAdjustments } from "react-icons/hi";
import { useLocation, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import Card from "../components/Card/Card";
import PageHeader from "../components/PageHeader/PageHeader";
import FilterSheet from "../components/FilterSheet/FilterSheet";
import Select from "../components/Select/Select";
import "../styles/CategoryPage.css";
import "./SearchPage.css";

const DEFAULT_CATEGORY_FILTERS = [
  "Vehículo",
  "Celular",
  "Electrónica",
  "Muebles",
  "Otros",
];

function SearchPage() {
  const { items, trackSearch } = useData();
  const loc = useLocation();
  const nav = useNavigate();
  const params = new URLSearchParams(loc.search);
  const q = params.get("q") || "";
  const sellerRaw = params.get("seller") || "";
  const seller = sellerRaw.trim().toLowerCase();

  const [sort, setSort] = useState("new");
  const [condition, setCondition] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    if (seller) return;
    if (q.trim()) {
      trackSearch(q);
    }
  }, [q, seller, trackSearch]);

  const resetFilters = () => {
    setSort("new");
    setCondition("");
    setCategoryFilter("");
  };

  const sellerInfo = useMemo(() => {
    if (!seller) return null;
    const match = items.find((item) => {
      const ownerEmail = (item.ownerEmail || "").toLowerCase();
      const ownerUsername = (item.ownerUsername || "").toLowerCase();
      const ownerId = (item.ownerId || "").toLowerCase();
      return (
        seller === ownerEmail ||
        (seller && seller === ownerUsername) ||
        seller === ownerId
      );
    });
    if (!match) {
      return { label: sellerRaw };
    }
    return {
      label:
        match.ownerName || match.ownerUsername || match.ownerEmail || sellerRaw,
      username: match.ownerUsername || null,
    };
  }, [items, seller, sellerRaw]);

  const categories = useMemo(() => {
    const set = new Set(DEFAULT_CATEGORY_FILTERS);
    items.forEach((item) => {
      if (item.category) {
        set.add(item.category);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [items]);

  const filtered = useMemo(() => {
    let arr = items;
    const t = q.trim().toLowerCase();

    if (seller) {
      arr = arr.filter((x) => {
        const ownerEmail = (x.ownerEmail || "").toLowerCase();
        const ownerUsername = (x.ownerUsername || "").toLowerCase();
        const ownerId = (x.ownerId || "").toLowerCase();
        return (
          seller === ownerEmail ||
          seller === ownerUsername ||
          seller === ownerId
        );
      });
    }

    if (categoryFilter) {
      const cat = categoryFilter.toLowerCase();
      arr = arr.filter(
        (x) => (x.category || "").toLowerCase() === cat,
      );
    }

    if (t) {
      arr = arr.filter(
        (x) =>
          (x.title || x.name || "").toLowerCase().includes(t) ||
          (x.brand || "").toLowerCase().includes(t) ||
          (x.model || "").toLowerCase().includes(t) ||
          (x.location || "").toLowerCase().includes(t) ||
          (x.description || "").toLowerCase().includes(t),
      );
    }

    if (condition) {
      arr = arr.filter(
        (x) => (x.condition || "usado").toLowerCase() === condition,
      );
    }

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
  }, [items, q, sort, condition, seller, categoryFilter]);

  const headerTitle = useMemo(() => {
    if (q.trim()) {
      return `Resultados para "${q}"`;
    }
    if (sellerInfo?.label) {
      return `Publicaciones de ${sellerInfo.label}`;
    }
    return "Búsqueda";
  }, [sellerInfo, q]);

  return (
    <main className="container page">
      <PageHeader title={headerTitle} />

      <div className="search-actions-bar">
        <button
          type="button"
          className="btn icon page-nav-btn search-action-btn"
          onClick={() => {
            if (window.history.length > 1) nav(-1);
            else nav("/");
          }}
          aria-label="Volver"
        >
          <HiOutlineArrowLeft aria-hidden />
        </button>
        <button
          type="button"
          className="btn icon page-nav-btn search-action-btn"
          onClick={() => setFilterOpen(true)}
          aria-label="Abrir filtros"
        >
          <HiOutlineAdjustments aria-hidden />
        </button>
      </div>

      <div className="muted" style={{ marginBottom: 8 }}>
        {filtered.length} resultado(s)
      </div>

      <div className="grid-cards">
        {filtered.map((it) => (
          <Card key={it.id} item={it} />
        ))}
      </div>

      {!filtered.length && (
        <p className="muted">No se encontraron resultados.</p>
      )}

      <FilterSheet open={filterOpen} onClose={() => setFilterOpen(false)}>
        <div className="filters-form search-sheet-controls">
          <Select
            label="Ordenar por"
            name="search_sort"
            value={sort}
            onChange={setSort}
            options={[
              { value: "new", label: "Más recientes" },
              { value: "price_asc", label: "Precio más bajo" },
              { value: "price_desc", label: "Precio más alto" },
            ]}
            placeholder="Más recientes"
          />

          <Select
            label="Categoría"
            name="search_category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: "", label: "Todas" },
              ...categories.map((cat) => ({ value: cat, label: cat })),
            ]}
            placeholder="Todas"
          />

          <Select
            label="Condición"
            name="search_condition"
            value={condition}
            onChange={setCondition}
            options={[
              { value: "", label: "Todas" },
              { value: "nuevo", label: "Nuevo" },
              { value: "usado", label: "Usado" },
            ]}
            placeholder="Todas"
          />
          <div className="search-sheet-actions">
            <button
              type="button"
              className="btn outline"
              onClick={resetFilters}
            >
              Limpiar
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={() => setFilterOpen(false)}
            >
              Ver {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      </FilterSheet>
    </main>
  );
}

export default SearchPage;
