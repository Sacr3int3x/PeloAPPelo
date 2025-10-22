import { API_BASE } from "./api";

const RETRY_BASE = 1500;
const RETRY_MAX = 15000;

function absoluteApiBase() {
  if (API_BASE.startsWith("http://") || API_BASE.startsWith("https://")) {
    return API_BASE;
  }
  if (typeof window === "undefined") return `http://localhost${API_BASE}`;
  return `${window.location.origin}${API_BASE}`;
}

function buildRealtimeUrl(token) {
  // Usar directamente la URL del backend en desarrollo
  if (process.env.NODE_ENV === "development") {
    const url = new URL("ws://localhost:4000/realtime");
    if (token) {
      url.searchParams.set("token", token);
    }
    return url.toString();
  }

  // En producción, usar la URL relativa
  const httpBase = absoluteApiBase().replace(/\/+$/, "");
  const root = httpBase.replace(/^http/, "ws").replace(/\/api$/, "");
  const url = new URL(`${root}/realtime`);
  if (token) {
    url.searchParams.set("token", token);
  }
  return url.toString();
}

class RealtimeClient extends EventTarget {
  constructor() {
    super();
    this.socket = null;
    this.token = null;
    this.desired = false;
    this.retryDelay = RETRY_BASE;
    this.pingTimer = null;
    this.reconnectTimer = null;
    this.lastFailureAt = 0;
    this.reportedUnavailable = false;
  }

  async setToken(token) {
    const normalized = token || null;
    if (this.token === normalized) return;

    // Limpiar estado previo
    this.stop();

    // Actualizar token
    this.token = normalized;

    // Si hay token, intentar conectar
    if (this.token) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Pequeña pausa para estabilidad
      this.start();
    }
  }

  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  handleConnectionProblem(reason) {
    this.lastFailureAt = Date.now();
    const detail =
      reason instanceof Error ? reason.message : String(reason || "");

    // Registrar cada error individualmente para mejor debugging
    console.warn(`Realtime: Error de conexión - ${detail}`);

    // Notificar solo la primera vez al usuario
    if (!this.reportedUnavailable) {
      console.warn(
        "Tiempo real no disponible en este momento. Continuaremos reintentando en segundo plano.",
        detail,
      );
      this.reportedUnavailable = true;
    }

    // Disparar evento de error para que la UI pueda reaccionar
    this.dispatchEvent(
      new CustomEvent("realtime.error", {
        detail: {
          error: detail,
          timestamp: this.lastFailureAt,
        },
      }),
    );
  }

  connect() {
    if (!this.token) {
      console.debug("Realtime: No hay token, esperando autenticación");
      return;
    }

    this.desired = true;

    // Si ya hay una conexión abierta, no hacer nada
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.debug("Realtime: Conexión ya establecida");
      return;
    }

    // Si hay un intento de conexión pendiente, esperar
    if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
      console.debug("Realtime: Conexión en proceso");
      return;
    }

    // Limpiar socket existente si lo hay
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (typeof WebSocket === "undefined") {
      console.warn("Realtime: WebSocket no soportado en este entorno");
      return;
    }

    try {
      const url = buildRealtimeUrl(this.token);
      console.debug("Realtime: Intentando conectar a", url);

      this.socket = new WebSocket(url);

      this.socket.addEventListener("open", () => {
        console.debug("Realtime: Conexión establecida");
        this.retryDelay = RETRY_BASE;
        this.reportedUnavailable = false;
        this.dispatchEvent(new CustomEvent("realtime.connected"));
        this.startPing();
      });

      this.socket.addEventListener("close", (event) => {
        console.debug("Realtime: Conexión cerrada", event.code, event.reason);
        this.stopPing();
        this.socket = null;
        this.dispatchEvent(new CustomEvent("realtime.disconnected"));
        if (this.desired) {
          if (!event.wasClean) {
            this.handleConnectionProblem(`code=${event.code}`);
          }
          this.scheduleReconnect();
        }
      });

      this.socket.addEventListener("error", (error) => {
        this.handleConnectionProblem(error);
        if (this.socket) {
          try {
            this.socket.close();
          } catch {
            // ignore
          }
        }
      });

      this.socket.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.type) {
            this.dispatchEvent(
              new CustomEvent(data.type, { detail: data.payload }),
            );
          }
        } catch (error) {
          console.error("Mensaje tiempo real inválido", error);
        }
      });
    } catch (error) {
      console.error("Realtime: Error al establecer la conexión:", error);
      this.handleConnectionProblem(error);
    }
  }

  start() {
    if (this.desired) return;
    this.connect();
  }

  stop() {
    this.desired = false;
    this.stopPing();
    this.clearReconnectTimer();
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // noop
      }
      this.socket = null;
    }
  }

  scheduleReconnect() {
    this.stopPing();
    if (!this.desired) return;
    const delay = Math.min(this.retryDelay, RETRY_MAX);
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
    this.retryDelay = Math.min(this.retryDelay * 1.5, RETRY_MAX);
  }

  startPing() {
    this.stopPing();
    if (!this.socket) return;
    this.pingTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(JSON.stringify({ type: "ping", at: Date.now() }));
        } catch (error) {
          console.error("No se pudo enviar ping", error);
        }
      }
    }, 20000);
  }

  stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  on(type, handler) {
    this.addEventListener(type, handler);
    return () => {
      this.removeEventListener(type, handler);
    };
  }
}

export const realtime = new RealtimeClient();
