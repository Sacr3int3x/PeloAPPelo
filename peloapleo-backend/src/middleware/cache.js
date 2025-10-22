import { createHash } from "crypto";
import zlib from "zlib";
import { promisify } from "util";

const gzip = promisify(zlib.gzip);
const deflate = promisify(zlib.deflate);

// Caché en memoria
const cache = new Map();

// Configuración por defecto
const defaultOptions = {
  ttl: 300, // 5 minutos
  maxSize: 100 * 1024 * 1024, // 100MB
  compress: true,
};

// Función para generar clave de caché
function generateCacheKey(req) {
  const data = `${req.method}:${req.url}:${JSON.stringify(req.query)}:${JSON.stringify(req.body)}`;
  return createHash("md5").update(data).digest("hex");
}

// Middleware de caché
export function cacheMiddleware(options = {}) {
  const config = { ...defaultOptions, ...options };

  return async (req, res, next) => {
    // Solo cachear GET y HEAD
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }

    const key = generateCacheKey(req);
    const cached = cache.get(key);

    if (cached) {
      const { data, encoding } = cached;
      res.setHeader("X-Cache", "HIT");
      res.setHeader("Content-Encoding", encoding);
      res.send(data);
      return;
    }

    // Interceptar la respuesta
    const send = res.send;
    res.send = async function (body) {
      let compressed;
      let encoding = "identity";

      if (config.compress && body && body.length > 1024) {
        const acceptEncoding = req.headers["accept-encoding"] || "";

        if (acceptEncoding.includes("gzip")) {
          compressed = await gzip(body);
          encoding = "gzip";
        } else if (acceptEncoding.includes("deflate")) {
          compressed = await deflate(body);
          encoding = "deflate";
        }
      }

      const data = compressed || body;

      // Guardar en caché
      cache.set(key, {
        data,
        encoding,
        timestamp: Date.now(),
      });

      // Limpiar caché si excede el tamaño máximo
      if (getCacheSize() > config.maxSize) {
        clearOldestCache();
      }

      res.setHeader("X-Cache", "MISS");
      if (encoding !== "identity") {
        res.setHeader("Content-Encoding", encoding);
      }

      send.call(this, data);
    };

    next();
  };
}

// Obtener tamaño total de la caché
function getCacheSize() {
  let size = 0;
  for (const [, value] of cache) {
    size += value.data.length;
  }
  return size;
}

// Limpiar entradas más antiguas de la caché
function clearOldestCache() {
  const entries = Array.from(cache.entries());
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

  // Eliminar el 20% más antiguo
  const deleteCount = Math.ceil(entries.length * 0.2);
  for (let i = 0; i < deleteCount; i++) {
    cache.delete(entries[i][0]);
  }
}

// Limpiar caché periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > defaultOptions.ttl * 1000) {
      cache.delete(key);
    }
  }
}, 60000); // Cada minuto

// Middleware de compresión standalone
export function compressionMiddleware() {
  return async (req, res, next) => {
    if (!req.headers["accept-encoding"]) {
      return next();
    }

    const acceptEncoding = req.headers["accept-encoding"];
    const send = res.send;

    res.send = async function (body) {
      if (!body || body.length < 1024) {
        return send.call(this, body);
      }

      let compressed;
      let encoding = "identity";

      if (acceptEncoding.includes("gzip")) {
        compressed = await gzip(body);
        encoding = "gzip";
      } else if (acceptEncoding.includes("deflate")) {
        compressed = await deflate(body);
        encoding = "deflate";
      }

      if (compressed) {
        res.setHeader("Content-Encoding", encoding);
        send.call(this, compressed);
      } else {
        send.call(this, body);
      }
    };

    next();
  };
}
