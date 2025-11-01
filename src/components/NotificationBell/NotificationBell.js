import React from "react";
import { FiBell } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import "./NotificationBell.css";

const NotificationBell = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { notificationCounts } = useNotifications();

  const handleBellClick = () => {
    navigate("/notifications");
  };

  if (!token) return null;

  return (
    <button className="notification-bell-button" onClick={handleBellClick}>
      <FiBell />
      {notificationCounts.total > 0 && (
        <span className="notification-badge">
          {notificationCounts.total > 9 ? "9+" : notificationCounts.total}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
