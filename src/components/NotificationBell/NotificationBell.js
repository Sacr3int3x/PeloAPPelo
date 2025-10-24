import React, { useState, useEffect, useRef } from "react";
import { FiBell, FiX, FiStar, FiMessageCircle, FiPackage, FiCheck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../../services/notifications";
import "./NotificationBell.css";

const NotificationBell = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (token) {
      fetchUnreadCount();
      // Actualizar contador cada 30 segundos
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const { count } = await getUnreadCount(token);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error al obtener contador de notificaciones:", error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { notifications: notifs } = await getNotifications(token);
      setNotifications(notifs);
    } catch (error) {
      console.error("Error al obtener notificaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await markAsRead(notification.id, token);
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      }

      setIsOpen(false);
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead(token);
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
    }
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId, token);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      fetchUnreadCount();
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "rating_request":
        return <FiStar className="notif-icon rating" />;
      case "rating_received":
        return <FiStar className="notif-icon success" />;
      case "message":
        return <FiMessageCircle className="notif-icon message" />;
      case "swap_request":
        return <FiPackage className="notif-icon swap" />;
      default:
        return <FiBell className="notif-icon default" />;
    }
  };

  if (!token) return null;

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button className="notification-bell-button" onClick={handleBellClick}>
        <FiBell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notificaciones</h3>
            {notifications.length > 0 && unreadCount > 0 && (
              <button className="mark-all-read-btn" onClick={handleMarkAllRead}>
                <FiCheck /> Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">
                <div className="spinner"></div>
                <p>Cargando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <FiBell />
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? "unread" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {getIcon(notification.type)}
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-time">{notification.timeAgo}</span>
                  </div>
                  <button
                    className="notification-delete-btn"
                    onClick={(e) => handleDeleteNotification(e, notification.id)}
                  >
                    <FiX />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
