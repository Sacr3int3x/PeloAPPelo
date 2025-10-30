# Animaciones en PeloAPPelo

Este documento explica cómo usar el sistema de animaciones implementado con Framer Motion para crear una experiencia similar a iOS.

## Sistema de Animaciones

### Transiciones de Página

Las transiciones entre páginas ahora usan animaciones suaves de slide con easing cúbico similar a iOS:

- **Entrada**: Deslizamiento desde la derecha con fade in
- **Salida**: Deslizamiento hacia la izquierda con fade out
- **Duración**: 300ms con easing [0.25, 0.46, 0.45, 0.94]

### Componentes Animados

#### AnimatedContainer

Wrapper básico para animaciones de entrada/salida.

```jsx
import { AnimatedContainer } from "../components/AnimatedComponents";

<AnimatedContainer variant="slideUp" delay={0.2}>
  <YourComponent />
</AnimatedContainer>;
```

**Variantes disponibles:**

- `fadeIn`: Opacidad de 0 a 1
- `slideUp`: Deslizamiento desde abajo
- `slideInRight`: Deslizamiento desde la derecha
- `bounceIn`: Efecto de rebote al entrar

#### AnimatedList

Para listas con efecto de cascada (stagger).

```jsx
<AnimatedList staggerDelay={0.1}>
  {items.map((item) => (
    <div key={item.id}>{item.name}</div>
  ))}
</AnimatedList>
```

#### AnimatedCard

Cards con animación de entrada y hover.

```jsx
<AnimatedCard delay={0.1}>
  <CardContent />
</AnimatedCard>
```

#### AnimatedButton

Botones con animaciones de hover y press.

```jsx
<AnimatedButton onClick={handleClick}>Click me!</AnimatedButton>
```

### Hooks de Utilidad

#### useInViewAnimation

Para animaciones cuando el elemento entra en vista.

```jsx
import { useInViewAnimation } from "../hooks/useAnimations";

function MyComponent() {
  const { ref, isInView } = useInViewAnimation(0.3);

  return (
    <motion.div
      ref={ref}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
    >
      Content
    </motion.div>
  );
}
```

#### useHoverAnimation

Para efectos de hover consistentes.

```jsx
import { useHoverAnimation } from "../hooks/useAnimations";

function HoverComponent() {
  const { hoverProps } = useHoverAnimation();

  return <motion.div {...hoverProps}>Hover me!</motion.div>;
}
```

### Clases CSS de Utilidad

#### Animaciones básicas

- `.fade-in`: Fade in con deslizamiento hacia arriba
- `.slide-up`: Deslizamiento desde abajo
- `.bounce-in`: Efecto de rebote

#### Efectos interactivos

- `.hover-lift`: Elevación al hacer hover
- `.ripple-button`: Efecto de onda al presionar

#### Estados

- `.success-animation`: Pulso verde para acciones exitosas
- `.error-animation`: Sacudida para errores

### Ejemplos de Uso

#### Página con elementos animados

```jsx
import {
  AnimatedContainer,
  AnimatedList,
} from "../components/AnimatedComponents";

function MyPage() {
  return (
    <AnimatedContainer variant="fadeIn">
      <h1>Título de la página</h1>

      <AnimatedList>
        {items.map((item, index) => (
          <AnimatedCard key={item.id} delay={index * 0.1}>
            <CardContent item={item} />
          </AnimatedCard>
        ))}
      </AnimatedList>
    </AnimatedContainer>
  );
}
```

#### Componente con animación al entrar en vista

```jsx
import { useInViewAnimation } from "../hooks/useAnimations";
import { motion } from "framer-motion";

function FeatureCard({ title, description }) {
  const { ref, isInView } = useInViewAnimation();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="feature-card"
    >
      <h3>{title}</h3>
      <p>{description}</p>
    </motion.div>
  );
}
```

## Mejores Prácticas

1. **Usa delays escalonados** para listas y grids
2. **Combina animaciones** con cuidado para evitar sobrecarga visual
3. **Considera el rendimiento** - usa `will-change` en CSS para elementos animados frecuentemente
4. **Accesibilidad** - Asegúrate de que las animaciones no interfieran con `prefers-reduced-motion`

## Configuración

Las animaciones están configuradas para:

- **Easing iOS-like**: Cubic bezier [0.25, 0.46, 0.45, 0.94]
- **Duraciones estándar**: 300ms para transiciones rápidas, 400-600ms para entradas
- **Spring animations**: stiffness 300-500, damping 17-25

Para personalizar, modifica los valores en `src/hooks/useAnimations.js`.
