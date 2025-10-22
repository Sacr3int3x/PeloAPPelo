// Servicio de notificaciones
export const markMessageAsRead = async (messageId, token) => {
  try {
    const response = await fetch(`/api/messages/${messageId}/read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  } catch (error) {
    console.error("Error marking message as read:", error);
    return { success: false, error: error.message };
  }
};

export const getUnreadCount = (conversations, userId) => {
  if (!conversations || !userId) return 0;

  return conversations.reduce((count, conv) => {
    const unreadMessages = conv.messages.filter(
      (msg) => !msg.read && msg.sender !== userId,
    );
    return count + unreadMessages.length;
  }, 0);
};

export const shouldShowNotification = (message, userId) => {
  return !message.read && message.sender !== userId;
};
