import crypto from "node:crypto";
import { TOKEN_TTL_MS } from "../config.js";

export function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password, hash) {
  if (!hash) return false;
  return hashPassword(password) === hash;
}

export function createToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function tokenExpiresAt() {
  return new Date(Date.now() + TOKEN_TTL_MS).toISOString();
}
