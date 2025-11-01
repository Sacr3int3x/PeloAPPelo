import { sendJson } from "../utils/http.js";
import { extractToken } from "../utils/auth.js";
import { requireUser } from "../services/authService.js";
import { getDb, saveDb } from "../store/dataStore.js";
import { prefixedId } from "../utils/id.js";
import { emitEvent } from "../realtime/socketHub.js";

// Calificar a un usuario después de una transacción
export async function rateUser({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const db = await getDb();
  const body = req.body || {};

  if (!body.transactionId || !body.rating || !body.toUserId) {
    const error = new Error(
      "Faltan campos requeridos: transactionId, rating, toUserId",
    );
    error.statusCode = 400;
    throw error;
  }

  // Verificar que la transacción existe y el usuario participó
  const transaction = db.transactions.find((t) => t.id === body.transactionId);
  if (!transaction) {
    const error = new Error("Transacción no encontrada");
    error.statusCode = 404;
    throw error;
  }

  const isSeller = transaction.sellerId === user.id;
  const isBuyer = transaction.buyerId === user.id;

  if (!isSeller && !isBuyer) {
    const error = new Error("No participas en esta transacción");
    error.statusCode = 403;
    throw error;
  }

  // Verificar que está calificando al usuario correcto
  const expectedTargetId = isSeller
    ? transaction.buyerId
    : transaction.sellerId;
  if (body.toUserId !== expectedTargetId) {
    const error = new Error(
      "Usuario objetivo incorrecto para esta transacción",
    );
    error.statusCode = 400;
    throw error;
  }

  // Verificar que no haya calificado ya
  const existingRating = db.ratings?.find(
    (r) => r.transactionId === body.transactionId && r.fromUserId === user.id,
  );

  if (existingRating) {
    const error = new Error("Ya has calificado esta transacción");
    error.statusCode = 400;
    throw error;
  }

  // Crear la calificación
  const ratingId = prefixedId("rtg");
  const rating = {
    id: ratingId,
    transactionId: body.transactionId,
    fromUserId: user.id,
    toUserId: body.toUserId,
    rating: Math.min(5, Math.max(1, body.rating)),
    comment: body.comment || "",
    createdAt: new Date().toISOString(),
  };

  db.ratings = db.ratings || [];
  db.ratings.push(rating);

  // Actualizar la reputación del usuario calificado
  const targetUser = db.users.find((u) => u.id === body.toUserId);
  if (targetUser) {
    const userRatings = db.ratings.filter((r) => r.toUserId === body.toUserId);
    const totalRating = userRatings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / userRatings.length;

    targetUser.reputation = {
      average: Math.round(averageRating * 10) / 10,
      count: userRatings.length,
      lastUpdated: new Date().toISOString(),
    };
  }

  await saveDb();

  // Emitir evento realtime para actualizar la reputación en los clientes
  emitEvent("user.reputation.updated", {
    userId: body.toUserId,
    reputation: targetUser.reputation,
  });

  sendJson(res, 201, { rating });
}

// Obtener reputación de un usuario
export async function getUserReputation({ params, res }) {
  const [userId] = params;
  if (!userId) {
    const error = new Error("ID de usuario requerido");
    error.statusCode = 400;
    throw error;
  }

  const db = await getDb();
  const user = db.users.find((u) => u.id === userId);

  if (!user) {
    const error = new Error("Usuario no encontrado");
    error.statusCode = 404;
    throw error;
  }

  const ratings = db.ratings?.filter((r) => r.toUserId === userId) || [];

  // Calcular reputación desde las calificaciones (igual que en listingService)
  let reputation = { average: 0, count: 0 };
  if (ratings.length > 0) {
    const total = ratings.reduce((sum, r) => sum + r.rating, 0);
    const average = total / ratings.length;
    reputation = {
      average: Math.round(average * 10) / 10,
      count: ratings.length,
    };
  }

  sendJson(res, 200, {
    userId,
    reputation,
    ratings: ratings.map((r) => {
      const fromUser = db.users.find((u) => u.id === r.fromUserId);
      const transaction = db.transactions.find((t) => t.id === r.transactionId);
      const listing = transaction
        ? db.listings.find((l) => l.id === transaction.listingId)
        : null;

      return {
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        fromUser: fromUser
          ? {
              id: fromUser.id,
              name: fromUser.name,
              email: fromUser.email,
            }
          : null,
        listing: listing
          ? {
              id: listing.id,
              name: listing.name,
            }
          : null,
      };
    }),
  });
}

// Obtener calificaciones pendientes del usuario actual
export async function getPendingRatings({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const db = await getDb();

  // Encontrar transacciones donde el usuario es comprador o vendedor
  const userTransactions = db.transactions.filter(
    (t) => t.sellerId === user.id || t.buyerId === user.id,
  );

  const pendingRatings = [];

  for (const transaction of userTransactions) {
    const isSeller = transaction.sellerId === user.id;
    const targetUserId = isSeller ? transaction.buyerId : transaction.sellerId;

    // Verificar si ya calificó
    const hasRated = db.ratings?.some(
      (r) => r.transactionId === transaction.id && r.fromUserId === user.id,
    );

    if (!hasRated) {
      const targetUser = db.users.find((u) => u.id === targetUserId);
      const listing = db.listings.find((l) => l.id === transaction.listingId);

      if (targetUser && listing) {
        pendingRatings.push({
          transactionId: transaction.id,
          toUser: {
            id: targetUser.id,
            name: targetUser.name,
            avatar: targetUser.avatar,
          },
          listing: {
            id: listing.id,
            title: listing.name,
            images: listing.images,
            price: listing.price,
          },
          role: isSeller ? "seller" : "buyer",
        });
      }
    }
  }

  sendJson(res, 200, { pendingRatings });
}
