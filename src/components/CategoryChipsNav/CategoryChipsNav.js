import React from "react";
import { Link } from "react-router-dom";
import { catSlug } from "../../utils/categories";
import "./CategoryChipsNav.css";

function CategoryChipsNav() {
  const categories = [
    "Vehículos",
    "Celulares",
    "Electrónica",
    "Muebles",
    "Otros",
  ];

  return (
    <div className="chip-nav">
      {categories.map((cat) => (
        <Link key={cat} to={`/category/${catSlug(cat)}`} className="chip-link">
          {cat}
        </Link>
      ))}
    </div>
  );
}

export default CategoryChipsNav;
