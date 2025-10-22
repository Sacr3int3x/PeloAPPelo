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
  const [pending, setPending] = React.useState(false);

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      const next = encodeURIComponent(loc.pathname + loc.search);
      nav(`/login?next=${next}`);
      return;
    }
    if (pending) return;
    setPending(true);
    const result = await toggleFav(id);
    if (!result?.success && result?.error) {
      console.error(result.error);
    }
    setPending(false);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={"favbtn" + (active ? " active" : "")}
      aria-label={active ? "Quitar de favoritos" : "Agregar a favoritos"}
      disabled={pending}
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
      className={`card card--compact shadow ${layoutClass}`}
      data-view={viewMode}
      role="article"
      aria-labelledby={`card-title-${item.id}`}
    >
      <div className="card-content">
        <figure className="card-media" role="img" aria-label={item.name}>
          <img
            src={item.images?.[0] || "/images/placeholder.jpg"}
            alt={item.name}
            className="card-img"
            loading="lazy"
          />
          <div className="card-fav" role="presentation">
            <FavButton id={item.id} />
          </div>
          <div className="card-badge" role="status" aria-live="polite">
            {item.status === "active" ? "Disponible" : "Vendido"}
          </div>
        </figure>
        <div className="card-body card-body--compact">
          <h3 className="card-title" title={item.name}>
            {item.name}
          </h3>
          <div
            className="card-price"
            title={`REF ${item.price?.toLocaleString()}`}
          >
            <span className="price-label">REF</span>
            <span className="price-amount">{item.price?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
