import React from "react";
import PropTypes from "prop-types";
import { MdStar, MdStarHalf } from "react-icons/md";
import "./Rating.css";

function Rating({ value = 4.6, votes = 120 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;

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
        {value.toFixed(1)} · {votes}
      </span>
    </div>
  );
}

Rating.propTypes = {
  value: PropTypes.number,
  votes: PropTypes.number,
};

export default Rating;
