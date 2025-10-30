import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMessages } from '../../context/MessageContext';
import RatingModal from '../RatingModal/RatingModal';
import './PendingRatings.css';

/**
 * Componente que muestra y gestiona las calificaciones pendientes del usuario
 */
function PendingRatings() {
  const { user } = useAuth();
  const { conversations } = useMessages();
  const [pendingRatings, setPendingRatings] = useState([]);
  const [currentRating, setCurrentRating] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPendingRatings = useCallback(async () => {
    if (!user || !conversations) {
      setLoading(false);
      return;
    }

    try {
      // Buscar conversaciones con transacciones que necesitan calificación
      const pending = [];

      for (const conversation of conversations) {
        if (!conversation.transaction) continue;

        const transaction = conversation.transaction;
        const isSeller = transaction.sellerId === user.id;
        const isBuyer = transaction.buyerId === user.id;

        if (!isSeller && !isBuyer) continue;

        // Verificar si el usuario actual ya calificó
        const hasRated = isSeller
          ? transaction.sellerRatingId
          : transaction.buyerRatingId;

        if (hasRated) continue;

        // Obtener datos del otro usuario
        const otherUserId = isSeller ? transaction.buyerId : transaction.sellerId;
        const otherUser = conversation.participants_data?.find(p => p.id === otherUserId);

        if (!otherUser) continue;

        const listing = conversation.listing || {};

        pending.push({
          id: transaction.id,
          conversationId: conversation.id,
          listing: {
            title: listing.name || "Artículo vendido",
            price: listing.price || 0,
            images: listing.images || ["/images/placeholder.jpg"]
          },
          fromUser: {
            id: user.id,
            name: user.name,
            email: user.email
          },
          toUser: {
            id: otherUser.id,
            name: otherUser.name,
            email: otherUser.email,
            avatar: otherUser.avatar,
            role: isSeller ? "buyer" : "seller",
            ratingAverage: 0, // TODO: obtener rating real
            ratingCount: 0
          },
          transaction,
          conversation
        });
      }

      setPendingRatings(pending);
    } catch (error) {
      console.error("Error cargando calificaciones pendientes:", error);
    } finally {
      setLoading(false);
    }
  }, [conversations, user]);

  useEffect(() => {
    loadPendingRatings();
  }, [loadPendingRatings]);

  const handleRatingClick = (ratingData) => {
    setCurrentRating(ratingData);
  };

  const handleRatingSubmitted = () => {
    setCurrentRating(null);
    loadPendingRatings(); // Recargar la lista
  };

  const handleRatingClose = () => {
    setCurrentRating(null);
  };

  if (loading) {
    return (
      <div className="pending-ratings">
        <div className="pending-ratings-header">
          <h3>Calificaciones Pendientes</h3>
        </div>
        <div className="pending-ratings-loading">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (pendingRatings.length === 0) {
    return (
      <div className="pending-ratings">
        <div className="pending-ratings-header">
          <h3>Calificaciones Pendientes</h3>
        </div>
        <div className="pending-ratings-empty">
          <p>🎉 No tienes calificaciones pendientes</p>
          <small>Todas tus transacciones han sido calificadas</small>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pending-ratings">
        <div className="pending-ratings-header">
          <h3>Calificaciones Pendientes</h3>
          <span className="pending-count">{pendingRatings.length}</span>
        </div>

        <div className="pending-ratings-list">
          {pendingRatings.map((rating) => (
            <div key={rating.id} className="pending-rating-item">
              <div className="pending-rating-content">
                <div className="pending-rating-listing">
                  <img
                    src={rating.listing.images?.[0]}
                    alt={rating.listing.title}
                    className="pending-rating-image"
                  />
                  <div className="pending-rating-info">
                    <h4>{rating.listing.title}</h4>
                    <p className="pending-rating-price">
                      ${rating.listing.price?.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="pending-rating-user">
                  <img
                    src={rating.toUser.avatar || "/images/avatars/default.png"}
                    alt={rating.toUser.name}
                    className="pending-rating-user-avatar"
                  />
                  <div className="pending-rating-user-info">
                    <p>Calificar a <strong>{rating.toUser.name}</strong></p>
                    <small>como {rating.toUser.role === "seller" ? "vendedor" : "comprador"}</small>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary pending-rating-btn"
                onClick={() => handleRatingClick(rating)}
              >
                Calificar Ahora
              </button>
            </div>
          ))}
        </div>
      </div>

      {currentRating && (
        <RatingModal
          isOpen={!!currentRating}
          onClose={handleRatingClose}
          ratingData={currentRating}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}
    </>
  );
}

export default PendingRatings;