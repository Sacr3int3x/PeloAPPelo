import React from "react";
import { useMessages } from "../../context/MessageContext";
import { useAuth } from "../../context/AuthContext";
import "./BlockedUsers.css";

function BlockedUsers() {
  const { blocked, unblockParticipant } = useMessages();
  const { user } = useAuth();

  if (!user) return null;

  const myBlockedUsers = blocked[user.email] || [];

  const handleUnblock = async (blockedEmail) => {
    try {
      await unblockParticipant(user.email, blockedEmail);
    } catch (error) {
      console.error("Error al desbloquear usuario:", error);
      alert("No se pudo desbloquear al usuario. Intenta de nuevo más tarde.");
    }
  };

  if (myBlockedUsers.length === 0) {
    return (
      <div className="blocked-users-empty">No tienes usuarios bloqueados</div>
    );
  }

  return (
    <div className="blocked-users-list">
      {myBlockedUsers.map((blockedEmail) => (
        <div key={blockedEmail} className="blocked-user-item">
          <div className="blocked-user-info">
            <span className="blocked-user-email">{blockedEmail}</span>
          </div>
          <button
            onClick={() => handleUnblock(blockedEmail)}
            className="unblock-button"
          >
            Desbloquear
          </button>
        </div>
      ))}
    </div>
  );
}

export default BlockedUsers;
