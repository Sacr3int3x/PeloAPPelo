import http from "node:http";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { handleRequest } from "./router.js";
import { HOST, PORT, ROOT_DIR, UPLOADS_DIR } from "./config.js";
import { applyCors, sendError } from "./utils/http.js";
import { logError, logInfo } from "./utils/logger.js";
import { getDb } from "./store/dataStore.js";
import { registerRealtimeServer } from "./realtime/socketHub.js";
import { rateLimit, securityHeaders } from "./middleware/validation.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { cacheMiddleware, compressionMiddleware } from "./middleware/cache.js";

function resolveUploadPath(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const relative = decoded.replace(/^\/+/, "");
  const fullPath = path.join(ROOT_DIR, relative);
  if (!fullPath.startsWith(UPLOADS_DIR)) {
    return null;
  }
  return fullPath;
}

async function serveStatic(req, res, pathname) {
  const filePath = resolveUploadPath(pathname);
  if (!filePath) {
    sendError(res, 404, "Recurso no encontrado");
    return;
  }
  try {
    const stat = await fsPromises.stat(filePath);
    if (stat.isDirectory()) {
      sendError(res, 404, "Recurso no encontrado");
      return;
    }
    const stream = fs.createReadStream(filePath);
    stream.on("open", () => {
      res.writeHead(200);
    });
    stream.on("error", (error) => {
      logError("Error leyendo archivo estático", error);
      if (!res.headersSent) {
        sendError(res, 500, "No se pudo leer el archivo");
      } else {
        res.destroy(error);
      }
    });
    stream.pipe(res);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendError(res, 404, "Recurso no encontrado");
      return;
    }
    logError("Error sirviendo archivo estático", error);
    sendError(res, 500, "Error interno del servidor");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    // Preflight para WebSocket
    if (req.method === "OPTIONS" && req.headers["sec-websocket-key"]) {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, Sec-WebSocket-Key",
        "Access-Control-Max-Age": "86400",
      });
      res.end();
      return;
    }

    // Aplicar middlewares en orden
    applyCors(req, res);

    // Rate limiting - 100 requests per minute
    rateLimit({ windowMs: 60000, max: 100 })(req, res, () => {});

    // Headers de seguridad
    securityHeaders(req, res, () => {});

    // Compresión y caché
    if (process.env.NODE_ENV === "production") {
      compressionMiddleware()(req, res, () => {});
      cacheMiddleware()(req, res, () => {});
    }

    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (url.pathname.startsWith("/uploads/")) {
      await serveStatic(req, res, url.pathname);
      return;
    }

    await handleRequest(req, res);
  } catch (error) {
    // Usar el manejador de errores centralizado
    errorHandler(error, req, res, () => {
      if (!res.headersSent) {
        res.end();
      }
    });
  }
});

registerRealtimeServer(server);

server.listen(PORT, HOST, async () => {
  await getDb();
  logInfo(`Servidor escuchando en http://${HOST}:${PORT}`);
});
