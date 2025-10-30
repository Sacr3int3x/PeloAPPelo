import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { apiRequest } from "../services/api";
import { realtime } from "../services/realtime";
import { LS } from "../utils/constants";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";

const AuthCtx = createContext(null);

export const useAuth = () => useContext(AuthCtx);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(LS.user);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(LS.token));
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(() => Boolean(token) && !user);
  const initRequested = useRef(false);

  const persistSession = useCallback((nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    if (nextToken) localStorage.setItem(LS.token, nextToken);
    else localStorage.removeItem(LS.token);
    if (nextUser) localStorage.setItem(LS.user, JSON.stringify(nextUser));
    else localStorage.removeItem(LS.user);
  }, []);

  useEffect(() => {
    if (!token || user || initRequested.current) return;
    initRequested.current = true;
    let active = true;
    (async () => {
      try {
        const response = await apiRequest("/auth/me", { token });
        if (active) {
          persistSession(response.user, token);
        }
      } catch (error) {
        console.warn("Fallo obteniendo sesión", error);
        if (active) {
          persistSession(null, null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [token, user, persistSession]);

  useEffect(() => {
    realtime.start();
    return () => {
      realtime.stop();
    };
  }, []);

  useEffect(() => {
    realtime.setToken(token);
  }, [token]);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      // Usar el nuevo endpoint para refrescar el token
      const response = await apiRequest("/auth/refresh", {
        method: "POST",
        token,
      });
      persistSession(response.user, response.token);
      return { success: true };
    } catch (error) {
      console.error("Error actualizando datos del usuario:", error);
      if (error?.status === 401) {
        persistSession(null, null);
      }
      return {
        success: false,
        error:
          error?.message || "No se pudo actualizar la información del usuario",
      };
    }
  }, [token, persistSession]);

  // Escuchar eventos de cambios en la verificación del usuario
  useEffect(() => {
    const handleVerificationChange = (event) => {
      const { userId } = event.detail || {};
      // Si el evento es para el usuario actual, refrescar sus datos
      if (user && userId === user.id) {
        console.log("Verificación actualizada, refrescando datos del usuario");
        refresh();
      }
    };

    realtime.addEventListener("verification.status.changed", handleVerificationChange);

    return () => {
      realtime.removeEventListener("verification.status.changed", handleVerificationChange);
    };
  }, [user, refresh]);

  const login = useCallback(
    async ({ identifier, password }) => {
      try {
        const response = await apiRequest("/auth/login", {
          method: "POST",
          data: { identifier, password },
        });
        persistSession(response.user, response.token);
        return { success: true, user: response.user };
      } catch (error) {
        return {
          success: false,
          error: error?.message || "No se pudo iniciar sesión.",
        };
      }
    },
    [persistSession],
  );

  const loginWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      // Enviar el token de Firebase al backend
      const response = await apiRequest("/auth/google", {
        method: "POST",
        data: { idToken },
      });

      persistSession(response.user, response.token);
      return { success: true, user: response.user };
    } catch (error) {
      console.error("Error en login con Google:", error);
      return {
        success: false,
        error: error?.message || "No se pudo iniciar sesión con Google.",
      };
    }
  }, [persistSession]);

  const register = useCallback(
    async ({ email, password, name, location, username, phone }) => {
      try {
        const response = await apiRequest("/auth/register", {
          method: "POST",
          data: { email, password, name, location, username, phone },
        });
        persistSession(response.user, response.token);
        return { success: true, user: response.user };
      } catch (error) {
        return {
          success: false,
          error: error?.message || "No se pudo completar el registro.",
        };
      }
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    if (!token) {
      persistSession(null, null);
      return;
    }
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
        token,
      });
    } catch (error) {
      console.warn("Error cerrando sesión", error);
    } finally {
      persistSession(null, null);
    }
  }, [token, persistSession]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      loginWithGoogle,
      register,
      logout,
      refresh,
    }),
    [user, token, loading, login, loginWithGoogle, register, logout, refresh],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
