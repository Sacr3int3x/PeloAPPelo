import React, { useEffect } from "react";
import { FiBell, FiX, FiCheck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import PageHeader from "../components/PageHeader/PageHeader";
import styles from "./NotificationsPage.module.css";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const {
    notificationCounts,
    notifications,
    loading,
    loadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
  } = useNotifications();

  useEffect(() => {
    if (token) {
      loadNotifications();
    }
  }, [token, loadNotifications]);

  const handleNotificationClick = async (notification) => {
    // Marcar como leída si no lo está
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }

    // Navegar a la URL si existe
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
  };

  const handleDeleteNotification = async (notificationId) => {
    await removeNotification(notificationId);
  };

  const formatTimeAgo = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now - created) / (1000 * 60));

    if (diffInMinutes < 1) return "Ahora";
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)}d`;
  };

  if (!token) {
    navigate("/login");
    return null;
  }

  return (
    <main className="container page">
      <PageHeader
        title="Notificaciones"
        subtitle={`${notificationCounts.total || 0} notificaciones`}
        actions={
          notifications.length > 0 && notificationCounts.total > 0 ? (
            <button className="btn outline sm" onClick={handleMarkAllRead}>
              <FiCheck /> Marcar todas como leídas
            </button>
          ) : null
        }
      />

      <div className={styles.notificationsContainer}>
        {loading ? (
          <div className={styles.loading}>
            <div className="spinner"></div>
            <p>Cargando notificaciones...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.empty}>
            <FiBell size={48} />
            <h3>No tienes notificaciones</h3>
            <p>Las notificaciones importantes aparecerán aquí</p>
          </div>
        ) : (
          <div className={styles.notificationsList}>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`${styles.notificationItem} ${!notification.read ? styles.unread : ""}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={styles.notificationContent}>
                  <h4 className={styles.notificationTitle}>
                    {notification.title}
                  </h4>
                  <p className={styles.notificationMessage}>
                    {notification.message}
                  </p>
                  <span className={styles.notificationTime}>
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                </div>
                <button
                  className={styles.notificationDeleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNotification(notification.id);
                  }}
                  aria-label="Eliminar notificación"
                >
                  <FiX />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default NotificationsPage;
