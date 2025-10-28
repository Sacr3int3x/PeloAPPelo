/**
 * JWT mejorado con refresh tokens y validación robusta
 */

import crypto from "node:crypto";
import { getDb, withDb } from "../store/dataStore.js";
import { prefixedId } from "./id.js";

// Configuración de tokens
const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutos
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 días

// Nota: Para implementación futura de JWT firmados
// const TOKEN_SECRET = process.env.JWT_SECRET || "default-secret-change-in-production";

/**
 * Genera un access token y refresh token
 */
export async function generateTokenPair(userId) {
  const accessToken = generateSecureToken();
  const refreshToken = generateSecureToken();
  const now = Date.now();

  const tokenData = {
    id: prefixedId("tkn"),
    userId,
    accessToken,
    refreshToken,
    accessTokenExpiry: new Date(now + ACCESS_TOKEN_EXPIRY).toISOString(),
    refreshTokenExpiry: new Date(now + REFRESH_TOKEN_EXPIRY).toISOString(),
    createdAt: new Date(now).toISOString(),
    lastUsed: new Date(now).toISOString(),
    isRevoked: false,
  };

  await withDb((db) => {
    // Limpiar tokens expirados del usuario
    db.tokens = db.tokens.filter(
      (t) =>
        t.userId !== userId ||
        (new Date(t.refreshTokenExpiry) > new Date() && !t.isRevoked),
    );

    // Agregar nuevo token
    db.tokens.push(tokenData);
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiry: tokenData.accessTokenExpiry,
    refreshTokenExpiry: tokenData.refreshTokenExpiry,
  };
}

/**
 * Valida un access token
 */
export async function validateAccessToken(accessToken) {
  if (!accessToken || typeof accessToken !== "string") {
    return { valid: false, error: "Token inválido" };
  }

  const db = await getDb();
  const tokenData = db.tokens.find((t) => t.accessToken === accessToken);

  if (!tokenData) {
    return { valid: false, error: "Token no encontrado" };
  }

  if (tokenData.isRevoked) {
    return { valid: false, error: "Token revocado" };
  }

  const now = new Date();
  if (new Date(tokenData.accessTokenExpiry) < now) {
    return { valid: false, error: "Token expirado", expired: true };
  }

  // Actualizar último uso
  await withDb((db) => {
    const token = db.tokens.find((t) => t.accessToken === accessToken);
    if (token) {
      token.lastUsed = now.toISOString();
    }
  });

  return {
    valid: true,
    userId: tokenData.userId,
    tokenId: tokenData.id,
  };
}

/**
 * Refresca un access token usando un refresh token
 */
export async function refreshAccessToken(refreshToken) {
  if (!refreshToken || typeof refreshToken !== "string") {
    throw createError("Refresh token inválido", 401);
  }

  const db = await getDb();
  const tokenData = db.tokens.find((t) => t.refreshToken === refreshToken);

  if (!tokenData) {
    throw createError("Refresh token no encontrado", 401);
  }

  if (tokenData.isRevoked) {
    throw createError("Refresh token revocado", 401);
  }

  const now = new Date();
  if (new Date(tokenData.refreshTokenExpiry) < now) {
    throw createError("Refresh token expirado", 401);
  }

  // Generar nuevo access token
  const newAccessToken = generateSecureToken();
  const newAccessTokenExpiry = new Date(
    now.getTime() + ACCESS_TOKEN_EXPIRY,
  ).toISOString();

  await withDb((db) => {
    const token = db.tokens.find((t) => t.refreshToken === refreshToken);
    if (token) {
      token.accessToken = newAccessToken;
      token.accessTokenExpiry = newAccessTokenExpiry;
      token.lastUsed = now.toISOString();
    }
  });

  return {
    accessToken: newAccessToken,
    accessTokenExpiry: newAccessTokenExpiry,
  };
}

/**
 * Revoca todos los tokens de un usuario
 */
export async function revokeAllUserTokens(userId) {
  await withDb((db) => {
    db.tokens = db.tokens.map((token) => {
      if (token.userId === userId) {
        return { ...token, isRevoked: true };
      }
      return token;
    });
  });
}

/**
 * Revoca un token específico
 */
export async function revokeToken(accessToken) {
  await withDb((db) => {
    const token = db.tokens.find((t) => t.accessToken === accessToken);
    if (token) {
      token.isRevoked = true;
    }
  });
}

/**
 * Limpia tokens expirados (ejecutar periódicamente)
 */
export async function cleanExpiredTokens() {
  const now = new Date();
  await withDb((db) => {
    const initialCount = db.tokens.length;
    db.tokens = db.tokens.filter(
      (token) => new Date(token.refreshTokenExpiry) > now && !token.isRevoked,
    );
    const removed = initialCount - db.tokens.length;
    if (removed > 0) {
      console.log(`🧹 Limpiados ${removed} tokens expirados`);
    }
  });
}

/**
 * Obtiene información del usuario desde un token
 */
export async function getUserFromAccessToken(accessToken) {
  const validation = await validateAccessToken(accessToken);

  if (!validation.valid) {
    return null;
  }

  const db = await getDb();
  const user = db.users.find((u) => u.id === validation.userId);

  return user || null;
}

/**
 * Genera un token seguro
 */
function generateSecureToken() {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Crea un error con código de estado
 */
function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Iniciar limpieza periódica de tokens (cada hora)
if (process.env.NODE_ENV !== "test") {
  setInterval(cleanExpiredTokens, 60 * 60 * 1000);
}

// Exportar también las constantes
export { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY };
