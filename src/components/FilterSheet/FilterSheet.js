import React from "react";
import PropTypes from "prop-types";
import "./FilterSheet.css";

function FilterSheet({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <button className="iconbtn" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
          <div className="h2">Filtros</div>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

FilterSheet.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
};

export default FilterSheet;
