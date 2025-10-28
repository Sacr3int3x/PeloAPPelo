/**
 * Sanitización avanzada de inputs
 * Previene XSS, SQL injection y otros ataques
 */

/**
 * Sanitiza texto HTML para prevenir XSS
 * @param {string} input - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
export function sanitizeHtml(input) {
  if (typeof input !== "string") return input;

  const htmlEntities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char]);
}

/**
 * Sanitiza texto general removiendo caracteres peligrosos
 * @param {string} input - Texto a sanitizar
 * @param {Object} options - Opciones de sanitización
 */
export function sanitizeText(input, options = {}) {
  if (typeof input !== "string") return input;

  const {
    allowNewlines = true,
    allowTabs = false,
    maxLength = 10000,
    trim = true,
  } = options;

  let sanitized = input;

  // Trim si es requerido
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Limitar longitud
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remover caracteres de control excepto los permitidos
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, " ");
  }
  if (!allowTabs) {
    sanitized = sanitized.replace(/\t/g, " ");
  }

  // Remover otros caracteres de control
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  // Remover espacios múltiples
  sanitized = sanitized.replace(/\s+/g, " ");

  return sanitized;
}

/**
 * Sanitiza email
 */
export function sanitizeEmail(email) {
  if (typeof email !== "string") return "";

  const sanitized = email.toLowerCase().trim();

  // Validación básica de formato
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error("Formato de email inválido");
  }

  // Prevenir inyección
  if (sanitized.includes("..") || sanitized.includes("@.")) {
    throw new Error("Email inválido");
  }

  return sanitized;
}

/**
 * Sanitiza URL
 */
export function sanitizeUrl(url) {
  if (typeof url !== "string") return "";

  const sanitized = url.trim();

  // Solo permitir http y https
  try {
    const parsed = new URL(sanitized);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Protocolo no permitido");
    }
    return parsed.toString();
  } catch (error) {
    throw new Error("URL inválida");
  }
}

/**
 * Sanitiza número de teléfono
 */
export function sanitizePhone(phone) {
  if (typeof phone !== "string") return "";

  // Remover todo excepto dígitos, + y espacios
  const sanitized = phone.replace(/[^\d+\s()-]/g, "").trim();

  return sanitized;
}

/**
 * Sanitiza nombre de archivo
 */
export function sanitizeFilename(filename) {
  if (typeof filename !== "string") return "";

  // Remover caracteres peligrosos para sistemas de archivos
  const sanitized = filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "");

  // Prevenir path traversal
  if (
    sanitized.includes("..") ||
    sanitized.includes("/") ||
    sanitized.includes("\\")
  ) {
    throw new Error("Nombre de archivo inválido");
  }

  // Limitar longitud
  const maxLength = 255;
  if (sanitized.length > maxLength) {
    const extension = sanitized.split(".").pop();
    const nameWithoutExt = sanitized.substring(
      0,
      maxLength - extension.length - 1,
    );
    return `${nameWithoutExt}.${extension}`;
  }

  return sanitized;
}

/**
 * Sanitiza objeto recursivamente
 */
export function sanitizeObject(obj, options = {}) {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj !== "object") {
    return sanitizeText(String(obj), options);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, options));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeText(key, {
      allowNewlines: false,
      maxLength: 100,
    });

    if (typeof value === "string") {
      sanitized[sanitizedKey] = sanitizeText(value, options);
    } else if (typeof value === "object" && value !== null) {
      sanitized[sanitizedKey] = sanitizeObject(value, options);
    } else {
      sanitized[sanitizedKey] = value;
    }
  }

  return sanitized;
}

/**
 * Valida y sanitiza entrada de búsqueda
 */
export function sanitizeSearchQuery(query) {
  if (typeof query !== "string") return "";

  let sanitized = query.trim();

  // Remover caracteres especiales que podrían usarse en inyecciones
  sanitized = sanitized.replace(/[;'"\\{}[\]<>]/g, "");

  // Limitar longitud
  const maxLength = 200;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remover múltiples espacios
  sanitized = sanitized.replace(/\s+/g, " ");

  return sanitized;
}

/**
 * Previene NoSQL injection
 */
export function preventNoSQLInjection(input) {
  if (typeof input !== "object" || input === null) {
    return input;
  }

  const dangerous = ["$where", "$regex", "$ne", "$gt", "$lt", "$gte", "$lte"];

  if (Array.isArray(input)) {
    return input.map(preventNoSQLInjection);
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(input)) {
    // Remover operadores peligrosos
    if (dangerous.includes(key)) {
      continue;
    }

    if (typeof value === "object" && value !== null) {
      cleaned[key] = preventNoSQLInjection(value);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}
