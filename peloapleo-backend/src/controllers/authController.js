import { sendJson } from "../utils/http.js";
import { extractToken } from "../utils/auth.js";
import {
  authenticate,
  authenticateWithGoogle,
  completeGoogleRegistration as completeGoogleRegistrationService,
  createSession,
  createUser,
  getUserFromToken,
  logout as logoutSession,
  sanitizeUser,
} from "../services/authService.js";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
}

export async function register({ req, res }) {
  const body = req.body || {};
  const { email, password, name, location, username, phone } = body;

  if (!validateEmail(email)) {
    const error = new Error("Debes indicar un correo válido.");
    error.statusCode = 400;
    throw error;
  }
  if (!password || String(password).length < 6) {
    const error = new Error("La clave debe tener al menos 6 caracteres.");
    error.statusCode = 400;
    throw error;
  }

  const user = await createUser({
    email,
    password,
    name,
    location,
    username,
    phone,
  });
  const session = await createSession(user.id);

  sendJson(res, 201, {
    user,
    token: session.token,
    expiresAt: session.expiresAt,
  });
}

export async function login({ req, res }) {
  const body = req.body || {};
  const { identifier, password } = body;
  if (!identifier || !password) {
    const error = new Error("Debes indicar usuario y clave.");
    error.statusCode = 400;
    throw error;
  }
  const result = await authenticate(identifier, password);
  sendJson(res, 200, result);
}

export async function me({ req, res }) {
  const token = extractToken(req);
  const user = await getUserFromToken(token);
  if (!user) {
    const error = new Error("No autorizado");
    error.statusCode = 401;
    throw error;
  }
  sendJson(res, 200, { user: sanitizeUser(user) });
}

export async function logout({ req, res }) {
  const token = extractToken(req);
  await logoutSession(token);
  sendJson(res, 200, { success: true });
}

export async function refreshToken({ req, res }) {
  const token = extractToken(req);
  const user = await getUserFromToken(token);
  if (!user) {
    const error = new Error("No autorizado");
    error.statusCode = 401;
    throw error;
  }

  // Crear una nueva sesión
  const session = await createSession(user.id);
  sendJson(res, 200, {
    user: sanitizeUser(user),
    token: session.token,
    expiresAt: session.expiresAt,
  });
}

export async function googleAuth({ req, res }) {
  const body = req.body || {};
  const { idToken } = body;

  if (!idToken) {
    const error = new Error("Token de Google requerido.");
    error.statusCode = 400;
    throw error;
  }

  const result = await authenticateWithGoogle(idToken);
  sendJson(res, 200, result);
}

export async function completeGoogleRegistration({ req, res }) {
  const body = req.body || {};
  const { googleData, username, location, phone } = body;

  if (!googleData || !username || !location) {
    const error = new Error(
      "Datos de Google, nombre de usuario y ubicación son requeridos.",
    );
    error.statusCode = 400;
    throw error;
  }

  const result = await completeGoogleRegistrationService(googleData, {
    username,
    location,
    phone,
  });
  sendJson(res, 201, result);
}
