import { sendJson } from "../utils/http.js";
import { extractToken } from "../utils/auth.js";
import {
  getUserFromToken,
  createSession,
  sanitizeUser,
} from "../services/authService.js";

export async function refreshToken({ req, res }) {
  const token = extractToken(req);
  const user = await getUserFromToken(token);
  if (!user) {
    const error = new Error("No autorizado");
    error.statusCode = 401;
    throw error;
  }
  // Generar nuevo token y sesión
  const session = await createSession(user.id);
  sendJson(res, 200, {
    user: sanitizeUser(user),
    token: session.token,
    expiresAt: session.expiresAt,
  });
}
