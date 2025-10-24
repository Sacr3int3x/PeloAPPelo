import React, { useState, useEffect } from "react";
import { FiX, FiStar, FiCheck, FiUser } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { createTransaction } from "../../services/transactions";
import { getConversationParticipants } from "../../services/messages";
import "./MarcarComoVendidoModal.css";

const MarcarComoVendidoModal = ({ listing, isOpen, onClose, onSuccess }) => {
  const { token, user } = useAuth();
  const [buyers, setBuyers] = useState([]);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: Seleccionar comprador, 2: Calificar

  useEffect(() => {
    if (isOpen && listing) {
      fetchBuyers();
    }
  }, [isOpen, listing]);

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      const participants = await getConversationParticipants(listing.id, token);
      // Filtrar solo usuarios que no son el vendedor
      const potentialBuyers = participants.filter(p => p.id !== user.id);
      setBuyers(potentialBuyers);
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener compradores:", error);
      setError("No se pudieron cargar los compradores");
      setLoading(false);
    }
  };

  const handleBuyerSelect = (buyer) => {
    setSelectedBuyer(buyer);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedBuyer) {
      setError("Selecciona un comprador");
      return;
    }

    if (rating === 0) {
      setError("Por favor califica al comprador");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createTransaction({
        listingId: listing.id,
        buyerId: selectedBuyer.id,
        rating,
        comment,
      }, token);

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Error al marcar como vendido:", error);
      setError(error.response?.data?.error || "Error al procesar la venta");
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedBuyer(null);
    setRating(0);
    setHoverRating(0);
    setComment("");
    setError("");
    setStep(1);
    setBuyers([]);
    onClose();
  };

  const handleBack = () => {
    setStep(1);
    setRating(0);
    setComment("");
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content marcar-vendido-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{step === 1 ? "Seleccionar Comprador" : "Calificar Comprador"}</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          {step === 1 ? (
            <>
              <div className="listing-info">
                <img src={listing.images?.[0]} alt={listing.title} />
                <div>
                  <h3>{listing.title}</h3>
                  <p className="price">${listing.price?.toLocaleString()}</p>
                </div>
              </div>

              <div className="buyer-selection">
                <p className="instruction">¿A quién le vendiste este producto?</p>
                
                {loading ? (
                  <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Cargando compradores...</p>
                  </div>
                ) : buyers.length === 0 ? (
                  <div className="empty-state">
                    <FiUser />
                    <p>No hay compradores disponibles</p>
                    <small>Asegúrate de tener conversaciones sobre este producto</small>
                  </div>
                ) : (
                  <div className="buyer-list">
                    {buyers.map((buyer) => (
                      <div
                        key={buyer.id}
                        className="buyer-item"
                        onClick={() => handleBuyerSelect(buyer)}
                      >
                        <img 
                          src={buyer.avatar || "/images/avatars/default.png"} 
                          alt={buyer.name}
                          className="buyer-avatar"
                        />
                        <div className="buyer-info">
                          <h4>{buyer.name}</h4>
                          {buyer.ratingAverage > 0 && (
                            <div className="buyer-rating">
                              <FiStar className="star-filled" />
                              <span>{buyer.ratingAverage.toFixed(1)}</span>
                              <span className="rating-count">({buyer.ratingCount})</span>
                            </div>
                          )}
                        </div>
                        <FiCheck className="select-icon" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="selected-buyer-info">
                <img 
                  src={selectedBuyer.avatar || "/images/avatars/default.png"} 
                  alt={selectedBuyer.name}
                  className="buyer-avatar-large"
                />
                <div>
                  <h3>{selectedBuyer.name}</h3>
                  <p className="subtitle">Compraste: {listing.title}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="rating-form">
                <div className="form-group">
                  <label>¿Cómo fue tu experiencia con este comprador?</label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star ${
                          star <= (hoverRating || rating) ? "filled" : ""
                        }`}
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
                    placeholder="Cuéntanos sobre tu experiencia..."
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
                    onClick={handleBack}
                    disabled={loading}
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || rating === 0}
                  >
                    {loading ? (
                      <>
                        <div className="btn-spinner"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <FiCheck />
                        Confirmar Venta
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarcarComoVendidoModal;
