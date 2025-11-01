import React from "react";
import PropTypes from "prop-types";
import { MdStar, MdStarHalf } from "react-icons/md";
import "./Rating.css";

function Rating({ value = 0, votes = 0, size = "normal" }) {
  const safeValue = Number.isFinite(value)
    ? Math.min(5, Math.max(0, value))
    : 0;
  const safeVotes = Number.isFinite(votes) && votes > 0 ? Math.floor(votes) : 0;
  const full = Math.floor(safeValue);
  const half = safeValue - full >= 0.5 && full < 5;

  const starSize = size === "small" ? 14 : 18;

  return (
    <div className={`rating ${size === "small" ? "rating--small" : ""}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden>
          {i < full ? (
            <MdStar size={starSize} color="#f59e0b" />
          ) : i === full && half ? (
            <MdStarHalf size={starSize} color="#f59e0b" />
          ) : (
            <MdStar size={starSize} color="#d1d5db" />
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
  size: PropTypes.oneOf(["small", "normal"]),
};

export default Rating;
