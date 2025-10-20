import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import Hero from "../components/Hero/Hero";
import CategoryChipsNav from "../components/CategoryChipsNav/CategoryChipsNav";
import LatestItems from "../components/LatestItems/LatestItems";
import "../styles/HomePage.css";

function HomePage() {
  const pullThreshold = 90;
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(Date.now());
  const [refreshMessage, setRefreshMessage] = useState(
    "Buscando nuevas publicaciones…",
  );

  const pullStartRef = useRef(null);
  const draggingRef = useRef(false);
  const pullDistanceRef = useRef(0);

  useEffect(() => {
    pullDistanceRef.current = pullDistance;
  }, [pullDistance]);

  const refreshHints = useMemo(
    () => [
      "Buscando nuevas publicaciones…",
      "Revisando ofertas frescas…",
      "Cargando más oportunidades…",
      "Actualizando el catálogo…",
    ],
    [],
  );

  const triggerRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPullDistance(pullThreshold);
    const hint =
      refreshHints[Math.floor(Math.random() * refreshHints.length)] ||
      refreshHints[0];
    setRefreshMessage(hint);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    setShuffleSeed(Date.now());
    setTimeout(() => {
      setPullDistance(0);
    }, 160);
    setIsRefreshing(false);
  }, [pullThreshold, refreshHints]);

  const startPull = useCallback(
    (startY) => {
      if (isRefreshing) return;
      if (window.scrollY <= 0) {
        pullStartRef.current = startY;
        draggingRef.current = true;
      }
    },
    [isRefreshing],
  );

  const movePull = useCallback((currentY) => {
    if (!draggingRef.current || pullStartRef.current == null) return;
    if (window.scrollY > 0) {
      setPullDistance(0);
      return;
    }
    const delta = currentY - pullStartRef.current;
    if (delta > 0) {
      const dampened = Math.min(delta * 0.55, 150);
      setPullDistance(dampened);
    } else {
      setPullDistance(0);
    }
  }, []);

  const endPull = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    pullStartRef.current = null;
    const distance = pullDistanceRef.current;
    if (distance >= pullThreshold && !isRefreshing) {
      triggerRefresh();
    } else {
      setPullDistance(0);
    }
  }, [isRefreshing, pullThreshold, triggerRefresh]);

  useEffect(() => {
    const handleTouchStart = (event) => {
      if (event.touches?.length) startPull(event.touches[0].clientY);
    };
    const handleTouchMove = (event) => {
      if (event.touches?.length) movePull(event.touches[0].clientY);
    };
    const handleTouchEnd = () => {
      endPull();
    };

    const handleMouseDown = (event) => {
      if (event.button !== 0) return;
      startPull(event.clientY);
    };
    const handleMouseMove = (event) => {
      movePull(event.clientY);
    };
    const handleMouseUp = () => {
      endPull();
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [endPull, movePull, startPull]);

  const progress = isRefreshing
    ? 100
    : Math.min(100, (pullDistance / pullThreshold) * 100);

  const indicatorLabel = isRefreshing
    ? refreshMessage
    : pullDistance >= pullThreshold
      ? "Suelta para actualizar"
      : "Desliza hacia abajo para actualizar";

  const indicatorClass = `home-refresh-indicator${
    isRefreshing ? " refreshing" : ""
  }`;

  return (
    <main className="container page home-page">
      <div
        className="home-refresh-wrapper"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        <div
          className={indicatorClass}
          style={{ opacity: pullDistance > 2 || isRefreshing ? 1 : 0 }}
        >
          <div className="home-refresh-indicator-inner">
            <div className="home-refresh-spinner" aria-hidden />
            <span>{indicatorLabel}</span>
          </div>
          <div className="home-refresh-progress">
            <div
              className="home-refresh-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Hero />
        <CategoryChipsNav />
        <LatestItems limit={24} shuffleSeed={shuffleSeed} />
      </div>
    </main>
  );
}

export default HomePage;
