import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useData } from "../../context/DataContext";
import ErrorBoundary from "../ErrorBoundary/ErrorBoundary";
import logo from "../../logo.png";
import "./Header.css";

function HeaderContent() {
  const nav = useNavigate();
  const location = useLocation();
  const data = useData();
  const [q, setQ] = React.useState("");
  const authPaths = ["/login", "/register"];
  const isAuthPage = authPaths.includes(location.pathname);
  const isHome = location.pathname === "/";
  const showBrand = !isHome || isAuthPage;
  const showSearch = !isAuthPage;
  const [pinned, setPinned] = React.useState(true);

  const go = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    if (data?.trackSearch) {
      data.trackSearch(term);
    }
    nav(`/search?q=${encodeURIComponent(term)}`);
  };

  React.useEffect(() => {
    document.title = "PeloAPelo";
    const link =
      document.querySelector("link[rel='icon']") ||
      document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    link.href = "/logo.png";
    document.head.appendChild(link);
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      setPinned(window.scrollY <= 0);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const shouldPin = isAuthPage || pinned;

  return (
    <header
      className={`header${isAuthPage ? " header--auth" : ""}${
        isHome ? " header--home" : ""
      }${shouldPin ? " header--pinned" : ""}`}
    >
      <div className="header-inner">
        {showBrand && (
          <button
            type="button"
            className="header-brand"
            onClick={() => nav("/")}
            aria-label="Ir al inicio"
          >
            <img
              src={logo}
              alt="peloAPPelo"
              className="header-brand-img"
              loading="lazy"
            />
            <span className="header-brand-text">peloAPPelo</span>
          </button>
        )}

        {showSearch && (
          <form onSubmit={go} className="search">
            <input
              className="input"
              placeholder="Buscar vehículos, celulares..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </form>
        )}
      </div>
    </header>
  );
}

export default function Header() {
  return (
    <ErrorBoundary>
      <HeaderContent />
    </ErrorBoundary>
  );
}
