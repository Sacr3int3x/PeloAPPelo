import React from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { useData } from "../../context/DataContext";
import ErrorBoundary from "../ErrorBoundary/ErrorBoundary";
import NotificationBell from "../NotificationBell/NotificationBell";
import logo from "../../logo.png";
import "./Header.css";

import { MdHome, MdFavorite, MdAdd, MdChat, MdPerson } from "react-icons/md";
import { useMessages } from "../../context/MessageContext";

function HeaderContent({ showNav }) {
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
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const shouldPin = isAuthPage || pinned;

  const { unreadCount } = useMessages();
  const navLinks = [
    { to: "/", icon: MdHome, label: "Inicio" },
    { to: "/favs", icon: MdFavorite, label: "Favoritos" },
    { to: "/publish", icon: MdAdd, label: "Publicar", fab: true },
    { to: "/inbox", icon: MdChat, label: "Mensajes", badge: unreadCount },
    { to: "/profile", icon: MdPerson, label: "Perfil" },
  ];

  return (
    <header
      className={`header${isAuthPage ? " header--auth" : ""}${
        isHome ? " header--home" : ""
      }${shouldPin ? " header--pinned" : ""}`}
    >
      <div className="header-inner">
        {showBrand && (
          <NavLink to="/" className="header-brand" aria-label="Ir al inicio">
            <img
              src={logo}
              alt="peloAPPelo"
              className="header-brand-img"
              loading="lazy"
              style={{ width: 40, height: 40, objectFit: "contain" }}
            />
            <span className="header-brand-text">peloAPPelo</span>
          </NavLink>
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

        {isHome && <NotificationBell />}

        {showNav && (
          <nav className="header-nav-desktop">
            <ul className="nav-list-desktop">
              {navLinks.map((link, idx) => (
                <li
                  key={link.to}
                  className={link.fab ? "nav-fab-desktop" : "nav-item-desktop"}
                >
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `nav-link-desktop${isActive ? " nav-link-active-desktop" : ""}`
                    }
                  >
                    <span className="nav-icon-desktop">
                      <link.icon size={22} />
                      {link.badge ? (
                        <span
                          className="nav-badge-desktop"
                          aria-label={`${link.badge} mensajes nuevos`}
                        >
                          {link.badge}
                        </span>
                      ) : null}
                    </span>
                    <span className="nav-label-desktop">{link.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}

export default function Header({ showNav }) {
  return (
    <ErrorBoundary>
      <HeaderContent showNav={showNav} />
    </ErrorBoundary>
  );
}
