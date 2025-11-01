import React, { useState, useEffect, useCallback } from "react";
import { FiX, FiCheck, FiUser } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useMessages } from "../../context/MessageContext";
import { createTransaction } from "../../services/transactions";
import "./MarcarComoVendidoModal.css";

const MarcarComoVendidoModal = ({ listing, isOpen, onClose, onSuccess }) => {
  const { token, user } = useAuth();
  const { conversations } = useMessages();
  const [buyers, setBuyers] = useState([]);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBuyers = useCallback(() => {
    if (!listing?.id || !conversations) return;
    try {
      setLoading(true);
      // Filtrar conversaciones que tienen el listingId
      const relevantConversations = conversations.filter(
        (conv) => conv.listingId === listing.id,
      );
      const participants = [];
      const seen = new Set();
      relevantConversations.forEach((conv) => {
        conv.participants_data.forEach((p) => {
          if (!seen.has(p.email) && p.id !== user.id) {
            seen.add(p.email);
            participants.push(p);
          }
        });
      });
      setBuyers(participants);
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener compradores:", error);
      setError("No se pudieron cargar los compradores");
      setLoading(false);
    }
  }, [listing?.id, conversations, user.id]);

  useEffect(() => {
    if (isOpen && listing) {
      fetchBuyers();
    }
  }, [isOpen, listing, fetchBuyers]);

  const handleBuyerSelect = (buyer) => {
    setSelectedBuyer(buyer);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!listing?.id) {
      setError("No se pudo identificar la publicación");
      return;
    }

    if (!selectedBuyer) {
      setError("Selecciona un comprador");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createTransaction(
        {
          listingId: listing.id,
          buyerId: selectedBuyer.id,
        },
        token,
      );

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
    setError("");
    setBuyers([]);
    onClose();
  };

  if (!isOpen || !listing) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content marcar-vendido-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Seleccionar Comprador</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
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
                <small>
                  Asegúrate de tener conversaciones sobre este producto
                </small>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="buyer-list">
                  {buyers.map((buyer) => (
                    <div key={buyer.id} className="buyer-item">
                      <input
                        type="radio"
                        id={`buyer-${buyer.id}`}
                        name="buyer"
                        value={buyer.id}
                        checked={selectedBuyer?.id === buyer.id}
                        onChange={() => handleBuyerSelect(buyer)}
                        className="buyer-radio"
                      />
                      <label
                        htmlFor={`buyer-${buyer.id}`}
                        className="buyer-label"
                      >
                        <img
                          src={buyer.avatar || "/images/avatars/default.png"}
                          alt={buyer.name}
                          className="buyer-avatar"
                        />
                        <div className="buyer-info">
                          <h4>{buyer.name}</h4>
                        </div>
                      </label>
                    </div>
                  ))}
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
                    disabled={loading || !selectedBuyer}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarcarComoVendidoModal;
