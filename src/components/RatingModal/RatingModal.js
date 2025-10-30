import React, { useState } from "react";
import { FiX, FiStar, FiCheck } from "react-icons/fi";
import { submitReputation } from "../../services/transactions";
import { useAuth } from "../../context/AuthContext";
import "./RatingModal.css";

const RatingModal = ({ pendingRating, isOpen, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError("Por favor selecciona una calificación");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await submitReputation(
        { transactionId: pendingRating.id, rating, comment },
        token,
      );
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Error al calificar:", error);
      if (error.code === "VERIFICATION_REQUIRED") {
        setError(
          "Debes verificar tu identidad antes de calificar usuarios. Ve a tu perfil para completar la verificación.",
        );
      } else {
        setError(error.response?.data?.error || "Error al enviar calificación");
      }
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoverRating(0);
    setComment("");
    setError("");
    onClose();
  };

  if (!isOpen || !pendingRating) return null;

  const { listing, fromUser, toUser } = pendingRating;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content rating-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            Calificar {toUser.role === "seller" ? "Vendedor" : "Comprador"}
          </h2>
          <button className="modal-close-btn" onClick={handleClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          <div className="transaction-info">
            <div className="listing-card">
              <img src={listing.images?.[0]} alt={listing.title} />
              <div className="listing-details">
                <h3>{listing.title}</h3>
                <p className="price">${listing.price?.toLocaleString()}</p>
              </div>
            </div>

            <div className="user-card">
              <img
                src={toUser.avatar || "/images/avatars/default.png"}
                alt={toUser.name}
                className="user-avatar"
              />
              <div className="user-info">
                <h4>{toUser.name}</h4>
                {toUser.ratingAverage > 0 && (
                  <div className="user-rating">
                    <FiStar className="star-filled" />
                    <span>{toUser.ratingAverage.toFixed(1)}</span>
                    <span className="rating-count">({toUser.ratingCount})</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rating-form">
            <div className="form-group">
              <label>¿Cómo fue tu experiencia?</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star ${star <= (hoverRating || rating) ? "filled" : ""}`}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <FiStar />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="rating-text">
                  {rating === 1 && "Muy mala"}
                  {rating === 2 && "Mala"}
                  {rating === 3 && "Regular"}
                  {rating === 4 && "Buena"}
                  {rating === 5 && "Excelente"}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="comment">Comentario (opcional)</label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Comparte tu experiencia..."
                rows="4"
                maxLength="500"
              />
              <small className="char-count">{comment.length}/500</small>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || rating === 0}
              >
                {loading ? (
                  <>
                    <div className="btn-spinner"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <FiCheck />
                    Enviar Calificación
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
