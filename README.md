# PeloAPelo 🔄

**PeloAPelo** es una plataforma de marketplace peer-to-peer enfocada en intercambios y compra-venta de artículos entre usuarios verificados. La aplicación pone especial énfasis en la seguridad con verificación de identidad y un sistema de reputación basado en calificaciones.

## 🚀 Características Principales

- **Marketplace de artículos**: Publicación, búsqueda y navegación por categorías
- **Sistema de intercambios (Swaps)**: Los usuarios pueden proponer intercambios de artículos
- **Verificación de identidad**: Proceso de verificación con foto y documento oficial
- **Sistema de reputación**: Calificaciones y comentarios entre usuarios
- **Mensajería en tiempo real**: Chat bidireccional entre compradores y vendedores
- **Favoritos**: Guarda artículos de interés
- **Dashboard de administrador**: Panel para moderación y gestión de usuarios
- **Notificaciones**: Alertas en tiempo real de mensajes y propuestas

## 🛠️ Tecnologías

### Frontend

- **React 19** con React Router DOM
- **Context API** para gestión de estado
- **CSS Modules** para estilos
- **React Icons** para iconografía
- **WebSockets** para comunicación en tiempo real

### Backend

- **Node.js** con servidor HTTP nativo
- **LowDB** como base de datos JSON
- **WebSockets (ws)** para comunicación bidireccional
- **Multer** para manejo de archivos
- **NanoID** para generación de IDs únicos

## 📋 Requisitos Previos

- Node.js 16+ y npm
- Puerto 3000 disponible (frontend)
- Puerto 4000 disponible (backend)

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Sacr3int3x/PeloAPPelo.git
cd peloapelo
```

### 2. Instalar dependencias del frontend

```bash
npm install
```

### 3. Instalar dependencias del backend

```bash
cd peloapleo-backend
npm install
cd ..
```

### 4. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
REACT_APP_API_BASE=http://localhost:4000/api
```

## ▶️ Ejecución

### Modo Desarrollo

**Terminal 1 - Backend:**

```bash
cd peloapleo-backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

### Modo Producción

```bash
npm run build
```

Los archivos optimizados estarán en la carpeta `build/`

## 📁 Estructura del Proyecto

```
peloapelo/
├── src/
│   ├── components/      # Componentes reutilizables
│   ├── context/         # Context API (Auth, Data, Messages)
│   ├── pages/           # Páginas de la aplicación
│   ├── services/        # Servicios API y comunicación
│   ├── styles/          # Estilos globales y CSS modules
│   ├── utils/           # Utilidades y helpers
│   └── App.js           # Componente raíz con rutas
├── peloapleo-backend/
│   ├── src/
│   │   ├── controllers/ # Lógica de controladores
│   │   ├── services/    # Lógica de negocio
│   │   ├── middleware/  # Middlewares personalizados
│   │   ├── realtime/    # WebSocket handlers
│   │   └── server.js    # Servidor principal
│   ├── data/            # Base de datos JSON
│   └── uploads/         # Archivos subidos
├── public/              # Archivos estáticos
└── docs/                # Documentación adicional
```

## 🔐 Seguridad

- Autenticación basada en tokens JWT
- Verificación de identidad con documento oficial
- Validación de archivos subidos
- Sistema de bloqueo de usuarios
- Moderación de contenido por administradores

## 🧪 Testing

```bash
npm test
```

## 📱 Funcionalidades por Rol

### Usuario Regular

- Publicar y editar artículos
- Buscar y filtrar productos
- Proponer intercambios
- Chat con otros usuarios
- Calificar transacciones
- Gestionar favoritos

### Administrador

- Ver todos los usuarios y publicaciones
- Moderar contenido
- Gestionar calificaciones
- Ver estadísticas del sistema

## 🤝 Contribuir

Lee [CONTRIBUTING.md](docs/CONTRIBUTING.md) para conocer el proceso de contribución.

## 📄 Licencia

Este proyecto está bajo licencia MIT.

## 👥 Autores

- **Equipo PeloAPelo** - Desarrollo inicial

## 📞 Contacto

Para dudas o sugerencias, consulta la página de [Centro de Ayuda](http://localhost:3000/#/help) dentro de la aplicación.

---

**Nota**: Esta aplicación es un proyecto educativo/demostrativo. Para uso en producción, considera implementar:

- Base de datos robusta (PostgreSQL, MongoDB)
- Sistema de autenticación OAuth
- Procesamiento de pagos
- Hosting escalable
- Sistema de backup automatizado
- Monitoreo y logging centralizado
