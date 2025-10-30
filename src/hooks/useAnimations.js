import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

// Hook para animaciones de entrada cuando el elemento entra en vista
export function useInViewAnimation(threshold = 0.1) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: threshold });

  return { ref, isInView };
}

// Hook para animaciones de stagger (efecto cascada)
export function useStaggerAnimation(items, delay = 0.1) {
  const [visibleItems, setVisibleItems] = useState([]);

  useEffect(() => {
    const timeouts = items.map((_, index) =>
      setTimeout(
        () => {
          setVisibleItems((prev) => [...prev, index]);
        },
        index * delay * 1000,
      ),
    );

    return () => timeouts.forEach(clearTimeout);
  }, [items, delay]);

  return visibleItems;
}

// Hook para animaciones de hover con spring
export function useHoverAnimation() {
  const [isHovered, setIsHovered] = useState(false);

  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    animate: isHovered ? { scale: 1.05 } : { scale: 1 },
    transition: { type: "spring", stiffness: 300, damping: 20 },
  };

  return { isHovered, hoverProps };
}

// Hook para animaciones de loading
export function useLoadingAnimation(isLoading) {
  return {
    animate: isLoading ? { opacity: 0.5 } : { opacity: 1 },
    transition: { duration: 0.2 },
  };
}

// Variantes de animación comunes (estilo iOS)
export const animationVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },

  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },

  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },

  bounceIn: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { opacity: 1, scale: 1 },
    transition: {
      duration: 0.5,
      ease: [0.68, -0.55, 0.265, 1.55],
    },
  },

  pageTransition: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};
