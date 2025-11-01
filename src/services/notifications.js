// Servicio de notificaciones
import { apiRequest } from "./api";
import { getPendingRatings, fetchSwapProposals } from "./transactions";

// Tipos de notificaciones
export const NOTIFICATION_TYPES = {
  MESSAGE: "message",
  SWAP_REQUEST: "swap_request",
  SWAP_ACCEPTED: "swap_accepted",
  SWAP_REJECTED: "swap_rejected",
  RATING_REQUEST: "rating_request",
  RATING_RECEIVED: "rating_received",
};

// Obtener todas las notificaciones
export const getNotifications = async (token) => {
  try {
    const response = await apiRequest("/notifications", { token });
    return response;
  } catch (error) {
    console.error("Error obteniendo notificaciones:", error);
    return { notifications: [] };
  }
};

// Obtener contador de notificaciones no leídas
export const getUnreadCount = async (token) => {
  try {
    const response = await apiRequest("/notifications/unread-count", { token });
    return response;
  } catch (error) {
    console.error("Error obteniendo contador de notificaciones:", error);
    return { count: 0 };
  }
};

// Marcar notificación como leída
export const markAsRead = async (notificationId, token) => {
  try {
    const response = await apiRequest(`/notifications/${notificationId}/read`, {
      method: "POST",
      token,
    });
    return response;
  } catch (error) {
    console.error("Error marcando notificación como leída:", error);
    return { success: false };
  }
};

// Marcar todas las notificaciones como leídas
export const markAllAsRead = async (token) => {
  try {
    const response = await apiRequest("/notifications/mark-all-read", {
      method: "POST",
      token,
    });
    return response;
  } catch (error) {
    console.error("Error marcando todas como leídas:", error);
    return { success: false };
  }
};

// Eliminar notificación
export const deleteNotification = async (notificationId, token) => {
  try {
    const response = await apiRequest(`/notifications/${notificationId}`, {
      method: "DELETE",
      token,
    });
    return response;
  } catch (error) {
    console.error("Error eliminando notificación:", error);
    return { success: false };
  }
};

// Funciones de utilidad para obtener contadores específicos
export const getMessagesUnreadCount = (conversations, userId) => {
  if (!conversations || !userId) return 0;

  return conversations.reduce((count, conv) => {
    const unreadMessages = conv.messages.filter(
      (msg) => !msg.read && msg.sender !== userId,
    );
    return count + unreadMessages.length;
  }, 0);
};

export const getPendingRatingsCount = async (token) => {
  try {
    const ratings = await getPendingRatings(token);
    return ratings.length;
  } catch (error) {
    console.error("Error obteniendo calificaciones pendientes:", error);
    return 0;
  }
};

export const getPendingSwapsCount = async (token, userId) => {
  try {
    const response = await fetchSwapProposals(token);
    const pendingSwaps = response.proposals.filter(
      (swap) => swap.status === "pending" && swap.receiver.id === userId,
    );
    return pendingSwaps.length;
  } catch (error) {
    console.error("Error obteniendo intercambios pendientes:", error);
    return 0;
  }
};

// Obtener todos los contadores de notificaciones
export const getAllNotificationCounts = async (
  token,
  conversations,
  userId,
) => {
  try {
    // Usar el endpoint unificado del backend para obtener todos los contadores
    const response = await apiRequest("/notifications/unread-count", { token });

    return {
      messages: response.messages || 0,
      ratings: response.ratings || 0,
      swaps: response.swaps || 0,
      total: response.count || 0,
    };
  } catch (error) {
    console.error("Error obteniendo contadores de notificaciones:", error);
    return { messages: 0, ratings: 0, swaps: 0, total: 0 };
  }
};
