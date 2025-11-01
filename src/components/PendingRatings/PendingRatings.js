import React, { useState, useEffect, useCallback } from "react";
import { getPendingRatings } from "../../services/transactions";
import RatingModal from "../RatingModal/RatingModal";
import { useAuth } from "../../context/AuthContext";
import "./PendingRatings.css";

const PendingRatings = () => {
  const auth = useAuth();
  const token = auth?.token || null;
  const user = auth?.user || null;
  const loadingAuth = auth?.loading || false;
  const [pendingRatings, setPendingRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const loadPendingRatings = useCallback(async () => {
    try {
      setLoading(true);
      const ratings = await getPendingRatings(token);
      setPendingRatings(ratings);
    } catch (err) {
      console.error("Error loading pending ratings:", err);
      setError("Error al cargar calificaciones pendientes");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && user) {
      loadPendingRatings();
    } else {
      setLoading(false);
    }
  }, [token, user, loadPendingRatings]);

  const handleRateUser = (rating) => {
    setSelectedRating(rating);
    setShowRatingModal(true);
  };

  const handleModalClose = () => {
    setShowRatingModal(false);
    setSelectedRating(null);
  };

  if (loadingAuth) {
    return (
      <div className="pending-ratings">
        <div className="pending-ratings-header">
          <h2>Calificaciones Pendientes</h2>
        </div>
        <div className="loading-state">
          <div className="skeleton-loader"></div>
          <div className="skeleton-loader"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pending-ratings">
        <div className="pending-ratings-header">
          <h2>Calificaciones Pendientes</h2>
        </div>
        <div className="empty-state">
          <p>Debes iniciar sesión para ver tus calificaciones pendientes.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pending-ratings">
        <div className="pending-ratings-header">
          <h2>Calificaciones Pendientes</h2>
        </div>
        <div className="loading-state">
          <div className="skeleton-loader"></div>
          <div className="skeleton-loader"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pending-ratings">
        <div className="pending-ratings-header">
          <h2>Calificaciones Pendientes</h2>
        </div>
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadPendingRatings} className="btn btn-secondary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pending-ratings">
      <div className="pending-ratings-header">
        <h2>Calificaciones Pendientes</h2>
        <p className="pending-count">
          {pendingRatings.length}{" "}
          {pendingRatings.length === 1
            ? "calificación pendiente"
            : "calificaciones pendientes"}
        </p>
      </div>

      {pendingRatings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⭐</div>
          <h3>¡Todas al día!</h3>
          <p>No tienes calificaciones pendientes por completar.</p>
        </div>
      ) : (
        <div className="pending-ratings-list">
          {pendingRatings.map((rating) => (
            <div key={rating.transactionId} className="pending-rating-card">
              <div className="transaction-summary">
                <div className="listing-info">
                  <img
                    src={
                      rating.listing.images?.[0] ||
                      "/images/demo/placeholder.jpg"
                    }
                    alt={rating.listing.title}
                    className="listing-thumbnail"
                  />
                  <div className="listing-details">
                    <h4>{rating.listing.title}</h4>
                    <p className="listing-price">${rating.listing.price}</p>
                    <p className="transaction-date">
                      Transacción pendiente de calificación
                    </p>
                  </div>
                </div>

                <div className="user-info">
                  <div className="user-avatar">
                    {rating.toUser.avatar ? (
                      <img
                        src={rating.toUser.avatar}
                        alt={rating.toUser.name}
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {rating.toUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="user-details">
                    <h4>{rating.toUser.name}</h4>
                    <p className="user-role">
                      {rating.role === "seller" ? "Comprador" : "Vendedor"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rating-actions">
                <button
                  onClick={() => handleRateUser(rating)}
                  className="btn btn-primary"
                >
                  Calificar Usuario
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showRatingModal && selectedRating && (
        <RatingModal
          pendingRating={selectedRating}
          isOpen={showRatingModal}
          onClose={handleModalClose}
          onSuccess={() => loadPendingRatings()}
        />
      )}
    </div>
  );
};

export default PendingRatings;
