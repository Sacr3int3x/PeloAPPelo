/**
 * Rate Limiter Middleware
 * Protege endpoints contra ataques de fuerza bruta y abuso
 */

const rateLimitStore = new Map();

/**
 * Limpia entradas antiguas del store cada 5 minutos
 */
setInterval(
  () => {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
      if (now > data.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

/**
 * Crea un middleware de rate limiting
 * @param {Object} options - Opciones de configuración
 * @param {number} options.windowMs - Ventana de tiempo en milisegundos
 * @param {number} options.maxRequests - Máximo de peticiones por ventana
 * @param {string} options.message - Mensaje de error personalizado
 * @param {Function} options.keyGenerator - Función para generar la key (por defecto usa IP)
 */
export function createRateLimiter(options = {}) {
  const {
    windowMs = 60000, // 1 minuto por defecto
    maxRequests = 100,
    message = "Demasiadas peticiones, intenta de nuevo más tarde",
    keyGenerator = (req) => getClientIp(req),
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let limitData = rateLimitStore.get(key);

    if (!limitData || now > limitData.resetTime) {
      // Nueva ventana o ventana expirada
      limitData = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, limitData);
    } else {
      limitData.count++;
    }

    // Headers informativos
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, maxRequests - limitData.count),
    );
    res.setHeader(
      "X-RateLimit-Reset",
      new Date(limitData.resetTime).toISOString(),
    );

    if (limitData.count > maxRequests) {
      res.writeHead(429, {
        "Content-Type": "application/json",
        "Retry-After": Math.ceil((limitData.resetTime - now) / 1000),
      });
      res.end(
        JSON.stringify({
          error: "Too Many Requests",
          message,
          retryAfter: limitData.resetTime,
        }),
      );
      return;
    }

    next();
  };
}

/**
 * Rate limiter estricto para endpoints de autenticación
 * 5 intentos por 15 minutos
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 5,
  message:
    "Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.",
});

/**
 * Rate limiter para API general
 * 100 peticiones por minuto
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 100,
});

/**
 * Rate limiter para creación de contenido
 * 10 publicaciones por hora
 */
export const contentCreationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  maxRequests: 10,
  message: "Límite de publicaciones alcanzado. Intenta de nuevo en una hora.",
});

/**
 * Rate limiter para mensajes
 * 30 mensajes por minuto
 */
export const messageRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 30,
  message: "Estás enviando mensajes muy rápido. Espera un momento.",
});

/**
 * Obtiene la IP del cliente considerando proxies
 */
function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

/**
 * Middleware para limpiar el rate limit de un usuario (útil tras login exitoso)
 */
export function clearRateLimit(req) {
  const key = getClientIp(req);
  rateLimitStore.delete(key);
}
