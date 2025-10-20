import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import "./ProfilePage.css";

function ProfilePage() {
  const auth = useAuth();
  const data = useData();
  const byOwner = data?.byOwner || (() => []);

  if (!auth) return null;

  const { user, logout } = auth;
  if (!user) return null;

  const myItems = byOwner(user.email);
  const activeListings = myItems.filter((it) => it.status === "active").length;
  const favItems = data?.favItems || [];
  const memberSince = user.since ? new Date(user.since) : new Date();
  const memberYear = memberSince.getFullYear();
  const completedSwaps = Math.max(1, myItems.length * 2);
  const positiveRate = Math.min(99, 90 + myItems.length * 2);

  return (
    <main className="container page profile-page">
      <section className="panel profile-hero">
        <span className="profile-tag">Perfil</span>
        <div className="profile-avatar" aria-hidden>
          {user.name?.charAt(0).toUpperCase()}
        </div>
        <h1 className="profile-name">{user.name}</h1>
        <p className="profile-meta">Miembro desde {memberYear}</p>
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{completedSwaps}</span>
            <span className="profile-stat-label">Intercambios completados</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{positiveRate}%</span>
            <span className="profile-stat-label">Calificación positiva</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{activeListings}</span>
            <span className="profile-stat-label">Publicaciones activas</span>
          </div>
        </div>
      </section>

      <section className="panel profile-menu">
        <h2 className="profile-section-title">Gestión</h2>
        <div className="profile-links">
          <Link to="/profile/listings" className="profile-link">
            <div className="profile-link-text">
              <span>Mis publicaciones</span>
              <small>
                Gestiona, pausa o finaliza tus anuncios. Actualmente tienes {myItems.length}.
              </small>
            </div>
            <span aria-hidden>›</span>
          </Link>
          <Link to="/publish" className="profile-link">
            <div className="profile-link-text">
              <span>Crear publicación</span>
              <small>Publica un nuevo anuncio en minutos.</small>
            </div>
            <span aria-hidden>›</span>
          </Link>
          <Link to="/favs" className="profile-link">
            <div className="profile-link-text">
              <span>Favoritos</span>
              <small>{favItems.length} guardados para revisar luego.</small>
            </div>
            <span aria-hidden>›</span>
          </Link>
          <Link to="/" className="profile-link">
            <div className="profile-link-text">
              <span>Centro de ayuda</span>
              <small>Consejos y soporte para tus intercambios.</small>
            </div>
            <span aria-hidden>›</span>
          </Link>
        </div>
      </section>

      <button className="profile-logout-btn" onClick={logout}>
        Cerrar sesión
      </button>
    </main>
  );
}

export default ProfilePage;
