import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

export async function saveProfilePhoto(userId, file) {
  const userDir = path.join(UPLOADS_DIR, "profiles", userId);
  await fs.mkdir(userDir, { recursive: true });

  const filename = `profile-${Date.now()}${path.extname(file.originalname)}`;
  const filepath = path.join(userDir, filename);

  await fs.writeFile(filepath, file.buffer);

  return `/uploads/profiles/${userId}/${filename}`;
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
