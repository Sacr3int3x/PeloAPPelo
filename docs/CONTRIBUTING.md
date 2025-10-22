# Guía de Contribución

## Índice

1. [Estructura del Proyecto](#estructura-del-proyecto)
2. [Estándares de Código](#estándares-de-código)
3. [Flujo de Trabajo](#flujo-de-trabajo)
4. [Testing](#testing)

## Estructura del Proyecto

```
src/
├── components/     # Componentes reutilizables
├── pages/         # Páginas de la aplicación
├── context/       # Contextos de React
├── services/      # Servicios y APIs
├── utils/         # Utilidades y helpers
└── styles/        # Estilos globales y temas
```

## Estándares de Código

### React

- Usar componentes funcionales y hooks
- Implementar lazy loading para rutas
- Mantener componentes pequeños y enfocados
- Documentar props con PropTypes

### CSS

- Seguir la metodología BEM
- Usar variables CSS del tema
- Mantener especificidad baja
- Implementar mobile-first

### JavaScript

- Usar ES6+ features
- Implementar async/await
- Manejar errores apropiadamente
- Documentar funciones complejas

## Flujo de Trabajo

1. Crear rama desde `main`
2. Desarrollar feature/fix
3. Asegurar que pasan los tests
4. Crear PR con descripción detallada
5. Esperar review y aprobación

## Testing

### Frontend

- Tests unitarios para componentes
- Tests de integración para flujos
- Tests de accesibilidad
- Tests de performance

### Backend

- Tests unitarios para servicios
- Tests de integración para APIs
- Tests de seguridad
- Tests de carga

## Seguridad

### Frontend

- Sanitizar inputs de usuario
- Implementar CSP
- Usar HTTPS
- Validar datos

### Backend

- Implementar rate limiting
- Validar requests
- Sanitizar respuestas
- Manejar errores seguros

## Performance

### Checklist

- [ ] Lazy loading implementado
- [ ] Imágenes optimizadas
- [ ] Bundle minimizado
- [ ] Caché configurado
- [ ] Compresión habilitada

## Deploy

### Pasos

1. Ejecutar tests
2. Build producción
3. Validar assets
4. Deploy staging
5. Deploy producción
