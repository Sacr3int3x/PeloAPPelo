import React from "react";
import { Link } from "react-router-dom";
import "./SortFilter.css";

export default function SortFilter({ sortBy, onSortChange, totalResults }) {
  return (
    <div className="sort-filter">
      <div className="sort-filter-header">
        <span className="sort-filter-count">
          {totalResults} resultado{totalResults !== 1 ? "s" : ""}
        </span>
        <div className="sort-filter-controls">
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="new">Más recientes</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
          </select>
          <Link to="/publish" className="sort-filter-publish">
            <span className="publish-icon">+</span>
            Publicar
          </Link>
        </div>
      </div>
    </div>
  );
}
