import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { MdFavorite } from "react-icons/md";
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
  const sellerEmail = item.ownerEmail || null;
  const ownerListings = sellerEmail ? byOwner(sellerEmail) : [];

  // Manejo seguro de la reputación del vendedor
  const ownerRating = item.ownerRating || {};
  const ownerRatingAverage =
    typeof ownerRating.average === "number" ? ownerRating.average : 0;
  const ownerRatingCount =
    typeof ownerRating.count === "number" ? ownerRating.count : 0;
  const reputation = clamp(ownerRatingAverage, 0, 5);

  // Información del vendedor con valores por defecto seguros
  const sellerName = item.ownerName || sellerEmail?.split("@")[0] || "Vendedor";
  const sellerUsername =
    item.ownerUsername || sellerEmail?.split("@")[0] || "vendedor";

  // Manejo de la URL del avatar
  const defaultAvatar = "/images/avatars/default.svg";
  const sellerAvatar = item.ownerAvatar || defaultAvatar;
  const isFavorite = isFav(item.id);
  const isOwner =
    user?.email && sellerEmail
      ? user.email.toLowerCase() === sellerEmail.toLowerCase()
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
  const conditionLabel =
    (item.condition || "usado").toLowerCase() === "nuevo" ? "Nuevo" : "Usado";
  const publishedDate = item.createdAt ? new Date(item.createdAt) : null;

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
            aria-pressed={isFavorite}
          >
            <MdFavorite size={22} aria-hidden />
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
              {item.category} ·{" "}
              <span className="item-meta-location">{item.location}</span>
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
            <span className="item-spec-value">
              {item.brand || "No indicado"}
            </span>
          </div>
          <div className="item-spec">
            <span className="item-spec-label">Modelo</span>
            <span className="item-spec-value">
              {item.model || "No indicado"}
            </span>
          </div>
          <div className="item-spec">
            <span className="item-spec-label">Ubicación</span>
            <span className="item-spec-value item-spec-location">
              {item.location}
            </span>
          </div>
          <div className="item-spec">
            <span className="item-spec-label">Estado</span>
            <span className="item-spec-value">
              {statusLabel[item.status] || statusLabel.active}
            </span>
          </div>
          <div className="item-spec">
            <span className="item-spec-label">Condición</span>
            <span className="item-spec-value">{conditionLabel}</span>
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
              {publishedDate
                ? publishedDate.toLocaleDateString()
                : "No disponible"}
            </span>
          </div>
        </div>
      </section>

      <section className="panel item-section">
        <h2 className="item-section-title">Vendedor</h2>
        <div className="seller-card">
          <div className="seller-photo-wrapper">
            <img
              src={sellerAvatar}
              alt={`Perfil de ${sellerName}`}
              className="seller-photo"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = defaultAvatar;
              }}
              loading="lazy"
            />
          </div>
          <div className="seller-info">
            <div className="seller-identity">
              <span className="seller-name">{sellerName}</span>
              <span className="seller-username">@{sellerUsername}</span>
            </div>
            <div className="seller-location">
              Ubicación: <strong>{item.location}</strong>
            </div>
            <div className="seller-reputation">
              <Rating value={reputation} votes={ownerRatingCount} />
              <span className="seller-reviews">
                {ownerRatingCount === 1
                  ? "1 reseña"
                  : `${ownerRatingCount} reseñas`}
              </span>
            </div>
          </div>
          <div className="seller-actions">
            <div className="seller-count-pill">
              <span className="seller-count-number">
                {ownerListings.length}
              </span>
              <span className="seller-count-label">publicaciones</span>
            </div>
            <button
              type="button"
              className="seller-button"
              onClick={() => {
                if (!sellerEmail) return;
                nav(`/search?seller=${encodeURIComponent(sellerEmail)}`);
              }}
              disabled={!sellerEmail}
            >
              Ver más del vendedor
            </button>
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
            className="item-action-button"
            onClick={async () => {
              if (!user) {
                nav(`/login?next=${encodeURIComponent("/inbox")}`);
                return;
              }
              if (isOwner) return;

              try {
                // Validar que tenemos el email del vendedor
                if (!sellerEmail) {
                  throw new Error(
                    "No se pudo obtener la información del vendedor. Intenta recargar la página.",
                  );
                }

                // Evitar que el usuario se envíe mensajes a sí mismo
                if (
                  user?.email &&
                  sellerEmail.toLowerCase() === user.email.toLowerCase()
                ) {
                  throw new Error("No puedes enviarte mensajes a ti mismo.");
                }

                // Primero crear la conversación
                const conversationId = await startConversation({
                  to: sellerEmail,
                  listingId: item.id,
                  initialMessage: "¡Hola! Me interesa tu artículo.",
                });

                if (!conversationId) {
                  throw new Error("No se pudo crear la conversación");
                }

                // Redirigir al usuario al inbox con la conversación seleccionada
                nav(`/inbox?conversation=${conversationId}`, { replace: true });
              } catch (error) {
                console.error("Error al iniciar conversación:", error);

                // Mostrar mensaje específico según el error
                let errorMessage =
                  "Hubo un problema al iniciar la conversación.";

                if (error.message.includes("bloqueo")) {
                  errorMessage =
                    "No es posible iniciar la conversación porque existe un bloqueo entre los usuarios.";
                } else if (error.status === 403) {
                  errorMessage =
                    "No tienes permiso para iniciar esta conversación.";
                }

                alert(errorMessage);

                // Si hay un bloqueo, podríamos redirigir al usuario de vuelta
                if (error.status === 403) {
                  nav(-1);
                }
              }
            }}
            disabled={isOwner}
            aria-disabled={isOwner}
          >
            <span className="item-action-title">Enviar mensaje</span>
            <span className="item-action-sub">
              Chatea con el vendedor en privado
            </span>
          </button>
          <button
            className="item-action-button item-action-button--primary"
            onClick={() =>
              user
                ? nav(`/propose-swap/${item.id}`)
                : nav(
                    `/login?next=${encodeURIComponent(`/propose-swap/${item.id}`)}`,
                  )
            }
          >
            <span className="item-action-title">Proponer intercambio</span>
            <span className="item-action-sub">Ofrece un artículo a cambio</span>
          </button>
        </div>
      </section>
    </main>
  );
}

export default ItemPage;
