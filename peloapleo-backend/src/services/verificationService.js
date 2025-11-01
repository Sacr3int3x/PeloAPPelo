import { withDb, getDb, saveDb } from "../store/dataStore.js";
import { prefixedId } from "../utils/id.js";
import fs from "node:fs";
import path from "node:path";
import { ROOT_DIR } from "../config.js";
import { emitEvent } from "../realtime/socketHub.js";

const VERIFICATION_DIR = path.join(ROOT_DIR, "uploads", "verifications");

// Asegurar que el directorio de verificaciones existe
if (!fs.existsSync(VERIFICATION_DIR)) {
  fs.mkdirSync(VERIFICATION_DIR, { recursive: true });
}

/**
 * Estados de verificación:
 * - unverified: Usuario no ha solicitado verificación
 * - pending: Documentos enviados, esperando revisión
 * - approved: Verificación aprobada
 * - rejected: Verificación rechazada
 */

/**
 * Tipos de documentos requeridos:
 * - id_front: Foto frontal de la cédula/pasaporte
 * - id_back: Foto trasera de la cédula/pasaporte
 * - selfie: Selfie con el documento
 */

export async function submitVerificationDocuments(userId, documents) {
  const now = new Date().toISOString();

  return withDb(async (db) => {
    const userIndex = db.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      const error = new Error("Usuario no encontrado");
      error.statusCode = 404;
      throw error;
    }

    const user = db.users[userIndex];

    // Verificar que no tenga una verificación pendiente o aprobada
    if (user.verificationStatus === "pending") {
      const error = new Error(
        "Ya tienes una solicitud de verificación pendiente",
      );
      error.statusCode = 400;
      throw error;
    }

    if (user.verificationStatus === "approved") {
      const error = new Error("Tu cuenta ya está verificada");
      error.statusCode = 400;
      throw error;
    }

    // Validar que se hayan enviado todos los documentos requeridos
    const requiredDocs = ["id_front", "id_back", "selfie"];
    const missingDocs = requiredDocs.filter((docType) => !documents[docType]);

    if (missingDocs.length > 0) {
      const error = new Error(
        `Faltan los siguientes documentos: ${missingDocs.join(", ")}`,
      );
      error.statusCode = 400;
      throw error;
    }

    // Actualizar el usuario con la nueva solicitud de verificación
    const updatedUser = {
      ...user,
      verificationStatus: "pending",
      identityDocuments: {
        id_front: documents.id_front,
        id_back: documents.id_back,
        selfie: documents.selfie,
        submittedAt: now,
      },
      verificationRequestedAt: now,
      verificationCompletedAt: null,
      updatedAt: now,
    };

    db.users[userIndex] = updatedUser;
    await saveDb();

    return {
      success: true,
      message:
        "Documentos enviados correctamente. Tu solicitud será revisada en las próximas 24-48 horas.",
      verificationStatus: "pending",
    };
  });
}

export async function getVerificationStatus(userId) {
  const db = await getDb();
  const user = db.users.find((u) => u.id === userId);

  if (!user) {
    const error = new Error("Usuario no encontrado");
    error.statusCode = 404;
    throw error;
  }

  return {
    verificationStatus: user.verificationStatus || "unverified",
    identityDocuments: user.identityDocuments,
    verificationRequestedAt: user.verificationRequestedAt,
    verificationCompletedAt: user.verificationCompletedAt,
  };
}

export async function approveVerification(userId, adminId) {
  const now = new Date().toISOString();

  return withDb(async (db) => {
    const userIndex = db.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      const error = new Error("Usuario no encontrado");
      error.statusCode = 404;
      throw error;
    }

    const user = db.users[userIndex];

    if (user.verificationStatus !== "pending") {
      const error = new Error(
        "El usuario no tiene una solicitud de verificación pendiente",
      );
      error.statusCode = 400;
      throw error;
    }

    // Actualizar el estado de verificación
    const updatedUser = {
      ...user,
      verificationStatus: "approved",
      verificationCompletedAt: now,
      updatedAt: now,
    };

    db.users[userIndex] = updatedUser;

    // Registrar en el audit log
    db.auditLogs.push({
      id: prefixedId("aud"),
      userId: adminId,
      action: "verification.approve",
      targetType: "user",
      targetId: userId,
      details: {
        previousStatus: "pending",
        newStatus: "approved",
        completedAt: now,
      },
      createdAt: now,
    });

    await saveDb();

    // Emitir evento de cambio de verificación
    emitEvent(
      "verification.status.changed",
      {
        userId,
        newStatus: "approved",
        changedAt: now,
      },
      { userIds: [userId] },
    );

    return {
      success: true,
      message: "Verificación aprobada correctamente",
      userId,
      verificationStatus: "approved",
    };
  });
}

export async function rejectVerification(userId, adminId, reason) {
  const now = new Date().toISOString();

  return withDb(async (db) => {
    const userIndex = db.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      const error = new Error("Usuario no encontrado");
      error.statusCode = 404;
      throw error;
    }

    const user = db.users[userIndex];

    if (user.verificationStatus !== "pending") {
      const error = new Error(
        "El usuario no tiene una solicitud de verificación pendiente",
      );
      error.statusCode = 400;
      throw error;
    }

    // Actualizar el estado de verificación
    const updatedUser = {
      ...user,
      verificationStatus: "rejected",
      verificationCompletedAt: now,
      updatedAt: now,
    };

    db.users[userIndex] = updatedUser;

    // Registrar en el audit log
    db.auditLogs.push({
      id: prefixedId("aud"),
      userId: adminId,
      action: "verification.reject",
      targetType: "user",
      targetId: userId,
      details: {
        previousStatus: "pending",
        newStatus: "rejected",
        reason: reason || "Documentos no válidos o insuficientes",
        completedAt: now,
      },
      createdAt: now,
    });

    await saveDb();

    // Emitir evento de cambio de verificación
    emitEvent(
      "verification.status.changed",
      {
        userId,
        newStatus: "rejected",
        changedAt: now,
      },
      { userIds: [userId] },
    );

    return {
      success: true,
      message: "Verificación rechazada correctamente",
      userId,
      verificationStatus: "rejected",
    };
  });
}

export async function getPendingVerifications() {
  const db = await getDb();
  return db.users
    .filter((user) => user.verificationStatus === "pending")
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      verificationRequestedAt: user.verificationRequestedAt,
      identityDocuments: user.identityDocuments,
    }));
}

export async function getAllVerifications() {
  const db = await getDb();
  return db.users
    .filter(
      (user) =>
        user.verificationStatus && user.verificationStatus !== "unverified",
    )
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      verificationStatus: user.verificationStatus,
      verificationRequestedAt: user.verificationRequestedAt,
      verificationCompletedAt: user.verificationCompletedAt,
      identityDocuments: user.identityDocuments,
    }));
}

export async function resetVerification(userId, adminId) {
  const now = new Date().toISOString();

  return withDb(async (db) => {
    const userIndex = db.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      const error = new Error("Usuario no encontrado");
      error.statusCode = 404;
      throw error;
    }

    const user = db.users[userIndex];

    // Resetear el estado de verificación
    const updatedUser = {
      ...user,
      verificationStatus: "unverified",
      identityDocuments: null,
      verificationRequestedAt: null,
      verificationCompletedAt: null,
      updatedAt: now,
    };

    db.users[userIndex] = updatedUser;

    // Registrar en el audit log
    db.auditLogs.push({
      id: prefixedId("aud"),
      userId: adminId,
      action: "verification.reset",
      targetType: "user",
      targetId: userId,
      details: {
        previousStatus: user.verificationStatus,
        newStatus: "unverified",
        resetAt: now,
      },
      createdAt: now,
    });

    await saveDb();

    // Emitir evento de cambio de verificación
    emitEvent(
      "verification.status.changed",
      {
        userId,
        newStatus: "unverified",
        changedAt: now,
      },
      { userIds: [userId] },
    );

    return {
      success: true,
      message: "Verificación reseteada correctamente",
      userId,
      verificationStatus: "unverified",
    };
  });
}
