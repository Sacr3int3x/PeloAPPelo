import { sendJson } from "../utils/http.js";
import { extractToken } from "../utils/auth.js";
import {
  submitVerificationDocuments,
  getVerificationStatus,
  approveVerification,
  rejectVerification,
  getPendingVerifications,
  getAllVerifications,
  resetVerification,
} from "../services/verificationService.js";
import { requireUser, requireAdmin } from "../services/authService.js";

// Middleware para verificar que el usuario esté autenticado
async function requireAuth(req) {
  const token = extractToken(req);
  return await requireUser(token);
}

// Middleware para verificar que el usuario sea admin
async function requireAdminAuth(req) {
  const token = extractToken(req);
  return await requireAdmin(token);
}

export async function submitDocuments({ req, res }) {
  try {
    const user = await requireAuth(req);
    const body = req.body || {};

    const { id_front, id_back, selfie } = body;

    if (!id_front || !id_back || !selfie) {
      const error = new Error(
        "Se requieren fotos del frente, reverso del documento y selfie",
      );
      error.statusCode = 400;
      throw error;
    }

    const result = await submitVerificationDocuments(user.id, {
      id_front,
      id_back,
      selfie,
    });

    sendJson(res, 200, result);
  } catch (error) {
    throw error;
  }
}

export async function getStatus({ req, res }) {
  try {
    const user = await requireAuth(req);
    const status = await getVerificationStatus(user.id);
    sendJson(res, 200, status);
  } catch (error) {
    throw error;
  }
}

export async function approve({ req, res, params }) {
  try {
    const admin = await requireAdminAuth(req);
    const [userId] = params;

    if (!userId) {
      const error = new Error("ID de usuario requerido");
      error.statusCode = 400;
      throw error;
    }

    const result = await approveVerification(userId, admin.id);
    sendJson(res, 200, result);
  } catch (error) {
    throw error;
  }
}

export async function reject({ req, res, params }) {
  try {
    const admin = await requireAdminAuth(req);
    const [userId] = params;
    const body = req.body || {};
    const { reason } = body;

    if (!userId) {
      const error = new Error("ID de usuario requerido");
      error.statusCode = 400;
      throw error;
    }

    const result = await rejectVerification(userId, admin.id, reason);
    sendJson(res, 200, result);
  } catch (error) {
    throw error;
  }
}

export async function listPending({ req, res }) {
  try {
    await requireAdminAuth(req);
    const pending = await getPendingVerifications();
    sendJson(res, 200, { verifications: pending });
  } catch (error) {
    throw error;
  }
}

export async function listAll({ req, res }) {
  try {
    await requireAdminAuth(req);
    const all = await getAllVerifications();
    sendJson(res, 200, { verifications: all });
  } catch (error) {
    throw error;
  }
}

export async function reset({ req, res, params }) {
  try {
    const admin = await requireAdminAuth(req);
    const [userId] = params;

    if (!userId) {
      const error = new Error("ID de usuario requerido");
      error.statusCode = 400;
      throw error;
    }

    const result = await resetVerification(userId, admin.id);
    sendJson(res, 200, result);
  } catch (error) {
    throw error;
  }
}
