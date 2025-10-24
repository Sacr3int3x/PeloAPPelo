import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data/db.json');

async function fixSessions() {
  const adapter = new JSONFile(dbPath);
  const db = new Low(adapter, {});
  
  await db.read();
  
  console.log('📊 Estructura actual de db.data:');
  console.log('Propiedades:', Object.keys(db.data));
  console.log('Sessions existe?', 'sessions' in db.data);
  console.log('Sessions es array?', Array.isArray(db.data.sessions));
  console.log('Número de sessions:', db.data.sessions?.length || 0);
  
  if (!db.data.sessions) {
    console.log('\n❌ ¡Tabla sessions no existe! Creándola...');
    db.data.sessions = [];
    await db.write();
    console.log('✅ Tabla sessions creada correctamente');
  } else if (!Array.isArray(db.data.sessions)) {
    console.log('\n❌ sessions existe pero no es un array. Corrigiendo...');
    db.data.sessions = [];
    await db.write();
    console.log('✅ Tabla sessions corregida');
  } else {
    console.log('\n✅ Tabla sessions existe y está correcta');
    console.log('📋 Sessions actuales:');
    db.data.sessions.forEach(s => {
      const expired = new Date(s.expiresAt) < new Date();
      console.log(`  - Token: ${s.token.substring(0, 20)}... | User: ${s.userId} | Expired: ${expired}`);
    });
  }
}

fixSessions().catch(console.error);
