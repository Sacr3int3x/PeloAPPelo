import React from "react";
import PropTypes from "prop-types";
import { MdStar, MdStarHalf } from "react-icons/md";
import "./Rating.css";

function Rating({ value = 0, votes = 0 }) {
  const safeValue = Number.isFinite(value)
    ? Math.min(5, Math.max(0, value))
    : 0;
  const safeVotes = Number.isFinite(votes) && votes > 0 ? Math.floor(votes) : 0;
  const full = Math.floor(safeValue);
  const half = safeValue - full >= 0.5 && full < 5;

  return (
    <div className="rating">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden>
          {i < full ? (
            <MdStar size={18} color="#f59e0b" />
          ) : i === full && half ? (
            <MdStarHalf size={18} color="#f59e0b" />
          ) : (
            <MdStar size={18} color="#d1d5db" />
          )}
        </span>
      ))}
      <span className="rating-text">
        {safeValue.toFixed(1)} · {safeVotes}
      </span>
    </div>
  );
}

Rating.propTypes = {
  value: PropTypes.number,
  votes: PropTypes.number,
};

export default Rating;
