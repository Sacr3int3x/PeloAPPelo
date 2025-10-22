import { readJsonBody, sendJson } from "../utils/http.js";
import { extractToken } from "../utils/auth.js";
import { requireUser } from "../services/authService.js";
import {
  getReputationsForUser,
  submitReputation,
} from "../services/transactionService.js";

export async function create({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const body = await readJsonBody(req);
  const { transactionId, rating, comment } = body || {};
  if (!transactionId) {
    const error = new Error("Debes indicar la transacción que deseas calificar.");
    error.statusCode = 400;
    throw error;
  }
  const reputation = await submitReputation({
    transactionId,
    fromUserId: user.id,
    rating,
    comment,
  });
  sendJson(res, 201, { reputation });
}

export async function listMine({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const reputations = await getReputationsForUser(user.id);
  sendJson(res, 200, { reputations });
}

export async function listForUser({ params, res }) {
  const [userId] = params;
  if (!userId) {
    const error = new Error("Debes indicar el usuario.");
    error.statusCode = 400;
    throw error;
  }
  const reputations = await getReputationsForUser(userId);
  sendJson(res, 200, { reputations });
}
