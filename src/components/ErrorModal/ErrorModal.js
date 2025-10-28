import React from "react";
import "./ErrorModal.css";

const ErrorModal = ({ open, message, onClose }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay error-modal-overlay">
      <div className="modal-content error-modal-content">
        <div className="modal-text error-modal-text">{message}</div>
        <div className="modal-actions error-modal-actions">
          <button className="btn primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
