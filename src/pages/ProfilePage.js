import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { MdAddAPhoto } from "react-icons/md";
import "../styles/CategoryPage.css";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { fetchMyReputations } from "../services/transactions";
import { uploadProfilePhoto, removeProfilePhoto } from "../services/profile";
import "./ProfilePage.css";

function ProfilePage() {
  const auth = useAuth();
  const data = useData();
  const resolveByOwner = data?.byOwner;
  const token = auth?.token || null;
  const user = auth?.user || null;
  // logout no se usa
  const navigate = useNavigate();

  const [reputations, setReputations] = useState([]);
  const [uploadPending, setUploadPending] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadPending(true);
    setUploadError("");

    try {
      await uploadProfilePhoto(file, token);
      // Recargar los datos del usuario para obtener la nueva foto
      const refreshResult = await auth.refresh();
      if (!refreshResult.success) {
        throw new Error(
          refreshResult.error || "No se pudo actualizar la foto de perfil",
        );
      }
    } catch (error) {
      console.error("Error al subir la foto:", error);
      setUploadError(
        error.message || "No se pudo subir la foto. Inténtalo de nuevo.",
      );
    } finally {
      setUploadPending(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchMyReputations(token)
      .then((response) => {
        if (cancelled) return;
        setReputations(response.reputations || []);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error?.status === 404) {
          setReputations([]);
          return;
        }
        console.error("No se pudieron cargar las reputaciones", error);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const ratingSummary = useMemo(() => {
    if (!reputations.length) return { average: 0, count: 0 };
    const total = reputations.reduce(
      (sum, rep) => sum + Number(rep.rating || 0),
      0,
    );
    const average = Number((total / reputations.length).toFixed(2));
    return { average, count: reputations.length };
  }, [reputations]);

  const completedSwaps = reputations.length;

  const myItems = useMemo(() => {
    if (!user || !resolveByOwner) return [];
    return resolveByOwner(user.email);
  }, [resolveByOwner, user]);
  const activeListings = myItems.filter((it) => it.status === "active").length;
  // favItems no se usa
  const memberSince = user?.since ? new Date(user.since) : new Date();
  const memberYear = memberSince.getFullYear();

  // billingSummary no se usa

  const handleLogout = async () => {
    try {
      await auth.logout();
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (!user) {
    return <main className="container page">No autorizado.</main>;
  }

  return (
    <main className="container page profile-page">
      <section className="panel profile-hero">
        <span className="profile-tag">Perfil</span>
        {user.isAdmin && (
          <span className="profile-admin-chip">Administrador</span>
        )}
        <div className="profile-avatar-container">
          <div className="profile-avatar" aria-hidden>
            {user.avatar ? (
              <img src={user.avatar} alt={`Foto de perfil de ${user.name}`} />
            ) : (
              user.name?.charAt(0).toUpperCase()
            )}
          </div>
          <label
            className="profile-avatar-upload"
            title="Cambiar foto de perfil"
          >
            <MdAddAPhoto size={18} />
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePhotoChange}
              disabled={uploadPending}
            />
          </label>
          {uploadError && (
            <div
              className="field-error"
              role="alert"
              style={{ marginTop: "8px", textAlign: "center" }}
            >
              {uploadError}
            </div>
          )}
        </div>
        <h1 className="profile-name">{user.name}</h1>
        <p className="profile-meta">Miembro desde {memberYear}</p>
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{completedSwaps}</span>
            <span className="profile-stat-label">Intercambios completados</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">
              {ratingSummary.average !== null &&
              ratingSummary.average !== undefined
                ? ratingSummary.average.toFixed(1)
                : "0.0"}
            </span>
            <span className="profile-stat-label">Reputación promedio</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{activeListings}</span>
            <span className="profile-stat-label">Publicaciones activas</span>
          </div>
        </div>
      </section>
      <section className="panel profile-menu">
        <div className="category-header-bar" style={{ marginBottom: 24 }}>
          <button
            className="page-nav-btn"
            onClick={() => window.history.back()}
            title="Volver"
          >
            <HiOutlineArrowLeft size={24} />
          </button>
          <h2 className="category-header-title" style={{ margin: 0 }}>
            Gestión
          </h2>
          <span style={{ width: 46 }}></span>
        </div>
        <div className="profile-links">
          <Link to="/profile/listings" className="profile-link">
            <div className="profile-link-text">
              <span>Mis publicaciones</span>
              <small>
                Gestiona, pausa o finaliza tus anuncios. Actualmente tienes{" "}
                {myItems.length}.
              </small>
            </div>
            <span aria-hidden>›</span>
          </Link>
          <Link to="/profile/billing-details" className="profile-link">
            <div className="profile-link-text">
              <span>Facturación detallada</span>
              <small>
                Ver el detalle de las publicaciones vendidas y facturación.
              </small>
            </div>
            <span aria-hidden>›</span>
          </Link>
          <Link to="/profile/reputation-details" className="profile-link">
            <div className="profile-link-text">
              <span>Reputaciones detalladas</span>
              <small>Ver todas tus valoraciones y comentarios recibidos.</small>
            </div>
            <span aria-hidden>›</span>
          </Link>
          <Link to="/profile/blocked-users" className="profile-link">
            <div className="profile-link-text">
              <span>Usuarios bloqueados</span>
              <small>
                Gestiona los usuarios que has bloqueado y no pueden contactarte.
              </small>
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
          {user.isAdmin && (
            <Link to="/admin" className="profile-link">
              <div className="profile-link-text">
                <span>Panel administrativo</span>
                <small>
                  Monitorea usuarios, publicaciones y chats en tiempo real.
                </small>
              </div>
              <span aria-hidden>›</span>
            </Link>
          )}
          <button 
            onClick={handleLogout} 
            className="profile-link"
            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626' }}
          >
            <div className="profile-link-text">
              <span>Cerrar sesión</span>
              <small>Terminar la sesión actual y volver al inicio</small>
            </div>
            <span aria-hidden>›</span>
          </button>
        </div>
      </section>
    </main>
  );
}

export default ProfilePage;
