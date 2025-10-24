import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db;

async function initDB() {
  const { Low } = await import("lowdb");
  const { JSONFile } = await import("lowdb/node");

  const dbFile = join(process.cwd(), "data", "db.json");
  const adapter = new JSONFile(dbFile);
  const defaultData = {
    users: [],
    listings: [],
    favorites: [],
    conversations: [],
    messages: [],
    reputations: [],
    swaps: [],
    blocks: [],
    audit: [],
    transactions: [],
  };

  db = new Low(adapter, defaultData);
  await db.read();
  db.data = { ...defaultData, ...db.data };
  await db.write();
  return db;
}

// Inicializar la base de datos
const database = await initDB().catch((err) => {
  console.error("Error inicializando la base de datos:", err);
  throw err;
});

export { database as db };
