import React from "react";
import { motion } from "framer-motion";
import { animationVariants } from "../hooks/useAnimations";

// Componente wrapper para animaciones de entrada
export function AnimatedContainer({
  children,
  variant = "fadeIn",
  delay = 0,
  className = "",
  ...props
}) {
  const selectedVariant =
    animationVariants[variant] || animationVariants.fadeIn;

  return (
    <motion.div
      className={className}
      initial={selectedVariant.initial}
      animate={selectedVariant.animate}
      exit={selectedVariant.exit}
      transition={{
        ...selectedVariant.transition,
        delay,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Componente para listas con animación stagger
export function AnimatedList({ children, staggerDelay = 0.1, className = "" }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Componente para botones con animación de hover/press
export function AnimatedButton({
  children,
  onClick,
  className = "",
  variant = "bounce",
  ...props
}) {
  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
  };

  return (
    <motion.button
      className={className}
      variants={buttonVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// Componente para cards con animación de entrada
export function AnimatedCard({
  children,
  className = "",
  delay = 0,
  ...props
}) {
  return (
    <motion.div
      className={`animated-card ${className}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        y: -2,
        transition: { duration: 0.2 },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Componente para modales con animación de entrada/salida
export function AnimatedModal({ children, isOpen, onClose, className = "" }) {
  if (!isOpen) return null;

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`modal-content ${className}`}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
