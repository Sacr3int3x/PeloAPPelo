import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { fmt } from "../utils/format";
import "./ProfilePage.css";

const statusLabel = {
  active: "Activa",
  paused: "Pausada",
  sold: "Finalizada",
};

const planLabel = {
  premium: "Premium",
  plus: "Plus",
  gratis: "Gratis",
};

function ProfileListingsPage() {
  const { user } = useAuth();
  const data = useData();
  const navigate = useNavigate();
  const updateStatus = data?.updateStatus || (() => {});

  const listings = useMemo(() => {
    if (!user) return [];
    return data?.byOwner ? data.byOwner(user.email) : [];
  }, [data, user]);

  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(""), 3000);
    return () => clearTimeout(t);
  }, [feedback]);

  const handleStatusChange = (listingId, nextStatus) => {
    const promptMap = {
      active: "¿Deseas reactivar esta publicación?",
      paused: "¿Deseas pausar temporalmente esta publicación?",
      sold: "¿Marcar como finalizada? No aparecerá más en las búsquedas.",
    };
    const question = promptMap[nextStatus] || "¿Confirmas esta acción?";
    if (!window.confirm(question)) return;
    updateStatus(listingId, nextStatus);
    setFeedback("Estado actualizado correctamente.");
  };

  if (!user) {
    return (
      <main className="container page profile-listings-page">
        <div className="panel">
          <p className="muted">Inicia sesión para ver tus publicaciones.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container page profile-listings-page">
      <section className="panel profile-listings-panel">
        <div className="profile-listings-page-head">
          <div>
            <h1 className="profile-section-title">
              Mis publicaciones ({listings.length})
            </h1>
            <p className="muted">
              Gestiona la visibilidad de tus anuncios desde un solo lugar.
            </p>
          </div>
          <button
            type="button"
            className="btn outline"
            onClick={() => navigate(-1)}
          >
            Volver
          </button>
        </div>

        {feedback && <div className="profile-feedback">{feedback}</div>}

        {listings.length ? (
          <div className="profile-listing-list">
            {listings.map((listing) => (
              <article key={listing.id} className="profile-listing-row">
                <img
                  src={listing.images?.[0] || "/images/placeholder.jpg"}
                  alt={listing.name}
                  className="profile-listing-thumb"
                />
                <div className="profile-listing-detail">
                  <div className="profile-listing-header">
                    <h2 className="profile-listing-title">{listing.name}</h2>
                    <span className={`profile-status-chip status-${listing.status}`}>
                      {statusLabel[listing.status] || listing.status}
                    </span>
                  </div>
                  <div className="profile-listing-meta">
                    <span>REF {fmt(listing.price)}</span>
                    <span>{listing.location}</span>
                    <span className={`profile-plan plan-${listing.plan || "gratis"}`}>
                      {planLabel[listing.plan] || "Publicación"}
                    </span>
                  </div>
                  <p className="profile-listing-description">
                    {(listing.description || "Sin descripción.").slice(0, 160)}
                    {listing.description && listing.description.length > 160 ? "…" : ""}
                  </p>
                </div>
                <div className="profile-status-actions">
                  {listing.status !== "active" && (
                    <button
                      type="button"
                      className="status-btn outline"
                      onClick={() => handleStatusChange(listing.id, "active")}
                    >
                      Reactivar
                    </button>
                  )}
                  {listing.status === "active" && (
                    <button
                      type="button"
                      className="status-btn outline"
                      onClick={() => handleStatusChange(listing.id, "paused")}
                    >
                      Pausar
                    </button>
                  )}
                  {listing.status !== "sold" && (
                    <button
                      type="button"
                      className="status-btn danger"
                      onClick={() => handleStatusChange(listing.id, "sold")}
                    >
                      Finalizar
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">Aún no has publicado anuncios.</p>
        )}
      </section>
    </main>
  );
}

export default ProfileListingsPage;
