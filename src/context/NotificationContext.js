import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../services/notifications";

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};

export function NotificationProvider({ children }) {
  const { token, user } = useAuth();

  const [notificationCounts, setNotificationCounts] = useState({
    total: 0,
  });

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Actualizar contadores de notificaciones
  const updateNotificationCounts = useCallback(async () => {
    if (!token || !user) {
      setNotificationCounts({ total: 0 });
      return;
    }

    try {
      const response = await getUnreadCount(token);
      console.log("Notification counts updated:", response);
      setNotificationCounts({ total: response.count || 0 });
    } catch (error) {
      console.error("Error updating notification counts:", error);
    }
  }, [token, user]);

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await getNotifications(token);
      console.log("Loaded notifications:", response.notifications);
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Marcar notificación como leída
  const markNotificationAsRead = useCallback(
    async (notificationId) => {
      try {
        await markAsRead(notificationId, token);
        // Actualizar el estado local
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification,
          ),
        );
        // Actualizar contador
        await updateNotificationCounts();
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [token, updateNotificationCounts],
  );

  // Marcar todas las notificaciones como leídas
  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await markAllAsRead(token);
      // Actualizar el estado local
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true })),
      );
      // Actualizar contador
      setNotificationCounts({ total: 0 });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [token]);

  // Eliminar notificación
  const removeNotification = useCallback(
    async (notificationId) => {
      try {
        await deleteNotification(notificationId, token);
        // Actualizar el estado local
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId),
        );
        // Actualizar contador
        await updateNotificationCounts();
      } catch (error) {
        console.error("Error removing notification:", error);
      }
    },
    [token, updateNotificationCounts],
  );

  // Cargar notificaciones iniciales
  useEffect(() => {
    if (token) {
      loadNotifications();
      updateNotificationCounts();
    }
  }, [token, loadNotifications, updateNotificationCounts]);

  // Actualizar contadores periódicamente
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      updateNotificationCounts();
      loadNotifications();
    }, 120000); // cada 2 minutos

    return () => clearInterval(interval);
  }, [token, updateNotificationCounts, loadNotifications]);

  const value = {
    notificationCounts,
    notifications,
    loading,
    loadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    refreshCounts: updateNotificationCounts,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
