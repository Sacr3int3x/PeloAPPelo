import { sendJson } from "../utils/http.js";
import { extractToken } from "../utils/auth.js";
import { requireUser } from "../services/authService.js";
import { getDb } from "../store/dataStore.js";

// Función temporal para listar swaps (para compatibilidad con el frontend)
export async function listSwaps({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  
  // Por ahora retornamos un array vacío
  // Esta funcionalidad se puede implementar completamente después
  sendJson(res, 200, { swaps: [] });
}

// Funciones temporales para las operaciones de swap
export async function createSwap({ req, res, params }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const [listingId] = params;
  
  const error = new Error("La funcionalidad de intercambios está temporalmente deshabilitada.");
  error.statusCode = 503;
  throw error;
}

export async function acceptSwap({ req, res, params }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const [swapId] = params;
  
  const error = new Error("La funcionalidad de intercambios está temporalmente deshabilitada.");
  error.statusCode = 503;
  throw error;
}

export async function rejectSwap({ req, res, params }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const [swapId] = params;
  
  const error = new Error("La funcionalidad de intercambios está temporalmente deshabilitada.");
  error.statusCode = 503;
  throw error;
}

export async function cancelSwap({ req, res, params }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const [swapId] = params;
  
  const error = new Error("La funcionalidad de intercambios está temporalmente deshabilitada.");
  error.statusCode = 503;
  throw error;
}

export async function deleteSwap({ req, res, params }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const [swapId] = params;
  
  const error = new Error("La funcionalidad de intercambios está temporalmente deshabilitada.");
  error.statusCode = 503;
  throw error;
}
