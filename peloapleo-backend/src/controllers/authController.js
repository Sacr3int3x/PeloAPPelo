import { readJsonBody, sendJson } from "../utils/http.js";
import { extractToken } from "../utils/auth.js";
import {
  authenticate,
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
  const body = await readJsonBody(req);
  const { email, password, name, location, username, phone } = body || {};

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
  const body = await readJsonBody(req);
  const { identifier, password } = body || {};
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

export async function createAdminUser({ req, res }) {
  // Verificar que el usuario que hace la petición es administrador
  const token = extractToken(req);
  const admin = await getUserFromToken(token);
  
  if (!admin?.isAdmin) {
    const error = new Error("No autorizado");
    error.statusCode = 403;
    throw error;
  }

  const body = await readJsonBody(req);
  const { email, password, name, location, phone, role } = body || {};

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
    phone,
    role,
    isAdmin: role === "admin",
  });

  sendJson(res, 201, { user: sanitizeUser(user) });
}
