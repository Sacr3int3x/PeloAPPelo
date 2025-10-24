import React, { useMemo } from "react";
import PropTypes from "prop-types";
import Card from "../Card/Card";
import "./LatestItems.css";

import { useData } from "../../context/DataContext";
import ErrorBoundary from "../ErrorBoundary/ErrorBoundary";

// Constantes para el diseño
const CONTAINER_STYLES = {
  width: "100%",
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "0 1rem",
};

const mulberry32 = (seed) => {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleBySeed = (source, seed) => {
  if (!seed) return [...source];
  const random = mulberry32(seed);
  const arr = [...source];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

function LatestItemsContent({ limit = 24, shuffleSeed = null }) {
  const data = useData();
  const items = data?.items;
  const latest = useMemo(() => {
    const source = Array.isArray(items) ? items : [];
    // Eliminar duplicados basados en id
    const uniqueItems = source.reduce((acc, current) => {
      const x = acc.find((item) => item.id === current.id);
      if (!x) {
        return acc.concat([current]);
      }
      return acc;
    }, []);

    const ordered = uniqueItems.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    const list = shuffleSeed ? shuffleBySeed(ordered, shuffleSeed) : ordered;
    return list.slice(0, limit);
  }, [items, limit, shuffleSeed]);

  if (!latest.length) {
    return (
      <section className="latest-items">
        <h2 className="h2">Publicaciones recientes</h2>
        <p className="muted">
          Aún no hay publicaciones. ¡Sé el primero en publicar!
        </p>
      </section>
    );
  }

  return (
    <section className="latest-items" style={CONTAINER_STYLES}>
      <h2 className="h2">Publicaciones recientes</h2>
      <div className="latest-items-grid">
        {latest.map((item) => (
          <div key={item.id} className="latest-item-wrapper">
            <Card item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}

LatestItemsContent.propTypes = {
  limit: PropTypes.number,
  shuffleSeed: PropTypes.number,
};

function LatestItems(props) {
  return (
    <ErrorBoundary>
      <LatestItemsContent {...props} />
    </ErrorBoundary>
  );
}

export default LatestItems;
