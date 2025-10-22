import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { MdHome, MdFavorite, MdAdd, MdChat, MdPerson } from "react-icons/md";
import { useMessages } from "../../context/MessageContext";
import styles from "./BottomNav.module.css";

export default function BottomNav() {
  const loc = useLocation();
  const is = (p) => loc.pathname === p || loc.pathname.startsWith(`${p}/`);

  const { unreadCount } = useMessages();

  const Tab = ({ to, Icon, label, badge }) => (
    <NavLink to={to} className={`${styles.tab} ${is(to) ? "active" : ""}`}>
      <span className={styles.tabIconWrap}>
        <Icon size={22} aria-hidden />
        {badge}
      </span>
      <span>{label}</span>
    </NavLink>
  );

  return (
    <nav className={styles.bottomnav}>
      <div className={`${styles.bottomnavInner} container`}>
        <Tab to="/" Icon={MdHome} label="Inicio" />
        <Tab to="/favs" Icon={MdFavorite} label="Favoritos" />
        <NavLink to="/publish" className={styles.fabWrap}>
          <div className={styles.fab}>
            <MdAdd size={26} aria-hidden />
          </div>
        </NavLink>
        <Tab
          to="/inbox"
          Icon={MdChat}
          label="Mensajes"
          badge={
            unreadCount > 0 ? (
              <span
                className={styles.badge}
                aria-label={`${unreadCount} mensajes nuevos`}
              >
                {unreadCount}
              </span>
            ) : null
          }
        />
        <Tab to="/profile" Icon={MdPerson} label="Perfil" />
      </div>
    </nav>
  );
}
