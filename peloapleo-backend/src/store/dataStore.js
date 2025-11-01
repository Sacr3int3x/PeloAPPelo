import fs from "node:fs";
import fsPromises from "node:fs/promises";
import {
  DATA_DIR,
  DB_PATH,
  LISTING_UPLOADS_DIR,
  MESSAGE_UPLOADS_DIR,
  UPLOADS_DIR,
} from "../config.js";
import { ensureDir } from "../utils/file.js";
import { logError, logInfo } from "../utils/logger.js";

const defaultData = {
  users: [],
  listings: [],
  favorites: [],
  conversations: [],
  blocked: [],
  sessions: [],
  auditLogs: [],
  transactions: [],
  reputations: [],
  adminNotifications: [], // Notificaciones enviadas por el administrador
};

let loaded = false;
let dbCache = structuredClone(defaultData);
let writeInFlight = null;

async function ensureDataFile() {
  await ensureDir(DATA_DIR);
  await ensureDir(UPLOADS_DIR);
  await ensureDir(LISTING_UPLOADS_DIR);
  await ensureDir(MESSAGE_UPLOADS_DIR);
  const exists = fs.existsSync(DB_PATH);
  if (!exists) {
    await fsPromises.writeFile(
      DB_PATH,
      JSON.stringify(defaultData, null, 2),
      "utf8",
    );
    logInfo("Archivo de base de datos creado", { path: DB_PATH });
  }
}

async function loadDb() {
  if (loaded) return dbCache;
  await ensureDataFile();
  try {
    const contents = await fsPromises.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(contents);
    dbCache = {
      ...structuredClone(defaultData),
      ...parsed,
    };
    loaded = true;
    return dbCache;
  } catch (error) {
    logError(
      "No se pudo cargar la base de datos, usando valores por defecto",
      error,
    );
    dbCache = structuredClone(defaultData);
    loaded = true;
    return dbCache;
  }
}

async function persistDb() {
  if (writeInFlight) {
    await writeInFlight;
    return;
  }
  writeInFlight = fsPromises
    .writeFile(DB_PATH, JSON.stringify(dbCache, null, 2), "utf8")
    .catch((error) => {
      logError("Error guardando base de datos", error);
      throw error;
    })
    .finally(() => {
      writeInFlight = null;
    });
  await writeInFlight;
}

export async function getDb() {
  return loadDb();
}

export async function saveDb() {
  return persistDb();
}

export async function withDb(mutator) {
  const db = await loadDb();
  const result = await mutator(db);
  await persistDb();
  return result;
}

export function snapshotDb() {
  return structuredClone(dbCache);
}
