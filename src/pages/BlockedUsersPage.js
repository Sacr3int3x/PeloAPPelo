import React from "react";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useMessages } from "../context/MessageContext";
import { useAuth } from "../context/AuthContext";
import "../styles/CategoryPage.css";

function BlockedUsersPage() {
  const navigate = useNavigate();
  const { blocked, unblockParticipant } = useMessages();
  const { user } = useAuth();

  if (!user) {
    return <main className="container page">No autorizado.</main>;
  }

  const myBlockedUsers = blocked[user.email] || [];

  const handleUnblock = async (blockedEmail) => {
    try {
      await unblockParticipant(user.email, blockedEmail);
    } catch (error) {
      console.error("Error al desbloquear usuario:", error);
      alert("No se pudo desbloquear al usuario. Intenta de nuevo más tarde.");
    }
  };

  return (
    <main className="container page">
      <div className="category-header-bar">
        <button
          className="page-nav-btn"
          onClick={() => navigate(-1)}
          title="Volver"
        >
          <HiOutlineArrowLeft size={24} />
        </button>
        <h1 className="category-header-title">Usuarios bloqueados</h1>
        <span style={{ width: 46 }}></span>
      </div>

      <section className="panel">
        {myBlockedUsers.length === 0 ? (
          <div className="empty-state">
            <p>No tienes usuarios bloqueados</p>
            <small>
              Los usuarios que bloquees aparecerán aquí y no podrán ver tus
              publicaciones ni enviarte mensajes.
            </small>
          </div>
        ) : (
          <div className="blocked-list">
            {myBlockedUsers.map((blockedEmail) => (
              <div key={blockedEmail} className="profile-link">
                <div className="profile-link-text">
                  <span>{blockedEmail}</span>
                  <small>
                    Este usuario no puede ver tus publicaciones ni enviarte
                    mensajes
                  </small>
                </div>
                <button
                  onClick={() => handleUnblock(blockedEmail)}
                  className="unblock-btn"
                >
                  Desbloquear
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default BlockedUsersPage;
