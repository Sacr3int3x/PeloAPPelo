/**
 * Componentes Skeleton Loader
 * Mejoran la percepción de carga mostrando placeholders animados
 */

import React from "react";
import "./Skeleton.css";

/**
 * Skeleton básico
 */
export function Skeleton({
  width,
  height,
  borderRadius,
  className = "",
  ...props
}) {
  const style = {
    width: width || "100%",
    height: height || "1rem",
    borderRadius: borderRadius || "4px",
  };

  return <div className={`skeleton ${className}`} style={style} {...props} />;
}

/**
 * Skeleton para texto
 */
export function SkeletonText({
  lines = 3,
  lineHeight = "1rem",
  gap = "0.5rem",
}) {
  return (
    <div className="skeleton-text" style={{ gap }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? "70%" : "100%"}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton para tarjeta de producto
 */
export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton height="200px" className="skeleton-card-image" />
      <div className="skeleton-card-content">
        <Skeleton height="1.5rem" width="80%" />
        <Skeleton height="1rem" width="60%" />
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <Skeleton height="1rem" width="40%" />
          <Skeleton height="1rem" width="30%" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton para lista de tarjetas
 */
export function SkeletonCardList({ count = 6 }) {
  return (
    <div className="skeleton-card-list">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

/**
 * Skeleton para perfil de usuario
 */
export function SkeletonProfile() {
  return (
    <div className="skeleton-profile">
      <Skeleton
        width="120px"
        height="120px"
        borderRadius="50%"
        className="skeleton-profile-avatar"
      />
      <div className="skeleton-profile-info">
        <Skeleton height="2rem" width="200px" />
        <Skeleton height="1rem" width="150px" />
        <div style={{ marginTop: "1rem" }}>
          <SkeletonText lines={2} />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton para mensaje de chat
 */
export function SkeletonMessage({ align = "left" }) {
  return (
    <div className={`skeleton-message skeleton-message-${align}`}>
      <Skeleton width="50px" height="50px" borderRadius="50%" />
      <div className="skeleton-message-content">
        <Skeleton height="1rem" width="100px" />
        <Skeleton height="3rem" width="250px" borderRadius="12px" />
      </div>
    </div>
  );
}

/**
 * Skeleton para lista de mensajes
 */
export function SkeletonMessageList({ count = 5 }) {
  return (
    <div className="skeleton-message-list">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonMessage
          key={index}
          align={index % 2 === 0 ? "left" : "right"}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton para tabla
 */
export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} height="2rem" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="1.5rem" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para página completa
 */
export function SkeletonPage() {
  return (
    <div className="skeleton-page">
      <div className="skeleton-page-header">
        <Skeleton height="3rem" width="300px" />
        <Skeleton height="1.5rem" width="200px" />
      </div>
      <div className="skeleton-page-content">
        <SkeletonCardList count={6} />
      </div>
    </div>
  );
}

export default Skeleton;
