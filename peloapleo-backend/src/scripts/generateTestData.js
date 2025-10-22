import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const categories = {
  vehiculos: {
    label: "Vehículos",
    key: "Vehículo",
    items: [
      "Toyota Corolla",
      "Honda Civic",
      "Volkswagen Golf",
      "Ford Focus",
      "Chevrolet Cruze",
      "Hyundai Elantra",
      "Nissan Sentra",
      "Mazda 3",
      "Kia Forte",
      "Subaru Impreza"
    ]
  },
  celulares: {
    label: "Celulares",
    key: "Celular",
    items: [
      "iPhone 13 Pro",
      "Samsung Galaxy S21",
      "Google Pixel 6",
      "OnePlus 9",
      "Xiaomi Mi 11",
      "Huawei P40",
      "Motorola Edge",
      "Sony Xperia 1",
      "LG Velvet",
      "OPPO Find X3"
    ]
  },
  electronica: {
    label: "Electrónica",
    key: "Electrónica",
    items: [
      "MacBook Pro",
      "Dell XPS",
      "PlayStation 5",
      "Xbox Series X",
      "Nintendo Switch",
      "iPad Pro",
      "Samsung Galaxy Tab",
      "AirPods Pro",
      "Sony WH-1000XM4",
      "Bose QuietComfort"
    ]
  },
  muebles: {
    label: "Muebles",
    key: "Muebles",
    items: [
      "Sofá moderno",
      "Mesa de comedor",
      "Cama queen size",
      "Escritorio ejecutivo",
      "Silla ergonómica",
      "Librero modular",
      "Mesa de centro",
      "Armario de roble",
      "Buró minimalista",
      "Rack para TV"
    ]
  },
  otros: {
    label: "Otros",
    key: "Otros",
    items: [
      "Bicicleta de montaña",
      "Set de golf",
      "Cámara DSLR",
      "Guitarra eléctrica",
      "Maleta de viaje",
      "Reloj inteligente",
      "Drone DJI",
      "Telescopio",
      "Máquina de ejercicio",
      "Set de cocina"
    ]
  }
};

const plans = ['gratis', 'plus', 'premium'];
const conditions = ['nuevo', 'seminuevo', 'usado'];

function generatePrice(category) {
  const ranges = {
    vehiculos: { min: 100000, max: 500000 },
    celulares: { min: 5000, max: 30000 },
    electronica: { min: 3000, max: 50000 },
    muebles: { min: 1000, max: 20000 },
    otros: { min: 500, max: 10000 }
  };

  const range = ranges[category] || ranges.otros;
  return Math.floor(Math.random() * (range.max - range.min + 1) + range.min);
}

function generateListings(userId, userEmail) {
  const listings = [];
  const now = new Date().toISOString();

  Object.entries(categories).forEach(([category, data]) => {
    data.items.forEach((itemName, index) => {
      const baseId = `${category}-${index + 1}`;
      const listingsPerItem = 10; // 10 listings per item to get 100 per category

      for (let i = 0; i < listingsPerItem; i++) {
        const id = `${baseId}-${i + 1}`;
        listings.push({
          id: `lst_${id}`,
          name: itemName,
          description: `Descripción detallada de ${itemName}. Estado: ${conditions[i % conditions.length]}. ¡Excelente oportunidad!`,
          price: generatePrice(category),
          category: data.key,
          condition: conditions[i % conditions.length],
          plan: plans[i % plans.length],
          status: "active",
          ownerId: userId,
          ownerEmail: userEmail,
          createdAt: now,
          updatedAt: now,
          photos: [],
          views: Math.floor(Math.random() * 1000),
          favorites: Math.floor(Math.random() * 100)
        });
      }
    });
  });

  return listings;
}

async function generateTestData() {
  // Usuario de prueba
  const testUser = {
    id: "usr_test123",
    email: "test@peloapelo.com",
    name: "Usuario de Prueba",
    passwordHash: "937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244", // Contraseña: test123
    isAdmin: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Generar publicaciones
  const listings = generateListings(testUser.id, testUser.email);

  // Leer el archivo de base de datos actual
  const dbPath = join(__dirname, '..', 'data', 'db.json');
  const currentDb = {
    users: [testUser],
    listings: listings,
    conversations: [],
    messages: [],
    favorites: [],
    transactions: [],
    reputations: [],
    blocked: []
  };

  // Escribir el nuevo archivo
  await writeFile(dbPath, JSON.stringify(currentDb, null, 2));
  console.log(`Se han generado ${listings.length} publicaciones para el usuario de prueba`);
  console.log('Email:', testUser.email);
  console.log('Contraseña: test123');
}

generateTestData().catch(console.error);
