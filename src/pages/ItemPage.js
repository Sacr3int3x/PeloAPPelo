import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { MdChat, MdSwapHoriz } from "react-icons/md";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useMessages } from "../context/MessageContext";
import Rating from "../components/Rating/Rating";
import { clamp, fmt } from "../utils/format";
import "./ItemPage.css";

function ItemPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const { byId, byOwner, isFav, toggleFav } = useData();
  const { startConversation } = useMessages();
  const { id } = useParams();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const item = byId(id);
  if (!item) return <main className="container page">No encontrado.</main>;

  const images = (
    item.images?.length ? item.images : ["/images/placeholder.jpg"]
  ).slice(0, 6);
  const ownerListings = byOwner(item.ownerEmail);
  const reputation = clamp(3.8 + ownerListings.length * 0.05, 3.8, 5);
  const sellerName = (item.ownerEmail || "usuario@demo.com").split("@")[0];
  const isFavorite = isFav(item.id);
  const isOwner =
    user?.email && item.ownerEmail
      ? user.email.toLowerCase() === item.ownerEmail.toLowerCase()
      : false;
  const planLabel = {
    premium: "Destacado Premium",
    plus: "Destacado Plus",
    gratis: "Publicación estándar",
  };
  const statusLabel = {
    active: "Disponible",
    paused: "Pausado",
    sold: "Finalizado",
  };

  return (
    <main className="container page item-page">
      <div className="item-header-bar">
        <button
          type="button"
          className="item-back-btn"
          onClick={() => {
            if (window.history.length > 1) nav(-1);
            else nav("/");
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
        <span className="item-header-title">Detalle del anuncio</span>
        <span aria-hidden />
      </div>

      <section className="panel item-hero">
        <div className="item-hero-media">
          <img
            src={images[selectedImageIndex]}
            alt={item.name}
            className="item-hero-img"
          />
          <button
            type="button"
            className={`item-fav ${isFavorite ? "active" : ""}`}
            onClick={() => {
              if (!user) {
                nav(
                  `/login?next=${encodeURIComponent(loc.pathname + loc.search)}`,
                );
              } else {
                toggleFav(item.id);
              }
            }}
            aria-label={
              isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
            }
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 14.5C19 17.5376 16.6904 20 13.75 20C11.9061 20 10.2796 18.9733 9.5 17.5C8.72042 18.9733 7.09395 20 5.25 20C2.30964 20 0 17.5376 0 14.5C0 8.21429 7.14286 4 9.5 2C11.8571 4 19 8.21429 19 14.5Z" transform="translate(2 2)" />
            </svg>
          </button>
        </div>
        {images.length > 1 && (
          <div className="item-thumb-strip">
            {images.map((src, idx) => (
              <button
                key={idx}
                type="button"
                className={`item-thumb ${selectedImageIndex === idx ? "active" : ""}`}
                onClick={() => setSelectedImageIndex(idx)}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="panel item-summary">
        <div className="item-summary-head">
          <div>
            <h1 className="item-title">{item.name}</h1>
            <p className="item-meta">
              {item.category} · {item.location}
            </p>
          </div>
          <div className="item-price-tag">
            <span>REF</span>
            <strong>{fmt(item.price)}</strong>
            {item.plan && (
              <span className={`item-plan-chip plan-${item.plan}`}>
                {planLabel[item.plan] || "Publicación"}
              </span>
            )}
          </div>
        </div>
        <Rating value={reputation} votes={100 + ownerListings.length * 7} />
      </section>

      <section className="panel item-section">
        <h2 className="item-section-title">Especificaciones</h2>
        <div className="item-spec-grid">
          <div className="item-spec">
            <span className="item-spec-label">Categoría</span>
            <span className="item-spec-value">{item.category}</span>
          </div>
          <div className="item-spec">
            <span className="item-spec-label">Marca</span>
            <span className="item-spec-value">{item.brand || "No indicado"}</span>
          </div>
          <div className="item-spec">
            <span className="item-spec-label">Modelo</span>
            <span className="item-spec-value">{item.model || "No indicado"}</span>
          </div>
          <div className="item-spec">
            <span className="item-spec-label">Ubicación</span>
            <span className="item-spec-value">{item.location}</span>
          </div>
          <div className="item-spec">
            <span className="item-spec-label">Estado</span>
            <span className="item-spec-value">
              {statusLabel[item.status] || statusLabel.active}
            </span>
          </div>
          <div className="item-spec">
            <span className="item-spec-label">Plan</span>
            <span className="item-spec-value">
              {planLabel[item.plan] || "Estándar"}
            </span>
          </div>
          <div className="item-spec">
            <span className="item-spec-label">Publicado</span>
            <span className="item-spec-value">
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </section>

      <section className="panel item-section">
        <h2 className="item-section-title">Vendedor</h2>
        <div className="seller-card">
          <div className="seller-avatar" aria-hidden>
            {sellerName.charAt(0).toUpperCase()}
          </div>
          <div className="seller-info">
            <div className="seller-name">{sellerName}</div>
            <div className="seller-email">{item.ownerEmail}</div>
            <Rating value={reputation} votes={100 + ownerListings.length * 7} />
          </div>
          <div className="seller-count">
            <strong>{ownerListings.length}</strong>
            <span>publicaciones</span>
          </div>
        </div>
      </section>

      <section className="panel item-section">
        <h2 className="item-section-title">Descripción</h2>
        <p className="item-description copy">{item.description}</p>
      </section>

      <section className="panel item-section">
        <h2 className="item-section-title">Acciones</h2>
        <div className="item-action-buttons">
          <button
            className="btn outline"
            onClick={() => {
              if (!user) {
                nav(`/login?next=${encodeURIComponent("/inbox")}`);
                return;
              }
              if (isOwner) return;
              const conversationId = startConversation({
                from: user.email,
                to: item.ownerEmail,
                listingId: item.id,
              });
              if (conversationId) {
                nav(`/inbox?conversation=${conversationId}`);
              } else {
                nav("/inbox");
              }
            }}
            disabled={isOwner}
            aria-disabled={isOwner}
          >
            <MdChat size={18} aria-hidden /> Enviar mensaje
          </button>
          <button
            className="btn primary"
            onClick={() =>
              user
                ? nav(`/swap/${item.id}`)
                : nav(
                    `/login?next=${encodeURIComponent(`/swap/${item.id}`)}`,
                  )
            }
          >
            <MdSwapHoriz size={18} aria-hidden /> Proponer intercambio
          </button>
        </div>
      </section>
    </main>
  );
}

export default ItemPage;
