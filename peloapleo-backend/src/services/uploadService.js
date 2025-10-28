import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

export async function saveProfilePhoto(userId, file) {
  // Subir imagen a Cloudinary
  const { uploadImageToCloudinary } = await import("./cloudinaryService.js");
  const filename = `profile-${userId}-${Date.now()}`;
  const result = await uploadImageToCloudinary(file.buffer, filename);
  return result.secure_url;
}

export async function removeProfilePhoto(userId, filename) {
  const filepath = path.join(UPLOADS_DIR, "profiles", userId, filename);
  try {
    await fs.unlink(filepath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return true;
    throw error;
  }
}
