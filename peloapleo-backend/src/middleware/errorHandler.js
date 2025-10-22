import { logError } from "../utils/logger.js";
import { sendError } from "../utils/http.js";

// Middleware de manejo de errores
export function errorHandler(err, req, res, next) {
  logError("Error no manejado", err);

  // Si ya se envió la respuesta, no hacer nada
  if (res.headersSent) {
    return next(err);
  }

  // Determinar el código de estado
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Error interno del servidor";

  // Errores específicos
  if (err.name === "ValidationError") {
    status = 400;
    message = "Datos inválidos";
  } else if (err.name === "UnauthorizedError") {
    status = 401;
    message = "No autorizado";
  } else if (err.name === "ForbiddenError") {
    status = 403;
    message = "Acceso denegado";
  } else if (err.name === "NotFoundError") {
    status = 404;
    message = "Recurso no encontrado";
  }

  // En producción, no enviar detalles del error
  const isProduction = process.env.NODE_ENV === "production";
  const error = {
    message,
    status,
    ...(isProduction ? {} : { stack: err.stack }),
  };

  // Enviar respuesta de error
  sendError(res, status, message, error);
}

// Middleware para rutas no encontradas
export function notFoundHandler(req, res) {
  sendError(res, 404, "Ruta no encontrada");
}

// Clase base para errores personalizados
export class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Errores específicos
export class ValidationError extends AppError {
  constructor(message = "Datos inválidos") {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "No autorizado") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acceso denegado") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") {
    super(message, 404);
  }
}

// Middleware para capturar errores asíncronos
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
