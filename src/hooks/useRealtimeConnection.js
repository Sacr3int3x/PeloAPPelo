/**
 * Hook seguro para WebSocket que previene race conditions y memory leaks
 */

import { useEffect, useRef, useCallback, useState } from "react";

/**
 * Hook personalizado para manejar conexiones WebSocket de forma segura
 * @param {Object} realtime - Cliente realtime
 * @param {Function} messageHandler - Handler para mensajes
 * @param {Array} dependencies - Dependencias del handler
 */
export function useRealtimeConnection(
  realtime,
  messageHandler,
  dependencies = [],
) {
  const handlerRef = useRef(messageHandler);
  const isSubscribedRef = useRef(false);
  const messageQueueRef = useRef([]);

  // Actualizar handler sin causar re-renders
  useEffect(() => {
    handlerRef.current = messageHandler;
  }, [messageHandler]);

  // Manejar conexión y suscripción
  useEffect(() => {
    if (!realtime) return;

    let mounted = true;
    isSubscribedRef.current = true;

    // Handler seguro que verifica si el componente está montado
    const safeHandler = (event) => {
      if (!mounted || !isSubscribedRef.current) return;

      // Ejecutar handler actual
      if (handlerRef.current) {
        try {
          handlerRef.current(event.detail);
        } catch (error) {
          console.error("Error en handler de mensaje realtime:", error);
        }
      }
    };

    // Handler para conexión establecida
    const handleConnected = () => {
      if (!mounted) return;

      // Procesar mensajes en cola
      while (messageQueueRef.current.length > 0) {
        const queuedMessage = messageQueueRef.current.shift();
        safeHandler({ detail: queuedMessage });
      }
    };

    // Suscribir eventos
    realtime.addEventListener("realtime.message", safeHandler);
    realtime.addEventListener("realtime.connected", handleConnected);

    // Cleanup al desmontar
    return () => {
      mounted = false;
      isSubscribedRef.current = false;
      messageQueueRef.current = [];

      realtime.removeEventListener("realtime.message", safeHandler);
      realtime.removeEventListener("realtime.connected", handleConnected);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtime, ...dependencies]);

  return {
    isSubscribed: isSubscribedRef.current,
  };
}

/**
 * Hook para enviar mensajes de forma segura
 */
export function useRealtimeSender(realtime) {
  const sendMessage = useCallback(
    (data) => {
      if (!realtime) {
        console.warn("Realtime no disponible");
        return false;
      }

      return realtime.send(data);
    },
    [realtime],
  );

  return sendMessage;
}

/**
 * Hook para estado de conexión
 */
export function useRealtimeStatus(realtime) {
  const [status, setStatus] = useState({
    connected: false,
    error: null,
  });

  useEffect(() => {
    if (!realtime) return;

    let mounted = true;

    const handleConnected = () => {
      if (mounted) {
        setStatus({ connected: true, error: null });
      }
    };

    const handleDisconnected = () => {
      if (mounted) {
        setStatus((prev) => ({ ...prev, connected: false }));
      }
    };

    const handleError = (event) => {
      if (mounted) {
        setStatus((prev) => ({
          ...prev,
          error: event.detail.error,
        }));
      }
    };

    realtime.addEventListener("realtime.connected", handleConnected);
    realtime.addEventListener("realtime.disconnected", handleDisconnected);
    realtime.addEventListener("realtime.error", handleError);

    // Estado inicial
    const initialStatus = realtime.getStatus?.();
    if (initialStatus) {
      setStatus({
        connected: initialStatus.connected,
        error: null,
      });
    }

    return () => {
      mounted = false;
      realtime.removeEventListener("realtime.connected", handleConnected);
      realtime.removeEventListener("realtime.disconnected", handleDisconnected);
      realtime.removeEventListener("realtime.error", handleError);
    };
  }, [realtime]);

  return status;
}

export default useRealtimeConnection;
