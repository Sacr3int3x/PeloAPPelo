import { sendJson } from "../utils/http.js";
import { extractToken } from "../utils/auth.js";
import { requireUser } from "../services/authService.js";
import {
  blockUser,
  completeConversation,
  listConversationsForUser,
  removeConversation,
  sendMessage as sendMessageService,
  startConversation,
  unblockUser,
  markMessageAsRead,
} from "../services/conversationService.js";

export async function listMine({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const { conversations, blockedTargets } = await listConversationsForUser(
    user.id,
  );
  sendJson(res, 200, {
    conversations,
    blocked: {
      [user.email]: blockedTargets,
    },
  });
}

export async function start({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const body = req.body || {}; // Usar req.body en lugar de readJsonBody
  const { to, listingId, initialMessage, initialAttachments } = body;

  if (!to) {
    const error = new Error("Debes indicar el destinatario.");
    error.statusCode = 400;
    throw error;
  }
  const conversation = await startConversation({
    fromEmail: user.email,
    toEmail: to,
    listingId: listingId || null,
    initialMessage: initialMessage || "",
    initialAttachments: initialAttachments || [],
  });
  sendJson(res, 200, { conversation });
}

export async function sendMessage({ req, res, params }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const [conversationId] = params;
  const body = req.body || {}; // Usar req.body en lugar de readJsonBody
  const { message, attachments } = body;
  const conversation = await sendMessageService({
    conversationId,
    senderEmail: user.email,
    body: message || "",
    attachments: attachments || [],
  });
  sendJson(res, 200, { conversation });
}

export async function complete({ req, res, params }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const [conversationId] = params;
  const conversation = await completeConversation(conversationId, user.email);
  sendJson(res, 200, { conversation });
}

export async function remove({ req, res, params }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const [conversationId] = params;
  await removeConversation(conversationId, user.email);
  sendJson(res, 200, { success: true });
}

export async function block({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const body = req.body || {}; // Usar req.body en lugar de readJsonBody
  const { target } = body;
  if (!target) {
    const error = new Error("Debes indicar el usuario a bloquear.");
    error.statusCode = 400;
    throw error;
  }
  await blockUser(user.email, target);
  sendJson(res, 200, { success: true });
}

export async function unblock({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const body = req.body || {}; // Usar req.body en lugar de readJsonBody
  const { target } = body;
  if (!target) {
    const error = new Error("Debes indicar el usuario a desbloquear.");
    error.statusCode = 400;
    throw error;
  }
  await unblockUser(user.email, target);
  sendJson(res, 200, { success: true });
}

export async function markAsRead({ req, res, params }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const [conversationId] = params;
  const conversation = await markMessageAsRead(conversationId, user.id);
  sendJson(res, 200, { conversation });
}
