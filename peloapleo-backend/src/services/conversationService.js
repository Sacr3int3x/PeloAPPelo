import { getDb, withDb } from "../store/dataStore.js";
import { MAX_MESSAGE_ATTACHMENTS, MESSAGE_UPLOADS_DIR } from "../config.js";
import { ensureDir, isDataUrl, saveDataUrl } from "../utils/file.js";
import { toPublicPath } from "../utils/path.js";
import { prefixedId } from "../utils/id.js";
import { emitEvent } from "../realtime/socketHub.js";
import { findByEmail } from "./userService.js";
import {
  formatTransactionForUser,
  completeTransactionForConversation,
} from "./transactionService.js";

async function storeAttachments(attachments, conversationId) {
  if (!Array.isArray(attachments) || !attachments.length) return [];
  await ensureDir(MESSAGE_UPLOADS_DIR);
  const stored = [];
  let index = 0;
  for (const attachment of attachments) {
    if (!attachment || index >= MAX_MESSAGE_ATTACHMENTS) break;
    if (attachment.src && isDataUrl(attachment.src)) {
      const savedPath = await saveDataUrl(
        attachment.src,
        MESSAGE_UPLOADS_DIR,
        `${conversationId}_${index}`,
      );
      stored.push({
        id: prefixedId("att"),
        src: toPublicPath(savedPath),
        name: attachment.name || "Archivo",
        mime: attachment.mime || "image/jpeg",
      });
    } else if (attachment.src) {
      stored.push({
        id: prefixedId("att"),
        src: attachment.src,
        name: attachment.name || "Archivo",
        mime: attachment.mime || "image/jpeg",
      });
    }
    index += 1;
  }
  return stored;
}

function toConversationResponse(conversation, db, currentUserId = null) {
  const listing = db.listings.find(
    (item) => item.id === conversation.listingId,
  );
  const participants = conversation.participants
    .map((userId) => db.users.find((user) => user.id === userId))
    .filter(Boolean);
  const participantEmails = participants.map((user) => user.email);

  // Incluir datos completos de participantes con avatar
  const participantsData = participants.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    avatar: user.avatar || null,
  }));

  const transaction = db.transactions.find(
    (tx) => tx.conversationId === conversation.id,
  );
  return {
    id: conversation.id,
    listingId: conversation.listingId,
    listing:
      listing &&
      (() => ({
        id: listing.id,
        name: listing.name,
        price: listing.price,
        images: listing.images,
        ownerId: listing.ownerId,
      }))(),
    participants: participantEmails,
    participants_data: participantsData,
    messages: conversation.messages.map((message) => {
      const sender = db.users.find((user) => user.id === message.senderId);
      return {
        id: message.id,
        sender: sender?.email || message.senderId,
        body: message.body,
        attachments: message.attachments || [],
        createdAt: message.createdAt,
      };
    }),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    transaction: formatTransactionForUser(transaction, currentUserId),
  };
}

function isBlocked(db, ownerId, targetId) {
  return db.blocked.some(
    (entry) => entry.ownerId === ownerId && entry.targetId === targetId,
  );
}

export async function listConversationsForUser(userId) {
  const db = await getDb();
  const conversations = db.conversations.filter((conv) =>
    conv.participants?.includes(userId),
  );
  const blocked = db.blocked
    .filter((entry) => entry.ownerId === userId)
    .map((entry) => entry.targetId);

  return {
    conversations: conversations.map((conv) =>
      toConversationResponse(conv, db, userId),
    ),
    blockedTargets: blocked
      .map((targetId) => {
        const target = db.users.find((user) => user.id === targetId);
        return target?.email || null;
      })
      .filter(Boolean),
  };
}

export async function startConversation({
  fromEmail,
  toEmail,
  listingId,
  initialMessage,
  initialAttachments,
}) {
  const fromUser = await findByEmail(fromEmail);
  if (!fromUser) {
    const error = new Error("Remitente no válido.");
    error.statusCode = 400;
    throw error;
  }
  const toUser = await findByEmail(toEmail);
  if (!toUser) {
    const error = new Error("Destinatario no existe.");
    error.statusCode = 404;
    throw error;
  }
  if (fromUser.id === toUser.id) {
    const error = new Error(
      "No puedes iniciar una conversación contigo mismo.",
    );
    error.statusCode = 400;
    throw error;
  }

  const messageBody = (initialMessage || "").trim();
  const attachments = await storeAttachments(
    initialAttachments,
    listingId || "conversation",
  );
  const hasContent = Boolean(messageBody) || attachments.length > 0;

  let createdConversation = null;
  await withDb((db) => {
    if (
      isBlocked(db, fromUser.id, toUser.id) ||
      isBlocked(db, toUser.id, fromUser.id)
    ) {
      const error = new Error("No es posible iniciar la conversación.");
      error.statusCode = 403;
      throw error;
    }

    const existing = db.conversations.find(
      (conv) =>
        conv.listingId === listingId &&
        conv.participants?.includes(fromUser.id) &&
        conv.participants?.includes(toUser.id),
    );

    const now = new Date().toISOString();
    if (existing) {
      if (hasContent) {
        existing.messages.push({
          id: prefixedId("msg"),
          senderId: fromUser.id,
          body: messageBody,
          attachments,
          createdAt: now,
        });
        existing.updatedAt = now;
      }
      createdConversation = existing;
      return;
    }

    const conversation = {
      id: prefixedId("cnv"),
      participants: [fromUser.id, toUser.id],
      listingId: listingId || null,
      messages: hasContent
        ? [
            {
              id: prefixedId("msg"),
              senderId: fromUser.id,
              body: messageBody,
              attachments,
              createdAt: now,
            },
          ]
        : [],
      createdAt: now,
      updatedAt: now,
    };
    db.conversations.push(conversation);
    createdConversation = conversation;
  });

  const db = await getDb();
  const conversation = toConversationResponse(
    createdConversation,
    db,
    fromUser.id,
  );
  emitEvent(
    "conversation.upsert",
    { conversation },
    { userIds: [fromUser.id, toUser.id], requireAuth: true },
  );
  return conversation;
}

export async function sendMessage({
  conversationId,
  senderEmail,
  body,
  attachments,
}) {
  const sender = await findByEmail(senderEmail);
  if (!sender) {
    const error = new Error("Usuario no encontrado.");
    error.statusCode = 404;
    throw error;
  }

  const trimmedBody = (body || "").trim();
  const storedAttachments = await storeAttachments(attachments, conversationId);
  if (!trimmedBody && storedAttachments.length === 0) {
    const error = new Error("Escribe un mensaje o adjunta una imagen.");
    error.statusCode = 400;
    throw error;
  }

  let updated = null;
  await withDb((db) => {
    const conversation = db.conversations.find(
      (conv) => conv.id === conversationId,
    );
    if (!conversation) {
      const error = new Error("La conversación no existe.");
      error.statusCode = 404;
      throw error;
    }
    if (
      !Array.isArray(conversation.participants) ||
      !conversation.participants.includes(sender.id)
    ) {
      const error = new Error("No perteneces a esta conversación.");
      error.statusCode = 403;
      throw error;
    }
    const otherParticipantId = conversation.participants.find(
      (participantId) => participantId !== sender.id,
    );
    if (isBlocked(db, otherParticipantId, sender.id)) {
      const error = new Error("El usuario no recibe más mensajes.");
      error.statusCode = 403;
      throw error;
    }
    if (isBlocked(db, sender.id, otherParticipantId)) {
      const error = new Error(
        "Debes desbloquear al usuario para enviar mensajes.",
      );
      error.statusCode = 403;
      throw error;
    }
    const now = new Date().toISOString();
    conversation.messages.push({
      id: prefixedId("msg"),
      senderId: sender.id,
      body: trimmedBody,
      attachments: storedAttachments,
      createdAt: now,
    });
    conversation.updatedAt = now;
    updated = conversation;
  });

  const db = await getDb();
  const conversation = toConversationResponse(updated, db, sender.id);

  // Solo emitir un evento con la conversación completa actualizada
  const participantEmails = updated.participants.map((id) => {
    const user = db.users.find((u) => u.id === id);
    return user ? user.email : "unknown";
  });

  console.log("Enviando mensaje:", {
    conversationId: conversation.id,
    from: senderEmail,
    to: participantEmails.filter((email) => email !== senderEmail),
    messageId: conversation.messages[conversation.messages.length - 1]?.id,
    totalMessages: conversation.messages.length,
  });

  // Emitir un solo evento con toda la información necesaria
  emitEvent(
    "conversation.upsert",
    {
      conversation,
      lastMessage:
        conversation.messages[conversation.messages.length - 1] || null,
      timestamp: new Date().toISOString(),
    },
    {
      userIds: updated.participants,
      requireAuth: true,
    },
  );
  return conversation;
}

export async function removeConversation(conversationId, requesterEmail) {
  const requester = await findByEmail(requesterEmail);
  if (!requester) {
    const error = new Error("Usuario no encontrado.");
    error.statusCode = 404;
    throw error;
  }
  let affectedParticipants = [];
  await withDb((db) => {
    const conversation = db.conversations.find(
      (conv) => conv.id === conversationId,
    );
    if (!conversation) return;
    if (
      !Array.isArray(conversation.participants) ||
      !conversation.participants.includes(requester.id)
    ) {
      const error = new Error("No puedes eliminar esta conversación.");
      error.statusCode = 403;
      throw error;
    }
    affectedParticipants = [...conversation.participants];
    db.conversations = db.conversations.filter(
      (conv) => conv.id !== conversationId,
    );
  });
  if (affectedParticipants.length) {
    emitEvent(
      "conversation.removed",
      { conversationId },
      { userIds: affectedParticipants, requireAuth: true },
    );
  }
}

export async function completeConversation(conversationId, actorEmail) {
  const actor = await findByEmail(actorEmail);
  if (!actor) {
    const error = new Error("Usuario no encontrado.");
    error.statusCode = 404;
    throw error;
  }
  await completeTransactionForConversation(conversationId, actor.id);
  const db = await getDb();
  const conversation = db.conversations.find(
    (conv) => conv.id === conversationId,
  );
  if (!conversation) {
    const error = new Error("La conversación no existe.");
    error.statusCode = 404;
    throw error;
  }
  return toConversationResponse(conversation, db, actor.id);
}

export async function blockUser(ownerEmail, targetEmail) {
  const owner = await findByEmail(ownerEmail);
  const target = await findByEmail(targetEmail);
  if (!owner || !target) {
    const error = new Error("Usuario no encontrado.");
    error.statusCode = 404;
    throw error;
  }
  await withDb((db) => {
    const exists = db.blocked.some(
      (entry) => entry.ownerId === owner.id && entry.targetId === target.id,
    );
    if (!exists) {
      db.blocked.push({
        id: prefixedId("blk"),
        ownerId: owner.id,
        targetId: target.id,
        createdAt: new Date().toISOString(),
      });
    }
  });
}

export async function unblockUser(ownerEmail, targetEmail) {
  const owner = await findByEmail(ownerEmail);
  const target = await findByEmail(targetEmail);
  if (!owner || !target) return;
  await withDb((db) => {
    db.blocked = db.blocked.filter(
      (entry) => !(entry.ownerId === owner.id && entry.targetId === target.id),
    );
  });
}

export async function markMessageAsRead(conversationId, userId) {
  let updatedConversation = null;
  await withDb((db) => {
    const conversation = db.conversations.find(
      (conv) => conv.id === conversationId,
    );
    if (!conversation) {
      const error = new Error("La conversación no existe.");
      error.statusCode = 404;
      throw error;
    }

    if (
      !Array.isArray(conversation.participants) ||
      !conversation.participants.includes(userId)
    ) {
      const error = new Error("No perteneces a esta conversación.");
      error.statusCode = 403;
      throw error;
    }

    // Marcar todos los mensajes como leídos para este usuario
    conversation.messages = conversation.messages.map((msg) => ({
      ...msg,
      readBy: Array.from(new Set([...(msg.readBy || []), userId])),
    }));

    updatedConversation = conversation;
  });

  const db = await getDb();
  const conversation = toConversationResponse(updatedConversation, db, userId);

  // Notificar a todos los participantes que la conversación ha sido actualizada
  emitEvent(
    "conversation.upsert",
    { conversation },
    { userIds: updatedConversation.participants, requireAuth: true },
  );

  return conversation;
}
