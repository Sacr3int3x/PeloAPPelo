import React from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import "./PageTransition.css";

function PageTransition() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94], // Cubic bezier similar to iOS
        }}
        className="page-transition-wrapper"
      >
        {/* El contenido de la página se renderiza aquí */}
      </motion.div>
    </AnimatePresence>
  );
}

export default PageTransition;
