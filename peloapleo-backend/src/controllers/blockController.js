import { extractToken } from '../utils/auth.js';
import { requireUser } from '../utils/auth.js';
import { getBlockedUsers, blockUser, unblockUser } from '../services/blockService.js';
import { readJsonBody, sendJson } from '../utils/http.js';

export async function handleGetBlockedUsers({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const blockedUsers = await getBlockedUsers(user.email);
  
  sendJson(res, 200, { 
    user: {
      ...user,
      blocked: blockedUsers || []
    }
  });
}

export async function handleBlock({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const body = await readJsonBody(req);
  const { email: targetEmail } = body || {};

  if (!targetEmail) {
    const error = new Error('Debes indicar el usuario a bloquear');
    error.statusCode = 400;
    throw error;
  }

  await blockUser(user.email, targetEmail);
  sendJson(res, 200, { success: true });
}

export async function handleUnblock({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const body = await readJsonBody(req);
  const { email: targetEmail } = body || {};

  if (!targetEmail) {
    const error = new Error('Debes indicar el usuario a desbloquear');
    error.statusCode = 400;
    throw error;
  }

  await unblockUser(user.email, targetEmail);
  sendJson(res, 200, { success: true });
}
