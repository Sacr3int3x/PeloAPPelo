import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { MdAddAPhoto } from "react-icons/md";
import { FiLogOut } from "react-icons/fi";
import "../styles/CategoryPage.css";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { uploadProfilePhoto } from "../services/profile";
import { getUserReputation } from "../services/transactions";
import { realtime } from "../services/realtime";
import VerificationStatus from "../components/VerificationStatus/VerificationStatus";
import "./ProfilePage.css";

function ProfilePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const data = useData();
  const resolveByOwner = data?.byOwner;
  const token = auth?.token || null;
  const user = auth?.user || null;

  const [uploadPending, setUploadPending] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userReputation, setUserReputation] = useState({
    average: 0,
    count: 0,
  });

  const handleLogout = () => {
    auth.logout();
    navigate("/");
  };

  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadPending(true);
    setUploadError("");

    try {
      // Refrescar sesión antes de enviar
      if (auth.refresh) {
        await auth.refresh();
      }
      // Usar el token actualizado del contexto
      const latestToken =
        typeof auth.token === "function" ? auth.token() : auth.token;
      await uploadProfilePhoto(file, latestToken);
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
    if (!token || !user) return;

    const loadUserReputation = async () => {
      try {
        const reputation = await getUserReputation(user.id, token);
        setUserReputation(reputation);
      } catch (error) {
        console.error("Error loading user reputation:", error);
        // Mantener valores por defecto en caso de error
      }
    };

    loadUserReputation();

    // Suscribirse a actualizaciones de reputación en tiempo real
    const handleReputationUpdate = (event) => {
      const { userId, reputation } = event.detail || {};
      if (String(userId) === String(user.id) && reputation) {
        setUserReputation(reputation);
      }
    };

    const offReputationUpdate = realtime.on(
      "user.reputation.updated",
      handleReputationUpdate,
    );

    return () => {
      offReputationUpdate();
    };
  }, [token, user]);

  const ratingSummary = userReputation;

  const completedSwaps = 0; // TODO: Calcular desde transacciones

  const myItems = useMemo(() => {
    if (!user || !resolveByOwner) return [];
    return resolveByOwner(user.email);
  }, [resolveByOwner, user]);
  const activeListings = myItems.filter((it) => it.status === "active").length;
  // favItems no se usa
  const memberSince = user?.since ? new Date(user.since) : new Date();
  const memberYear = memberSince.getFullYear();

  // billingSummary no se usa

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
              <small
                style={{
                  fontSize: "0.7em",
                  color: "#64748b",
                  display: "block",
                  marginTop: "2px",
                }}
              >
                ({ratingSummary.count || 0} calificaciones)
              </small>
            </span>
            <span className="profile-stat-label">Reputación promedio</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{activeListings}</span>
            <span className="profile-stat-label">Publicaciones activas</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">
              {new Date().getFullYear() - memberYear}
            </span>
            <span className="profile-stat-label">Años en la plataforma</span>
          </div>
        </div>
      </section>

      {/* Sección de Verificación de Identidad */}
      <VerificationStatus />

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
          <Link to="/profile/pending-ratings" className="profile-link">
            <div className="profile-link-text">
              <span>Calificaciones pendientes</span>
              <small>
                Califica a los usuarios con los que has completado
                transacciones.
              </small>
            </div>
            <span aria-hidden>›</span>
          </Link>
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
          <Link to="/billing" className="profile-link">
            <div className="profile-link-text">
              <span>Facturación detallada</span>
              <small>
                Ver el detalle de las publicaciones vendidas y facturación.
              </small>
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
          <Link to="/help" className="profile-link">
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
        </div>
      </section>

      <section className="panel profile-logout-section">
        <button
          className="profile-logout-btn"
          onClick={() => setShowLogoutModal(true)}
        >
          <FiLogOut size={20} />
          <span>Cerrar sesión</span>
        </button>
      </section>

      {/* Modal de confirmación de cierre de sesión */}
      {showLogoutModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowLogoutModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "1.3em",
                color: "#1e293b",
              }}
            >
              ¿Cerrar sesión?
            </h3>
            <p className="modal-text">
              Se cerrará tu sesión actual. Tendrás que volver a iniciar sesión
              para acceder a tu cuenta.
            </p>
            <div className="modal-actions">
              <button
                className="btn outline"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancelar
              </button>
              <button className="btn primary" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default ProfilePage;
