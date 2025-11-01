import React from "react";
import { Link } from "react-router-dom";
import { HiOutlineArrowLeft } from "react-icons/hi";
import PendingRatings from "../components/PendingRatings/PendingRatings";
import "../styles/CategoryPage.css";

function PendingRatingsPage() {
  return (
    <main className="container page">
      <div className="category-header-bar">
        <Link to="/profile" className="page-nav-btn" title="Volver al perfil">
          <HiOutlineArrowLeft size={24} />
        </Link>
        <h1 className="category-header-title">Calificaciones Pendientes</h1>
        <span style={{ width: 46 }}></span>
      </div>

      <PendingRatings />
    </main>
  );
}

export default PendingRatingsPage;
