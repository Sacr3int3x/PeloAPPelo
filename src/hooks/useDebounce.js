/**
 * Custom Hook: useDebounce
 * Retrasa la actualización de un valor hasta que haya pasado un tiempo sin cambios
 */

import { useState, useEffect } from "react";

/**
 * Hook para debouncing de valores
 * @param {any} value - Valor a hacer debounce
 * @param {number} delay - Delay en milisegundos (default: 500ms)
 * @returns {any} Valor con debounce aplicado
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Establecer timeout para actualizar el valor
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar timeout si el valor cambia antes de que se cumpla el delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para debouncing de callbacks
 * @param {Function} callback - Función a ejecutar
 * @param {number} delay - Delay en milisegundos
 * @returns {Function} Función con debounce aplicado
 */
export function useDebouncedCallback(callback, delay = 500) {
  const [timeoutId, setTimeoutId] = useState(null);

  const debouncedCallback = (...args) => {
    // Limpiar timeout anterior
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Establecer nuevo timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args);
      setTimeoutId(null);
    }, delay);

    setTimeoutId(newTimeoutId);
  };

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return debouncedCallback;
}

/**
 * Función de utilidad para debouncing (sin hooks)
 */
export function debounce(func, wait = 300) {
  let timeout;

  const debounced = function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };

  debounced.cancel = function () {
    clearTimeout(timeout);
  };

  return debounced;
}

/**
 * Función de utilidad para throttling
 * Ejecuta la función máximo una vez cada 'limit' milisegundos
 */
export function throttle(func, limit = 300) {
  let inThrottle;

  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export default useDebounce;
