import { apiRequest } from "./api";

export const uploadProfilePhoto = async (file, token) => {
  if (!file) {
    throw new Error("No se seleccionó ningún archivo");
  }

  // Validar tamaño máximo (5MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error("La imagen es demasiado grande. Máximo 5MB.");
  }

  // Validar tipo de archivo
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Solo se permiten imágenes en formato JPG, PNG o WEBP.");
  }

  const formData = new FormData();
  formData.append("photo", file);

  try {
    return await apiRequest("me/profile-photo", {
      method: "POST",
      token,
      body: formData,
      isFormData: true,
    });
  } catch (error) {
    if (error.status === 404) {
      throw new Error("El servidor no admite la carga de fotos de perfil.");
    }
    throw error;
  }
};

export const removeProfilePhoto = async (token) => {
  return apiRequest("/me/profile-photo", {
    method: "DELETE",
    token,
  });
};
