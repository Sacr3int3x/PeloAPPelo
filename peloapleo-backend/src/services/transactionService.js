import { getDb, withDb } from "../store/dataStore.js";
import { prefixedId } from "../utils/id.js";
import { emitEvent } from "../realtime/socketHub.js";
import { listingToResponse } from "./listingService.js";

function sanitizeReputation(rep, db) {
  const fromUser = db.users.find((user) => user.id === rep.fromUserId);
  const toUser = db.users.find((user) => user.id === rep.toUserId);
  const listing = db.listings.find((item) => item.id === rep.listingId);
  return {
    id: rep.id,
    transactionId: rep.transactionId,
    conversationId: rep.conversationId,
    listingId: rep.listingId,
    listingName: listing?.name || null,
    rating: rep.rating,
    comment: rep.comment || "",
    fromUser: fromUser
      ? {
          id: fromUser.id,
          email: fromUser.email,
          name: fromUser.name,
          username: fromUser.username || null,
          avatar: fromUser.avatar || null,
        }
      : { id: rep.fromUserId },
    toUser: toUser
      ? {
          id: toUser.id,
          email: toUser.email,
          name: toUser.name,
          username: toUser.username || null,
          avatar: toUser.avatar || null,
        }
      : { id: rep.toUserId },
    createdAt: rep.createdAt,
  };
}

function sanitizeTransaction(transaction, currentUserId) {
  if (!transaction) return null;
  const myRole = transaction.sellerId === currentUserId ? "seller" : transaction.buyerId === currentUserId ? "buyer" : null;
  return {
    id: transaction.id,
    listingId: transaction.listingId,
    conversationId: transaction.conversationId,
    sellerId: transaction.sellerId,
    buyerId: transaction.buyerId,
    status: transaction.status,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
    sellerRatingId: transaction.sellerRatingId,
    buyerRatingId: transaction.buyerRatingId,
    myRole,
    myRatingSubmitted:
      myRole === "seller"
        ? Boolean(transaction.sellerRatingId)
        : myRole === "buyer"
        ? Boolean(transaction.buyerRatingId)
        : false,
  };
}

export async function completeTransactionForConversation(conversationId, actorId) {
  let record = null;
  await withDb((db) => {
    if (!Array.isArray(db.transactions)) {
      db.transactions = [];
    }
    const conversation = db.conversations.find((conv) => conv.id === conversationId);
    if (!conversation) {
      const error = new Error("La conversación no existe.");
      error.statusCode = 404;
      throw error;
    }
    if (!conversation.listingId) {
      const error = new Error("La conversación no está asociada a una publicación.");
      error.statusCode = 400;
      throw error;
    }
    const listing = db.listings.find((item) => item.id === conversation.listingId);
    if (!listing) {
      const error = new Error("La publicación ya no está disponible.");
      error.statusCode = 404;
      throw error;
    }
    if (listing.ownerId !== actorId) {
      const error = new Error("Solo el dueño de la publicación puede marcarla como concluida.");
      error.statusCode = 403;
      throw error;
    }
    let existing = db.transactions.find((tx) => tx.conversationId === conversationId);
    if (existing) {
      record = existing;
      return;
    }
    const buyerId = conversation.participants.find((participantId) => participantId !== listing.ownerId);
    if (!buyerId) {
      const error = new Error("No se puede determinar el comprador en la conversación.");
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
      sellerRatingId: null,
      buyerRatingId: null,
    };
    db.transactions.push(transaction);
    listing.status = "sold";
    listing.updatedAt = now;
    record = transaction;
  });
  const db = await getDb();
  const listingRecord = db.listings.find((item) => item.id === record.listingId);
  emitEvent(
    "conversation.transaction",
    { conversationId, transaction: sanitizeTransaction(record, null) },
    { userIds: [record.sellerId, record.buyerId], requireAuth: true },
  );
  if (listingRecord) {
    emitEvent("listing.updated", { item: listingToResponse(listingRecord, db) });
  }
  return sanitizeTransaction(record, actorId);
}

export async function getTransactionForConversation(conversationId, currentUserId) {
  const db = await getDb();
  const transaction = db.transactions.find((tx) => tx.conversationId === conversationId);
  return sanitizeTransaction(transaction, currentUserId);
}

export function formatTransactionForUser(transaction, currentUserId) {
  return sanitizeTransaction(transaction, currentUserId);
}

export async function submitReputation({ transactionId, fromUserId, rating, comment }) {
  if (!Number.isFinite(rating)) {
    const error = new Error("Calificación inválida.");
    error.statusCode = 400;
    throw error;
  }
  const normalizedRating = Math.min(5, Math.max(1, Number(rating)));
  const trimmedComment = (comment || "").trim().slice(0, 400);

  let reputationRecord = null;
  let transactionRecord = null;
  await withDb((db) => {
    if (!Array.isArray(db.reputations)) {
      db.reputations = [];
    }
    const transaction = db.transactions.find((tx) => tx.id === transactionId);
    if (!transaction) {
      const error = new Error("Transacción no encontrada.");
      error.statusCode = 404;
      throw error;
    }
    const isSeller = transaction.sellerId === fromUserId;
    const isBuyer = transaction.buyerId === fromUserId;
    if (!isSeller && !isBuyer) {
      const error = new Error("No participas en esta transacción.");
      error.statusCode = 403;
      throw error;
    }
    const targetId = isSeller ? transaction.buyerId : transaction.sellerId;
    if (isSeller && transaction.sellerRatingId) {
      const error = new Error("Ya calificaste esta operación.");
      error.statusCode = 400;
      throw error;
    }
    if (isBuyer && transaction.buyerRatingId) {
      const error = new Error("Ya calificaste esta operación.");
      error.statusCode = 400;
      throw error;
    }
    const now = new Date().toISOString();
    const reputation = {
      id: prefixedId("rep"),
      transactionId: transaction.id,
      conversationId: transaction.conversationId,
      listingId: transaction.listingId,
      fromUserId,
      toUserId: targetId,
      rating: normalizedRating,
      comment: trimmedComment,
      createdAt: now,
    };
    db.reputations.push(reputation);
    if (isSeller) {
      transaction.sellerRatingId = reputation.id;
    } else {
      transaction.buyerRatingId = reputation.id;
    }
    transaction.updatedAt = now;
    reputationRecord = reputation;
    transactionRecord = transaction;
  });
  const db = await getDb();
  const sanitizedRep = sanitizeReputation(reputationRecord, db);
  let finalListing = null;
  if (transactionRecord?.sellerRatingId && transactionRecord?.buyerRatingId) {
    await withDb((mutableDb) => {
      const listing = mutableDb.listings.find((item) => item.id === transactionRecord.listingId);
      if (listing) {
        listing.status = "finalizado";
        listing.updatedAt = new Date().toISOString();
        finalListing = { ...listing };
      }
    });
    if (finalListing) {
      const freshDb = await getDb();
      const listingResponse = listingToResponse(finalListing, freshDb);
      emitEvent("listing.updated", { item: listingResponse });
    }
  }
  emitEvent(
    "conversation.transaction",
    {
      conversationId: transactionRecord.conversationId,
      transaction: sanitizeTransaction(transactionRecord, null),
    },
    { userIds: [transactionRecord.sellerId, transactionRecord.buyerId], requireAuth: true },
  );
  return sanitizedRep;
}

export async function getReputationsForUser(userId) {
  const db = await getDb();
  const reps = db.reputations.filter((rep) => rep.toUserId === userId);
  return reps.map((rep) => sanitizeReputation(rep, db));
}

export async function getUserRatingSummary(userId) {
  const db = await getDb();
  const reputations = db.reputations.filter((rep) => rep.toUserId === userId);
  if (!reputations.length) {
    return { average: 0, count: 0 };
  }
  const total = reputations.reduce((sum, rep) => sum + Number(rep.rating || 0), 0);
  const average = Number((total / reputations.length).toFixed(2));
  const lastReview =
    reputations
      .map((rep) => new Date(rep.createdAt || 0).getTime())
      .filter((time) => Number.isFinite(time))
      .sort((a, b) => b - a)[0] || null;
  return {
    average,
    count: reputations.length,
    lastReviewAt: lastReview ? new Date(lastReview).toISOString() : null,
  };
}
