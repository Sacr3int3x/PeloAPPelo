/**
 * Utilidades de Accesibilidad (a11y)
 * Mejoran la experiencia para usuarios con tecnologías asistivas
 */

/**
 * Hook para gestionar el foco del teclado
 */
import { useEffect, useRef, useState, useCallback } from "react";

export function useFocusTrap(isActive = true) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener("keydown", handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener("keydown", handleTabKey);
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook para anuncios de pantalla lectora
 */
export function useScreenReaderAnnouncement() {
  const announcementRef = useRef(null);

  useEffect(() => {
    // Crear elemento de anuncio si no existe
    if (!announcementRef.current) {
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", "polite");
      announcement.setAttribute("aria-atomic", "true");
      announcement.style.position = "absolute";
      announcement.style.left = "-10000px";
      announcement.style.width = "1px";
      announcement.style.height = "1px";
      announcement.style.overflow = "hidden";
      document.body.appendChild(announcement);
      announcementRef.current = announcement;
    }

    return () => {
      if (announcementRef.current) {
        document.body.removeChild(announcementRef.current);
        announcementRef.current = null;
      }
    };
  }, []);

  const announce = (message) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
    }
  };

  return announce;
}

/**
 * Hook para navegación por teclado en listas
 */
export function useKeyboardNavigation(items, options = {}) {
  const {
    orientation = "vertical", // vertical | horizontal
    loop = true,
    onSelect = null,
  } = options;

  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      const isVertical = orientation === "vertical";
      const nextKey = isVertical ? "ArrowDown" : "ArrowRight";
      const prevKey = isVertical ? "ArrowUp" : "ArrowLeft";

      let newIndex = activeIndex;

      switch (e.key) {
        case nextKey:
          e.preventDefault();
          newIndex = activeIndex + 1;
          if (newIndex >= items.length) {
            newIndex = loop ? 0 : items.length - 1;
          }
          setActiveIndex(newIndex);
          break;

        case prevKey:
          e.preventDefault();
          newIndex = activeIndex - 1;
          if (newIndex < 0) {
            newIndex = loop ? items.length - 1 : 0;
          }
          setActiveIndex(newIndex);
          break;

        case "Home":
          e.preventDefault();
          setActiveIndex(0);
          break;

        case "End":
          e.preventDefault();
          setActiveIndex(items.length - 1);
          break;

        case "Enter":
        case " ":
          e.preventDefault();
          if (onSelect) {
            onSelect(items[activeIndex], activeIndex);
          }
          break;

        default:
          break;
      }
    },
    [activeIndex, items, loop, onSelect, orientation],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    containerRef,
    activeIndex,
    setActiveIndex,
  };
}

/**
 * Genera ID único para asociar labels con inputs
 */
let idCounter = 0;
export function useUniqueId(prefix = "id") {
  const idRef = useRef(null);

  if (!idRef.current) {
    idRef.current = `${prefix}-${++idCounter}`;
  }

  return idRef.current;
}

/**
 * Hook para detectar si el usuario usa teclado
 */
export function useKeyboardUser() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Tab") {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  useEffect(() => {
    if (isKeyboardUser) {
      document.body.classList.add("keyboard-user");
    } else {
      document.body.classList.remove("keyboard-user");
    }
  }, [isKeyboardUser]);

  return isKeyboardUser;
}

/**
 * Componente Skip Link para navegación
 */
export function SkipLink({
  href = "#main-content",
  children = "Saltar al contenido",
}) {
  return (
    <a href={href} className="skip-link">
      {children}
    </a>
  );
}

/**
 * Componente VisuallyHidden para texto solo para lectores de pantalla
 */
export function VisuallyHidden({ children, as: Component = "span", ...props }) {
  return (
    <Component
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        borderWidth: 0,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}

const accessibility = {
  useFocusTrap,
  useScreenReaderAnnouncement,
  useKeyboardNavigation,
  useUniqueId,
  useKeyboardUser,
  SkipLink,
  VisuallyHidden,
};

export default accessibility;
