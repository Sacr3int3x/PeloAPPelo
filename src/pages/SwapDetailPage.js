import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  MdArrowBack,
  MdCheckCircle,
  MdCancel,
  MdDelete,
  MdClose,
} from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import { useMessages } from "../context/MessageContext";
import {
  fetchSwapProposals,
  acceptSwapProposal,
  rejectSwapProposal,
  cancelSwapProposal,
  deleteSwapProposal,
} from "../services/transactions";
import "./SwapDetailPage.css";

// Modal para ver imagen en grande
const ImageModal = ({ open, onClose, imageUrl, alt }) => {
  if (!open) return null;
  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <button className="image-modal-close" onClick={onClose}>
        <MdClose />
      </button>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt={alt} className="image-modal-img" />
      </div>
    </div>
  );
};

// Modal de confirmación
const ConfirmModal = ({ open, onClose, onConfirm, text }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-text">{text}</div>
        <div className="modal-actions">
          <button className="btn primary" onClick={onConfirm}>
            Confirmar
          </button>
          <button className="btn outline" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal para rechazar con razón
const RejectModal = ({ open, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm(reason);
    setReason("");
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Rechazar propuesta de intercambio</h3>
        <div className="modal-text">
          Por favor, indica el motivo del rechazo:
        </div>
        <textarea
          className="modal-textarea"
          rows="4"
          placeholder="Ej: El artículo ofrecido no me interesa..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
            marginBottom: "10px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            fontFamily: "inherit",
            fontSize: "14px",
          }}
        />
        <div className="modal-actions">
          <button
            className="btn primary"
            onClick={handleConfirm}
            disabled={!reason.trim()}
          >
            Rechazar propuesta
          </button>
          <button className="btn outline" onClick={handleClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

function SwapDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { refresh: refreshConversations } = useMessages();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({
    open: false,
    action: null,
    text: "",
    onConfirm: null,
  });
  const [rejectModal, setRejectModal] = useState({
    open: false,
  });
  const [imageModal, setImageModal] = useState({
    open: false,
    imageUrl: "",
    alt: "",
  });

  useEffect(() => {
    const loadProposal = async () => {
      try {
        if (!token) {
          navigate("/login");
          return;
        }
        const response = await fetchSwapProposals(token);
        const found = response.proposals?.find((p) => p.id === id);
        if (found) {
          setProposal(found);
        } else {
          navigate("/inbox");
        }
      } catch (error) {
        console.error("Error al cargar la propuesta:", error);
        navigate("/inbox");
      } finally {
        setLoading(false);
      }
    };

    loadProposal();
  }, [id, token, navigate]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusText = (status) => {
    switch (status) {
      case "accepted":
        return "Aceptada";
      case "rejected":
        return "Rechazada";
      default:
        return "Pendiente";
    }
  };

  const handleAccept = () => {
    setModal({
      open: true,
      action: "accept",
      text: "¿Estás seguro de que deseas aceptar esta propuesta de intercambio? Se creará una conversación para coordinar los detalles.",
      onConfirm: async () => {
        try {
          const response = await acceptSwapProposal(id, token);
          setProposal((prev) => ({ ...prev, status: "accepted" }));

          // Refrescar las conversaciones para que aparezca la nueva
          await refreshConversations();

          if (response.conversationId) {
            navigate(`/inbox?conversation=${response.conversationId}`);
          } else {
            navigate("/inbox");
          }
        } catch (error) {
          console.error("Error al aceptar la propuesta:", error);
          alert("No se pudo aceptar la propuesta. Intenta de nuevo.");
        } finally {
          setModal((m) => ({ ...m, open: false }));
        }
      },
    });
  };

  const handleReject = () => {
    setRejectModal({ open: true });
  };

  const handleConfirmReject = async (reason) => {
    try {
      const response = await rejectSwapProposal(id, token, reason);
      setProposal((prev) => ({ ...prev, status: "rejected" }));

      // Refrescar las conversaciones
      await refreshConversations();

      if (response.conversationId) {
        navigate(`/inbox?conversation=${response.conversationId}`);
      } else {
        navigate("/inbox");
      }
    } catch (error) {
      console.error("Error al rechazar la propuesta:", error);
      alert("No se pudo rechazar la propuesta. Intenta de nuevo.");
    } finally {
      setRejectModal({ open: false });
    }
  };

  const handleCancel = () => {
    setModal({
      open: true,
      action: "cancel",
      text: "¿Estás seguro de que deseas cancelar esta propuesta de intercambio?",
      onConfirm: async () => {
        try {
          await cancelSwapProposal(id, token);
          navigate("/inbox");
        } catch (error) {
          console.error("Error al cancelar la propuesta:", error);
          alert("No se pudo cancelar la propuesta. Intenta de nuevo.");
        } finally {
          setModal((m) => ({ ...m, open: false }));
        }
      },
    });
  };

  const handleDelete = () => {
    setModal({
      open: true,
      action: "delete",
      text: "¿Estás seguro de que deseas eliminar esta propuesta finalizada?",
      onConfirm: async () => {
        try {
          await deleteSwapProposal(id, token);
          navigate("/inbox");
        } catch (error) {
          console.error("Error al eliminar la propuesta:", error);
          alert("No se pudo eliminar la propuesta. Intenta de nuevo.");
        } finally {
          setModal((m) => ({ ...m, open: false }));
        }
      },
    });
  };

  if (loading) {
    return (
      <main className="container page">
        <div className="loading-state">Cargando solicitud...</div>
      </main>
    );
  }

  if (!proposal) {
    return (
      <main className="container page">
        <div className="error-state">Solicitud no encontrada</div>
      </main>
    );
  }

  const isSender = proposal.sender.id === user?.id;
  const isReceiver = proposal.receiver.id === user?.id;

  return (
    <main className="container page swap-detail-page">
      <div className="swap-detail-header">
        <button
          className="btn-back"
          onClick={() => navigate("/inbox?tab=swaps")}
        >
          <MdArrowBack /> Volver a solicitudes
        </button>
        <div className="swap-status-badge-large">
          {getStatusText(proposal.status)}
        </div>
      </div>

      <div className="swap-detail-content">
        <div className="swap-detail-title">
          <h1>
            {isSender
              ? `Propuesta enviada a ${proposal.receiver.name}`
              : `Propuesta de ${proposal.sender.name}`}
          </h1>
          <span className="swap-detail-date">
            {formatDate(proposal.createdAt)}
          </span>
        </div>

        <div className="swap-detail-items">
          <div className="swap-detail-item-section">
            <h2>Artículo solicitado</h2>
            <div className="swap-detail-item">
              <div className="swap-detail-item-images">
                <img
                  src={
                    proposal.targetItem.images[0] || "/images/placeholder.jpg"
                  }
                  alt={proposal.targetItem.name}
                  className="swap-detail-main-image"
                  onClick={() =>
                    setImageModal({
                      open: true,
                      imageUrl:
                        proposal.targetItem.images[0] ||
                        "/images/placeholder.jpg",
                      alt: proposal.targetItem.name,
                    })
                  }
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/images/placeholder.jpg";
                  }}
                />
              </div>
              <div className="swap-detail-item-info">
                <Link
                  to={`/item/${proposal.targetItem.id}`}
                  className="swap-detail-item-title"
                >
                  {proposal.targetItem.name}
                </Link>
                <span className="swap-detail-item-price">
                  Valor referencia: REF{" "}
                  {proposal.targetItem.price.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="swap-detail-exchange-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="17 1 21 5 17 9"></polyline>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
              <polyline points="7 23 3 19 7 15"></polyline>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
            </svg>
          </div>

          <div className="swap-detail-item-section">
            <h2>Artículo ofrecido</h2>
            <div className="swap-detail-item">
              {proposal.offeredItem.images &&
                proposal.offeredItem.images.length > 0 && (
                  <div className="swap-detail-item-images">
                    <img
                      src={proposal.offeredItem.images[0]}
                      alt={proposal.offeredItem.description}
                      className="swap-detail-main-image"
                      onClick={() =>
                        setImageModal({
                          open: true,
                          imageUrl: proposal.offeredItem.images[0],
                          alt: proposal.offeredItem.description,
                        })
                      }
                    />
                    {proposal.offeredItem.images.length > 1 && (
                      <div className="swap-detail-image-gallery">
                        {proposal.offeredItem.images
                          .slice(1)
                          .map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`${proposal.offeredItem.description} ${idx + 2}`}
                              className="swap-detail-gallery-image"
                              onClick={() =>
                                setImageModal({
                                  open: true,
                                  imageUrl: img,
                                  alt: `${proposal.offeredItem.description} ${idx + 2}`,
                                })
                              }
                            />
                          ))}
                      </div>
                    )}
                  </div>
                )}
              <div className="swap-detail-item-info">
                <span className="swap-detail-item-title">
                  {proposal.offeredItem.description}
                </span>
                <span className="swap-detail-item-price">
                  Valor referencia: REF{" "}
                  {proposal.offeredItem.value.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {proposal.moneyAmount > 0 && (
          <div className="swap-detail-money">
            <h3>Efectivo adicional</h3>
            <p>
              {proposal.moneyDirection === "toSeller"
                ? "El comprador incluye dinero adicional: "
                : "El vendedor incluye dinero adicional: "}
              <strong>REF {proposal.moneyAmount.toLocaleString()}</strong>
            </p>
          </div>
        )}

        {proposal.message && (
          <div className="swap-detail-message">
            <h3>Mensaje</h3>
            <p>{proposal.message}</p>
          </div>
        )}

        <div className="swap-detail-actions">
          {proposal.status === "pending" && isReceiver && (
            <>
              <button className="btn-action-primary" onClick={handleAccept}>
                <MdCheckCircle /> Aceptar propuesta
              </button>
              <button className="btn-action-secondary" onClick={handleReject}>
                <MdCancel /> Rechazar propuesta
              </button>
            </>
          )}
          {proposal.status === "pending" && isSender && (
            <button className="btn-action-danger" onClick={handleCancel}>
              <MdCancel /> Cancelar propuesta
            </button>
          )}
          {proposal.status !== "pending" && (
            <button className="btn-action-danger" onClick={handleDelete}>
              <MdDelete /> Eliminar propuesta
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        open={modal.open}
        text={modal.text}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onConfirm={modal.onConfirm}
      />

      <RejectModal
        open={rejectModal.open}
        onClose={() => setRejectModal({ open: false })}
        onConfirm={handleConfirmReject}
      />

      <ImageModal
        open={imageModal.open}
        onClose={() => setImageModal({ open: false, imageUrl: "", alt: "" })}
        imageUrl={imageModal.imageUrl}
        alt={imageModal.alt}
      />
    </main>
  );
}

export default SwapDetailPage;
