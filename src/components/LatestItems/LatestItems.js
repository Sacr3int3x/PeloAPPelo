import React, { useMemo } from "react";
import PropTypes from "prop-types";
import Card from "../Card/Card";
import "./LatestItems.css";

import { useData } from "../../context/DataContext";
import ErrorBoundary from "../ErrorBoundary/ErrorBoundary";

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
    const ordered = [...source].sort(
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
    <section className="latest-items">
      <h2 className="h2">Publicaciones recientes</h2>
      <div className="grid-cards">
        {latest.map((item) => (
          <Card key={item.id} item={item} />
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
