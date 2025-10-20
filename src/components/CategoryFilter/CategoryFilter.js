import React from "react";
import "./CategoryFilter.css";

export default function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
}) {
  const handleCategoryClick = (category) => {
    onCategoryChange(category);
  };

  return (
    <div className="category-filter">
      <div className="category-filter-scroll">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-filter-item ${
              selectedCategory === category ? "active" : ""
            }`}
            onClick={() => handleCategoryClick(category)}
          >
            <div className="category-filter-icon">
              {getCategoryIcon(category)}
            </div>
            <span className="category-filter-label">{category}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function getCategoryIcon(category) {
  const icons = {
    Vehículos: "🚗",
    Celulares: "📱",
    Electrónica: "💻",
    Muebles: "🪑",
    Otros: "📦",
  };
  return icons[category] || "📦";
}
