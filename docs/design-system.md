# Sistema de Diseño PeloAPelo

## Índice

1. [Introducción](#introducción)
2. [Sistema de Diseño](#sistema-de-diseño)
3. [Componentes](#componentes)
4. [Seguridad](#seguridad)
5. [Performance](#performance)

## Introducción

Este documento describe el sistema de diseño y las mejores prácticas implementadas en PeloAPelo.

## Sistema de Diseño

### Colores

El sistema utiliza una paleta de colores escalable y accesible:

```javascript
colors: {
  primary: {
    50: '#f0f9ff',  // Fondos suaves
    500: '#0ea5e9', // Color principal
    900: '#0c4a6e', // Textos sobre fondos claros
  }
  // ... más variantes
}
```

### Tipografía

- Font principal: Inter
- Escala de tamaños: 0.75rem a 2.25rem
- Pesos: 400 (normal) a 800 (extrabold)

### Espaciado

Sistema de espaciado consistente basado en múltiplos de 4:

```css
--space-1: 0.25rem; /* 4px */
--space-4: 1rem; /* 16px */
--space-8: 3rem; /* 48px */
```

## Componentes

### Botones

```jsx
<button className="btn primary">Botón Principal</button>
<button className="btn secondary">Botón Secundario</button>
```

Variantes disponibles:

- `primary`: Acción principal
- `secondary`: Acción secundaria
- `outline`: Botón con borde
- `icon`: Botón circular para iconos

### Cards

```jsx
<div className="card">
  <div className="card-media">
    <img src="..." alt="..." />
  </div>
  <div className="card-body">
    <h3 className="card-title">Título</h3>
  </div>
</div>
```

### Formularios

```jsx
<div className="field">
  <label className="label">Etiqueta</label>
  <input className="input" type="text" />
</div>
```

## Seguridad

### Validación de Datos

- Implementado middleware de validación
- Sanitización de inputs
- Rate limiting
- Headers de seguridad

### Caché y Performance

- Sistema de caché implementado
- Compresión gzip/deflate
- Optimización de imágenes
- Lazy loading de componentes

## Performance

### Frontend

- Lazy loading de rutas
- Optimización de imágenes
- Bundle splitting
- Prefetch de recursos críticos

### Backend

- Sistema de caché
- Compresión de respuestas
- Rate limiting
- Optimización de consultas

## Responsive Design

### Breakpoints

```css
--xs: 360px --sm: 640px --md: 768px --lg: 1024px --xl: 1280px;
```

### Grid System

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* contenido */}
</div>
```

## Accesibilidad

### ARIA Roles

- Implementados roles semánticos
- Estados ARIA para componentes interactivos
- Focus visible mejorado
- Soporte para modo de alto contraste

### Reducción de Movimiento

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
