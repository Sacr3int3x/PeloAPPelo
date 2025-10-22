import { logError } from "../utils/logger.js";
import { sendError } from "../utils/http.js";

// Validador de datos básico
export function validateBody(schema) {
  return async (req, res, next) => {
    try {
      const body = req.body;

      if (!body) {
        sendError(res, 400, "Se requiere el cuerpo de la solicitud");
        return;
      }

      const validationErrors = validateSchema(body, schema);

      if (validationErrors.length > 0) {
        sendError(res, 400, "Datos inválidos", validationErrors);
        return;
      }

      next();
    } catch (error) {
      logError("Error validando datos", error);
      sendError(res, 500, "Error validando datos");
    }
  };
}

// Función para sanitizar inputs
export function sanitizeInput(input) {
  if (typeof input !== "string") return input;

  return input
    .replace(/[<>]/g, "") // Previene XSS básico
    .trim();
}

// Validador de esquemas
function validateSchema(data, schema) {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    if (rules.required && !value) {
      errors.push(`El campo "${field}" es requerido`);
      continue;
    }

    if (value) {
      if (rules.type && typeof value !== rules.type) {
        errors.push(`El campo "${field}" debe ser de tipo ${rules.type}`);
      }

      if (rules.min && value.length < rules.min) {
        errors.push(
          `El campo "${field}" debe tener al menos ${rules.min} caracteres`,
        );
      }

      if (rules.max && value.length > rules.max) {
        errors.push(
          `El campo "${field}" debe tener máximo ${rules.max} caracteres`,
        );
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`El campo "${field}" tiene un formato inválido`);
      }

      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(
          `El valor "${value}" no es válido para el campo "${field}"`,
        );
      }
    }
  }

  return errors;
}

// Rate limiting middleware
const rateLimits = new Map();

export function rateLimit(options = { windowMs: 60000, max: 100 }) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Limpiar registros antiguos
    for (const [ip, hits] of rateLimits.entries()) {
      const validHits = hits.filter((time) => time > windowStart);
      if (validHits.length === 0) {
        rateLimits.delete(ip);
      } else {
        rateLimits.set(ip, validHits);
      }
    }

    // Verificar límite
    const hits = rateLimits.get(key) || [];
    const recentHits = hits.filter((time) => time > windowStart);

    if (recentHits.length >= options.max) {
      sendError(res, 429, "Demasiadas solicitudes, intente más tarde");
      return;
    }

    // Registrar hit
    recentHits.push(now);
    rateLimits.set(key, recentHits);

    next();
  };
}

// Middleware de seguridad
export function securityHeaders(req, res, next) {
  // Prevenir XSS
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Prevenir clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevenir MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Política de seguridad de contenido
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';",
  );

  // Referrer Policy
  res.setHeader("Referrer-Policy", "same-origin");

  next();
}

// Validación de archivos
export function validateFile(
  file,
  options = {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png"],
  },
) {
  const errors = [];

  if (!file) {
    errors.push("No se proporcionó ningún archivo");
    return errors;
  }

  if (file.size > options.maxSize) {
    errors.push(
      `El archivo excede el tamaño máximo permitido de ${options.maxSize / 1024 / 1024}MB`,
    );
  }

  if (!options.allowedTypes.includes(file.mimetype)) {
    errors.push(
      `Tipo de archivo no permitido. Tipos permitidos: ${options.allowedTypes.join(", ")}`,
    );
  }

  return errors;
}
