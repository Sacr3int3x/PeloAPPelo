import { getDb, withDb } from "../store/dataStore.js";
import { prefixedId } from "../utils/id.js";
import { emitEvent } from "../realtime/socketHub.js";
import { listingToResponse } from "./listingService.js";

function sanitizeTransaction(transaction, currentUserId) {
  if (!transaction) return null;
  const myRole =
    transaction.sellerId === currentUserId
      ? "seller"
      : transaction.buyerId === currentUserId
        ? "buyer"
        : null;
  return {
    id: transaction.id,
    listingId: transaction.listingId,
    conversationId: transaction.conversationId,
    sellerId: transaction.sellerId,
    buyerId: transaction.buyerId,
    status: transaction.status,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
    myRole,
  };
}

export async function completeTransactionForConversation(
  conversationId,
  actorId,
) {
  let record = null;
  await withDb((db) => {
    if (!Array.isArray(db.transactions)) {
      db.transactions = [];
    }
    const conversation = db.conversations.find(
      (conv) => conv.id === conversationId,
    );
    if (!conversation) {
      const error = new Error("La conversación no existe.");
      error.statusCode = 404;
      throw error;
    }
    if (!conversation.listingId) {
      const error = new Error(
        "La conversación no está asociada a una publicación.",
      );
      error.statusCode = 400;
      throw error;
    }
    const listing = db.listings.find(
      (item) => item.id === conversation.listingId,
    );
    if (!listing) {
      const error = new Error("La publicación ya no está disponible.");
      error.statusCode = 404;
      throw error;
    }
    if (listing.ownerId !== actorId) {
      const error = new Error(
        "Solo el dueño de la publicación puede marcarla como concluida.",
      );
      error.statusCode = 403;
      throw error;
    }
    let existing = db.transactions.find(
      (tx) => tx.conversationId === conversationId,
    );
    if (existing) {
      record = existing;
      return;
    }
    const buyerId = conversation.participants.find(
      (participantId) => participantId !== listing.ownerId,
    );
    if (!buyerId) {
      const error = new Error(
        "No se puede determinar el comprador en la conversación.",
      );
      error.statusCode = 400;
      throw error;
    }
    const now = new Date().toISOString();
    const transaction = {
      id: prefixedId("tx"),
      conversationId,
      listingId: listing.id,
      sellerId: listing.ownerId,
      buyerId,
      status: "completed",
      createdAt: now,
      updatedAt: now,
    };
    db.transactions.push(transaction);
    listing.status = "sold";
    listing.updatedAt = now;
    record = transaction;
  });
  const db = await getDb();
  const listingRecord = db.listings.find(
    (item) => item.id === record.listingId,
  );
  emitEvent(
    "conversation.transaction",
    { conversationId, transaction: sanitizeTransaction(record, null) },
    { userIds: [record.sellerId, record.buyerId], requireAuth: true },
  );
  if (listingRecord) {
    emitEvent("listing.updated", {
      item: listingToResponse(listingRecord, db),
    });
  }
  return sanitizeTransaction(record, actorId);
}

export async function getTransactionForConversation(
  conversationId,
  currentUserId,
) {
  const db = await getDb();
  const transaction = db.transactions.find(
    (tx) => tx.conversationId === conversationId,
  );
  return sanitizeTransaction(transaction, currentUserId);
}

export function formatTransactionForUser(transaction, currentUserId) {
  return sanitizeTransaction(transaction, currentUserId);
}
