import React, { useState } from "react";
import PropTypes from "prop-types";
import "./RatingForm.css";

export default function RatingForm({ onSubmit, pending }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (pending) return;
    onSubmit({ rating, comment: comment.trim() });
  };

  return (
    <form className="rating-form" onSubmit={handleSubmit}>
      <div className="rating-form-stars">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className={`rating-star${rating >= value ? " active" : ""}`}
            onClick={() => setRating(value)}
            aria-label={`Calificar con ${value} estrella${value > 1 ? "s" : ""}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="rating-form-comment"
        placeholder="Escribe un comentario opcional"
        value={comment}
        maxLength={280}
        onChange={(event) => setComment(event.target.value)}
      />
      <div className="rating-form-actions">
        <span className="rating-form-hint">{280 - comment.length} caracteres restantes</span>
        <button type="submit" className="btn primary" disabled={pending}>
          {pending ? "Enviando..." : "Enviar calificación"}
        </button>
      </div>
    </form>
  );
}

RatingForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  pending: PropTypes.bool,
};

RatingForm.defaultProps = {
  pending: false,
};
