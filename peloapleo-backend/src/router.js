import { parse } from "node:url";
import { sendError, sendNoContent } from "./utils/http.js";
import { logError } from "./utils/logger.js";
import { handleMulter, profilePhotoUpload } from "./middleware/upload.js";
import { authMiddleware } from "./middleware/auth.js";
import * as authController from "./controllers/authController.js";
import * as listingController from "./controllers/listingController.js";
import * as favoriteController from "./controllers/favoriteController.js";
import * as conversationController from "./controllers/conversationController.js";
import * as adminController from "./controllers/adminController.js";
import * as reputationController from "./controllers/reputationController.js";
import * as profileController from "./controllers/profileController.js";
import * as transactionController from "./controllers/transactionController.js";

const routes = [
  {
    method: "POST",
    pattern: /^\/api\/auth\/refresh$/,
    handler: authController.refreshToken,
  },
  {
    method: "POST",
    pattern: /^\/api\/listings\/([a-zA-Z0-9_-]+)\/upload$/,
    handler: async (params) => {
      await handleMulter(listingPhotoUpload)(params);
      return listingController.uploadPhoto(params);
    },
  },
  {
    method: "PATCH",
    pattern: /^\/api\/listings\/([a-zA-Z0-9_-]+)$/,
    handler: listingController.update,
  },
  {
    method: "DELETE",
    pattern: /^\/api\/listings\/([a-zA-Z0-9_-]+)$/,
    handler: listingController.remove,
  },
  {
    method: "POST",
    pattern: /^\/api\/auth\/register$/,
    handler: authController.register,
  },
  {
    method: "POST",
    pattern: /^\/api\/auth\/login$/,
    handler: authController.login,
  },
  { method: "GET", pattern: /^\/api\/auth\/me$/, handler: authController.me },
  {
    method: "POST",
    pattern: /^\/api\/auth\/logout$/,
    handler: authController.logout,
  },
  {
    method: "POST",
    pattern: /^\/api\/me\/profile-photo$/,
    handler: async (params) => {
      await handleMulter(profilePhotoUpload)(params);
      return profileController.uploadProfilePhoto(params);
    },
  },
  {
    method: "DELETE",
    pattern: /^\/api\/me\/profile-photo$/,
    handler: profileController.deleteProfilePhoto,
  },

  {
    method: "GET",
    pattern: /^\/api\/listings$/,
    handler: listingController.list,
  },
  {
    method: "POST",
    pattern: /^\/api\/listings$/,
    handler: listingController.create,
  },
  {
    method: "GET",
    pattern: /^\/api\/listings\/([a-zA-Z0-9_-]+)$/,
    handler: listingController.detail,
  },
  {
    method: "PATCH",
    pattern: /^\/api\/listings\/([a-zA-Z0-9_-]+)\/status$/,
    handler: listingController.updateStatus,
  },
  {
    method: "GET",
    pattern: /^\/api\/me\/favorites$/,
    handler: favoriteController.listMine,
  },
  {
    method: "POST",
    pattern: /^\/api\/listings\/([a-zA-Z0-9_-]+)\/favorite$/,
    handler: favoriteController.add,
  },
  {
    method: "DELETE",
    pattern: /^\/api\/listings\/([a-zA-Z0-9_-]+)\/favorite$/,
    handler: favoriteController.remove,
  },

  {
    method: "GET",
    pattern: /^\/api\/me\/conversations\/?$/,
    handler: conversationController.listMine,
  },
  {
    method: "POST",
    pattern: /^\/api\/conversations\/?$/,
    handler: conversationController.start,
  },
  {
    method: "POST",
    pattern: /^\/api\/conversations\/([^/]+)\/messages\/?$/,
    handler: conversationController.sendMessage,
  },
  {
    method: "POST",
    pattern: /^\/api\/conversations\/([^/]+)\/read\/?$/,
    handler: conversationController.markAsRead,
  },
  {
    method: "POST",
    pattern: /^\/api\/conversations\/([^/]+)\/complete\/?$/,
    handler: conversationController.complete,
  },
  {
    method: "DELETE",
    pattern: /^\/api\/conversations\/([^/]+)\/?$/,
    handler: conversationController.remove,
  },
  {
    method: "POST",
    pattern: /^\/api\/block$/,
    handler: conversationController.block,
  },
  {
    method: "POST",
    pattern: /^\/api\/unblock$/,
    handler: conversationController.unblock,
  },

  {
    method: "POST",
    pattern: /^\/api\/reputations\/?$/,
    handler: reputationController.create,
  },
  {
    method: "GET",
    pattern: /^\/api\/me\/reputations\/?$/,
    handler: reputationController.listMine,
  },
  {
    method: "GET",
    pattern: /^\/api\/users\/([^/]+)\/reputations\/?$/,
    handler: reputationController.listForUser,
  },

  {
    method: "GET",
    pattern: /^\/api\/admin\/overview$/,
    handler: adminController.overview,
  },
  {
    method: "GET",
    pattern: /^\/api\/admin\/stats$/,
    handler: adminController.overview,
  },
  {
    method: "GET",
    pattern: /^\/api\/admin\/reputations$/,
    handler: adminController.reputations,
  },
  {
    method: "GET",
    pattern: /^\/api\/admin\/users$/,
    handler: adminController.users,
  },
  {
    method: "PATCH",
    pattern: /^\/api\/admin\/users\/([a-zA-Z0-9_-]+)$/,
    handler: adminController.updateUser,
  },
  {
    method: "GET",
    pattern: /^\/api\/admin\/listings$/,
    handler: adminController.listings,
  },
  {
    method: "PATCH",
    pattern: /^\/api\/admin\/listings\/([a-zA-Z0-9_-]+)$/,
    handler: adminController.updateListing,
  },
  {
    method: "GET",
    pattern: /^\/api\/admin\/conversations$/,
    handler: adminController.conversations,
  },
  {
    method: "GET",
    pattern: /^\/api\/admin\/audit$/,
    handler: adminController.auditLogs,
  },
  {
    method: "GET",
    pattern: /^\/api\/admin\/raw$/,
    handler: adminController.raw,
  },

  // Rutas para transacciones e intercambios
  {
    method: "GET",
    pattern: /^\/api\/transactions\/swaps$/,
    handler: async (params) => {
      await authMiddleware(params);
      return transactionController.listSwaps(params);
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/transactions\/swaps\/([a-zA-Z0-9_-]+)\/accept$/,
    handler: async (params) => {
      await authMiddleware(params);
      return transactionController.acceptSwap(params);
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/transactions\/swaps\/([a-zA-Z0-9_-]+)\/reject$/,
    handler: async (params) => {
      await authMiddleware(params);
      return transactionController.rejectSwap(params);
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/transactions\/swaps\/([a-zA-Z0-9_-]+)\/cancel$/,
    handler: async (params) => {
      await authMiddleware(params);
      return transactionController.cancelSwap(params);
    },
  },
  {
    method: "DELETE",
    pattern: /^\/api\/transactions\/swaps\/([a-zA-Z0-9_-]+)$/,
    handler: async (params) => {
      await authMiddleware(params);
      return transactionController.deleteSwap(params);
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/listings\/([a-zA-Z0-9_-]+)\/swap$/,
    handler: async (params) => {
      await authMiddleware(params);
      return transactionController.createSwap(params);
    },
  },
];

async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        const data = JSON.parse(body);
        resolve(data);
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

export async function handleRequest(req, res) {
  if (req.method === "OPTIONS") {
    sendNoContent(res);
    return;
  }

  // Procesar el cuerpo JSON para solicitudes POST y PATCH
  if (
    (req.method === "POST" || req.method === "PATCH") &&
    req.headers["content-type"]?.includes("application/json")
  ) {
    try {
      req.body = await parseJsonBody(req);
    } catch (error) {
      sendError(res, 400, "Invalid JSON body");
      return;
    }
  }

  const { pathname: rawPathname, query } = parse(req.url, true);
  const pathname =
    rawPathname?.replace(/\/+(?=$|\?)/g, "") || rawPathname || "/";

  console.log(`[ROUTER] ${req.method} ${pathname}`);

  const route = routes.find(
    (r) => r.method === req.method && r.pattern.test(pathname),
  );

  if (!route) {
    console.log("[ROUTER] No se encontró ruta para:", req.method, pathname);
    console.log(
      "[ROUTER] Rutas disponibles:",
      routes.map((r) => `${r.method} ${r.pattern}`),
    );
    sendError(res, 404, "Ruta no encontrada");
    return;
  }

  const match = pathname.match(route.pattern);
  const params = match ? match.slice(1) : [];

  try {
    await route.handler({ req, res, params, query, pathname });
  } catch (error) {
    const status = error?.statusCode || 500;
    const message =
      error?.message || "Ocurrió un error inesperado en el servidor.";
    if (status >= 500) {
      logError(`Fallo manejando ${req.method} ${pathname}`, error);
    }
    sendError(res, status, message, error?.details);
  }
}
