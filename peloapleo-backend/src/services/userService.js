import { getDb } from "../store/dataStore.js";
import { sanitizeUser } from "./authService.js";

function normalizeEmail(value) {
  return (value || "").trim().toLowerCase();
}

export async function findByEmail(email) {
  const db = await getDb();
  const normalized = normalizeEmail(email);
  return db.users.find((user) => user.email === normalized) || null;
}

export async function findById(id) {
  const db = await getDb();
  return db.users.find((user) => user.id === id) || null;
}

export function toPublicProfile(user) {
  if (!user) return null;
  const sanitized = sanitizeUser(user);
  return {
    id: sanitized.id,
    email: sanitized.email,
    username: sanitized.username,
    name: sanitized.name,
    location: sanitized.location,
    phone: sanitized.phone,
    since: sanitized.since,
    createdAt: sanitized.createdAt,
  };
}
