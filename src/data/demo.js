export const DEMO_LISTINGS = [
  {
    id: 'demo_1',
    title: 'Honda Civic 2020',
    description: 'Vehículo en excelentes condiciones. Motor 2.0L, transmisión automática, aire acondicionado.',
    price: 15000,
    category: 'vehiculos',
    brand: 'Honda',
    model: 'Civic',
    location: 'Miranda',
    images: ['/images/demo/honda.webp'],
    owner: 'demo@example.com',
    createdAt: new Date().toISOString(),
    status: 'active'
  },
  {
    id: 'demo_2',
    title: 'iPhone 13 Pro',
    description: 'Nuevo, sellado en caja. 256GB, color grafito.',
    price: 999,
    category: 'celulares',
    brand: 'Apple',
    model: 'iPhone 13',
    location: 'Caracas',
    images: ['/images/demo/iphone13pro.jpg'],
    owner: 'demo@example.com',
    createdAt: new Date().toISOString(),
    status: 'active'
  }
];