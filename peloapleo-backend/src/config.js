import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, "..");
export const DATA_DIR = path.join(ROOT_DIR, "data");
export const DB_PATH = path.join(DATA_DIR, "db.json");
export const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");
export const LISTING_UPLOADS_DIR = path.join(UPLOADS_DIR, "listings");
export const MESSAGE_UPLOADS_DIR = path.join(UPLOADS_DIR, "messages");

export const PORT = Number.parseInt(process.env.PORT || "4000", 10);
export const HOST = process.env.HOST || "0.0.0.0";

const userOrigins = (process.env.APP_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Orígenes permitidos en desarrollo
const localOrigins = [];
if (process.env.NODE_ENV !== "production") {
  for (let port = 3000; port <= 3020; port += 1) {
    localOrigins.push(`http://localhost:${port}`);
    localOrigins.push(`http://127.0.0.1:${port}`);
  }
}

// En producción, solo permitir orígenes específicos
export const ALLOWED_ORIGINS =
  process.env.NODE_ENV === "production"
    ? userOrigins
    : Array.from(new Set([...userOrigins, ...localOrigins]));

export const TOKEN_TTL_MS =
  Number.parseInt(process.env.TOKEN_TTL_MS || "", 10) ||
  1000 * 60 * 60 * 24 * 7;

export const MAX_LISTING_IMAGES = 5;
export const MAX_MESSAGE_ATTACHMENTS = 6;

export const SERVER_NAME = "PeloAPelo API";

const adminSources = [
  process.env.APP_ADMINS || "",
  process.env.APP_ADMIN_EMAILS || "",
];

const parsedAdmins = adminSources
  .join(",")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const defaultAdmins = ["ana@demo.com"];

export const ADMIN_EMAILS = new Set([...defaultAdmins, ...parsedAdmins]);
