import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineDocument,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineX,
} from "react-icons/hi";
import { toast } from "react-toastify";
import "../styles/CategoryPage.css";
import "../styles/AdminDashboard.css";

const UserProfilePage = () => {
  const { token, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { id: userId } = useParams();

  const [userData, setUserData] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [userReputations, setUserReputations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageModal, setImageModal] = useState({
    open: false,
    src: "",
    alt: "",
  });
  const [imageZoom, setImageZoom] = useState({ scale: 1, x: 0, y: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isAdmin = Boolean(currentUser?.isAdmin);

  const openImageModal = (src, alt) => {
    setImageModal({ open: true, src, alt });
    setImageZoom({ scale: 1, x: 0, y: 0 });
  };

  const closeImageModal = () => {
    setImageModal({ open: false, src: "", alt: "" });
    setImageZoom({ scale: 1, x: 0, y: 0 });
  };

  const loadUserData = useCallback(async () => {
    if (!token || !userId) return;

    try {
      setLoading(true);
      setError("");

      // Cargar datos del usuario
      const userResponse = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error("Error al cargar datos del usuario");
      }

      const user = await userResponse.json();
      setUserData(user);

      // Cargar publicaciones del usuario
      const listingsResponse = await fetch(
        `/api/admin/listings?owner=${user.email}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (listingsResponse.ok) {
        const listingsData = await listingsResponse.json();
        setUserListings(listingsData.items || []);
      }

      // Cargar reputaciones del usuario
      const reputationsResponse = await fetch(
        `/api/admin/reputations?q=${user.email}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (reputationsResponse.ok) {
        const reputationsData = await reputationsResponse.json();
        setUserReputations(reputationsData.reputations || []);
      }
    } catch (error) {
      setError(error.message);
      toast.error("Error al cargar los datos del usuario");
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    if (isAdmin && token) {
      loadUserData();
    }
  }, [isAdmin, token, loadUserData]);

  const handleVerificationAction = async (action) => {
    if (!userData) return;

    try {
      const endpoint = action === "approve" ? "approve" : "reject";
      const response = await fetch(
        `/api/admin/verification/${endpoint}/${userData.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Error al ${action === "approve" ? "aprobar" : "rechazar"} verificación`,
        );
      }

      toast.success(
        `Verificación ${action === "approve" ? "aprobada" : "rechazada"} exitosamente`,
      );
      loadUserData(); // Recargar datos
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!userData) return;

    try {
      const response = await fetch(`/api/admin/users/${userData.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar usuario");
      }

      toast.success("Usuario eliminado exitosamente");
      navigate("/admin"); // Volver al dashboard
    } catch (error) {
      toast.error(error.message);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const getVerificationStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <HiOutlineCheckCircle className="status-icon approved" />;
      case "rejected":
        return <HiOutlineXCircle className="status-icon rejected" />;
      case "pending":
        return <HiOutlineClock className="status-icon pending" />;
      default:
        return <HiOutlineDocument className="status-icon unverified" />;
    }
  };

  const getVerificationStatusText = (status) => {
    switch (status) {
      case "approved":
        return "Verificado";
      case "rejected":
        return "Rechazado";
      case "pending":
        return "Pendiente";
      default:
        return "No verificado";
    }
  };

  if (!isAdmin) {
    return (
      <main className="container page">
        <div className="panel">
          <h1>Acceso restringido</h1>
          <p>No tienes permisos para ver este contenido.</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container page">
        <div className="panel">
          <p>Cargando datos del usuario…</p>
        </div>
      </main>
    );
  }

  if (error || !userData) {
    return (
      <main className="container page">
        <div className="panel">
          <h1>Error</h1>
          <p>{error || "No se pudo cargar la información del usuario."}</p>
          <button className="btn primary" onClick={() => navigate(-1)}>
            Volver
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="container page">
      <div className="category-header-bar" style={{ marginBottom: 24 }}>
        <button
          className="page-nav-btn"
          onClick={() => navigate(-1)}
          title="Volver"
        >
          <HiOutlineArrowLeft size={24} />
        </button>
        <h2 className="category-header-title" style={{ margin: 0 }}>
          Perfil de Usuario
        </h2>
        <span style={{ width: 46 }}></span>
      </div>

      <div className="user-profile-grid">
        {/* Información básica del usuario */}
        <section className="admin-section">
          <div className="user-profile-header">
            <div className="user-avatar">
              {userData.avatar ? (
                <img
                  src={userData.avatar}
                  alt={userData.name || userData.username}
                />
              ) : (
                <HiOutlineUser size={48} />
              )}
            </div>
            <div className="user-info">
              <h1>{userData.name || userData.username}</h1>
              <div className="user-meta">
                <div className="user-meta-item">
                  <HiOutlineMail />
                  <span>{userData.email}</span>
                </div>
                {userData.phone && (
                  <div className="user-meta-item">
                    <HiOutlinePhone />
                    <span>{userData.phone}</span>
                  </div>
                )}
                {userData.location && (
                  <div className="user-meta-item">
                    <HiOutlineLocationMarker />
                    <span>{userData.location}</span>
                  </div>
                )}
                <div className="user-meta-item">
                  <HiOutlineCalendar />
                  <span>
                    Miembro desde{" "}
                    {new Date(userData.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="user-status">
                <span
                  className={`admin-role admin-role-${userData.role || "user"}`}
                >
                  {userData.role || "user"}
                </span>
                <div className="verification-status">
                  {getVerificationStatusIcon(userData.verificationStatus)}
                  <span>
                    {getVerificationStatusText(userData.verificationStatus)}
                  </span>
                </div>
              </div>
              <div className="user-actions">
                <button
                  className="btn danger sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Eliminar Usuario
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Estado de verificación */}
        <section className="admin-section">
          <h3>Verificación de Identidad</h3>
          {userData.identityDocuments ? (
            <div className="verification-review">
              <div className="verification-documents-grid">
                {userData.identityDocuments.id_front && (
                  <div className="document-item">
                    <h4>Frente del documento</h4>
                    <img
                      src={userData.identityDocuments.id_front}
                      alt="Frente del documento"
                      className="document-full"
                      onClick={() =>
                        openImageModal(
                          userData.identityDocuments.id_front,
                          "Frente del documento",
                        )
                      }
                    />
                  </div>
                )}
                {userData.identityDocuments.id_back && (
                  <div className="document-item">
                    <h4>Reverso del documento</h4>
                    <img
                      src={userData.identityDocuments.id_back}
                      alt="Reverso del documento"
                      className="document-full"
                      onClick={() =>
                        openImageModal(
                          userData.identityDocuments.id_back,
                          "Reverso del documento",
                        )
                      }
                    />
                  </div>
                )}
                {userData.identityDocuments.selfie && (
                  <div className="document-item">
                    <h4>Selfie de verificación</h4>
                    <img
                      src={userData.identityDocuments.selfie}
                      alt="Selfie de verificación"
                      className="document-full"
                      onClick={() =>
                        openImageModal(
                          userData.identityDocuments.selfie,
                          "Selfie de verificación",
                        )
                      }
                    />
                  </div>
                )}
              </div>
              {userData.verificationStatus === "pending" && (
                <div className="verification-actions">
                  <button
                    className="btn success"
                    onClick={() => handleVerificationAction("approve")}
                  >
                    Aprobar Verificación
                  </button>
                  <button
                    className="btn danger"
                    onClick={() => handleVerificationAction("reject")}
                  >
                    Rechazar Verificación
                  </button>
                </div>
              )}
            </div>
          ) : null}
          {userData.verificationStatus === "approved" && (
            <div className="verification-approved">
              <HiOutlineCheckCircle className="status-icon approved" />
              <p>Este usuario ha sido verificado exitosamente.</p>
              {userData.verificationCompletedAt && (
                <p className="muted">
                  Verificado el{" "}
                  {new Date(userData.verificationCompletedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
          {userData.verificationStatus === "rejected" && (
            <div className="verification-rejected">
              <HiOutlineXCircle className="status-icon rejected" />
              <p>La verificación de este usuario fue rechazada.</p>
              {userData.verificationCompletedAt && (
                <p className="muted">
                  Rechazado el{" "}
                  {new Date(userData.verificationCompletedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
          {userData.verificationStatus === "unverified" &&
            !userData.identityDocuments && (
              <div className="verification-none">
                <HiOutlineDocument className="status-icon unverified" />
                <p>Este usuario no ha solicitado verificación de identidad.</p>
              </div>
            )}
        </section>

        {/* Estadísticas */}
        <section className="admin-section">
          <h3>Estadísticas</h3>
          <div className="user-stats-grid">
            <div className="stat-item">
              <div className="stat-value">{userData.listingsCount || 0}</div>
              <div className="stat-label">Publicaciones</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{userData.reputationsCount || 0}</div>
              <div className="stat-label">Reputaciones</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {userReputations.length > 0
                  ? (
                      userReputations.reduce(
                        (sum, rep) => sum + rep.rating,
                        0,
                      ) / userReputations.length
                    ).toFixed(1)
                  : "0.0"}
              </div>
              <div className="stat-label">Calificación promedio</div>
            </div>
          </div>
        </section>

        {/* Publicaciones recientes */}
        <section className="admin-section">
          <h3>Publicaciones Recientes</h3>
          {userListings.length > 0 ? (
            <div className="user-listings-grid">
              {userListings.slice(0, 6).map((listing) => (
                <div key={listing.id} className="listing-card">
                  <div className="listing-image">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.name} />
                    ) : (
                      <div className="no-image">Sin imagen</div>
                    )}
                  </div>
                  <div className="listing-info">
                    <h4>{listing.name}</h4>
                    <p className="listing-price">
                      {listing.price
                        ? `${listing.price.toLocaleString()} Bs`
                        : "Precio no especificado"}
                    </p>
                    <span className={`admin-chip status-${listing.status}`}>
                      {listing.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Este usuario no tiene publicaciones.</p>
          )}
        </section>

        {/* Reputaciones */}
        <section className="admin-section">
          <h3>Reputaciones Recibidas</h3>
          {userReputations.length > 0 ? (
            <div className="user-reputations-list">
              {userReputations.slice(0, 10).map((rep) => (
                <div key={rep.id} className="reputation-item">
                  <div className="reputation-header">
                    <div className="reputation-rating">
                      {"★".repeat(rep.rating)}
                      {"☆".repeat(5 - rep.rating)}
                    </div>
                    <div className="reputation-date">
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="reputation-comment">
                    {rep.comment || "Sin comentario"}
                  </p>
                  <div className="reputation-from">
                    De:{" "}
                    {rep.fromUser?.name ||
                      rep.fromUser?.email ||
                      "Usuario desconocido"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Este usuario no tiene reputaciones.</p>
          )}
        </section>
      </div>

      {/* Modal de confirmación para eliminar usuario */}
      {showDeleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirmar eliminación</h3>
              <button
                className="modal-close"
                onClick={() => setShowDeleteConfirm(false)}
              >
                <HiOutlineX size={24} />
              </button>
            </div>
            <div className="modal-body">
              <p>
                ¿Estás seguro de que quieres eliminar al usuario{" "}
                <strong>
                  {userData.name || userData.username || userData.email}
                </strong>
                ?
              </p>
              <p className="text-danger">
                Esta acción no se puede deshacer. Se eliminarán todas las
                publicaciones, conversaciones, reputaciones y datos asociados a
                este usuario.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </button>
              <button className="btn danger" onClick={handleDeleteUser}>
                Eliminar Usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de imagen con zoom */}
      {imageModal.open && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="image-modal-close" onClick={closeImageModal}>
              <HiOutlineX size={24} />
            </button>
            <img
              src={imageModal.src}
              alt={imageModal.alt}
              className="image-modal-image"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                transform: `scale(${imageZoom.scale}) translate(${imageZoom.x}px, ${imageZoom.y}px)`,
                transition:
                  imageZoom.scale === 1 ? "transform 0.2s ease" : "none",
                cursor: imageZoom.scale > 1 ? "grab" : "zoom-in",
              }}
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                const newScale = Math.max(
                  0.5,
                  Math.min(3, imageZoom.scale * delta),
                );
                setImageZoom((prev) => ({ ...prev, scale: newScale }));
              }}
              onClick={(e) => {
                if (imageZoom.scale <= 1) {
                  setImageZoom((prev) => ({ ...prev, scale: 2 }));
                }
              }}
              draggable={false}
            />
          </div>
        </div>
      )}
    </main>
  );
};

export default UserProfilePage;
