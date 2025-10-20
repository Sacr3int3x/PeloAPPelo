import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "./PageTransition.css";

function PageTransition() {
  const location = useLocation();
  const [active, setActive] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setActive(true);
    const timeout = setTimeout(() => setActive(false), 420);
    return () => clearTimeout(timeout);
  }, [location]);

  return active ? <div className="page-transition-overlay" aria-hidden /> : null;
}

export default PageTransition;
