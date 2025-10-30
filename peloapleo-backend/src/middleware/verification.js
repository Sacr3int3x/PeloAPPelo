import { extractToken } from "../utils/auth.js";
import { requireUser } from "../services/authService.js";

/**
 * Middleware que requiere que el usuario esté verificado para realizar ciertas acciones
 * Se aplica a rutas como publicar listings, crear intercambios, etc.
 */
export async function requireVerifiedUser(req, res, next) {
  try {
    const token = extractToken(req);
    const user = await requireUser(token);

    // Verificar si el usuario está aprobado
    if (user.verificationStatus !== "approved") {
      const error = new Error(
        "Debes verificar tu identidad antes de realizar esta acción. " +
          "Ve a tu perfil y completa el proceso de verificación.",
      );
      error.statusCode = 403;
      error.code = "VERIFICATION_REQUIRED";
      throw error;
    }

    // Agregar el usuario al request para que esté disponible en los controladores
    req.user = user;
    next();
  } catch (error) {
    // Si no hay usuario autenticado, dejar que el middleware de auth maneje el error
    if (error.statusCode === 401) {
      next();
      return;
    }
    next(error);
  }
}

/**
 * Middleware opcional que solo advierte sobre verificación no completada
 * pero permite continuar con la acción
 */
export async function warnUnverifiedUser(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      next();
      return;
    }

    const user = await requireUser(token);

    // Agregar información de verificación al request
    req.userVerificationStatus = user.verificationStatus || "unverified";
    req.user = user;

    next();
  } catch (error) {
    // No bloquear la acción si hay error obteniendo el usuario
    req.userVerificationStatus = "unknown";
    next();
  }
}
