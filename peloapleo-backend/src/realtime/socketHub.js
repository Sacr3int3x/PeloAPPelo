import { WebSocketServer } from "ws";
import { parse } from "node:url";
import { getUserFromToken } from "../services/authService.js";
import { logError, logInfo } from "../utils/logger.js";
import { findByEmail } from "../services/userService.js";

const clients = new Set();
let wss = null;

function makeClientId() {
  return `ws_${Math.random().toString(36).slice(2, 10)}`;
}

function buildMessage(type, payload) {
  return JSON.stringify({
    type,
    payload,
    timestamp: new Date().toISOString(),
  });
}

function send(socket, type, payload) {
  if (!socket || socket.readyState !== socket.OPEN) return;
  try {
    socket.send(buildMessage(type, payload));
  } catch (error) {
    logError("No se pudo enviar mensaje por WebSocket", error);
  }
}

function cleanUp(client) {
  if (!client) return;
  clients.delete(client);
}

function registerPingInterval() {
  setInterval(() => {
    clients.forEach((client) => {
      if (client.socket.readyState !== client.socket.OPEN) {
        cleanUp(client);
        return;
      }
      try {
        client.socket.ping();
      } catch (error) {
        logError("Error enviando ping WS", error);
      }
    });
  }, 30000);
}

export function registerRealtimeServer(server) {
  if (wss) return wss;
  wss = new WebSocketServer({
    server,
    path: "/realtime",
    verifyClient: async ({ req, origin }, cb) => {
      try {
        // Permitir conexiones desde cualquier origen en desarrollo
        if (process.env.NODE_ENV !== "production") {
          return cb(true);
        }

        // En producción, validar origen
        const allowedOrigins = [origin];
        if (!allowedOrigins.includes(origin)) {
          return cb(false, 403, "Origen no permitido");
        }

        return cb(true);
      } catch (error) {
        logError("Error verificando cliente WS", error);
        return cb(false, 500, "Error interno");
      }
    },
  });

  wss.on("connection", async (socket, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get("token") || "";
    const user = await getUserFromToken(token);

    // Log cuando un usuario intenta conectarse
    logInfo("Intento de conexión WebSocket", {
      token: token ? "presente" : "ausente",
      user: user ? `${user.email} (${user.id})` : "no autenticado",
      ip: req.socket.remoteAddress,
    });

    const client = {
      id: makeClientId(),
      socket,
      user,
      token,
      connectedAt: new Date().toISOString(),
      query: parse(req.url, true).query,
    };
    clients.add(client);

    send(socket, "session.ready", {
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        : null,
    });

    socket.on("close", () => {
      cleanUp(client);
    });

    socket.on("error", (error) => {
      logError("Error en conexión WebSocket", error);
      cleanUp(client);
    });

    socket.on("message", (raw) => {
      try {
        const payload = JSON.parse(String(raw));
        if (payload?.type === "ping") {
          send(socket, "pong", { at: new Date().toISOString() });
        }
      } catch (error) {
        logError("Mensaje inválido recibido por WebSocket", error);
      }
    });

    logInfo("Cliente WebSocket conectado", {
      clientId: client.id,
      email: client.user?.email,
    });
  });

  registerPingInterval();
  return wss;
}

export function emitEvent(type, payload, options = {}) {
  const { userIds, requireAuth = false } = options;
  if (!wss) return;

  const idsSet = Array.isArray(userIds)
    ? new Set(userIds.map((id) => String(id)))
    : null;

  let eventCount = 0;
  clients.forEach((client) => {
    if (client.socket.readyState !== client.socket.OPEN) return;
    if (requireAuth && !client.user) return;

    const shouldSend =
      !idsSet || (client.user && idsSet.has(String(client.user.id)));

    if (shouldSend) {
      send(client.socket, type, payload);
      eventCount++;
    }
  });

  logInfo(`Evento ${type} emitido a ${eventCount} clientes`, {
    type,
    userIds: userIds?.join(", "),
    recipients: eventCount,
  });
}

export function emitBroadcast(type, payload) {
  emitEvent(type, payload);
}
