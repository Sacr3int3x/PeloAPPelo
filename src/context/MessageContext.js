import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { nowId, read, write } from "../utils/helpers";
import { LS } from "../utils/constants";

const MessageCtx = createContext(null);

export const useMessages = () => useContext(MessageCtx);

const reorderByUpdatedAt = (threads) =>
  [...threads].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

const makeId = () => `${nowId()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeState = (raw) => {
  if (!raw) {
    return { threads: [], blocked: {} };
  }
  if (Array.isArray(raw)) {
    return { threads: raw, blocked: {} };
  }
  return {
    threads: Array.isArray(raw.threads) ? raw.threads : [],
    blocked: raw.blocked || {},
  };
};

const normalizeAttachments = (input) => {
  if (!Array.isArray(input)) return [];
  return input
    .filter((att) => att && att.src)
    .map((att) => ({
      id: att.id || makeId(),
      src: att.src,
      name: att.name || "Archivo",
      mime: att.mime || "image/jpeg",
    }));
};

export function MessageProvider({ children }) {
  const [state, setState] = useState(() => normalizeState(read(LS.messages, null)));

  useEffect(() => {
    write(LS.messages, state);
  }, [state]);

  const getBlockedSet = useCallback(
    (owner) => new Set(state.blocked?.[owner] || []),
    [state.blocked],
  );

  const updateBlocked = useCallback((owner, updater) => {
    setState((prev) => {
      const blocked = { ...(prev.blocked || {}) };
      const current = new Set(blocked[owner] || []);
      const nextSet = updater(current);
      blocked[owner] = Array.from(nextSet);
      return { ...prev, blocked };
    });
  }, []);

  const startConversation = useCallback(
    ({ from, to, listingId, initialMessage, initialAttachments }) => {
      if (!from || !to || from === to) return null;
      const participants = [from, to];
      const normalizedListingId =
        listingId !== undefined && listingId !== null
          ? String(listingId)
          : null;
      const trimmedMessage = initialMessage?.trim();
      const attachments = normalizeAttachments(initialAttachments);
      const hasContent = Boolean(trimmedMessage) || attachments.length > 0;
      let createdId = null;
      setState((prev) => {
        const blockedFrom = new Set(prev.blocked?.[from] || []);
        const blockedTo = new Set(prev.blocked?.[to] || []);
        if (blockedFrom.has(to) || blockedTo.has(from)) {
          return prev;
        }
        const existing = prev.threads.find(
          (conv) =>
            conv.listingId === normalizedListingId &&
            participants.every((p) => conv.participants.includes(p)),
        );
        if (existing) {
          createdId = existing.id;
          if (!hasContent) return prev;
          const timestamp = new Date().toISOString();
          const message = {
            id: makeId(),
            sender: from,
            body: trimmedMessage,
            attachments,
            createdAt: timestamp,
          };
          return {
            ...prev,
            threads: reorderByUpdatedAt(
              prev.threads.map((conv) =>
                conv.id === existing.id
                  ? {
                      ...conv,
                      messages: [...conv.messages, message],
                      updatedAt: timestamp,
                    }
                  : conv,
              ),
            ),
          };
        }
        const timestamp = new Date().toISOString();
        const newConversation = {
          id: makeId(),
          participants,
          listingId: normalizedListingId,
          messages: hasContent
            ? [
                {
                  id: makeId(),
                  sender: from,
                  body: trimmedMessage,
                  attachments,
                  createdAt: timestamp,
                },
              ]
            : [],
          updatedAt: timestamp,
        };
        createdId = newConversation.id;
        return {
          ...prev,
          threads: reorderByUpdatedAt([newConversation, ...prev.threads]),
        };
      });
      return createdId;
    },
    [],
  );

  const sendMessage = useCallback((conversationId, sender, body, attachments = []) => {
    const trimmed = (body || "").trim();
    const normalizedAttachments = normalizeAttachments(attachments);
    if (!trimmed && normalizedAttachments.length === 0) {
      return {
        success: false,
        error: "Escribe un mensaje o adjunta una imagen.",
      };
    }
    let found = false;
    let error = null;
    setState((prev) => {
      const idx = prev.threads.findIndex((conv) => conv.id === conversationId);
      if (idx === -1) {
        error = "La conversación no existe.";
        return prev;
      }
      const conversation = prev.threads[idx];
      const other = conversation.participants.find((p) => p !== sender);
      const otherBlocked = new Set(prev.blocked?.[other] || []);
      if (otherBlocked.has(sender)) {
        error = "El usuario no recibe más mensajes.";
        return prev;
      }
      const senderBlocked = new Set(prev.blocked?.[sender] || []);
      if (senderBlocked.has(other)) {
        error = "Debes desbloquear al usuario para enviar mensajes.";
        return prev;
      }
      found = true;
      const timestamp = new Date().toISOString();
      const message = {
        id: makeId(),
        sender,
        body: trimmed,
        attachments: normalizedAttachments,
        createdAt: timestamp,
      };
      const nextThreads = [...prev.threads];
      nextThreads[idx] = {
        ...conversation,
        messages: [...conversation.messages, message],
        updatedAt: timestamp,
      };
      return {
        ...prev,
        threads: reorderByUpdatedAt(nextThreads),
      };
    });
    if (!found) {
      return { success: false, error: error || "No se pudo enviar el mensaje." };
    }
    if (error) return { success: false, error };
    return { success: true };
  }, []);

  const deleteConversation = useCallback((conversationId) => {
    setState((prev) => ({
      ...prev,
      threads: prev.threads.filter((conv) => conv.id !== conversationId),
    }));
  }, []);

  const blockParticipant = useCallback(
    (owner, target) => {
      if (!owner || !target) return;
      updateBlocked(owner, (set) => {
        set.add(target);
        return set;
      });
    },
    [updateBlocked],
  );

  const unblockParticipant = useCallback(
    (owner, target) => {
      if (!owner || !target) return;
      updateBlocked(owner, (set) => {
        set.delete(target);
        return set;
      });
    },
    [updateBlocked],
  );

  const value = useMemo(
    () => ({
      conversations: state.threads,
      blocked: state.blocked,
      startConversation,
      sendMessage,
      deleteConversation,
      blockParticipant,
      unblockParticipant,
      isBlocked: (owner, target) => getBlockedSet(owner).has(target),
    }),
    [
      state.threads,
      state.blocked,
      startConversation,
      sendMessage,
      deleteConversation,
      blockParticipant,
      unblockParticipant,
      getBlockedSet,
    ],
  );

  return <MessageCtx.Provider value={value}>{children}</MessageCtx.Provider>;
}
