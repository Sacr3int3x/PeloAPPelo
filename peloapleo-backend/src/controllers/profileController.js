import { sendJson } from "../utils/http.js";
import { extractToken } from "../utils/auth.js";
import { getUserFromToken } from "../services/authService.js";
import {
  saveProfilePhoto,
  removeProfilePhoto,
} from "../services/uploadService.js";
import { updateUser } from "../services/authService.js";

export async function uploadProfilePhoto({ req, res }) {
  const token = extractToken(req);
  const user = await getUserFromToken(token);

  if (!user) {
    const error = new Error("No autorizado");
    error.statusCode = 401;
    throw error;
  }

  if (!req.file) {
    const error = new Error("No se proporcionó ninguna imagen");
    error.statusCode = 400;
    throw error;
  }

  // Validar tipo de archivo
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(req.file.mimetype)) {
    const error = new Error(
      "Tipo de archivo no permitido. Use JPG, PNG o WEBP.",
    );
    error.statusCode = 400;
    throw error;
  }

  // Validar tamaño (5MB máximo)
  const maxSize = 5 * 1024 * 1024;
  if (req.file.size > maxSize) {
    const error = new Error("La imagen es demasiado grande. Máximo 5MB.");
    error.statusCode = 400;
    throw error;
  }

  // Si el usuario ya tiene una foto, eliminarla
  if (user.avatar) {
    const oldFilename = user.avatar.split("/").pop();
    await removeProfilePhoto(user.id, oldFilename);
  }

  // Guardar la nueva foto
  const photoUrl = await saveProfilePhoto(user.id, req.file);

  // Actualizar el usuario con la nueva URL de la foto
  await updateUser(user.id, { avatar: photoUrl });

  sendJson(res, 200, {
    success: true,
    avatar: photoUrl,
  });
}

export async function deleteProfilePhoto({ req, res }) {
  const token = extractToken(req);
  const user = await getUserFromToken(token);

  if (!user) {
    const error = new Error("No autorizado");
    error.statusCode = 401;
    throw error;
  }

  if (user.avatar) {
    const filename = user.avatar.split("/").pop();
    await removeProfilePhoto(user.id, filename);
    await updateUser(user.id, { avatar: null });
  }

  sendJson(res, 200, { success: true });
}
