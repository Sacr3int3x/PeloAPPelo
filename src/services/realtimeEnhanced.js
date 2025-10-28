/**
 * Cliente WebSocket Mejorado con Reconexión Automática
 * Implementa backoff exponencial y manejo robusto de errores
 */

import { API_BASE } from "./api";

// Configuración de reconexión
const RETRY_BASE = 1000; // 1 segundo
const RETRY_MAX = 30000; // 30 segundos máximo
const RETRY_MULTIPLIER = 1.5; // Factor de incremento
const MAX_RETRY_ATTEMPTS = 10; // Intentos antes de darse por vencido temporalmente
const PING_INTERVAL = 30000; // 30 segundos
const PONG_TIMEOUT = 10000; // 10 segundos

function buildRealtimeUrl(token) {
  if (process.env.NODE_ENV === "development") {
    const url = new URL("ws://localhost:4000/realtime");
    if (token) url.searchParams.set("token", token);
    return url.toString();
  }

  const httpBase = API_BASE.replace(/\/+$/, "");
  const root = httpBase.replace(/^http/, "ws").replace(/\/api$/, "");
  const url = new URL(`${root}/realtime`);
  if (token) url.searchParams.set("token", token);
  return url.toString();
}

class EnhancedRealtimeClient extends EventTarget {
  constructor() {
    super();
    this.socket = null;
    this.token = null;
    this.desired = false;
    this.retryDelay = RETRY_BASE;
    this.retryAttempts = 0;
    this.pingTimer = null;
    this.pongTimer = null;
    this.reconnectTimer = null;
    this.lastPongTime = null;
    this.isConnected = false;
    this.manualClose = false;

    // Bind methods
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
  }

  async setToken(token) {
    const normalized = token || null;
    if (this.token === normalized) return;

    this.stop();
    this.token = normalized;

    if (this.token) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      this.start();
    }
  }

  start() {
    if (this.desired) return;
    this.desired = true;
    this.manualClose = false;
    this.retryAttempts = 0;
    this.connect();
  }

  stop() {
    this.desired = false;
    this.manualClose = true;
    this.clearAllTimers();
    this.disconnect();
  }

  connect() {
    if (!this.token || !this.desired) return;
    if (this.socket) this.disconnect();

    try {
      const url = buildRealtimeUrl(this.token);
      console.log(`🔌 Conectando a WebSocket: ${url.split("?")[0]}...`);

      this.socket = new WebSocket(url);
      this.socket.addEventListener("open", this.handleOpen);
      this.socket.addEventListener("close", this.handleClose);
      this.socket.addEventListener("error", this.handleError);
      this.socket.addEventListener("message", this.handleMessage);
    } catch (error) {
      console.error("❌ Error creando WebSocket:", error);
      this.scheduleReconnect();
    }
  }

  disconnect() {
    this.clearAllTimers();
    this.isConnected = false;

    if (this.socket) {
      try {
        this.socket.removeEventListener("open", this.handleOpen);
        this.socket.removeEventListener("close", this.handleClose);
        this.socket.removeEventListener("error", this.handleError);
        this.socket.removeEventListener("message", this.handleMessage);

        if (this.socket.readyState === WebSocket.OPEN) {
          this.socket.close(1000, "Cliente cerrado");
        }
      } catch (error) {
        console.warn("Error al cerrar WebSocket:", error);
      }
      this.socket = null;
    }
  }

  handleOpen() {
    console.log("✅ WebSocket conectado exitosamente");
    this.isConnected = true;
    this.retryAttempts = 0;
    this.retryDelay = RETRY_BASE;
    this.lastPongTime = Date.now();

    // Iniciar ping/pong para mantener conexión activa
    this.startPingPong();

    // Notificar conexión exitosa
    this.dispatchEvent(new CustomEvent("realtime.connected"));
  }

  handleClose(event) {
    console.log(
      `🔌 WebSocket cerrado - Código: ${event.code}, Razón: ${event.reason || "N/A"}`,
    );
    this.isConnected = false;
    this.clearAllTimers();

    this.dispatchEvent(
      new CustomEvent("realtime.disconnected", {
        detail: { code: event.code, reason: event.reason },
      }),
    );

    // Solo reconectar si no fue cierre manual y aún se desea la conexión
    if (!this.manualClose && this.desired) {
      this.scheduleReconnect();
    }
  }

  handleError(error) {
    console.error("❌ Error en WebSocket:", error);

    this.dispatchEvent(
      new CustomEvent("realtime.error", {
        detail: { error: error.message || "WebSocket error" },
      }),
    );
  }

  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);

      // Manejar pong del servidor
      if (data.type === "pong") {
        this.lastPongTime = Date.now();
        clearTimeout(this.pongTimer);
        return;
      }

      // Emitir mensaje a los listeners
      this.dispatchEvent(new CustomEvent("realtime.message", { detail: data }));
    } catch (error) {
      console.error("Error procesando mensaje WebSocket:", error);
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;

    this.retryAttempts++;

    // Si se alcanzó el máximo de intentos, esperar más tiempo
    if (this.retryAttempts > MAX_RETRY_ATTEMPTS) {
      console.warn(
        `⚠️ Máximo de intentos alcanzado (${MAX_RETRY_ATTEMPTS}). Esperando ${RETRY_MAX / 1000}s...`,
      );
      this.retryDelay = RETRY_MAX;
    } else {
      // Backoff exponencial
      this.retryDelay = Math.min(RETRY_MAX, this.retryDelay * RETRY_MULTIPLIER);
    }

    console.log(
      `🔄 Reintentando en ${Math.round(this.retryDelay / 1000)}s... (Intento ${this.retryAttempts})`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.desired && !this.isConnected) {
        this.connect();
      }
    }, this.retryDelay);
  }

  startPingPong() {
    this.clearPingPong();

    this.pingTimer = setInterval(() => {
      if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(JSON.stringify({ type: "ping" }));

          // Esperar pong del servidor
          this.pongTimer = setTimeout(() => {
            console.warn("⚠️ No se recibió pong del servidor, reconectando...");
            this.disconnect();
            this.scheduleReconnect();
          }, PONG_TIMEOUT);
        } catch (error) {
          console.error("Error enviando ping:", error);
        }
      }
    }, PING_INTERVAL);
  }

  clearPingPong() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  clearAllTimers() {
    this.clearPingPong();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  send(data) {
    if (!this.isConnected || this.socket?.readyState !== WebSocket.OPEN) {
      console.warn("⚠️ No se puede enviar: WebSocket no conectado");
      return false;
    }

    try {
      this.socket.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      return false;
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      desired: this.desired,
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay,
      lastPongTime: this.lastPongTime,
    };
  }
}

// Instancia singleton
export const realtime = new EnhancedRealtimeClient();

// Método de compatibilidad con la API anterior
realtime.register = function (handler) {
  this.addEventListener("realtime.message", (event) => handler(event.detail));
};

// Detener conexión al cerrar la página
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    realtime.stop();
  });
}

export default realtime;
