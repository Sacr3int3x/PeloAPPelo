import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiRequest, buildImageUrl } from "../services/api";
import {
  completeConversation as apiCompleteConversation,
  submitReputation as apiSubmitReputation,
} from "../services/transactions";
import { useAuth } from "./AuthContext";
import { realtime } from "../services/realtime";

const MessageCtx = createContext(null);

export const useMessages = () => useContext(MessageCtx);

const normalizeAttachments = (attachments) =>
  (attachments || []).map((att) => ({
    ...att,
    src: buildImageUrl(att.src),
  }));

const normalizeConversation = (conversation) => {
  // Normalizar los datos de los participantes
  const participantsData = (conversation.participants_data || []).map(
    (participant) => ({
      ...participant,
      avatar: participant.avatar ? buildImageUrl(participant.avatar) : null,
    }),
  );

  return {
    ...conversation,
    participants_data: participantsData,
    messages: (conversation.messages || []).map((message) => ({
      ...message,
      attachments: normalizeAttachments(message.attachments),
    })),
    transaction: conversation.transaction || null,
    swapInfo: conversation.swapInfo || null,
  };
};

const sortConversations = (list) =>
  [...list].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt || 0) -
      new Date(a.updatedAt || a.createdAt || 0),
  );

export function MessageProvider({ children }) {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [blocked, setBlocked] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!token || !user) {
      console.log("fetchConversations: No hay token o usuario");
      setConversations([]);
      setBlocked({});
      return;
    }

    console.log("fetchConversations: Iniciando carga con usuario", user.email);
    setLoading(true);

    try {
      const response = await apiRequest("/me/conversations", { token });

      if (!response || !Array.isArray(response.conversations)) {
        console.error(
          "fetchConversations: Respuesta inválida del servidor",
          response,
        );
        throw new Error("Respuesta inválida del servidor");
      }

      console.log("fetchConversations: Respuesta del servidor", {
        conversationsCount: response.conversations.length,
        muestra: response.conversations.slice(0, 2).map((conv) => ({
          id: conv.id,
          participantes: conv.participants,
          mensajes: conv.messages?.length || 0,
        })),
      });

      // Normalizar las conversaciones
      const normalized = response.conversations.map((conv) => {
        const normalizedConv = normalizeConversation(conv);

        // Asegurar que lastReadAt existe
        if (!normalizedConv.lastReadAt) {
          normalizedConv.lastReadAt = {};
        }

        // Si no hay registro de última lectura, usar la fecha del último mensaje leído
        if (!normalizedConv.lastReadAt[user.id]) {
          const lastReadMessage = [...(normalizedConv.messages || [])]
            .reverse()
            .find((msg) => msg.readBy?.includes(user.id));

          normalizedConv.lastReadAt[user.id] = lastReadMessage
            ? new Date(lastReadMessage.createdAt).getTime()
            : 0;
        }

        console.log("Procesando conversación:", {
          id: normalizedConv.id,
          participantes: normalizedConv.participants,
          mensajes: normalizedConv.messages?.length || 0,
          ultimaLectura: new Date(
            normalizedConv.lastReadAt[user.id],
          ).toISOString(),
        });

        return normalizedConv;
      });

      // Ordenar y guardar
      const sorted = sortConversations(normalized);
      console.log("Guardando conversaciones:", {
        total: sorted.length,
        primeras: sorted.slice(0, 2).map((c) => ({
          id: c.id,
          mensajes: c.messages?.length,
        })),
      });

      setConversations(sorted);
      setBlocked(response.blocked || {});
    } catch (error) {
      console.error("Error cargando conversaciones:", {
        message: error.message,
        status: error.status,
        details: error.details,
      });
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    console.log("Iniciando carga de conversaciones...");
    if (!token) {
      console.log("No hay token, omitiendo carga");
      return;
    }
    fetchConversations()
      .then(() => {
        console.log("Conversaciones cargadas");
      })
      .catch((error) => {
        console.error("Error cargando conversaciones:", error);
      });
  }, [fetchConversations, token]);

  useEffect(() => {
    if (!token || !user) return () => {};

    // Solicitar permiso para notificaciones
    import("../utils/notifications").then(
      ({ requestNotificationPermission }) => {
        requestNotificationPermission();
      },
    );

    // Mantener un registro de las últimas actualizaciones por conversación
    const lastUpdates = new Map();

    const handleUpsert = (event) => {
      const conversation = normalizeConversation(event.detail?.conversation);
      if (!conversation) {
        console.warn(
          "Realtime: Evento conversation.upsert sin datos de conversación",
        );
        return;
      }

      // Evitar actualizaciones duplicadas
      const lastUpdate = lastUpdates.get(conversation.id);
      if (lastUpdate && lastUpdate.updatedAt === conversation.updatedAt) {
        console.debug(
          "Realtime: Ignorando actualización duplicada",
          conversation.id,
        );
        return;
      }

      console.log("Realtime: Actualizando conversación", {
        id: conversation.id,
        participantes: conversation.participants,
        mensajes: conversation.messages?.length,
        actualizado: conversation.updatedAt,
      });

      setConversations((prev) => {
        const existing = prev.find((conv) => conv.id === conversation.id);

        // Verificar si hay mensajes o transacciones nuevas para notificar
        if (existing) {
          // Verificar cambios en la transacción
          if (!existing.transaction && conversation.transaction) {
            import("../utils/notifications").then(({ showNotification }) => {
              showNotification("Transacción completada", {
                body: "La operación ha sido marcada como completada",
                data: { conversationId: conversation.id },
                onClick: () => {
                  window.location.href = `#/inbox?conversation=${conversation.id}`;
                },
              });
            });
          }

          // Verificar nuevos mensajes
          if (conversation.messages?.length > existing.messages?.length) {
            const newMessages = conversation.messages.slice(
              existing.messages.length,
            );
            const lastMessage = newMessages[newMessages.length - 1];

            // Solo notificar si el mensaje no es mío
            if (lastMessage && lastMessage.sender !== user.email) {
              import("../utils/notifications").then(({ showNotification }) => {
                const notificationBody =
                  lastMessage.body ||
                  (lastMessage.attachments?.length
                    ? "Nueva imagen"
                    : "Nuevo mensaje");

                showNotification("Nuevo mensaje", {
                  body: notificationBody,
                  data: { conversationId: conversation.id },
                  onClick: () => {
                    window.location.href = `#/inbox?conversation=${conversation.id}`;
                  },
                });
              });
            }
          }
        }

        // Actualizar el registro de la última actualización
        lastUpdates.set(conversation.id, {
          updatedAt: conversation.updatedAt,
          messageCount: conversation.messages?.length,
        });

        // Actualizar la lista de conversaciones
        const updated = sortConversations([
          conversation,
          ...prev.filter((conv) => conv.id !== conversation.id),
        ]);

        return updated;
      });
    };

    const handleNewMessage = (event) => {
      const { conversationId, lastMessage } = event.detail || {};
      if (!conversationId || !lastMessage) {
        console.debug(
          "Realtime: Mensaje recibido sin ID de conversación o contenido",
        );
        return;
      }

      setConversations((prev) => {
        const conversation = prev.find((conv) => conv.id === conversationId);
        if (!conversation) {
          console.debug(
            "Realtime: Conversación no encontrada, refrescando...",
            conversationId,
          );
          // Si no encontramos la conversación, forzar una recarga
          fetchConversations();
          return prev;
        }

        // Verificar si el mensaje ya existe
        const messageExists = conversation.messages.some(
          (msg) => msg.id === lastMessage.id,
        );
        if (messageExists) {
          console.debug(
            "Realtime: Mensaje duplicado, ignorando",
            lastMessage.id,
          );
          return prev;
        }

        console.debug(
          "Realtime: Agregando nuevo mensaje a conversación",
          conversationId,
        );
        const updatedConv = {
          ...conversation,
          messages: [
            ...conversation.messages,
            {
              ...lastMessage,
              attachments: normalizeAttachments(lastMessage.attachments),
            },
          ],
          updatedAt: new Date().toISOString(),
        };

        return sortConversations([
          updatedConv,
          ...prev.filter((conv) => conv.id !== conversationId),
        ]);
      });
    };

    const handleRemoved = (event) => {
      const conversationId = event.detail?.conversationId;
      if (!conversationId) return;
      setConversations((prev) =>
        prev.filter((conv) => conv.id !== conversationId),
      );
    };

    const handleTransaction = (event) => {
      const { conversationId, transaction } = event.detail || {};
      if (!conversationId) return;
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? normalizeConversation({ ...conv, transaction })
            : conv,
        ),
      );
    };

    const offUpsert = realtime.on("conversation.upsert", handleUpsert);
    const offNewMessage = realtime.on("message.new", handleNewMessage);
    const offRemoved = realtime.on("conversation.removed", handleRemoved);
    const offTransaction = realtime.on(
      "conversation.transaction",
      handleTransaction,
    );

    return () => {
      offUpsert();
      offNewMessage();
      offRemoved();
      offTransaction();
    };
  }, [token, user, fetchConversations]);

  const startConversation = useCallback(
    async ({ to, listingId, initialMessage, initialAttachments }) => {
      if (!token || !user) return null;

      // Verificar si hay un bloqueo mutuo antes de intentar crear la conversación
      const isBlocked =
        blocked[user.email]?.includes(to) || blocked[to]?.includes(user.email);
      if (isBlocked) {
        throw new Error(
          "No es posible iniciar la conversación porque existe un bloqueo entre los usuarios.",
        );
      }

      try {
        console.log("Verificando e iniciando nueva conversación:", {
          from: user.email,
          to,
          listingId,
          tieneBloqueo: isBlocked,
        });

        // Verificar si ya existe una conversación para este listingId
        const existingConv = conversations.find(
          (conv) =>
            conv.listingId === listingId &&
            conv.participants.includes(user.email) &&
            conv.participants.includes(to),
        );

        if (existingConv) {
          console.log(
            "Ya existe una conversación para este artículo:",
            existingConv.id,
          );
          return existingConv.id;
        }

        const response = await apiRequest("/conversations", {
          method: "POST",
          token,
          data: {
            to,
            listingId,
            initialMessage,
            initialAttachments,
          },
        });

        if (!response || !response.conversation) {
          throw new Error("Respuesta inválida del servidor");
        }

        const conversation = normalizeConversation(response.conversation);
        console.log("Conversación creada exitosamente:", {
          id: conversation.id,
          participantes: conversation.participants,
          mensajes: conversation.messages?.length || 0,
        });

        // Actualizar inmediatamente el estado local
        const conversationId = conversation.id;
        setConversations((prev) => {
          const updated = sortConversations([
            conversation,
            ...prev.filter((conv) => conv.id !== conversationId),
          ]);
          return updated;
        });

        // Forzar actualización de conversaciones
        await fetchConversations();

        return conversationId;
      } catch (error) {
        console.error("Error al iniciar la conversación:", error);
        if (error.status === 403) {
          throw new Error(
            "No es posible iniciar la conversación porque uno de los usuarios ha bloqueado al otro.",
          );
        }
        throw new Error(
          error?.message ||
            "No se pudo iniciar la conversación. Intenta de nuevo más tarde.",
        );
      }
    },
    [token, user, fetchConversations, conversations, blocked],
  );

  const markConversationAsRead = useCallback(
    async (conversationId) => {
      if (!token || !user) return;

      const currentTime = new Date().getTime();

      // Actualizar inmediatamente el estado local
      setConversations((prev) => {
        const targetConv = prev.find((conv) => conv.id === conversationId);
        if (!targetConv) return prev;

        // Actualizar el tiempo de última lectura y el estado de los mensajes
        const updatedConv = {
          ...targetConv,
          lastReadAt: {
            ...(targetConv.lastReadAt || {}),
            [user.id]: currentTime,
          },
          lastMessage: targetConv.lastMessage
            ? {
                ...targetConv.lastMessage,
                readBy: Array.from(
                  new Set([...(targetConv.lastMessage.readBy || []), user.id]),
                ),
              }
            : null,
          messages: targetConv.messages.map((msg) => ({
            ...msg,
            readBy: Array.from(new Set([...(msg.readBy || []), user.id])),
          })),
        };

        console.log("Actualizando estado de lectura:", {
          conversationId,
          userId: user.id,
          timestamp: new Date(currentTime).toISOString(),
          messageCount: updatedConv.messages.length,
        });

        return sortConversations([
          updatedConv,
          ...prev.filter((conv) => conv.id !== conversationId),
        ]);
      });

      // Enviar la actualización al servidor
      try {
        const response = await apiRequest(
          `/conversations/${conversationId}/read`,
          {
            method: "POST",
            token,
          },
        );

        if (response.conversation) {
          const conversation = normalizeConversation(response.conversation);

          // Verificar que la respuesta del servidor incluye la actualización de readBy
          setConversations((prev) => {
            const updatedConversations = sortConversations([
              conversation,
              ...prev.filter((conv) => conv.id !== conversation.id),
            ]);

            console.log("Actualización del servidor completada:", {
              conversationId,
              hasUnread: updatedConversations.some((conv) =>
                conv.messages?.some(
                  (msg) =>
                    msg.sender !== user.email &&
                    (!msg.readBy || !msg.readBy.includes(user.id)),
                ),
              ),
            });

            return updatedConversations;
          });
        }
      } catch (error) {
        console.error("No se pudo marcar como leído", error);
        // Revertir el cambio local si hay error
        await fetchConversations();
      }
    },
    [token, user, fetchConversations],
  );

  const sendMessage = useCallback(
    async (conversationId, sender, body, attachments = []) => {
      if (!token || !user) {
        return { success: false, error: "Debes iniciar sesión." };
      }
      try {
        console.log("Enviando mensaje:", {
          conversationId,
          sender,
          hasAttachments: attachments?.length > 0,
        });

        const response = await apiRequest(
          `/conversations/${conversationId}/messages`,
          {
            method: "POST",
            token,
            data: {
              message: body,
              attachments,
            },
          },
        );

        console.log("Respuesta del servidor:", {
          conversationId,
          messageCount: response.conversation?.messages?.length,
          lastMessage: response.conversation?.messages?.slice(-1)[0],
        });

        const conversation = normalizeConversation(response.conversation);
        setConversations((prev) => {
          // Verificar si la conversación ya existe y tiene mensajes
          const existing = prev.find((conv) => conv.id === conversation.id);
          if (existing) {
            console.log("Estado actual de la conversación:", {
              id: existing.id,
              messageCount: existing.messages?.length,
              lastMessage: existing.messages?.slice(-1)[0],
            });
          }

          return sortConversations([
            conversation,
            ...prev.filter((conv) => conv.id !== conversation.id),
          ]);
        });

        // Forzar una recarga de las conversaciones después de enviar el mensaje
        await fetchConversations();

        return { success: true };
      } catch (error) {
        console.error("Error al enviar mensaje:", error);
        return {
          success: false,
          error: error?.message || "No se pudo enviar el mensaje.",
        };
      }
    },
    [token, user, fetchConversations],
  );

  const deleteConversation = useCallback(
    async (conversationId) => {
      if (!token || !user) return;
      try {
        await apiRequest(`/conversations/${conversationId}`, {
          method: "DELETE",
          token,
        });
        setConversations((prev) =>
          prev.filter((conv) => conv.id !== conversationId),
        );
      } catch (error) {
        console.error("No se pudo eliminar la conversación", error);
      }
    },
    [token, user],
  );

  const completeConversation = useCallback(
    async (conversationId) => {
      if (!token || !user) {
        return { success: false, error: "Debes iniciar sesión." };
      }
      try {
        const response = await apiCompleteConversation(conversationId, token);
        const conversation = normalizeConversation(response.conversation);
        setConversations((prev) =>
          sortConversations([
            conversation,
            ...prev.filter((conv) => conv.id !== conversation.id),
          ]),
        );
        return { success: true, conversation };
      } catch (error) {
        return {
          success: false,
          error: error?.message || "No se pudo completar la operación.",
        };
      }
    },
    [token, user],
  );

  const submitReputation = useCallback(
    async ({ transactionId, rating, comment, conversationId }) => {
      if (!token || !user) {
        return { success: false, error: "Debes iniciar sesión." };
      }
      try {
        await apiSubmitReputation({ transactionId, rating, comment }, token);
        if (conversationId) {
          await fetchConversations();
        }
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error?.message || "No se pudo registrar la reputación.",
        };
      }
    },
    [token, user, fetchConversations],
  );

  const blockParticipant = useCallback(
    async (owner, target) => {
      if (!token || !user) return;
      try {
        await apiRequest("/block", {
          method: "POST",
          token,
          data: { target },
        });
        setBlocked((prev) => {
          const list = new Set(prev[owner] || []);
          list.add(target);
          return { ...prev, [owner]: Array.from(list) };
        });
      } catch (error) {
        console.error("No se pudo bloquear al usuario", error);
      }
    },
    [token, user],
  );

  const unblockParticipant = useCallback(
    async (owner, target) => {
      if (!token || !user) return;
      try {
        await apiRequest("/unblock", {
          method: "POST",
          token,
          data: { target },
        });
        setBlocked((prev) => {
          const list = new Set(prev[owner] || []);
          list.delete(target);
          return { ...prev, [owner]: Array.from(list) };
        });
      } catch (error) {
        console.error("No se pudo desbloquear al usuario", error);
      }
    },
    [token, user],
  );

  // Memoizar el conteo de mensajes no leídos
  const unreadCount = useMemo(() => {
    if (!user || !conversations) return 0;

    const count = conversations.reduce((total, conv) => {
      // Solo contar mensajes más recientes que la última vez que se marcó como leído
      const lastReadTime = conv.lastReadAt?.[user.id] || 0;

      // Buscar mensajes no leídos que sean más recientes que la última lectura
      const hasUnread = conv.messages?.some((msg) => {
        const isFromOther = msg.sender !== user.email;
        const messageTime = new Date(msg.createdAt).getTime();
        const isUnread = messageTime > lastReadTime;

        return isFromOther && isUnread;
      });

      console.log("Estado de lectura de conversación:", {
        conversationId: conv.id,
        lastReadTime: new Date(lastReadTime).toISOString(),
        hasUnread,
        messagesCount: conv.messages?.length || 0,
      });

      return hasUnread ? total + 1 : total;
    }, 0);

    console.log("Total de conversaciones no leídas:", count);
    return count;
  }, [conversations, user]);

  const value = useMemo(
    () => ({
      conversations,
      blocked,
      loading,
      startConversation,
      sendMessage,
      deleteConversation,
      blockParticipant,
      unblockParticipant,
      unreadCount,
      isBlocked: (ownerEmail, targetEmail) =>
        Boolean(blocked?.[ownerEmail]?.includes(targetEmail)),
      refresh: fetchConversations,
      completeConversation,
      submitReputation,
      setConversations,
      markConversationAsRead,
    }),
    [
      conversations,
      blocked,
      loading,
      startConversation,
      sendMessage,
      deleteConversation,
      blockParticipant,
      unblockParticipant,
      unreadCount,
      fetchConversations,
      completeConversation,
      submitReputation,
      setConversations,
      markConversationAsRead,
    ],
  );

  return <MessageCtx.Provider value={value}>{children}</MessageCtx.Provider>;
}
