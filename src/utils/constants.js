// Constantes de localStorage
export const LS = {
  listings: "pp_listings",
  user: "pp_user",
  users: "pp_users",
  favs: "pp_favs",
  views: "pp_views",
  searches: "pp_searches",
  messages: "pp_messages",
  token: "pp_token",
};

// Catálogo de productos por categoría
export const CATALOG = {
  vehiculos: {
    locations: [
      "Amazonas",
      "Anzoátegui",
      "Apure",
      "Aragua",
      "Barinas",
      "Bolívar",
      "Carabobo",
      "Cojedes",
      "Delta Amacuro",
      "Falcón",
      "Guárico",
      "La Guaira",
      "Lara",
      "Mérida",
      "Miranda",
      "Monagas",
      "Nueva Esparta",
      "Portuguesa",
      "Sucre",
      "Táchira",
      "Trujillo",
      "Yaracuy",
      "Zulia",
    ],
    brands: {
      Otros: ["otros"],
      Toyota: [
        "Corolla",
        "Hilux",
        "Fortuner",
        "Yaris",
        "Land Cruiser (Machito/Burbuja)",
        "Prado",
      ],
      Chevrolet: ["Aveo", "Spark", "Optra", "Cruze", "Silverado"],
      Ford: ["Fiesta", "Focus", "Explorer", "EcoSport", "Ranger"],
      Nissan: ["Sentra", "Frontier", "Tiida", "Versa"],
      Renault: ["Logan", "Sandero", "Duster", "Symbol"],
      Hyundai: ["Elantra", "Tucson", "Accent"],
      Kia: ["Rio", "Cerato", "Sportage"],
      Honda: ["Civic", "Accord", "CR-V", "Fit"],
    },
  },
  celulares: {
    locations: ["Caracas", "Maracaibo", "Valencia", "Maracay"],
    brands: {
      Otros: ["otros"],
      Apple: ["iPhone 11", "iPhone 12", "iPhone 13", "iPhone 14"],
      Samsung: ["S21", "S22", "A54", "A34"],
      Xiaomi: ["Redmi Note 11", "Redmi Note 12", "Mi 11"],
      Huawei: ["P30", "P40", "Y9", "Y7"],
      Motorola: ["Moto G Power", "Moto G Stylus", "Moto E"],
    },
  },
  electronica: {
    locations: ["Caracas", "Valencia"],
    brands: {
      Otros: ["otros"],
      Sony: ["TV Bravia"],
      LG: ["OLED C1", "OLED C2"],
      Samsung: ["QLED", "Crystal UHD"],
    },
  },
  muebles: {
    locations: ["Caracas", "Maracay"],
    brands: {
      Otros: ["otros"],
      Ikea: ["Malm", "Billy"],
      Genérico: ["Juego de sala"],
    },
  },
  otros: {
    locations: ["Caracas"],
    brands: {
      Otros: ["otros"],
      Variado: ["Genérico"],
    },
  },
};
