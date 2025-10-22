import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { catSlug } from "../../utils/categories";
import "./CategoryChipsNav.css";

const categories = [
  "Vehículos",
  "Celulares",
  "Electrónica",
  "Muebles",
  "Otros",
];

function CategoryChipsNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState(() => {
    const match = categories.find((cat) => location.pathname.includes(catSlug(cat)));
    return match || "Todos";
  });

  const handleSelect = (cat) => {
    setActive(cat);
    if (cat === "Todos") {
      navigate("/");
      return;
    }
    navigate(`/category/${catSlug(cat)}`);
  };

  useEffect(() => {
    const match = categories.find((cat) => location.pathname.includes(catSlug(cat)));
    if (match) {
      setActive(match);
    } else if (location.pathname === "/") {
      setActive("Todos");
    }
  }, [location.pathname]);

  return (
    <div className="category-filter home-category-nav">
      <div className="category-filter-scroll">
        <button
          type="button"
          className={`category-filter-item ${active === "Todos" ? "active" : ""}`}
          onClick={() => handleSelect("Todos")}
        >
          <span className="category-filter-label">Todos</span>
        </button>
        {categories.map((cat) => (
          <button
            type="button"
            key={cat}
            className={`category-filter-item ${active === cat ? "active" : ""}`}
            onClick={() => handleSelect(cat)}
          >
            <span className="category-filter-label">{cat}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default CategoryChipsNav;
