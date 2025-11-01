import { sendJson } from "../utils/http.js";
import { extractToken } from "../utils/auth.js";
import { requireUser } from "../services/authService.js";
import { getDb, withDb } from "../store/dataStore.js";

// Obtener todas las notificaciones del usuario (solo administrativas)
export async function getNotifications({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const db = await getDb();

  // Obtener solo notificaciones administrativas
  const notifications = db.adminNotifications.map((notification) => ({
    ...notification,
    read: notification.readBy?.includes(user.id) || false,
  }));

  // Ordenar por fecha de creación (más recientes primero)
  notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  sendJson(res, 200, { notifications });
}

// Obtener contador de notificaciones no leídas (solo administrativas)
export async function getUnreadCount({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const db = await getDb();

  // Contar notificaciones administrativas no leídas
  const unreadCount = db.adminNotifications.filter(
    (notification) => !notification.readBy?.includes(user.id),
  ).length;

  sendJson(res, 200, { count: unreadCount });
}

// Marcar notificación como leída
export async function markAsRead({ req, res, params }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const [notificationId] = params;

  await withDb(async (db) => {
    const notification = db.adminNotifications.find(
      (n) => n.id === notificationId,
    );
    if (notification) {
      if (!notification.readBy) {
        notification.readBy = [];
      }
      if (!notification.readBy.includes(user.id)) {
        notification.readBy.push(user.id);
      }
    }
  });

  sendJson(res, 200, { success: true });
}

// Marcar todas las notificaciones como leídas
export async function markAllAsRead({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);

  await withDb(async (db) => {
    db.adminNotifications.forEach((notification) => {
      if (!notification.readBy) {
        notification.readBy = [];
      }
      if (!notification.readBy.includes(user.id)) {
        notification.readBy.push(user.id);
      }
    });
  });

  sendJson(res, 200, { success: true });
}

// Eliminar notificación (solo para admin)
export async function deleteNotification({ req, res, params }) {
  const token = extractToken(req);
  await requireUser(token);
  const [notificationId] = params;

  // Verificar que sea admin (por ahora solo verificamos que esté autenticado)
  // TODO: Agregar verificación de rol de admin

  await withDb(async (db) => {
    const index = db.adminNotifications.findIndex(
      (n) => n.id === notificationId,
    );
    if (index !== -1) {
      db.adminNotifications.splice(index, 1);
    }
  });

  sendJson(res, 200, { success: true });
}

// Enviar notificación administrativa a todos los usuarios (solo para admin)
export async function sendAdminNotification({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);

  // Verificar que sea admin (por ahora solo verificamos que esté autenticado)
  // TODO: Agregar verificación de rol de admin

  const { title, message, actionUrl } = req.body;

  if (!title || !message) {
    sendJson(res, 400, { error: "Título y mensaje son requeridos" });
    return;
  }

  const notification = {
    id: `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: "admin",
    title,
    message,
    actionUrl: actionUrl || null,
    readBy: [],
    createdAt: new Date().toISOString(),
    sentBy: user.id,
  };

  await withDb(async (db) => {
    db.adminNotifications.push(notification);
  });

  sendJson(res, 200, { success: true, notification });
}

// Obtener todas las notificaciones administrativas (para admin)
export async function getAdminNotifications({ req, res }) {
  const token = extractToken(req);
  await requireUser(token);

  // Verificar que sea admin (por ahora solo verificamos que esté autenticado)
  // TODO: Agregar verificación de rol de admin

  const db = await getDb();
  const notifications = db.adminNotifications.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  sendJson(res, 200, { notifications });
}
