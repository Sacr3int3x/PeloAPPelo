import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useData } from "../context/DataContext";
import Card from "../components/Card/Card";
import PageHeader from "../components/PageHeader/PageHeader";

function SearchPage() {
  const { items, trackSearch } = useData();
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const q = params.get("q") || "";

  const [sort, setSort] = useState("new");

  useEffect(() => {
    if (q.trim()) {
      trackSearch(q);
    }
  }, [q, trackSearch]);

  const filtered = useMemo(() => {
    let arr = items;
    const t = q.trim().toLowerCase();

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
  }, [items, q, sort]);

  return (
    <main className="container page">
      <PageHeader title={q ? `Resultados para "${q}"` : "Búsqueda"} />

      <div
        className="row"
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <label className="field" style={{ marginBottom: 0 }}>
          <span className="label" style={{ marginRight: 8 }}>
            Ordenar:
          </span>
          <select
            className="input"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ width: "auto", padding: "6px 10px" }}
          >
            <option value="new">Más recientes</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
          </select>
        </label>
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
    </main>
  );
}

export default SearchPage;
