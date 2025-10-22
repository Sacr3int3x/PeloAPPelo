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
            <span className="category-filter-label">{category}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
