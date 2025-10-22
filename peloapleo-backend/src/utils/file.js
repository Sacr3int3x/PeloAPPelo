import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { logError } from "./logger.js";

const mimeExtensions = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function ensureDir(dirPath) {
  if (fs.existsSync(dirPath)) return;
  await fsPromises.mkdir(dirPath, { recursive: true });
}

export function isDataUrl(value) {
  return typeof value === "string" && value.startsWith("data:");
}

function parseDataUrl(dataUrl) {
  const match = /^data:(.+);base64,(.*)$/i.exec(dataUrl);
  if (!match) {
    throw new Error("Formato de imagen no válido");
  }
  const [, mime, base64] = match;
  const buffer = Buffer.from(base64, "base64");
  const extension = mimeExtensions[mime.toLowerCase()] || "bin";
  return { mime, buffer, extension };
}

export async function saveDataUrl(dataUrl, targetDirectory, filename) {
  const { buffer, extension } = parseDataUrl(dataUrl);
  const safeName = filename.replace(/[^a-z0-9_-]/gi, "").toLowerCase();
  const finalName = `${safeName || "file"}_${Date.now()}.${extension}`;
  const fullPath = path.join(targetDirectory, finalName);
  await ensureDir(targetDirectory);
  await fsPromises.writeFile(fullPath, buffer);
  return fullPath;
}

export async function deleteIfExists(filePath) {
  if (!filePath) return;
  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      logError(`No se pudo borrar el archivo ${filePath}`, error);
    }
  }
}
