import { sendJson } from "../utils/http.js";
import { extractToken } from "../utils/auth.js";
import { requireUser } from "../services/authService.js";
import { getDb, saveDb } from "../store/dataStore.js";
import { prefixedId } from "../utils/id.js";
import { emitEvent } from "../realtime/socketHub.js";
import { listingToResponse } from "../services/listingService.js";

// Crear transacción de venta
export async function create({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const db = await getDb();
  const body = req.body || {};

  if (!body.listingId || !body.buyerId) {
    const error = new Error("Faltan campos requeridos: listingId, buyerId");
    error.statusCode = 400;
    throw error;
  }

  const listing = db.listings.find((l) => l.id === body.listingId);
  if (!listing) {
    const error = new Error("Anuncio no encontrado");
    error.statusCode = 404;
    throw error;
  }

  if (listing.ownerId !== user.id) {
    const error = new Error("Solo el vendedor puede marcar como vendido");
    error.statusCode = 403;
    throw error;
  }

  if (listing.status === "sold") {
    const error = new Error("El anuncio ya está marcado como vendido");
    error.statusCode = 400;
    throw error;
  }

  const buyer = db.users.find((u) => u.id === body.buyerId);
  if (!buyer) {
    const error = new Error("Comprador no encontrado");
    error.statusCode = 404;
    throw error;
  }

  // Crear la transacción
  const transactionId = prefixedId("txn");
  const transaction = {
    id: transactionId,
    listingId: body.listingId,
    sellerId: user.id,
    buyerId: body.buyerId,
    status: "completed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.transactions = db.transactions || [];
  db.transactions.push(transaction);

  // Actualizar el estado del anuncio a pausado (solo visible para el vendedor)
  listing.status = "paused";
  listing.soldAt = new Date().toISOString();

  await saveDb();

  // Emitir evento de actualización de la publicación
  const updatedListing = listingToResponse(listing, db);
  emitEvent("listing.updated", { item: updatedListing });

  sendJson(res, 201, { transaction });
}

// Rechazar propuesta de intercambio
export async function rejectSwap({ req, res, params }) {
  const [swapId] = params;
  const token = extractToken(req);
  const user = await requireUser(token);
  const db = await getDb();
  const swap = (db.swaps || []).find((s) => s.id === swapId);
  if (!swap) {
    const error = new Error("Propuesta de intercambio no encontrada");
    error.statusCode = 404;
    throw error;
  }
  if (swap.receiverId !== user.id) {
    const error = new Error("Solo el vendedor puede rechazar la propuesta");
    error.statusCode = 403;
    throw error;
  }
  if (swap.status !== "pending") {
    const error = new Error("La propuesta ya fue aceptada o rechazada");
    error.statusCode = 400;
    throw error;
  }
  swap.status = "rejected";
  swap.rejectedAt = new Date().toISOString();
  swap.rejectReason = req.body?.reason || "";
  await saveDb();
  sendJson(res, 200, { success: true });
}

// Listar propuestas de intercambio enriquecidas
export async function listSwaps({ req, res }) {
  let user = null;
  let swaps = [];
  try {
    const token = extractToken(req);
    user = await requireUser(token);
    const db = await getDb();
    swaps = (db.swaps || []).filter(
      (swap) => swap.senderId === user.id || swap.receiverId === user.id,
    );
    // Enriquecer cada swap con datos completos de usuario y publicación
    const enriched = swaps.map((swap) => {
      const sender = db.users.find((u) => u.id === swap.senderId) || {};
      const receiver = db.users.find((u) => u.id === swap.receiverId) || {};
      const targetItem =
        db.listings.find((l) => l.id === swap.receiverListingId) || {};

      // Determinar si está sin leer
      const isReceiver = swap.receiverId === user.id;
      const isPending = swap.status === "pending";
      const readBy = swap.readBy || [];
      const unread = isReceiver && isPending && !readBy.includes(user.id);

      return {
        ...swap,
        sender: {
          id: sender.id,
          name: sender.name || sender.email || "",
          email: sender.email,
          avatar: sender.avatar || "",
        },
        receiver: {
          id: receiver.id,
          name: receiver.name || receiver.email || "",
          email: receiver.email,
          avatar: receiver.avatar || "",
        },
        targetItem: {
          id: targetItem.id,
          name: targetItem.name || "",
          images: targetItem.images || [],
          price: targetItem.price || 0,
        },
        moneyAmount: swap.cashAmount || 0,
        unread,
      };
    });
    sendJson(res, 200, { proposals: enriched, currentUserId: user.id });
  } catch (err) {
    // Si la sesión está expirada o no hay usuario, devolver lista vacía
    sendJson(res, 200, { proposals: [], currentUserId: null });
  }
}

// Crear propuesta de intercambio
export async function createSwap({ req, res, params }) {
  const [listingId] = params;
  const token = extractToken(req);
  const user = await requireUser(token);
  const db = await getDb();
  const listing = db.listings.find((l) => l.id === listingId);
  if (!listing) {
    const error = new Error("Anuncio no encontrado");
    error.statusCode = 404;
    throw error;
  }
  if (listing.ownerId === user.id) {
    const error = new Error(
      "No puedes proponer intercambio a tu propio anuncio",
    );
    error.statusCode = 400;
    throw error;
  }
  const body = req.body || {};
  if (!body.offeredItem || !body.offeredItem.description) {
    const error = new Error("Debes describir el artículo que ofreces");
    error.statusCode = 400;
    throw error;
  }
  const swapId = prefixedId("swp");
  const swap = {
    id: swapId,
    senderId: user.id,
    receiverId: listing.ownerId,
    receiverListingId: listing.id,
    offeredItem: body.offeredItem,
    message: body.message || "",
    cashAmount: body.cashAmount || 0,
    cashDirection: body.cashDirection || "none",
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  db.swaps = db.swaps || [];
  db.swaps.push(swap);
  await saveDb();
  sendJson(res, 201, { swap });
}

// Eliminar propuesta de intercambio
export async function deleteSwap({ req, res, params }) {
  // Export explícito para el router
  const [swapId] = params;
  const token = extractToken(req);
  const user = await requireUser(token);
  const db = await getDb();
  const swapIndex = (db.swaps || []).findIndex(
    (swap) =>
      swap.id === swapId &&
      (swap.senderId === user.id || swap.receiverId === user.id),
  );
  if (swapIndex === -1) {
    const error = new Error(
      "Propuesta de intercambio no encontrada o no autorizada",
    );
    error.statusCode = 404;
    throw error;
  }
  db.swaps.splice(swapIndex, 1);
  await saveDb();
  sendJson(res, 200, { success: true });
}

// Aceptar propuesta de intercambio y crear conversación
export async function acceptSwap({ req, res, params }) {
  const [swapId] = params;
  const token = extractToken(req);
  const user = await requireUser(token);
  const db = await getDb();
  const swap = (db.swaps || []).find((s) => s.id === swapId);
  if (!swap) {
    const error = new Error("Propuesta de intercambio no encontrada");
    error.statusCode = 404;
    throw error;
  }
  if (swap.receiverId !== user.id) {
    const error = new Error("Solo el vendedor puede aceptar la propuesta");
    error.statusCode = 403;
    throw error;
  }
  if (swap.status !== "pending") {
    const error = new Error("La propuesta ya fue aceptada o rechazada");
    error.statusCode = 400;
    throw error;
  }
  // Marcar como aceptada
  swap.status = "accepted";
  swap.acceptedAt = new Date().toISOString();

  // Crear conversación entre ambos usuarios si no existe
  db.conversations = db.conversations || [];
  const existingConv = db.conversations.find(
    (conv) =>
      conv.listingId === swap.receiverListingId &&
      conv.participants.includes(swap.senderId) &&
      conv.participants.includes(swap.receiverId),
  );
  let conversation;
  if (existingConv) {
    conversation = existingConv;
    // Si la conversación existe y no tiene mensajes, agregar el mensaje automático
    if (conversation.messages.length === 0) {
      const swapDetails = [
        `✅ Propuesta de intercambio aceptada`,
        `Artículo ofrecido: ${swap.offeredItem?.description || "Sin descripción"}`,
        swap.message ? `Mensaje: ${swap.message}` : null,
        swap.cashAmount > 0
          ? `Dinero adicional: $${swap.cashAmount} (${swap.cashDirection})`
          : null,
      ]
        .filter(Boolean)
        .join("\n");
      conversation.messages.push({
        id: prefixedId("msg"),
        sender: swap.receiverId,
        body: swapDetails,
        createdAt: new Date().toISOString(),
        attachments: [],
        readBy: [swap.receiverId],
      });
    }
  } else {
    // Crear mensaje automático con detalles del intercambio
    const swapDetails = [
      `✅ Propuesta de intercambio aceptada`,
      `Artículo ofrecido: ${swap.offeredItem?.description || "Sin descripción"}`,
      swap.message ? `Mensaje: ${swap.message}` : null,
      swap.cashAmount > 0
        ? `Dinero adicional: $${swap.cashAmount} (${swap.cashDirection})`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    conversation = {
      id: prefixedId("conv"),
      listingId: swap.receiverListingId,
      participants: [swap.senderId, swap.receiverId],
      messages: [
        {
          id: prefixedId("msg"),
          sender: swap.receiverId,
          body: swapDetails,
          createdAt: new Date().toISOString(),
          attachments: [],
          readBy: [swap.receiverId],
        },
      ],
      createdAt: new Date().toISOString(),
      lastReadAt: {},
      swapInfo: {
        swapId: swap.id,
        offeredItem: swap.offeredItem,
        message: swap.message,
        cashAmount: swap.cashAmount,
        cashDirection: swap.cashDirection,
        senderId: swap.senderId,
        receiverId: swap.receiverId,
        status: swap.status,
        acceptedAt: swap.acceptedAt,
      },
    };
    db.conversations.push(conversation);
  }
  await saveDb();
  sendJson(res, 200, { success: true, conversation });
}

// Cancelar propuesta de intercambio (solo el remitente puede cancelar)
export async function cancelSwap({ req, res, params }) {
  const [swapId] = params;
  const token = extractToken(req);
  const user = await requireUser(token);
  const db = await getDb();
  const swap = (db.swaps || []).find((s) => s.id === swapId);
  if (!swap) {
    const error = new Error("Propuesta de intercambio no encontrada");
    error.statusCode = 404;
    throw error;
  }
  if (swap.senderId !== user.id) {
    const error = new Error("Solo el remitente puede cancelar la propuesta");
    error.statusCode = 403;
    throw error;
  }
  if (swap.status !== "pending") {
    const error = new Error(
      "La propuesta ya fue aceptada, rechazada o cancelada",
    );
    error.statusCode = 400;
    throw error;
  }
  swap.status = "cancelled";
  swap.cancelledAt = new Date().toISOString();
  await saveDb();
  sendJson(res, 200, { success: true });
}

// Marcar propuesta de intercambio como leída
export async function markSwapAsRead({ req, res, params }) {
  const [swapId] = params;
  const token = extractToken(req);
  const user = await requireUser(token);
  const db = await getDb();
  const swap = (db.swaps || []).find((s) => s.id === swapId);
  if (!swap) {
    const error = new Error("Propuesta de intercambio no encontrada");
    error.statusCode = 404;
    throw error;
  }
  if (swap.senderId !== user.id && swap.receiverId !== user.id) {
    const error = new Error("No autorizado para marcar como leída");
    error.statusCode = 403;
    throw error;
  }
  swap.readBy = swap.readBy || [];
  if (!swap.readBy.includes(user.id)) {
    swap.readBy.push(user.id);
  }
  await saveDb();
  sendJson(res, 200, { success: true });
}
