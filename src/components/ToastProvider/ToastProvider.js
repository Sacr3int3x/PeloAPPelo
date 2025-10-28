/**
 * Sistema de Notificaciones Toast Unificado
 * Feedback visual consistente en toda la aplicación
 */

import React, { createContext, useContext, useState, useCallback } from "react";
import "./ToastProvider.css";

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return context;
}

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, options = {}) => {
    const {
      type = "info", // success, error, warning, info
      duration = 4000,
      position = "top-right", // top-right, top-center, top-left, bottom-right, bottom-center, bottom-left
      action = null,
    } = options;

    const id = ++toastId;

    const toast = {
      id,
      message,
      type,
      position,
      action,
      timestamp: Date.now(),
    };

    setToasts((prev) => [...prev, toast]);

    // Auto-cerrar después de la duración
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Métodos de conveniencia
  const success = useCallback(
    (message, options = {}) =>
      addToast(message, { ...options, type: "success" }),
    [addToast],
  );

  const error = useCallback(
    (message, options = {}) => addToast(message, { ...options, type: "error" }),
    [addToast],
  );

  const warning = useCallback(
    (message, options = {}) =>
      addToast(message, { ...options, type: "warning" }),
    [addToast],
  );

  const info = useCallback(
    (message, options = {}) => addToast(message, { ...options, type: "info" }),
    [addToast],
  );

  const value = {
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info,
  };

  // Agrupar toasts por posición
  const toastsByPosition = toasts.reduce((acc, toast) => {
    const position = toast.position || "top-right";
    if (!acc[position]) acc[position] = [];
    acc[position].push(toast);
    return acc;
  }, {});

  return (
    <ToastContext.Provider value={value}>
      {children}
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <div
          key={position}
          className={`toast-container toast-container-${position}`}
        >
          {positionToasts.map((toast) => (
            <Toast
              key={toast.id}
              toast={toast}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      ))}
    </ToastContext.Provider>
  );
}

function Toast({ toast, onClose }) {
  const { message, type, action } = toast;

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <div className={`toast toast-${type}`} role="alert" aria-live="polite">
      <div className="toast-icon">{icons[type]}</div>
      <div className="toast-content">
        <p className="toast-message">{message}</p>
        {action && (
          <button
            className="toast-action"
            onClick={() => {
              action.onClick();
              onClose();
            }}
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        className="toast-close"
        onClick={onClose}
        aria-label="Cerrar notificación"
      >
        ×
      </button>
    </div>
  );
}

export default ToastProvider;
