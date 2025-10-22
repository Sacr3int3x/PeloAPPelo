import { withDb, getDb, saveDb } from "../store/dataStore.js";
import {
  hashPassword,
  verifyPassword,
  createToken,
  tokenExpiresAt,
} from "../utils/crypto.js";
import { prefixedId } from "../utils/id.js";
import { ADMIN_EMAILS } from "../config.js";

export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  const email = (user.email || "").toLowerCase();
  const role = user.role || (ADMIN_EMAILS.has(email) ? "admin" : "user");
  return {
    ...rest,
    role,
    isAdmin: role === "admin" || ADMIN_EMAILS.has(email),
  };
}

function normalizeIdentifier(value) {
  return (value || "").trim().toLowerCase();
}

export async function createUser({
  email,
  password,
  name,
  location,
  username,
  phone,
  role,
}) {
  const normalizedEmail = normalizeIdentifier(email);
  const normalizedUsername = normalizeIdentifier(username);
  const displayName =
    (name || "").trim() || normalizedEmail.split("@")[0] || "Usuario";
  const passwordHash = hashPassword(password);
  const now = new Date().toISOString();

  return withDb((db) => {
    if (db.users.some((u) => u.email === normalizedEmail)) {
      const error = new Error(
        "Ya existe una cuenta registrada con este correo.",
      );
      error.statusCode = 409;
      throw error;
    }
    if (
      normalizedUsername &&
      db.users.some((u) => u.username === normalizedUsername)
    ) {
      const error = new Error("Ese nombre de usuario ya está en uso.");
      error.statusCode = 409;
      throw error;
    }
    const assignedRole = role || (ADMIN_EMAILS.has(normalizedEmail) ? "admin" : "user");
    const record = {
      id: prefixedId("usr"),
      email: normalizedEmail,
      username: normalizedUsername || null,
      name: displayName,
      location: (location || "").trim(),
      phone: (phone || "").trim(),
      passwordHash,
      since: now,
      createdAt: now,
      updatedAt: now,
      role: assignedRole,
    };
    db.users.push(record);
    return sanitizeUser(record);
  });
}

export async function findByIdentifier(identifier) {
  const normalized = normalizeIdentifier(identifier);
  const db = await getDb();
  return db.users.find(
    (user) => user.email === normalized || user.username === normalized,
  );
}

export async function authenticate(identifier, password) {
  const user = await findByIdentifier(identifier);
  if (!user) {
    const error = new Error("No encontramos una cuenta con esos datos.");
    error.statusCode = 404;
    throw error;
  }
  if (!verifyPassword(password, user.passwordHash)) {
    const error = new Error("Clave incorrecta.");
    error.statusCode = 401;
    throw error;
  }
  const session = await createSession(user.id);
  return {
    user: sanitizeUser(user),
    token: session.token,
    expiresAt: session.expiresAt,
  };
}

export async function createSession(userId) {
  const token = createToken();
  const expiresAt = tokenExpiresAt();
  await withDb((db) => {
    db.sessions = db.sessions.filter(
      (session) =>
        session.userId !== userId || new Date(session.expiresAt) > new Date(),
    );
    db.sessions.push({
      id: prefixedId("sess"),
      token,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt,
    });
  });
  await saveDb();
  return { token, expiresAt };
}

export async function getUserFromToken(token) {
  if (!token) return null;
  const db = await getDb();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    return null;
  }
  const user = db.users.find((u) => u.id === session.userId);
  return user ? sanitizeUser(user) : null;
}

export async function requireUser(token) {
  const user = await getUserFromToken(token);
  if (!user) {
    const error = new Error("No autorizado");
    error.statusCode = 401;
    throw error;
  }
  return user;
}

export async function logout(token) {
  if (!token) return;
  await withDb((db) => {
    db.sessions = db.sessions.filter((session) => session.token !== token);
  });
}

export async function updateUser(userId, updates) {
  return withDb((db) => {
    const userIndex = db.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      const error = new Error("Usuario no encontrado");
      error.statusCode = 404;
      throw error;
    }

    const user = db.users[userIndex];
    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    db.users[userIndex] = updatedUser;
    return sanitizeUser(updatedUser);
  });
}
