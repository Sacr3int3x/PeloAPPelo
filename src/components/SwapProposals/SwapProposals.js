import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdDelete, MdClose } from "react-icons/md";
import "./SwapProposals.css";

function SwapProposals({ proposals = [], currentUserId, onDelete }) {
  const navigate = useNavigate();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProposals, setSelectedProposals] = useState([]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
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

  const getStatusClass = (status) => {
    switch (status) {
      case "accepted":
        return "accepted";
      case "rejected":
        return "rejected";
      default:
        return "pending";
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedProposals([]);
  };

  const toggleProposalSelection = (proposalId) => {
    setSelectedProposals((prev) => {
      if (prev.includes(proposalId)) {
        return prev.filter((id) => id !== proposalId);
      }
      return [...prev, proposalId];
    });
  };

  const handleDeleteSelected = () => {
    if (
      window.confirm(`¿Eliminar ${selectedProposals.length} solicitud(es)?`)
    ) {
      selectedProposals.forEach((id) => onDelete(id));
      setSelectedProposals([]);
      setSelectionMode(false);
    }
  };

  const handleCardClick = (proposalId) => {
    if (selectionMode) {
      toggleProposalSelection(proposalId);
    } else {
      navigate(`/swap/${proposalId}`);
    }
  };

  return (
    <div className="swap-proposals-list">
      <div className="list-header">
        <div className="list-header-top">
          <h2>Solicitudes de intercambio</h2>
          <button
            className="btn-selection-mode"
            onClick={toggleSelectionMode}
            title={selectionMode ? "Cancelar selección" : "Seleccionar"}
          >
            {selectionMode ? <MdClose /> : "Seleccionar"}
          </button>
        </div>
        {selectionMode && selectedProposals.length > 0 && (
          <div className="list-header-delete-bar">
            <button
              className="btn-delete-selected"
              onClick={handleDeleteSelected}
              title={`Eliminar ${selectedProposals.length} solicitud(es)`}
            >
              <MdDelete /> Eliminar ({selectedProposals.length})
            </button>
          </div>
        )}
        {!selectionMode && (
          <div className="inbox-legend">
            <span className="inbox-legend-item">
              <span className="inbox-legend-indicator my-listing"></span>
              <span className="inbox-legend-text">Mi publicación</span>
            </span>
            <span className="inbox-legend-item">
              <span className="inbox-legend-indicator other-listing"></span>
              <span className="inbox-legend-text">Otra publicación</span>
            </span>
          </div>
        )}
      </div>

      <div className="list-scroller">
        {proposals.length === 0 ? (
          <div className="list-empty">No hay propuestas de intercambio.</div>
        ) : (
          proposals.map((proposal) => {
            const isSender = proposal.sender.id === currentUserId;
            const isMyListing = proposal.receiver.id === currentUserId;

            return (
              <div
                key={proposal.id}
                className={`swap-proposal-compact ${proposal.unread ? "message-new" : ""} ${selectionMode ? "selection-mode" : ""} ${selectedProposals.includes(proposal.id) ? "selected" : ""} ${isMyListing ? "my-listing" : "other-listing"}`}
                onClick={() => handleCardClick(proposal.id)}
                role="button"
                tabIndex={0}
              >
                {selectionMode && (
                  <div className="inbox-card-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedProposals.includes(proposal.id)}
                      onChange={() => toggleProposalSelection(proposal.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}

                <div className="seller-photo-wrapper">
                  <img
                    src={
                      proposal.targetItem.images[0] || "/images/placeholder.jpg"
                    }
                    alt={proposal.targetItem.name}
                    className="seller-photo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/images/placeholder.jpg";
                    }}
                    loading="lazy"
                  />
                </div>

                <div className="inbox-card-body">
                  <div className="inbox-card-header">
                    <span className="inbox-card-name">
                      {isSender
                        ? `Enviada a ${proposal.receiver.name}`
                        : `Recibida de ${proposal.sender.name}`}
                    </span>
                  </div>
                  <div className="inbox-card-listing">
                    {proposal.targetItem.name}
                  </div>
                  <div className="inbox-card-preview">
                    Por: {proposal.offeredItem.description}
                    {proposal.moneyAmount > 0 &&
                      ` + REF ${proposal.moneyAmount.toLocaleString()}`}
                  </div>
                  <div className="swap-proposal-meta">
                    <span className="inbox-card-date">
                      {formatDate(proposal.createdAt)}
                    </span>
                    <span
                      className={`swap-status-badge-mini ${getStatusClass(proposal.status)}`}
                    >
                      {getStatusText(proposal.status)}
                    </span>
                  </div>
                  {/* Motivo de rechazo visible solo para el comprador */}
                  {isSender && proposal.status === "rejected" && proposal.rejectReason && (
                    <div className="swap-reject-reason">
                      <b>Motivo del rechazo:</b> {proposal.rejectReason}
                    </div>
                  )}
                </div>

                {!selectionMode && (
                  <button
                    className="btn-delete-conversation"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("¿Eliminar esta solicitud?")) {
                        onDelete(proposal.id);
                      }
                    }}
                    title="Eliminar solicitud"
                  >
                    <MdDelete />
                  </button>
                )}

                {proposal.unread && <span className="inbox-card-unread" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default SwapProposals;
