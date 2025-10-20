import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { MdHome, MdFavorite, MdAdd, MdChat, MdPerson } from "react-icons/md";
import "./BottomNav.css";

export default function BottomNav() {
  const loc = useLocation();
  const is = (p) =>
    loc.pathname === p || loc.pathname.startsWith(`${p}/`);

  const Tab = ({ to, Icon, label }) => (
    <NavLink to={to} className={"tab" + (is(to) ? " active" : "")}>
      <Icon size={22} aria-hidden />
      <span className="tab-label">{label}</span>
    </NavLink>
  );

  return (
    <nav className="bottomnav">
      <div className="bottomnav-inner container">
        <Tab to="/" Icon={MdHome} label="Inicio" />
        <Tab to="/favs" Icon={MdFavorite} label="Favoritos" />
        <NavLink to="/publish" className="fab-wrap">
          <div className="fab">
            <MdAdd size={26} aria-hidden />
          </div>
        </NavLink>
        <Tab to="/inbox" Icon={MdChat} label="Mensajes" />
        <Tab to="/profile" Icon={MdPerson} label="Perfil" />
      </div>
    </nav>
  );
}
