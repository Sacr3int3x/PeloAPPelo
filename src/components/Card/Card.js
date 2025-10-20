import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { MdFavorite } from "react-icons/md";
import "./Card.css";

export function FavButton({ id, size = 22 }) {
  const { isFav, toggleFav } = useData();
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const active = isFav(id);

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      const next = encodeURIComponent(loc.pathname + loc.search);
      nav(`/login?next=${next}`);
      return;
    }
    toggleFav(id);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={"favbtn" + (active ? " active" : "")}
      aria-label={active ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <MdFavorite size={size} aria-hidden />
    </button>
  );
}

export default function Card({ item, viewMode = "grid" }) {
  const layoutClass = viewMode === "list" ? "card--list" : "card--grid";
  return (
    <Link
      to={`/item/${item.id}`}
      className={`card card--compact ${layoutClass}`}
      data-view={viewMode}
    >
      <div className="card-content">
        <figure className="card-media">
          <img
            src={item.images?.[0] || "/images/placeholder.jpg"}
            alt={item.name}
            className="card-img"
            loading="lazy"
          />
          <div className="card-fav">
            <FavButton id={item.id} />
          </div>
          <div className="card-badge">
            {item.status === "active" ? "Disponible" : "Vendido"}
          </div>
        </figure>
        <div className="card-body">
          <div className="card-category">{item.category}</div>
          <h3 className="card-title">{item.name}</h3>
          <div className="card-location">
            <span className="location-icon">📍</span>
            {item.location}
          </div>
          <div className="card-price">
            <span className="price-label">REF</span>
            <span className="price-amount">
              {item.price?.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
